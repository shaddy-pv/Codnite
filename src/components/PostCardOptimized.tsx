import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Share2, Bookmark, Heart } from 'lucide-react';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { Button } from './ui/Button';
import Loading from './ui/Loading';
import { api, Post } from '../services/api';
import { useToast } from './ui/Toast';
import { usePerformanceMonitor } from '../hooks/usePerformance';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  showActions?: boolean;
}

const PostCard: React.FC<PostCardProps> = React.memo(({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  showActions = true
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { success, error } = useToast();
  
  // Performance monitoring in development
  usePerformanceMonitor('PostCard');

  // Memoize expensive computations
  const formattedDate = useMemo(() => {
    const date = new Date(post.createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }, [post.createdAt]);

  const truncatedContent = useMemo(() => {
    if (post.content.length <= 200) return post.content;
    return post.content.substring(0, 200) + '...';
  }, [post.content]);

  const tags = useMemo(() => {
    return post.tags?.split(',').slice(0, 3) || [];
  }, [post.tags]);

  // Optimize callback functions
  const handleLike = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isLiked) {
        await api.unlikePost(post.id);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await api.likePost(post.id);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
      onLike?.(post.id);
    } catch (err: any) {
      error('Failed to update like', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isLiked, post.id, onLike, error]);

  const handleComment = useCallback(() => {
    onComment?.(post.id);
  }, [onComment, post.id]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: window.location.origin + `/post/${post.id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
      success('Link copied to clipboard');
    }
    onShare?.(post.id);
  }, [post.title, post.content, post.id, onShare, success]);

  const handleBookmark = useCallback(async () => {
    try {
      if (isBookmarked) {
        await api.unbookmarkPost(post.id);
        setIsBookmarked(false);
        success('Removed from bookmarks');
      } else {
        await api.bookmarkPost(post.id);
        setIsBookmarked(true);
        success('Added to bookmarks');
      }
      onBookmark?.(post.id);
    } catch (err: any) {
      error('Failed to update bookmark', err.message);
    }
  }, [isBookmarked, post.id, onBookmark, success, error]);

  return (
    <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <Avatar 
          src={post.author?.avatarUrl} 
          name={post.author?.name || 'Unknown User'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Link 
              to={`/profile/${post.author?.id || 'unknown'}`}
              className="font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {post.author?.name || 'Unknown User'}
            </Link>
            <span className="text-neutral-500 dark:text-neutral-400 text-sm">
              {formattedDate}
            </span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            @{post.author?.username || 'unknown'}
          </p>
        </div>
        {post.language && (
          <Badge variant="secondary" size="sm">
            {post.language}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {post.title}
        </h3>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {truncatedContent}
        </p>
        
        {/* Code snippet */}
        {post.code && (
          <div className="mt-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-neutral-800 dark:text-neutral-200">
              <code>{post.code}</code>
            </pre>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, index) => (
              <Badge key={index} variant="outline" size="sm">
                #{tag.trim()}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLoading}
              leftIcon={isLiked ? <Heart className="h-4 w-4 fill-current" /> : <ThumbsUp className="h-4 w-4" />}
              className={`${isLiked ? 'text-red-500 hover:text-red-600' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              {isLoading ? <Loading size="sm" /> : likesCount}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              leftIcon={<MessageSquare className="h-4 w-4" />}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              {post._count?.comments || 0}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              leftIcon={<Share2 className="h-4 w-4" />}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Share
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            leftIcon={<Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current text-primary-600' : ''}`} />}
            className={`${isBookmarked ? 'text-primary-600 hover:text-primary-700' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
          >
            {isBookmarked ? 'Saved' : 'Save'}
          </Button>
        </div>
      )}
    </article>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
