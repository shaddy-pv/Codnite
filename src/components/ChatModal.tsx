import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Circle, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Avatar from './ui/Avatar';
import { PortalModal } from './ui/PortalModal';
import { api } from '../services/api';
import { useToast } from './ui/Toast';
import socketService from '../services/socket';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userAvatar
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { error: showError } = useToast();

  // Scroll the messages container to bottom (avoid scrolling modal backdrop)
  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when modal opens
  useEffect(() => {
    let mounted = true;
    if (isOpen) {
      // Reset scroll position every time it opens to avoid stuck offset
      requestAnimationFrame(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
      loadMessages();
      joinChatRoom();
    } else {
      leaveChatRoom();
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = 0;
    }
    return () => { mounted = false; };
  }, [isOpen, userId]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socketService.isSocketConnected()) return;

    const handleNewMessage = (message: Message) => {
      if (message.senderId === userId || message.receiverId === userId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === userId) {
        setIsTyping(data.isTyping);
      }
    };

    const handleUserOnline = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === userId) {
        setIsOnline(data.isOnline);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleTyping);
    socketService.onUserOnline(handleUserOnline);

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userTyping', handleTyping);
      socketService.off('userOnline', handleUserOnline);
    };
  }, [userId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await api.getMessages(userId);
      console.log('Messages response:', response);
      console.log('Messages array:', response.messages);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const joinChatRoom = () => {
    socketService.joinChat(userId);
  };

  const leaveChatRoom = () => {
    socketService.leaveChat(userId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.sendMessage(userId, newMessage.trim());
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
      
      // Emit typing stop
      socketService.stopTyping(userId);
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Emit typing status
    if (e.target.value.trim()) {
      socketService.startTyping(userId);
    } else {
      socketService.stopTyping(userId);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      console.log('Formatting date:', dateString, typeof dateString);
      
      // Handle different date formats
      let date: Date;
      if (typeof dateString === 'string') {
        // Try parsing as ISO string first
        date = new Date(dateString);
        
        // If that fails, try other common formats
        if (isNaN(date.getTime())) {
          // Try parsing as PostgreSQL timestamp
          date = new Date(dateString.replace(' ', 'T'));
        }
        
        // If still invalid, try adding timezone info
        if (isNaN(date.getTime())) {
          date = new Date(dateString + 'Z');
        }
      } else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date after all attempts:', dateString);
        return 'Just now';
      }
      
      const now = new Date();
      const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
      
      // Show relative time for recent messages
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m ago`;
      } else if (diffInMinutes < 1440) { // Less than 24 hours
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Just now';
    }
  };

  return (
    <PortalModal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="flex flex-col h-[80vh] md:h-[600px] bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar
                src={userAvatar}
                name={userName}
                size="md"
              />
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {userName}
              </h3>
              <p className="text-sm text-slate-400">
                {isOnline ? 'Online' : 'Offline'}
                {isTyping && ' • Typing...'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/20">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
              <p className="text-slate-400 text-center max-w-sm">
                Start a conversation with {userName}!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === userId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.senderId === userId
                      ? 'bg-slate-700/50 text-white border border-slate-600/50'
                      : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.senderId === userId
                        ? 'text-slate-400'
                        : 'text-primary-200'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                    {message.senderId !== userId && (
                      <span className="ml-1">
                        {message.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
          {/* sentinel no-op; we manually control scrollTop */}
          <div />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-700/30">
          <div className="flex space-x-3">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500/20"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-lg shadow-primary-500/25 border-0"
              leftIcon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </PortalModal>
  );
};

export default ChatModal;
