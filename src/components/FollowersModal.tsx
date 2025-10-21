import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { PortalModal } from './ui/PortalModal';
import Avatar from './ui/Avatar';
import { api } from '../services/api';
import { useToast } from './ui/Toast';
import FollowButton from './FollowButton';

interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  points: number;
  isFollowing?: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  userName: string;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  userName
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadCurrentUser();
    }
  }, [isOpen, userId, type]);

  const loadCurrentUser = async () => {
    try {
      const userData = await api.getMe();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      let response;
      if (type === 'followers') {
        response = await api.getFollowers(userId, 1, 50);
        setUsers(response.followers || []);
      } else {
        response = await api.getFollowing(userId, 1, 50);
        setUsers(response.following || []);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      showError(`Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setUsers(prev => prev.map(user => 
      user.id === targetUserId 
        ? { ...user, isFollowing }
        : user
    ));
  };

  const getTitle = () => {
    return type === 'followers' ? 'Followers' : 'Following';
  };

  const getIcon = () => {
    return type === 'followers' ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />;
  };

  return (
    <PortalModal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="flex flex-col h-[600px] bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {getTitle()}
              </h2>
              <p className="text-slate-400 text-sm">
                {userName} • {users.length} {type}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400">Loading {type}...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No {type} yet</h3>
              <p className="text-slate-400 text-center max-w-sm">
                {type === 'followers' 
                  ? 'This user doesn\'t have any followers yet.' 
                  : 'This user isn\'t following anyone yet.'
                }
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {users.map((user, index) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-700/30 transition-all duration-200 group"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.4s ease-out forwards'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.name}
                      size="md"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                        {user.name}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-slate-500 text-sm mt-1 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="text-xs text-slate-500">
                          {user.points.toLocaleString()} points
                        </span>
                        <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                        <span className="text-xs text-slate-500">
                          {type === 'followers' ? 'Follows you' : 'Following'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {currentUser && user.id !== currentUser.id && (
                    <FollowButton
                      userId={user.id}
                      isFollowing={user.isFollowing || false}
                      onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                      size="sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalModal>
  );
};

export default FollowersModal;

