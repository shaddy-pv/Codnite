import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Share2, Bookmark, Heart } from 'lucide-react';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { Button } from './ui/Button';
import Loading from './ui/Loading';
import { api, Post } from '../services/api';
import { useToast } from './ui/Toast';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  showActions?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  showActions = true
}) => {
  // Safety check for post data
  if (!post || !post.id) {
    return null;
  }

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

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

  const handleBookmark = () => {
    onBookmark?.(post.id);
    // TODO: Implement bookmark functionality
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    success('Code copied to clipboard');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <Avatar 
          src={post.author?.avatarUrl} 
          name={post.author?.name || 'Unknown User'}
          size="md" 
        />
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <Link 
              to={`/profile/${post.author?.id || 'unknown'}`} 
              className="font-medium text-gray-900 dark:text-white hover:underline"
            >
              {post.author?.name || 'Unknown User'}
            </Link>
            <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
              @{post.author?.username || 'unknown'}
            </span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            {post.author?.collegeId && (
              <>
                <span>{post.author.collegeId}</span>
                <span className="mx-1">•</span>
              </>
            )}
            <span>{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {post.title}
        </h3>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
          {post.content}
        </p>

        {post.code && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                {post.language?.toUpperCase()}
              </span>
              <button
                onClick={() => copyCode(post.code!)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="text-gray-800 dark:text-gray-200 text-sm font-mono overflow-x-auto">
              <code>{post.code}</code>
            </pre>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <Badge key={index} text={tag} color="blue" />
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      {showActions && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex space-x-6">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loading size="sm" />
              ) : (
                <Heart className={`h-4 w-4 mr-1.5 ${isLiked ? 'fill-current' : ''}`} />
              )}
              <span className="text-sm">{likesCount}</span>
            </button>
            
            <button
              onClick={handleComment}
              className="flex items-center text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              <span className="text-sm">{post._count?.comments || 0}</span>
            </button>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleBookmark}
              className="text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              onClick={handleShare}
              className="text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
