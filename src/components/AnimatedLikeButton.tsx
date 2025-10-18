import React, { useState, useCallback, useEffect } from 'react';
import { Heart, ThumbsUp } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface AnimatedLikeButtonProps {
  itemId: string;
  itemType: 'post' | 'comment';
  initialLikes: number;
  initialIsLiked: boolean;
  onLikeChange?: (likes: number, isLiked: boolean) => void;
  variant?: 'heart' | 'thumbs';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const AnimatedLikeButton: React.FC<AnimatedLikeButtonProps> = ({
  itemId,
  itemType,
  initialLikes,
  initialIsLiked,
  onLikeChange,
  variant = 'heart',
  size = 'md',
  showCount = true,
  className = ''
}) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const { error: showError } = useToast();

  // Update state when props change
  useEffect(() => {
    setLikes(initialLikes);
    setIsLiked(initialIsLiked);
  }, [initialLikes, initialIsLiked]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;

    setIsLiking(true);
    const previousLikes = likes;
    const previousIsLiked = isLiked;

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : likes - 1;
    
    setLikes(newLikes);
    setIsLiked(newIsLiked);
    setIsAnimating(true);
    setAnimationKey(prev => prev + 1);

    try {
      if (newIsLiked) {
        if (itemType === 'post') {
          await api.likePost(itemId);
        } else {
          await api.likeComment(itemId);
        }
      } else {
        if (itemType === 'post') {
          await api.unlikePost(itemId);
        } else {
          await api.unlikeComment(itemId);
        }
      }
      
      onLikeChange?.(newLikes, newIsLiked);
    } catch (error: any) {
      // Revert optimistic update on error
      setLikes(previousLikes);
      setIsLiked(previousIsLiked);
      showError('Failed to update like');
    } finally {
      setIsLiking(false);
      // Stop animation after a delay
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [itemId, itemType, likes, isLiked, isLiking, onLikeChange, showError]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const Icon = variant === 'heart' ? Heart : ThumbsUp;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleLike}
        disabled={isLiking}
        className={`
          relative flex items-center justify-center rounded-full transition-all duration-200
          ${buttonSizeClasses[size]}
          ${isLiked 
            ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
          ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
      >
        <Icon 
          className={`
            ${sizeClasses[size]} transition-all duration-200
            ${isLiked ? 'fill-current' : ''}
            ${isAnimating ? 'animate-pulse' : ''}
          `}
        />
        
        {/* Ripple effect */}
        {isAnimating && (
          <div
            key={animationKey}
            className="absolute inset-0 rounded-full bg-red-200 dark:bg-red-800 animate-ping opacity-75"
          />
        )}
        
        {/* Floating hearts animation */}
        {isAnimating && variant === 'heart' && isLiked && (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={`heart-${animationKey}-${i}`}
                className="absolute pointer-events-none"
                style={{
                  animation: `floatHeart 1s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Heart className="w-3 h-3 text-red-400 fill-current" />
              </div>
            ))}
          </>
        )}
      </button>

      {showCount && (
        <span 
          className={`
            text-sm font-medium transition-colors duration-200
            ${isLiked ? 'text-red-500' : 'text-gray-500'}
            ${isAnimating ? 'animate-pulse' : ''}
          `}
        >
          {likes > 0 ? likes.toLocaleString() : ''}
        </span>
      )}

      <style jsx>{`
        @keyframes floatHeart {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -70px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100px) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedLikeButton;
