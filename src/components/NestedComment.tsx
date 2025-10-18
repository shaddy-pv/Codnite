import React, { useState, useCallback } from 'react';
import { 
  Reply, 
  Edit3, 
  Trash2, 
  Heart, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronRight,
  Flag,
  User
} from 'lucide-react';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { api } from '../services/api';
import { useToast } from './ui/Toast';
import RichTextEditor from './RichTextEditor';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  replyCount: number;
  isEdited: boolean;
  parentId?: string;
}

interface NestedCommentProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  onCommentUpdate?: () => void;
  onCommentDelete?: () => void;
  maxDepth?: number;
  currentDepth?: number;
}

const NestedComment: React.FC<NestedCommentProps> = ({
  comment,
  postId,
  currentUserId,
  onCommentUpdate,
  onCommentDelete,
  maxDepth = 3,
  currentDepth = 0
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [showActions, setShowActions] = useState(false);
  const { success, error: showError } = useToast();

  const canEdit = currentUserId === comment.author.id;
  const canDelete = currentUserId === comment.author.id;
  const canReply = currentDepth < maxDepth;

  const handleLike = useCallback(async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (comment.isLiked) {
        await api.unlikeComment(comment.id);
      } else {
        await api.likeComment(comment.id);
      }
      onCommentUpdate?.();
    } catch (error: any) {
      showError('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  }, [comment.id, comment.isLiked, isLiking, onCommentUpdate, showError]);

  const handleReply = useCallback(async () => {
    if (!replyContent.trim()) return;

    try {
      await api.createComment(postId, replyContent, comment.id);
      success('Reply posted successfully!');
      setReplyContent('');
      setIsReplying(false);
      onCommentUpdate?.();
    } catch (error: any) {
      showError('Failed to post reply');
    }
  }, [replyContent, postId, comment.id, onCommentUpdate, success, showError]);

  const handleEdit = useCallback(async () => {
    if (!editContent.trim()) return;

    try {
      await api.updateComment(comment.id, editContent);
      success('Comment updated successfully!');
      setIsEditing(false);
      onCommentUpdate?.();
    } catch (error: any) {
      showError('Failed to update comment');
    }
  }, [editContent, comment.id, onCommentUpdate, success, showError]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.deleteComment(comment.id);
      success('Comment deleted successfully!');
      onCommentDelete?.();
    } catch (error: any) {
      showError('Failed to delete comment');
    }
  }, [comment.id, onCommentDelete, success, showError]);

  const handleReport = useCallback(async () => {
    try {
      await api.reportComment(comment.id, 'Inappropriate content');
      success('Comment reported successfully');
      setShowActions(false);
    } catch (error: any) {
      showError('Failed to report comment');
    }
  }, [comment.id, success, showError]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderReplies = () => {
    if (comment.replies.length === 0) return null;

    return (
      <div className="ml-8 mt-4 space-y-4">
        {comment.replies.map((reply) => (
          <NestedComment
            key={reply.id}
            comment={reply}
            postId={postId}
            currentUserId={currentUserId}
            onCommentUpdate={onCommentUpdate}
            onCommentDelete={onCommentDelete}
            maxDepth={maxDepth}
            currentDepth={currentDepth + 1}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar
            src={comment.author.avatarUrl}
            alt={comment.author.name}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.author.name}
              </span>
              <span className="text-sm text-gray-500">
                @{comment.author.username}
              </span>
              <span className="text-sm text-gray-400">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <Badge variant="secondary" className="text-xs">
                  edited
                </Badge>
              )}
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                {canEdit && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={handleReport}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-orange-600 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="mb-4">
            <RichTextEditor
              content={editContent}
              onChange={setEditContent}
              placeholder="Edit your comment..."
              maxLength={2000}
            />
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={!editContent.trim()}
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="prose dark:prose-invert max-w-none mb-4"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        )}

        {/* Comment Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
              comment.isLiked ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
            <span>{comment.likes}</span>
          </button>

          {canReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
          )}

          {comment.replyCount > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              {showReplies ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>{comment.replyCount} replies</span>
            </button>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <RichTextEditor
              content={replyContent}
              onChange={setReplyContent}
              placeholder={`Reply to ${comment.author.name}...`}
              maxLength={2000}
            />
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyContent.trim()}
              >
                Reply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {showReplies && renderReplies()}
    </div>
  );
};

export default NestedComment;
