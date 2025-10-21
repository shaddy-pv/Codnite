import React, { useState, useEffect, useCallback, memo } from 'react';
import { MessageSquare, Send, MoreHorizontal, Edit, Trash2, Reply, ChevronDown, ChevronRight } from 'lucide-react';
import Avatar from './ui/Avatar';
import { Button } from './ui/Button';
import { commentsApi } from '../services/api';
import { useToast } from './ui/Toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_username: string;
  author_name: string;
  author_avatar?: string;
  parent_id?: string;
  replies?: Comment[];
  reply_count?: number;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
  onCommentCountChange?: (count: number) => void;
}

const CommentSectionComponent: React.FC<CommentSectionProps> = ({
  postId,
  initialComments = [],
  onCommentCountChange
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const { success, error } = useToast();

  // Load comments when component mounts
  useEffect(() => {
    loadComments();
  }, [postId]);

  // Update comment count when comments change
  useEffect(() => {
    onCommentCountChange?.(comments.length);
  }, [comments.length, onCommentCountChange]);

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await commentsApi.getByPost(postId);
      setComments(response.data || []);
    } catch (err: any) {
      error('Failed to load comments', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [postId, error]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await commentsApi.create(postId, { content: newComment.trim() });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      success('Comment added successfully');
    } catch (err: any) {
      error('Failed to add comment', err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, newComment, success, error]);

  const handleSubmitReply = useCallback(async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await commentsApi.create(postId, { 
        content: replyContent.trim(), 
        parent_id: parentId 
      });
      
      // Update the parent comment with the new reply
      setComments(prev => 
        prev.map(comment => 
          comment.id === parentId 
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), response.data],
                reply_count: (comment.reply_count || 0) + 1
              }
            : comment
        )
      );
      
      setReplyContent('');
      setReplyingTo(null);
      success('Reply added successfully');
    } catch (err: any) {
      error('Failed to add reply', err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, replyContent, success, error]);

  const handleEditComment = useCallback(async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await commentsApi.update(commentId, { content: editContent.trim() });
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? { ...comment, content: editContent.trim() } : comment
        )
      );
      setEditingComment(null);
      setEditContent('');
      success('Comment updated successfully');
    } catch (err: any) {
      error('Failed to update comment', err.message);
    }
  }, [editContent, success, error]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsApi.delete(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      success('Comment deleted successfully');
    } catch (err: any) {
      error('Failed to delete comment', err.message);
    }
  }, [success, error]);

  const startEditing = useCallback((comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingComment(null);
    setEditContent('');
  }, []);

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  const startReplying = useCallback((commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent('');
  }, []);

  const cancelReplying = useCallback(() => {
    setReplyingTo(null);
    setReplyContent('');
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="flex space-x-3">
        <Avatar size="sm" name="You" />
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            rows={2}
            disabled={isSubmitting}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              leftIcon={<Send className="h-4 w-4" />}
              size="sm"
            >
              {isSubmitting ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar
                src={comment.author_avatar}
                name={comment.author_name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {comment.author_name}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleEditComment(comment.id)}
                        size="sm"
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {comment.content}
                    </p>
                    
                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startReplying(comment.id)}
                        className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center space-x-1"
                      >
                        <Reply className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 flex items-center space-x-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 ml-8">
                        <div className="flex space-x-2">
                          <Avatar size="sm" name="You" />
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder={`Reply to ${comment.author_name}...`}
                              className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                              rows={2}
                              disabled={isSubmitting}
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                              <Button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim() || isSubmitting}
                                size="sm"
                              >
                                {isSubmitting ? 'Posting...' : 'Reply'}
                              </Button>
                              <Button
                                onClick={cancelReplying}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies Toggle */}
                    {comment.reply_count && comment.reply_count > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="flex items-center space-x-1 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                          {expandedReplies.has(comment.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>
                            {expandedReplies.has(comment.id) ? 'Hide' : 'Show'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Replies */}
                    {expandedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-8 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-3">
                            <Avatar
                              src={reply.author_avatar}
                              name={reply.author_name}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {reply.author_name}
                                </span>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

const areEqual = (prev: CommentSectionProps, next: CommentSectionProps) => (
  prev.postId === next.postId &&
  (prev.initialComments?.length || 0) === (next.initialComments?.length || 0)
);

const CommentSection = memo(CommentSectionComponent, areEqual);

export default CommentSection;
