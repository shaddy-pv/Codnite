import { io, Socket } from 'socket.io-client';
import { api } from './api';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event handlers
  private notificationHandlers: ((notification: any) => void)[] = [];
  private unreadCountHandlers: ((count: number) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  connect() {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found, skipping socket connection');
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);
      
      // Join user-specific room for notifications
      this.joinUserRoom();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
      
      // Attempt to reconnect if not a manual disconnect
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
      this.attemptReconnect();
    });

    // Notification events
    this.socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      this.notifyNotificationHandlers(notification);
    });

    this.socket.on('unread_count_update', (data) => {
      console.log('Unread count updated:', data.count);
      this.notifyUnreadCountHandlers(data.count);
    });

    // Authentication events
    this.socket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error);
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    });

    // Room events
    this.socket.on('joined_room', (data) => {
      console.log('Joined room:', data.roomId);
    });

    this.socket.on('left_room', (data) => {
      console.log('Left room:', data.roomId);
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  private joinUserRoom() {
    if (!this.socket?.connected) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      this.socket.emit('join-room', `user_${user.id}`);
    }
  }

  // Public methods for event handling
  onNotification(callback: (notification: any) => void) {
    this.notificationHandlers.push(callback);
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== callback);
    };
  }

  onUnreadCountUpdate(callback: (count: number) => void) {
    this.unreadCountHandlers.push(callback);
    return () => {
      this.unreadCountHandlers = this.unreadCountHandlers.filter(h => h !== callback);
    };
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionHandlers.push(callback);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== callback);
    };
  }

  private notifyNotificationHandlers(notification: any) {
    this.notificationHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
  }

  private notifyUnreadCountHandlers(count: number) {
    this.unreadCountHandlers.forEach(handler => {
      try {
        handler(count);
      } catch (error) {
        console.error('Error in unread count handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Manual room management
  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', roomId);
    }
  }

  // Send custom events
  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Listen to custom events
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Messaging-specific methods
  joinChat(userId: string) {
    this.emit('joinChat', { userId });
  }

  leaveChat(userId: string) {
    this.emit('leaveChat', { userId });
  }

  startTyping(userId: string) {
    this.emit('startTyping', { userId });
  }

  stopTyping(userId: string) {
    this.emit('stopTyping', { userId });
  }

  onNewMessage(callback: (message: any) => void) {
    return this.on('newMessage', callback);
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    return this.on('userTyping', callback);
  }

  onUserOnline(callback: (data: { userId: string; isOnline: boolean }) => void) {
    return this.on('userOnline', callback);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
