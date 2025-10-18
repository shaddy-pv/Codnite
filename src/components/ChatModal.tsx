import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Circle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Avatar from './ui/Avatar';
import { Modal } from './ui/Modal';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { error: showError } = useToast();

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      joinChatRoom();
    } else {
      leaveChatRoom();
    }
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar
                src={userAvatar}
                name={userName}
                size="md"
              />
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                {userName}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {isOnline ? 'Online' : 'Offline'}
                {isTyping && ' • Typing...'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            leftIcon={<X className="w-4 h-4" />}
          >
            Close
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-neutral-500 dark:text-neutral-400">
              No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map((message) => {
              console.log('Rendering message:', message);
              return (
              <div
                key={message.id}
                className={`flex ${message.senderId === userId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === userId
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                      : 'bg-primary-600 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === userId
                        ? 'text-neutral-500 dark:text-neutral-400'
                        : 'text-primary-100'
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
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              leftIcon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChatModal;
