import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing,
  onFollowChange,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const [loading, setLoading] = useState(false);
  const [currentFollowState, setCurrentFollowState] = useState(isFollowing);
  const { success, error: showError } = useToast();

  useEffect(() => {
    setCurrentFollowState(isFollowing);
  }, [isFollowing]);

  const handleFollowToggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (currentFollowState) {
        // Unfollow
        await api.unfollowUser(userId);
        setCurrentFollowState(false);
        onFollowChange(false);
        success('Unfollowed successfully');
      } else {
        // Follow
        await api.followUser(userId);
        setCurrentFollowState(true);
        onFollowChange(true);
        success('Followed successfully');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Updating...';
    return currentFollowState ? 'Following' : 'Follow';
  };

  const getButtonVariant = () => {
    if (loading) return 'outline';
    return currentFollowState ? 'outline' : 'primary';
  };

  const getIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    return currentFollowState ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />;
  };

  return (
    <Button
      onClick={handleFollowToggle}
      variant={getButtonVariant()}
      size={size}
      disabled={loading}
      leftIcon={showIcon ? getIcon() : undefined}
      className={`transition-all duration-200 ${
        currentFollowState 
          ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400' 
          : 'hover:bg-primary-50 hover:text-primary-600'
      } ${className}`}
    >
      {getButtonText()}
    </Button>
  );
};

export default FollowButton;

