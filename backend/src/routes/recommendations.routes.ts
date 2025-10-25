import { Router } from 'express';
import { query } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get user recommendations
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user?.userId;

    // Get user's college and interests
    const user = await query(`
      SELECT college_id, points FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.rows[0];

    // Get recommendations based on:
    // 1. Same college
    // 2. Similar skill level (points)
    // 3. Not already following
    // 4. Not self
    const recommendations = await query(`
      SELECT 
        u.id, u.username, u.name, u.bio, u.avatar_url, u.college_id, u.points,
        c.name as college_name, c.short_name as college_short_name,
        CASE 
          WHEN u.college_id = $2 THEN 0.8
          WHEN ABS(u.points - $3) <= 100 THEN 0.6
          ELSE 0.4
        END as score,
        CASE 
          WHEN u.college_id = $2 THEN 'Same college'
          WHEN ABS(u.points - $3) <= 100 THEN 'Similar skill level'
          ELSE 'Popular in community'
        END as reason
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE u.id != $1 
        AND u.id NOT IN (
          SELECT following_id FROM follows WHERE follower_id = $1
        )
      ORDER BY 
        CASE WHEN u.college_id = $2 THEN 1 ELSE 2 END,
        ABS(u.points - $3),
        u.points DESC
      LIMIT $4
    `, [userId, userData.college_id, userData.points, limit]);

    // Store recommendations in database
    for (const rec of recommendations.rows) {
      await query(`
        INSERT INTO user_recommendations (user_id, recommended_user_id, recommendation_type, score, reason)
        VALUES ($1, $2, 'algorithm', $3, $4)
        ON CONFLICT (user_id, recommended_user_id, recommendation_type) 
        DO UPDATE SET score = $3, reason = $4, created_at = CURRENT_TIMESTAMP
      `, [userId, rec.id, rec.score, rec.reason]);
    }

    res.json(recommendations.rows);
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    res.status(500).json({ error: 'Failed to get user recommendations' });
  }
});

// Get post recommendations
router.get('/posts', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user?.userId;

    // Get user's interests and following list
    const user = await query(`
      SELECT college_id FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = await query(`
      SELECT following_id FROM follows WHERE follower_id = $1
    `, [userId]);

    const followingIds = following.rows.map(f => f.following_id);

    // Get recommendations based on:
    // 1. Posts from followed users
    // 2. Posts from same college
    // 3. Trending posts (most likes/comments)
    // 4. Recent posts
    const recommendations = await query(`
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at,
        u.id as author_id, u.username as author_username, u.name as author_name,
        u.avatar_url as author_avatar, u.college_id as author_college_id,
        c.name as college_name, c.short_name as college_short_name,
        (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
        CASE 
          WHEN p.author_id = ANY($2) THEN 1.0
          WHEN u.college_id = $3 THEN 0.8
          WHEN (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) > 5 THEN 0.6
          ELSE 0.4
        END as score,
        CASE 
          WHEN p.author_id = ANY($2) THEN 'From someone you follow'
          WHEN u.college_id = $3 THEN 'From your college'
          WHEN (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) > 5 THEN 'Trending post'
          ELSE 'Recent post'
        END as reason
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE p.author_id != $1
      ORDER BY 
        CASE WHEN p.author_id = ANY($2) THEN 1 ELSE 2 END,
        CASE WHEN u.college_id = $3 THEN 1 ELSE 2 END,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) DESC,
        p.created_at DESC
      LIMIT $4
    `, [userId, followingIds, user.rows[0].college_id, limit]);

    // Store recommendations in database
    for (const rec of recommendations.rows) {
      await query(`
        INSERT INTO post_recommendations (user_id, post_id, recommendation_type, score, reason)
        VALUES ($1, $2, 'algorithm', $3, $4)
        ON CONFLICT (user_id, post_id, recommendation_type) 
        DO UPDATE SET score = $3, reason = $4, created_at = CURRENT_TIMESTAMP
      `, [userId, rec.id, rec.score, rec.reason]);
    }

    res.json(recommendations.rows);
  } catch (error) {
    console.error('Error getting post recommendations:', error);
    res.status(500).json({ error: 'Failed to get post recommendations' });
  }
});

// Get challenge recommendations
router.get('/challenges', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user?.userId;

    // Get user's skill level and completed challenges
    const user = await query(`
      SELECT points FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const completedChallenges = await query(`
      SELECT challenge_id FROM submissions WHERE user_id = $1 AND status = 'completed'
    `, [userId]);

    const completedIds = completedChallenges.rows.map(c => c.challenge_id);

    // Get recommendations based on:
    // 1. Difficulty matching user skill level
    // 2. Not already completed
    // 3. Active challenges
    const recommendations = await query(`
      SELECT 
        c.id, c.title, c.description, c.difficulty, c.points, 
        c.start_date, c.end_date, c.created_at,
        (SELECT COUNT(*) FROM submissions s WHERE s.challenge_id = c.id) as submission_count,
        CASE 
          WHEN c.difficulty = 'Easy' AND $2 < 200 THEN 1.0
          WHEN c.difficulty = 'Medium' AND $2 BETWEEN 200 AND 500 THEN 1.0
          WHEN c.difficulty = 'Hard' AND $2 > 500 THEN 1.0
          ELSE 0.6
        END as score,
        CASE 
          WHEN c.difficulty = 'Easy' AND $2 < 200 THEN 'Perfect for beginners'
          WHEN c.difficulty = 'Medium' AND $2 BETWEEN 200 AND 500 THEN 'Matches your skill level'
          WHEN c.difficulty = 'Hard' AND $2 > 500 THEN 'Challenge yourself'
          ELSE 'Popular challenge'
        END as reason
      FROM challenges c
      WHERE c.id != ALL($3) 
        AND c.end_date > CURRENT_TIMESTAMP
      ORDER BY 
        CASE 
          WHEN c.difficulty = 'Easy' AND $2 < 200 THEN 1
          WHEN c.difficulty = 'Medium' AND $2 BETWEEN 200 AND 500 THEN 1
          WHEN c.difficulty = 'Hard' AND $2 > 500 THEN 1
          ELSE 2
        END,
        c.points DESC,
        c.created_at DESC
      LIMIT $4
    `, [userId, user.rows[0].points, completedIds, limit]);

    res.json(recommendations.rows);
  } catch (error) {
    console.error('Error getting challenge recommendations:', error);
    res.status(500).json({ error: 'Failed to get challenge recommendations' });
  }
});

// Get trending hashtags
router.get('/hashtags', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const hashtags = await query(`
      SELECT h.id, h.name, h.usage_count, h.created_at
      FROM hashtags h
      ORDER BY h.usage_count DESC, h.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json(hashtags.rows);
  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    res.status(500).json({ error: 'Failed to get trending hashtags' });
  }
});

export default router;
