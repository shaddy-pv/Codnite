import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, Search, MoreVertical, Phone, Video, Smile, Paperclip, X } from 'lucide-react';
import { chatApi, api } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Chat {
  id: string;
  participants: { id: string; username: string; avatarUrl?: string; name?: string; isOnline?: boolean }[];
  lastMessage?: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
  createdAt: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

const Messages: React.FC = () => {
  const safeTimeAgo = (dateInput?: string): string => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return formatDistanceToNow(d) + ' ago';
  };
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    (async () => {
      await loadCurrentUser();
      await loadChats();
    })();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  const loadCurrentUser = async () => {
    try {
      const userData = await api.getMe();
      setCurrentUserId(userData.id);
    } catch (error) {
      console.error('Error loading current user:', error);
      setCurrentUserId('current-user');
    }
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await chatApi.getDirectChats();
      setChats(response.chats || []);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        // Unauthorized: show empty chats without logging noise
        setChats([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      // Extract participant ID from chat ID (format: chat_${participantId})
      const participantId = chatId.replace('chat_', '');
      const response = await chatApi.getDirectMessages(participantId, 1, 50);
      setMessages(response.messages || []);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        setMessages([]);
        return;
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat || sending) return;

    setSending(true);
    try {
      // Extract participant ID from chat ID (format: chat_${participantId})
      const participantId = activeChat.replace('chat_', '');
      const response = await chatApi.sendDirectMessage(participantId, newMessage);
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
      
      // Update last message in chats
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, lastMessage: response.message } 
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    setActiveChat(chatId);
    // Mark messages as read
    const participantId = chatId.replace('chat_', '');
    chatApi.markDirectChatAsRead(participantId).catch(err => console.error('Failed to mark as read:', err));
    setChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, unreadCount: 0 } : chat));
  };

  const activeChatData = chats.find(chat => chat.id === activeChat);
  const otherParticipant = activeChatData?.participants.find(p => p.id !== currentUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
            <MessageSquare className="h-10 w-10 text-primary-400" />
            <span>Messages</span>
          </h1>
          <p className="text-slate-400 text-lg">Connect and chat with other developers</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 h-[calc(100vh-200px)] flex">
          {/* Chat List Sidebar */}
          <div className="w-1/3 border-r border-slate-700/50 flex flex-col">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-primary-400" />
                <span>Chats</span>
              </h2>
            </div>
            <div className="p-4 border-b border-slate-700/50">
              <Input
                placeholder="Search chats or start new..."
                icon={<Search className="h-4 w-4 text-slate-400" />}
                className="bg-slate-800/70 border-slate-600/50 text-white placeholder-slate-400"
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg font-semibold">No chats yet</p>
                  <p className="text-sm">Start a conversation with someone!</p>
                </div>
              ) : (
                chats.map(chat => {
                  const participant = chat.participants.find(p => p.id !== currentUserId);
                  return (
                    <div
                      key={chat.id}
                      className={`flex items-center p-4 space-x-3 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 ${
                        activeChat === chat.id ? 'bg-slate-800/70 border-l-4 border-primary-600' : ''
                      }`}
                      onClick={() => handleChatClick(chat.id)}
                    >
                      <Avatar src={participant?.avatarUrl} name={participant?.username} size="lg" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white">{participant?.name || participant?.username}</h4>
                          <span className="text-xs text-slate-500">
                            {safeTimeAgo((chat as any)?.lastMessage?.createdAt || (chat as any)?.lastMessage?.last_message_time)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-1">
                          {chat.lastMessage?.content || 'No messages yet.'}
                        </p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="w-2/3 flex flex-col">
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-700/30">
                  <div className="flex items-center space-x-3">
                    <Avatar src={otherParticipant?.avatarUrl} name={otherParticipant?.username} size="md" />
                    <div>
                      <h3 className="font-semibold text-white">{otherParticipant?.name || otherParticipant?.username}</h3>
                      <p className="text-sm text-slate-400">{otherParticipant?.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/20 custom-scrollbar">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.senderId === currentUserId
                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                            : 'bg-slate-700/50 text-white border border-slate-600/50'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.senderId === currentUserId
                              ? 'text-primary-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {safeTimeAgo((message as any)?.createdAt)}
                          {message.senderId === currentUserId && (
                            <span className="ml-1">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-slate-700/50 bg-slate-700/30">
                  <div className="flex space-x-3">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700/50">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500/20"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white border-0"
                      leftIcon={sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare className="h-24 w-24 text-slate-600 mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-2">Select a chat to start messaging</h3>
                <p className="text-lg text-center max-w-md">
                  Choose a conversation from the left sidebar or start a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
