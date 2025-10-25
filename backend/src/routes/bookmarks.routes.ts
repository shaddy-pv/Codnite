import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../utils/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get user's bookmarked posts
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const bookmarks = await query(`
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar_url,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
        b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.author_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limitNum, offset]);

    const totalResult = await query(
      'SELECT COUNT(*) as total FROM bookmarks WHERE user_id = $1',
      [userId]
    );

    const formattedPosts = bookmarks.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      code: row.code,
      language: row.language,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        username: row.author_username,
        name: row.author_name,
        avatarUrl: row.author_avatar_url,
      },
      commentCount: parseInt(row.comment_count),
      likeCount: parseInt(row.like_count),
      bookmarkedAt: row.bookmarked_at,
    }));

    res.json({
      posts: formattedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(totalResult.rows[0].total),
        totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

export default router;