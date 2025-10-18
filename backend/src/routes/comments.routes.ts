import { Router } from 'express';
import { query } from '../utils/database';
import { authenticate } from '../middleware/auth';
import { processMentions } from './social.routes';
import logger from '../utils/logger';
import { NotificationService } from '../services/notification.service';

const createCommentsRoutes = (notificationService: NotificationService) => {
  const router = Router();

// Create a comment
router.post('/posts/:postId/comments', authenticate, async (req: any, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if post exists and get author info
    const postCheck = await query('SELECT id, author_id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postAuthorId = postCheck.rows[0].author_id;

    // Create comment
    const comment = await query(`
      INSERT INTO comments (content, author_id, post_id, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, content, created_at, updated_at
    `, [content, userId, postId]);

    // Process mentions
    await processMentions(postId, comment.rows[0].id, content, userId);

    // Send notification to post author (if not commenting on own post)
    if (postAuthorId !== userId) {
      await notificationService.notifyNewComment(postId, userId, postAuthorId);
    }

    // Get author info
    const author = await query(`
      SELECT id, username, name, avatar_url FROM users WHERE id = $1
    `, [userId]);

    const response = {
      id: comment.rows[0].id,
      content: comment.rows[0].content,
      createdAt: comment.rows[0].created_at,
      updatedAt: comment.rows[0].updated_at,
      author: {
        id: author.rows[0].id,
        username: author.rows[0].username,
        name: author.rows[0].name,
        avatarUrl: author.rows[0].avatar_url
      }
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Get comments for a post
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const comments = await query(`
      SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name,
        u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `, [postId, limit, offset]);

    res.json(comments.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Update a comment
router.put('/comments/:commentId', authenticate, async (req: any, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if comment exists and user owns it
    const commentCheck = await query(`
      SELECT id, post_id FROM comments WHERE id = $1 AND author_id = $2
    `, [commentId, userId]);

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Update comment
    const comment = await query(`
      UPDATE comments 
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, content, created_at, updated_at
    `, [content, commentId]);

    // Process mentions for updated content
    await processMentions(commentCheck.rows[0].post_id, commentId, content, userId);

    res.json(comment.rows[0]);
  } catch (error) {
    logger.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
router.delete('/comments/:commentId', authenticate, async (req: any, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Check if comment exists and user owns it
    const commentCheck = await query(`
      SELECT id FROM comments WHERE id = $1 AND author_id = $2
    `, [commentId, userId]);

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Delete comment
    await query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

  return router;
};

export default createCommentsRoutes;
