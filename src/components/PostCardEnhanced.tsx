import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Share2, Bookmark, Heart, MoreHorizontal, Flag, Copy, ExternalLink } from 'lucide-react';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { Button } from './ui/Button';
import Loading from './ui/Loading';
import { api, Post, bookmarkApi } from '../services/api';
import { useToast } from './ui/Toast';
import CommentSection from './CommentSection';
import { usePerformanceMonitor } from '../hooks/usePerformance';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onCommentCountChange?: (postId: string, count: number) => void;
  showActions?: boolean;
  showComments?: boolean;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = React.memo(({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onReport,
  onCommentCountChange,
  showActions = true,
  showComments = false,
  className = ''
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(showComments);
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
    if (post.content.length <= 300) return post.content;
    return post.content.substring(0, 300) + '...';
  }, [post.content]);

  const tags = useMemo(() => {
    if (Array.isArray(post.tags)) {
      return post.tags.slice(0, 5);
    }
    if (typeof post.tags === 'string') {
      return post.tags.split(',').slice(0, 5);
    }
    return [];
  }, [post.tags]);

  // Optimize callback functions
  const handleLike = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await api.likePost(post.id);
      
      if (response.liked) {
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      } else {
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      }
      onLike?.(post.id);
    } catch (err: any) {
      error('Failed to update like', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, post.id, onLike, error]);

  const handleComment = useCallback(() => {
    setShowCommentsSection(!showCommentsSection);
    onComment?.(post.id);
  }, [showCommentsSection, onComment, post.id]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: `${window.location.origin}/post/${post.id}`,
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
        success('Link copied to clipboard');
      }
      onShare?.(post.id);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error('Failed to share post', err.message);
      }
    }
  }, [post.title, post.content, post.id, onShare, success, error]);

  const handleBookmark = useCallback(async () => {
    try {
      const response = await bookmarkApi.bookmarkPost(post.id);
      setIsBookmarked(response.bookmarked);
      success(response.bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
      onBookmark?.(post.id);
    } catch (err: any) {
      error('Failed to update bookmark', err.message);
    }
  }, [post.id, onBookmark, success, error]);

  const handleReport = useCallback(() => {
    onReport?.(post.id);
    setShowMoreOptions(false);
  }, [onReport, post.id]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      success('Link copied to clipboard');
    } catch (err: any) {
      error('Failed to copy link', err.message);
    }
    setShowMoreOptions(false);
  }, [post.id, success, error]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(`/post/${post.id}`, '_blank');
    setShowMoreOptions(false);
  }, [post.id]);

  return (
    <article className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${className}`}>
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
              to={`/profile/${post.author?.id}`}
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
        
        {/* Category Badge */}
        {post.category && (
          <Badge variant="secondary" size="sm">
            {post.category}
          </Badge>
        )}
        
        {/* Language Badge */}
        {post.language && (
          <Badge variant="outline" size="sm">
            {post.language}
          </Badge>
        )}

        {/* More Options */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          
          {showMoreOptions && (
            <div className="absolute right-0 top-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 z-30 min-w-[160px]">
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open in New Tab</span>
              </button>
              <button
                onClick={handleReport}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Flag className="h-4 w-4" />
                <span>Report</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {post.title}
        </h3>
        
        {/* Rich Content */}
        <div 
          className="prose prose-sm max-w-none text-neutral-700 dark:text-neutral-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
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

      {/* Comments Section */}
      {showCommentsSection && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <CommentSection
            postId={post.id}
            onCommentCountChange={(count) => {
              onCommentCountChange?.(post.id, count);
            }}
          />
        </div>
      )}
    </article>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
