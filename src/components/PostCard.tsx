import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Share2, Bookmark, Heart, MoreHorizontal, Flag, Trash2 } from 'lucide-react';
import Avatar from './ui/Avatar';
import Loading from './ui/Loading';
import { api, Post } from '../services/api';
import { useToast } from './ui/Toast';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onCommentCountChange?: (postId: string, count: number) => void;
  showActions?: boolean;
  showComments?: boolean;
}

const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onCommentCountChange,
  showActions = true,
  showComments = false
}) => {
  // Safety check for post data
  if (!post || !post.id) {
    return null;
  }

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(showComments);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const { success, error } = useToast();

  // Sync showComments prop with internal state
  useEffect(() => {
    setShowCommentsSection(showComments);
  }, [showComments]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
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
  };

  const handleComment = () => {
    setShowCommentsSection(!showCommentsSection);
    onComment?.(post.id);
  };

  const handleShare = () => {
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
  };

  const handleBookmark = async () => {
    if (isBookmarkLoading) return;
    
    setIsBookmarkLoading(true);
    try {
      const { bookmarkApi } = await import('../services/api');
      const result = await bookmarkApi.bookmarkPost(post.id);
      
      if (result.bookmarked) {
        setIsBookmarked(true);
        success('Post saved!');
      } else {
        setIsBookmarked(false);
        success('Post removed from saved');
      }
      
      onBookmark?.(post.id);
    } catch (err: any) {
      error('Failed to save post', err.message);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    success('Code copied to clipboard');
  };

  const handleReport = () => {
    setShowOptionsMenu(false);
    // TODO: Implement report functionality
    success('Post reported successfully');
  };

  const handleDelete = async () => {
    setShowOptionsMenu(false);
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        // TODO: Implement delete API call
        success('Post deleted successfully');
      } catch (err: any) {
        error('Failed to delete post', err.message);
      }
    }
  };

  return (
    <div className="bg-ember-bg-secondary backdrop-blur-sm rounded-2xl border border-ember-border overflow-hidden shadow-medium hover:shadow-strong hover:bg-ember-bg-tertiary hover:border-primary-600/30 hover:shadow-glow transition-all duration-300 group">
      {/* Post Header */}
             <div className="flex items-center p-6 border-b border-ember-border">
               <Avatar 
                 src={post.author?.avatarUrl} 
                 alt={post.author?.name || 'Unknown User'}
                 size="md"
                 className="ring-2 ring-ember-border group-hover:ring-primary-600/50 transition-all duration-300"
               />
        <div className="ml-4 flex-1">
          <div className="flex items-center space-x-3">
            <Link 
              to={`/profile/${post.author?.id || 'unknown'}`} 
              className="font-semibold text-ember-text-primary hover:text-primary-400 transition-colors text-lg"
            >
              {post.author?.name || 'Unknown User'}
            </Link>
            <span className="text-ember-text-secondary text-sm">
              @{post.author?.username || 'unknown'}
            </span>
          </div>
          <div className="flex items-center text-ember-text-secondary text-sm mt-1">
            {post.author?.collegeId && (
              <>
                <span>{post.author.collegeId}</span>
                <span className="mx-2">•</span>
              </>
            )}
            <span>{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Language Badge */}
          {post.language && (
            <div className="px-3 py-1 bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-primary-600/30 rounded-full shadow-soft">
              <span className="text-primary-300 text-xs font-medium">{post.language}</span>
            </div>
          )}
          
          {/* Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover rounded-lg transition-all duration-300"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showOptionsMenu && (
              <>
                <div className="absolute top-full right-0 mt-2 w-48 bg-ember-bg-secondary rounded-xl shadow-strong border border-ember-border py-2 z-20 backdrop-blur-md">
                  <button
                    onClick={handleReport}
                    className="flex items-center w-full px-4 py-2 text-sm text-ember-text-primary hover:bg-ember-bg-hover hover:text-primary-300 transition-all duration-300 rounded-lg mx-2"
                  >
                    <Flag className="w-4 h-4 mr-3" />
                    Report Post
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-error-400 hover:bg-error-500/10 hover:text-error-300 transition-all duration-300 rounded-lg mx-2"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete Post
                  </button>
                </div>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowOptionsMenu(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        <h3 className="font-bold text-ember-text-primary mb-4 text-xl leading-tight group-hover:text-primary-300 transition-colors duration-300">
          {post.title}
        </h3>
        
        <p className="text-ember-text-secondary mb-6 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {post.code && (
          <div className="bg-ember-bg-primary rounded-xl border border-ember-border overflow-hidden mb-6 shadow-soft">
            <div className="flex items-center justify-between px-4 py-3 bg-ember-bg-tertiary border-b border-ember-border">
              <span className="text-primary-400 text-xs font-semibold">
                {post.language?.toUpperCase()}
              </span>
              <button
                onClick={() => copyCode(post.code!)}
                className="text-ember-text-secondary hover:text-primary-300 text-xs transition-all duration-300 px-3 py-1 rounded-lg hover:bg-ember-bg-hover"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 text-ember-text-primary text-sm font-mono overflow-x-auto">
              <code>{post.code}</code>
            </pre>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-ember-bg-tertiary text-ember-text-secondary text-xs rounded-full border border-ember-border hover:bg-ember-bg-hover hover:text-primary-300 hover:border-primary-600/30 transition-all duration-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      {showActions && (
        <div className="px-4 sm:px-6 py-4 border-t border-ember-border bg-ember-bg-tertiary/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <button
                onClick={handleLike}
                disabled={isLoading}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isLiked 
                    ? 'text-secondary-400 hover:text-secondary-300 hover:bg-secondary-500/10 shadow-glow' 
                    : 'text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <Loading size="sm" />
                ) : (
                  <Heart className={`h-4 sm:h-5 w-4 sm:w-5 ${isLiked ? 'fill-current' : ''}`} />
                )}
                <span className="text-xs sm:text-sm font-medium">{likesCount}</span>
              </button>
              
              <button
                onClick={handleComment}
                className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover transition-all duration-300"
              >
                <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5" />
                <span className="text-xs sm:text-sm font-medium">{post._count?.comments || 0}</span>
              </button>

              <button
                onClick={handleShare}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-xl text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover transition-all duration-300"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
            
            <button
              onClick={handleBookmark}
              disabled={isBookmarkLoading}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                isBookmarked 
                  ? 'text-warning-400 hover:text-warning-300 hover:bg-warning-500/10 shadow-soft' 
                  : 'text-ember-text-secondary hover:text-ember-text-primary hover:bg-ember-bg-hover'
              } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isBookmarkLoading ? (
                <Loading size="sm" />
              ) : (
                <Bookmark className={`h-4 sm:h-5 w-4 sm:w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              )}
              <span className="hidden sm:inline text-sm font-medium">
                {isBookmarked ? 'Saved' : 'Save'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showCommentsSection && (
        <div className="px-4 sm:px-6 py-4 border-t border-ember-border bg-ember-bg-primary/30">
          <CommentSection
            postId={post.id}
            onCommentCountChange={(count) => {
              onCommentCountChange?.(post.id, count);
            }}
          />
        </div>
      )}
    </div>
  );
};

const areEqual = (prev: PostCardProps, next: PostCardProps) => (
  prev.post.id === next.post.id &&
  prev.post._count?.likes === next.post._count?.likes &&
  prev.post._count?.comments === next.post._count?.comments &&
  prev.showActions === next.showActions &&
  prev.showComments === next.showComments
);

const PostCard = memo(PostCardComponent, areEqual);

export default PostCard;
