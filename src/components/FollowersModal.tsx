import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
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
      } else {
        response = await api.getFollowing(userId, 1, 50);
      }
      setUsers(response.users || []);
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
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {getTitle()}
            </h2>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              ({users.length})
            </span>
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

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
              <Users className="w-12 h-12 mb-4 opacity-50" />
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.name}
                      size="md"
                    />
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {user.name}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {user.points} points
                      </p>
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
    </Modal>
  );
};

export default FollowersModal;

