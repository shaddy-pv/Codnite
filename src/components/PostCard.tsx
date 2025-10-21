import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Share2, Bookmark, Heart } from 'lucide-react';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { Button } from './ui/Button';
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

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-slate-900/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 group">
      {/* Post Header */}
             <div className="flex items-center p-6 border-b border-slate-700/50">
               <Avatar 
                 src={post.author?.avatarUrl} 
                 name={post.author?.name || 'Unknown User'}
                 size="md" 
               />
        <div className="ml-4 flex-1">
          <div className="flex items-center space-x-3">
            <Link 
              to={`/profile/${post.author?.id || 'unknown'}`} 
              className="font-semibold text-white hover:text-primary-400 transition-colors text-lg"
            >
              {post.author?.name || 'Unknown User'}
            </Link>
            <span className="text-slate-400 text-sm">
              @{post.author?.username || 'unknown'}
            </span>
          </div>
          <div className="flex items-center text-slate-400 text-sm mt-1">
            {post.author?.collegeId && (
              <>
                <span>{post.author.collegeId}</span>
                <span className="mx-2">•</span>
              </>
            )}
            <span>{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
        
        {/* Language Badge */}
        {post.language && (
          <div className="px-3 py-1 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-full">
            <span className="text-primary-300 text-xs font-medium">{post.language}</span>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="p-6">
        <h3 className="font-bold text-white mb-4 text-xl leading-tight">
          {post.title}
        </h3>
        
        <p className="text-slate-300 mb-6 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {post.code && (
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
              <span className="text-primary-400 text-xs font-semibold">
                {post.language?.toUpperCase()}
              </span>
              <button
                onClick={() => copyCode(post.code!)}
                className="text-slate-400 hover:text-white text-xs transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 text-slate-200 text-sm font-mono overflow-x-auto">
              <code>{post.code}</code>
            </pre>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full border border-slate-600/50 hover:bg-slate-700 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      {showActions && (
        <div className="px-4 sm:px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <button
                onClick={handleLike}
                disabled={isLoading}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                  isLiked 
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5" />
                <span className="text-xs sm:text-sm font-medium">{post._count?.comments || 0}</span>
              </button>

              <button
                onClick={handleShare}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
            
            <button
              onClick={handleBookmark}
              disabled={isBookmarkLoading}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                isBookmarked 
                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
        <div className="px-4 sm:px-6 py-4 border-t border-slate-700/50 bg-slate-800/20">
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
