import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Advanced search endpoint
router.get('/', async (req, res) => {
  try {
    const { q, type, filters = '{}', limit = 20, offset = 0 } = req.query;
    
    // Optional authentication - check if token is provided
    let userId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const config = require('../config/env');
        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
        userId = decoded.userId;
      }
    } catch (authError) {
      // Token is invalid or missing, but we continue without authentication
      console.log('Search request without valid authentication');
    }

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchFilters = JSON.parse(filters as string);
    let results: any[] = [];
    let totalCount = 0;

    // Save search to history (only if user is authenticated)
    if (userId) {
      await query(`
        INSERT INTO search_history (user_id, query, results_count)
        VALUES ($1, $2, $3)
      `, [userId, q, 0]);
    }

    // Search posts
    if (!type || type === 'posts' || type === 'all') {
      let postWhereClause = `WHERE (p.title ILIKE $1 OR p.content ILIKE $1)`;
      const postParams: any[] = [`%${q}%`];
      let paramIndex = 2;

      if (searchFilters.language) {
        postWhereClause += ` AND p.language = $${paramIndex}`;
        postParams.push(searchFilters.language);
        paramIndex++;
      }

      if (searchFilters.tags && searchFilters.tags.length > 0) {
        postWhereClause += ` AND p.tags && $${paramIndex}`;
        postParams.push(searchFilters.tags);
        paramIndex++;
      }

      const posts = await query(`
        SELECT 
          p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at,
          u.id as author_id, u.username as author_username, u.name as author_name,
          u.avatar_url as author_avatar, u.college_id as author_college_id,
          c.name as college_name, c.short_name as college_short_name,
          (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        LEFT JOIN colleges c ON u.college_id = c.id
        ${postWhereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...postParams, parseInt(limit as string), parseInt(offset as string)]);

      results = [...results, ...posts.rows.map(post => ({ ...post, result_type: 'post' }))];
    }

    // Search users
    if (!type || type === 'users' || type === 'all') {
      let userWhereClause = `WHERE (u.username ILIKE $1 OR u.name ILIKE $1 OR u.bio ILIKE $1)`;
      const userParams: any[] = [`%${q}%`];
      let paramIndex = 2;

      if (searchFilters.college_id) {
        userWhereClause += ` AND u.college_id = $${paramIndex}`;
        userParams.push(searchFilters.college_id);
        paramIndex++;
      }

      const users = await query(`
        SELECT 
          u.id, u.username, u.name, u.bio, u.avatar_url, u.college_id, u.points,
          u.created_at, c.name as college_name, c.short_name as college_short_name,
          (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) as followers_count,
          (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) as following_count
        FROM users u
        LEFT JOIN colleges c ON u.college_id = c.id
        ${userWhereClause}
        ORDER BY u.points DESC, u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...userParams, parseInt(limit as string), parseInt(offset as string)]);

      results = [...results, ...users.rows.map(user => ({ ...user, result_type: 'user' }))];
    }

    // Search challenges
    if (!type || type === 'challenges' || type === 'all') {
      let challengeWhereClause = `WHERE (c.title ILIKE $1 OR c.description ILIKE $1)`;
      const challengeParams: any[] = [`%${q}%`];
      let paramIndex = 2;

      if (searchFilters.difficulty) {
        challengeWhereClause += ` AND c.difficulty = $${paramIndex}`;
        challengeParams.push(searchFilters.difficulty);
        paramIndex++;
      }

      const challenges = await query(`
        SELECT 
          c.id, c.title, c.description, c.difficulty, c.points, 
          c.start_date, c.end_date, c.created_at,
          (SELECT COUNT(*) FROM submissions s WHERE s.challenge_id = c.id) as submission_count
        FROM challenges c
        ${challengeWhereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...challengeParams, parseInt(limit as string), parseInt(offset as string)]);

      results = [...results, ...challenges.rows.map(challenge => ({ ...challenge, result_type: 'challenge' }))];
    }

    // Search hashtags
    if (!type || type === 'hashtags' || type === 'all') {
      const hashtags = await query(`
        SELECT id, name, usage_count, created_at
        FROM hashtags
        WHERE name ILIKE $1
        ORDER BY usage_count DESC, created_at DESC
        LIMIT $2 OFFSET $3
      `, [`%${q}%`, parseInt(limit as string), parseInt(offset as string)]);

      results = [...results, ...hashtags.rows.map(hashtag => ({ ...hashtag, result_type: 'hashtag' }))];
    }

    // Update search history with results count (only if user is authenticated)
    if (userId) {
      await query(`
        UPDATE search_history 
        SET results_count = $1 
        WHERE user_id = $2 AND query = $3
        AND created_at = (
          SELECT MAX(created_at) FROM search_history 
          WHERE user_id = $2 AND query = $3
        )
      `, [results.length, userId, q]);
    }

    res.json({
      results,
      total: results.length,
      query: q,
      type: type || 'all',
      filters: searchFilters
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Get search suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const userId = req.user?.userId;

    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions: any[] = [];

    // Get recent searches
    const recentSearches = await query(`
      SELECT DISTINCT query
      FROM search_history
      WHERE user_id = $1 AND query ILIKE $2
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId, `%${q}%`]);

    suggestions.push(...recentSearches.rows.map(search => ({
      type: 'recent_search',
      text: search.query
    })));

    // Get hashtag suggestions
    const hashtagSuggestions = await query(`
      SELECT name, usage_count
      FROM hashtags
      WHERE name ILIKE $1
      ORDER BY usage_count DESC
      LIMIT 5
    `, [`%${q}%`]);

    suggestions.push(...hashtagSuggestions.rows.map(hashtag => ({
      type: 'hashtag',
      text: `#${hashtag.name}`,
      usage_count: hashtag.usage_count
    })));

    // Get user suggestions
    const userSuggestions = await query(`
      SELECT username, name
      FROM users
      WHERE username ILIKE $1 OR name ILIKE $1
      ORDER BY points DESC
      LIMIT 5
    `, [`%${q}%`]);

    suggestions.push(...userSuggestions.rows.map(user => ({
      type: 'user',
      text: `@${user.username}`,
      name: user.name
    })));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ error: 'Failed to get search suggestions' });
  }
});

// Get search history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user?.userId;

    const history = await query(`
      SELECT query, results_count, created_at
      FROM search_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit as string), parseInt(offset as string)]);

    res.json(history.rows);
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Clear search history
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    await query('DELETE FROM search_history WHERE user_id = $1', [userId]);

    res.json({ message: 'Search history cleared successfully' });
  } catch (error) {
    console.error('Error clearing search history:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});

export default router;
