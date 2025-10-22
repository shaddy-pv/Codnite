import { Router } from 'express';
import { query } from '../utils/database';
import { authenticate } from '../middleware/auth';
import { processHashtags, processMentions } from './social.routes';
import logger from '../utils/logger';
import { NotificationService } from '../services/notification.service';

const createPostRoutes = (notificationService: NotificationService) => {
  const router = Router();

// Get all posts with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort as string || 'newest';
    const offset = (page - 1) * limit;

    // Determine ORDER BY clause based on sort parameter
    let orderBy = 'ORDER BY p.created_at DESC';
    switch (sort) {
      case 'trending':
        orderBy = 'ORDER BY ((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) + (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)) DESC, p.created_at DESC';
        break;
      case 'newest':
        orderBy = 'ORDER BY p.created_at DESC';
        break;
      case 'following':
        // For following, we need to get posts from users the current user follows
        // This will be handled differently - we'll need user authentication
        orderBy = 'ORDER BY p.created_at DESC';
        break;
      default:
        orderBy = 'ORDER BY p.created_at DESC';
    }

    let postsQuery;
    let queryParams = [limit, offset];
    
    if (sort === 'following') {
      // For following posts, we need authentication
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required for following feed' });
      }
      
      postsQuery = `
        SELECT 
          p.id, p.title, p.content, p.code, p.language, p.tags, p.college_id, p.created_at, p.updated_at,
          u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar_url, u.college_id as author_college_id,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.college_id IS NULL
        AND p.author_id IN (
          SELECT following_id FROM follows WHERE follower_id = $3
        )
        ${orderBy}
        LIMIT $1 OFFSET $2
      `;
      queryParams = [limit, offset, userId];
    } else {
      postsQuery = `
        SELECT 
          p.id, p.title, p.content, p.code, p.language, p.tags, p.college_id, p.created_at, p.updated_at,
          u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar_url, u.college_id as author_college_id,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.college_id IS NULL
        ${orderBy}
        LIMIT $1 OFFSET $2
      `;
    }

    const countQuery = 'SELECT COUNT(*) as total FROM posts WHERE college_id IS NULL';

    const [postsResult, countResult] = await Promise.all([
      query(postsQuery, queryParams),
      query(countQuery)
    ]);

    const posts = postsResult.rows.map(row => ({
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
        collegeId: row.author_college_id,
      },
      _count: {
        comments: parseInt(row.comment_count),
        likes: parseInt(row.like_count),
      }
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get post with author info
    const postQuery = `
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar_url, u.college_id as author_college_id,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1
    `;

    const postResult = await query(postQuery, [id]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    // Get comments for this post
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC
    `;

    const commentsResult = await query(commentsQuery, [id]);

    const comments = commentsResult.rows.map(row => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        username: row.author_username,
        name: row.author_name,
      }
    }));

    const response = {
      id: post.id,
      title: post.title,
      content: post.content,
      code: post.code,
      language: post.language,
      tags: post.tags,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: {
        id: post.author_id,
        username: post.author_username,
        name: post.author_name,
        avatarUrl: post.author_avatar_url,
        collegeId: post.author_college_id,
      },
      comments,
      _count: {
        comments: parseInt(post.comment_count),
        likes: parseInt(post.like_count),
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, content, code, language, tags, collegeId } = req.body;
    const userId = req.user.userId;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const createQuery = `
      INSERT INTO posts (title, content, code, language, tags, author_id, college_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, content, code, language, tags, college_id, created_at, updated_at
    `;

    const result = await query(createQuery, [
      title,
      content,
      code || '',
      language || 'javascript',
      tags || [],
      userId,
      collegeId || null
    ]);

    const post = result.rows[0];

    // Process hashtags and mentions
    const fullContent = `${title} ${content}`;
    await processHashtags(post.id, fullContent);
    await processMentions(post.id, null, fullContent, userId);

    // Award points for creating a post
    await query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [10, userId]
    );

    // Get author info
    const authorQuery = `
      SELECT id, username, name, college_id 
      FROM users WHERE id = $1
    `;
    const authorResult = await query(authorQuery, [userId]);
    const author = authorResult.rows[0];

    const response = {
      id: post.id,
      title: post.title,
      content: post.content,
      code: post.code,
      language: post.language,
      tags: post.tags,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: {
        id: author.id,
        username: author.username,
        name: author.name,
        collegeId: author.college_id,
      },
      _count: {
        comments: 0,
        likes: 0,
      }
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, content, code, language, tags } = req.body;
    const userId = req.user.userId;

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findFirst({
      where: { id, authorId: userId }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(code !== undefined && { code }),
        ...(language && { language }),
        ...(tags && { tags }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            collegeId: true,
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          }
        }
      }
    });

    res.json(updatedPost);
  } catch (error) {
    logger.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findFirst({
      where: { id, authorId: userId }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/Unlike post
router.post('/:id/like', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user already liked the post
    const existingLikeResult = await query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingLikeResult.rows.length > 0) {
      // Unlike
      await query(
        'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [id, userId]
      );
      res.json({ liked: false });
    } else {
      // Like
      await query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
        [userId, id]
      );

      // Get post author info for notification
      const postResult = await query(
        'SELECT author_id FROM posts WHERE id = $1',
        [id]
      );

      if (postResult.rows.length > 0) {
        const postAuthorId = postResult.rows[0].author_id;
        
        // Only send notification if the liker is not the post author
        if (postAuthorId !== userId) {
          await notificationService.notifyPostLike(id, userId, postAuthorId);
          
          // Award points to post author for getting a like
          await query(
            'UPDATE users SET points = points + $1 WHERE id = $2',
            [5, postAuthorId]
          );
        }
      }

      res.json({ liked: true });
    }
  } catch (error) {
    logger.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Bookmark/unbookmark post
router.post('/:id/bookmark', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if post exists
    const post = await query('SELECT id FROM posts WHERE id = $1', [id]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already bookmarked
    const existingBookmark = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND post_id = $2',
      [userId, id]
    );

    if (existingBookmark.rows.length > 0) {
      // Remove bookmark
      await query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2',
        [userId, id]
      );
      res.json({ bookmarked: false });
    } else {
      // Add bookmark
      await query(
        'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2)',
        [userId, id]
      );
      res.json({ bookmarked: true });
    }
  } catch (error) {
    logger.error('Error toggling bookmark:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// Get user's bookmarked posts
router.get('/bookmarks', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    const bookmarks = await query(`
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar_url, u.college_id as author_college_id,
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
      bookmarkedAt: row.bookmarked_at,
      author: {
        id: row.author_id,
        username: row.author_username,
        name: row.author_name,
        avatarUrl: row.author_avatar_url,
        collegeId: row.author_college_id,
      },
      _count: {
        comments: parseInt(row.comment_count),
        likes: parseInt(row.like_count),
      }
    }));

    res.json({
      posts: formattedPosts,
      total: parseInt(totalResult.rows[0].total),
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    logger.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

  return router;
};

export default createPostRoutes;
