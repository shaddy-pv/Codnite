import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users, Search, MoreVertical, Phone, Video, Smile, Paperclip, X } from 'lucide-react';
import { chatApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import Avatar from './ui/Avatar';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
}

interface Chat {
  id: string;
  participant: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    isOnline: boolean;
  };
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

interface ChatSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ isOpen, onClose }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await chatApi.getDirectChats();
      setChats(response.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await chatApi.getDirectMessages(chatId, 1, 50);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;

    setSending(true);
    try {
      const response = await chatApi.sendDirectMessage(activeChat, newMessage);
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
      
      // Update last message in chats
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, lastMessage: response.message, updatedAt: response.message.createdAt }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
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

  const filteredChats = chats.filter(chat =>
    chat.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChatData = chats.find(chat => chat.id === activeChat);

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.senderId === 'current-user-id'; // You'll need to get this from context
    const isLastMessage = messages[messages.length - 1]?.id === message.id;

    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
            isCurrentUser
              ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
              : 'bg-slate-700/50 text-white border border-slate-600/50'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          <p
            className={`text-xs mt-2 ${
              isCurrentUser ? 'text-primary-200' : 'text-slate-400'
            }`}
          >
            {formatDistanceToNow(new Date(message.createdAt))} ago
            {isCurrentUser && (
              <span className="ml-1">
                {message.read ? '✓✓' : '✓'}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      <div className="flex h-full">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        {/* Chat Sidebar */}
        <div className="relative w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Messages</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      activeChat === chat.id
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar
                          src={chat.participant.avatarUrl}
                          alt={chat.participant.name}
                          size="md"
                        />
                        {chat.participant.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{chat.participant.name}</h3>
                          {chat.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {chat.lastMessage ? formatDistanceToNow(new Date(chat.lastMessage.createdAt)) + ' ago' : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="relative flex-1 bg-slate-800 flex flex-col">
          {activeChatData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700 bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar
                        src={activeChatData.participant.avatarUrl}
                        alt={activeChatData.participant.name}
                        size="md"
                      />
                      {activeChatData.participant.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{activeChatData.participant.name}</h3>
                      <p className="text-sm text-slate-400">
                        {activeChatData.participant.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare className="w-16 h-16 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
                    <p className="text-center max-w-sm">
                      Start a conversation with {activeChatData.participant.name}!
                    </p>
                  </div>
                ) : (
                  messages.map(renderMessage)
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700 bg-slate-700/50">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="pr-12 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-lg shadow-primary-500/25 border-0"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare className="w-16 h-16 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-center max-w-sm">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;
