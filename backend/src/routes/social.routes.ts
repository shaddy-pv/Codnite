import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Extract hashtags from text
const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[\w]+/g;
  return text.match(hashtagRegex) || [];
};

// Extract mentions from text
const extractMentions = (text: string): string[] => {
  const mentionRegex = /@[\w]+/g;
  return text.match(mentionRegex) || [];
};

// Process hashtags for a post
const processHashtags = async (postId: string, content: string) => {
  const hashtags = extractHashtags(content);
  
  for (const hashtag of hashtags) {
    const hashtagName = hashtag.substring(1).toLowerCase(); // Remove # and convert to lowercase
    
    // Create or update hashtag
    await query(`
      INSERT INTO hashtags (name, usage_count)
      VALUES ($1, 1)
      ON CONFLICT (name) 
      DO UPDATE SET usage_count = hashtags.usage_count + 1, updated_at = CURRENT_TIMESTAMP
    `, [hashtagName]);

    // Get hashtag ID
    const hashtagResult = await query('SELECT id FROM hashtags WHERE name = $1', [hashtagName]);
    const hashtagId = hashtagResult.rows[0].id;

    // Link hashtag to post
    await query(`
      INSERT INTO post_hashtags (post_id, hashtag_id)
      VALUES ($1, $2)
      ON CONFLICT (post_id, hashtag_id) DO NOTHING
    `, [postId, hashtagId]);
  }
};

// Process mentions for a post or comment
const processMentions = async (postId: string | null, commentId: string | null, content: string, mentionedBy: string) => {
  const mentions = extractMentions(content);
  
  for (const mention of mentions) {
    const username = mention.substring(1); // Remove @
    
    // Find user by username
    const userResult = await query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (userResult.rows.length > 0) {
      const mentionedUserId = userResult.rows[0].id;
      
      // Create mention record
      await query(`
        INSERT INTO mentions (post_id, comment_id, mentioned_user_id, mentioned_by)
        VALUES ($1, $2, $3, $4)
      `, [postId, commentId, mentionedUserId, mentionedBy]);

      // Create notification for mentioned user
      await query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ($1, 'mention', 'You were mentioned', 'You were mentioned in a post', $2)
      `, [mentionedUserId, JSON.stringify({ post_id: postId, comment_id: commentId, mentioned_by: mentionedBy })]);
    }
  }
};

// Get hashtag details
router.get('/hashtags/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get hashtag info
    const hashtag = await query(`
      SELECT id, name, usage_count, created_at, updated_at
      FROM hashtags
      WHERE name = $1
    `, [name]);

    if (hashtag.rows.length === 0) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    // Get posts with this hashtag
    const posts = await query(`
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at,
        u.id as author_id, u.username as author_username, u.name as author_name,
        u.avatar_url as author_avatar, u.college_id as author_college_id,
        c.name as college_name, c.short_name as college_short_name,
        (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      FROM posts p
      JOIN post_hashtags ph ON p.id = ph.post_id
      JOIN users u ON p.author_id = u.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE ph.hashtag_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [hashtag.rows[0].id, limit, offset]);

    return res.json({
      hashtag: hashtag.rows[0],
      posts: posts.rows
    });
  } catch (error) {
    console.error('Error getting hashtag details:', error);
    return res.status(500).json({ error: 'Failed to get hashtag details' });
  }
});

// Get trending hashtags
router.get('/hashtags', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const hashtags = await query(`
      SELECT id, name, usage_count, created_at, updated_at
      FROM hashtags
      ORDER BY usage_count DESC, updated_at DESC
      LIMIT $1
    `, [limit]);

    return res.json(hashtags.rows);
  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    return res.status(500).json({ error: 'Failed to get trending hashtags' });
  }
});

// Get user mentions
router.get('/mentions', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user?.userId;

    const mentions = await query(`
      SELECT 
        m.id, m.post_id, m.comment_id, m.created_at,
        u.id as mentioned_by_id, u.username as mentioned_by_username, u.name as mentioned_by_name,
        u.avatar_url as mentioned_by_avatar,
        p.title as post_title,
        c.content as comment_content
      FROM mentions m
      JOIN users u ON m.mentioned_by = u.id
      LEFT JOIN posts p ON m.post_id = p.id
      LEFT JOIN comments c ON m.comment_id = c.id
      WHERE m.mentioned_user_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return res.json(mentions.rows);
  } catch (error) {
    console.error('Error getting user mentions:', error);
    return res.status(500).json({ error: 'Failed to get user mentions' });
  }
});

// Get hashtag suggestions
router.get('/hashtags/suggestions', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await query(`
      SELECT name, usage_count
      FROM hashtags
      WHERE name ILIKE $1
      ORDER BY usage_count DESC
      LIMIT 10
    `, [`%${q}%`]);

    return res.json(suggestions.rows);
  } catch (error) {
    console.error('Error getting hashtag suggestions:', error);
    return res.status(500).json({ error: 'Failed to get hashtag suggestions' });
  }
});

// Get user suggestions for mentions
router.get('/mentions/suggestions', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user?.userId;

    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await query(`
      SELECT id, username, name, avatar_url
      FROM users
      WHERE (username ILIKE $1 OR name ILIKE $1) AND id != $2
      ORDER BY points DESC
      LIMIT 10
    `, [`%${q}%`, userId]);

    return res.json(suggestions.rows);
  } catch (error) {
    console.error('Error getting mention suggestions:', error);
    return res.status(500).json({ error: 'Failed to get mention suggestions' });
  }
});

// Export helper functions for use in other routes
export { processHashtags, processMentions, extractHashtags, extractMentions };

export default router;
