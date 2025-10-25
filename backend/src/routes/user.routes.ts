import { Router } from 'express';
import { query } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// Get current user profile (me)
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        u.id, u.email, u.username, u.name, u.bio, u.avatar_url, u.cover_photo_url, u.github_username, 
        u.linkedin_url, u.college_id, u.points, u.created_at, u.updated_at,
        c.name as college_name, c.short_name as college_short_name
       FROM users u
       LEFT JOIN colleges c ON u.college_id = c.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      coverPhotoUrl: user.cover_photo_url,
      githubUsername: user.github_username,
      linkedinUrl: user.linkedin_url,
      collegeId: user.college_id,
      college: user.college_name ? {
        id: user.college_id,
        name: user.college_name,
        shortName: user.college_short_name,
      } : null,
      points: user.points,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    logger.error('Error fetching current user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update current user profile (me)
router.put('/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, username, bio, githubUsername, linkedinUrl, collegeId } = req.body;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (username !== undefined) {
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }
    if (githubUsername !== undefined) {
      updateFields.push(`github_username = $${paramCount}`);
      values.push(githubUsername);
      paramCount++;
    }
    if (linkedinUrl !== undefined) {
      updateFields.push(`linkedin_url = $${paramCount}`);
      values.push(linkedinUrl);
      paramCount++;
    }
    if (collegeId !== undefined) {
      updateFields.push(`college_id = $${paramCount}`);
      values.push(collegeId);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, username, name, bio, avatar_url, cover_photo_url, github_username, linkedin_url, college_id, points, created_at, updated_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      coverPhotoUrl: user.cover_photo_url,
      githubUsername: user.github_username,
      linkedinUrl: user.linkedin_url,
      collegeId: user.college_id,
      points: user.points,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    logger.error('Error updating current user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT id, email, username, name, college_id, created_at, updated_at 
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      collegeId: user.college_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const { name, username, collegeId } = req.body;
    const userId = req.user.userId;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (username) {
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
    if (collegeId) {
      updateFields.push(`college_id = $${paramCount}`);
      values.push(collegeId);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, email, username, name, college_id, created_at, updated_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = result.rows[0];
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      name: updatedUser.name,
      collegeId: updatedUser.college_id,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT id, username, name, bio, avatar_url, cover_photo_url, github_username, linkedin_url, college_id, points, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      coverPhotoUrl: user.cover_photo_url,
      githubUsername: user.github_username,
      linkedinUrl: user.linkedin_url,
      collegeId: user.college_id,
      points: user.points,
      createdAt: user.created_at,
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get current user's statistics (me)
router.get('/me/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const [rankResult, problemsSolvedResult, contributionsResult, followersResult, followingResult, badgesResult, achievementsResult] = await Promise.all([
      query('SELECT COUNT(*) + 1 as rank FROM users WHERE points > (SELECT COALESCE(points, 0) FROM users WHERE id = $1)', [userId]),
      query('SELECT COUNT(*) as problems_solved FROM submissions s WHERE s.user_id = $1 AND s.status = \'accepted\'', [userId]),
      query('SELECT COUNT(*) as contributions FROM posts WHERE author_id = $1', [userId]),
      query('SELECT COUNT(*) as followers FROM follows WHERE following_id = $1', [userId]),
      query('SELECT COUNT(*) as following FROM follows WHERE follower_id = $1', [userId]),
      query('SELECT COUNT(*) as badges FROM user_badges WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*) as achievements FROM user_achievements WHERE user_id = $1', [userId])
    ]);

    res.json({
      rank: parseInt(rankResult.rows[0].rank),
      problemsSolved: parseInt(problemsSolvedResult.rows[0].problems_solved),
      contributions: parseInt(contributionsResult.rows[0].contributions),
      followers: parseInt(followersResult.rows[0].followers),
      following: parseInt(followingResult.rows[0].following),
      badges: parseInt(badgesResult.rows[0].badges),
      achievements: parseInt(achievementsResult.rows[0].achievements)
    });
  } catch (error) {
    logger.error('Error fetching current user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get current user's badges (me)
router.get('/me/badges', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const badges = await query(`
      SELECT b.id, b.name, b.description, b.icon, b.color, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `, [userId]);

    res.json(badges.rows);
  } catch (error) {
    logger.error('Error fetching current user badges:', error);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

// Get current user's achievements (me)
router.get('/me/achievements', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const achievements = await query(`
      SELECT a.id, a.name, a.description, a.points, a.icon, ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.earned_at DESC
    `, [userId]);

    res.json(achievements.rows);
  } catch (error) {
    logger.error('Error fetching current user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

// Get current user's skills (me)
router.get('/me/skills', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Get skills from posts
    const postSkills = await query(`
      SELECT DISTINCT language 
      FROM posts 
      WHERE author_id = $1 AND language IS NOT NULL
    `, [userId]);

    // Get skills from submissions
    const submissionSkills = await query(`
      SELECT DISTINCT language 
      FROM submissions 
      WHERE user_id = $1 AND language IS NOT NULL
    `, [userId]);

    // Combine and deduplicate skills
    const allSkills = new Set();
    postSkills.rows.forEach(row => allSkills.add(row.language));
    submissionSkills.rows.forEach(row => allSkills.add(row.language));

    res.json(Array.from(allSkills));
  } catch (error) {
    logger.error('Error fetching current user skills:', error);
    res.status(500).json({ error: 'Failed to fetch user skills' });
  }
});

// Get current user's activity (me)
router.get('/me/activity', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const activity = await query(`
      SELECT 
        'post' as type,
        p.id,
        p.title,
        p.created_at,
        NULL as problem_title,
        NULL as submission_status
       FROM posts p 
       WHERE p.author_id = $1
       UNION ALL
       SELECT 
        'submission' as type,
        s.id,
        NULL as title,
        s.created_at,
        'Problem Solved' as problem_title,
        s.status as submission_status
       FROM submissions s 
       WHERE s.user_id = $1 AND s.status = 'accepted'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json(activity.rows);
  } catch (error) {
    logger.error('Error fetching current user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Get current user's follow status (me)
router.get('/me/follow-status', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.query;

    if (!targetUserId) {
      return res.json({ isFollowing: false });
    }

    const followStatus = await query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [userId, targetUserId]
    );

    res.json({ isFollowing: followStatus.rows.length > 0 });
  } catch (error) {
    logger.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get user statistics
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's rank based on points
    const rankResult = await query(
      `SELECT COUNT(*) + 1 as rank 
       FROM users 
       WHERE points > (SELECT COALESCE(points, 0) FROM users WHERE id = $1)`,
      [userId]
    );

    // Get problems solved count (handle case where submissions table might be empty)
    const problemsResult = await query(
      `SELECT COUNT(*) as problems_solved 
       FROM submissions s 
       WHERE s.user_id = $1 AND s.status = 'accepted'`,
      [userId]
    ).catch(() => ({ rows: [{ problems_solved: 0 }] }));

    // Get posts count (contributions)
    const postsResult = await query(
      `SELECT COUNT(*) as contributions 
       FROM posts 
       WHERE author_id = $1`,
      [userId]
    ).catch(() => ({ rows: [{ contributions: 0 }] }));

    // Get followers count
    const followersResult = await query(
      `SELECT COUNT(*) as followers 
       FROM follows 
       WHERE following_id = $1`,
      [userId]
    ).catch(() => ({ rows: [{ followers: 0 }] }));

    // Get following count
    const followingResult = await query(
      `SELECT COUNT(*) as following 
       FROM follows 
       WHERE follower_id = $1`,
      [userId]
    ).catch(() => ({ rows: [{ following: 0 }] }));

    // Get badges count (we'll implement this later)
    let badgesResult;
    try {
      badgesResult = await query(
        `SELECT COUNT(*) as badges 
         FROM user_badges 
         WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      // Table doesn't exist yet, return 0
      badgesResult = { rows: [{ badges: 0 }] };
    }

    // Get achievements count (we'll implement this later)
    let achievementsResult;
    try {
      achievementsResult = await query(
        `SELECT COUNT(*) as achievements 
         FROM user_achievements 
         WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      // Table doesn't exist yet, return 0
      achievementsResult = { rows: [{ achievements: 0 }] };
    }

    res.json({
      rank: parseInt(rankResult.rows[0].rank),
      problemsSolved: parseInt(problemsResult.rows[0].problems_solved),
      contributions: parseInt(postsResult.rows[0].contributions),
      followers: parseInt(followersResult.rows[0].followers),
      following: parseInt(followingResult.rows[0].following),
      badges: parseInt(badgesResult.rows[0].badges) || 0,
      achievements: parseInt(achievementsResult.rows[0].achievements) || 0
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user badges
router.get('/:userId/badges', async (req, res) => {
  try {
    const { userId } = req.params;

    // For now, return empty array since we don't have badges table yet
    // We'll implement this when we add the badges system
    res.json([]);
  } catch (error) {
    logger.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

// Get user achievements
router.get('/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;

    // For now, return empty array since we don't have achievements table yet
    // We'll implement this when we add the achievements system
    res.json([]);
  } catch (error) {
    logger.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

// Get user activity feed
router.get('/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get recent posts
    const postsResult = await query(
      `SELECT 
        'post' as type,
        p.id,
        p.title,
        p.created_at,
        NULL as problem_title,
        NULL as submission_status
       FROM posts p 
       WHERE p.author_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ).catch(() => ({ rows: [] }));

    // Get recent submissions
    const submissionsResult = await query(
      `SELECT 
        'submission' as type,
        s.id,
        NULL as title,
        s.created_at,
        'Problem Solved' as problem_title,
        s.status as submission_status
       FROM submissions s 
       WHERE s.user_id = $1 AND s.status = 'accepted'
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ).catch(() => ({ rows: [] }));

    // Combine and sort activities
    const activities = [...postsResult.rows, ...submissionsResult.rows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, Number(limit));

    res.json(activities);
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Get user skills (from posts and submissions)
router.get('/:userId/skills', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get skills from posts
    const postsSkillsResult = await query(
      `SELECT DISTINCT language 
       FROM posts 
       WHERE author_id = $1 AND language IS NOT NULL`,
      [userId]
    ).catch(() => ({ rows: [] }));

    // Get skills from submissions
    const submissionsSkillsResult = await query(
      `SELECT DISTINCT language 
       FROM submissions 
       WHERE user_id = $1 AND language IS NOT NULL`,
      [userId]
    ).catch(() => ({ rows: [] }));

    // Combine and deduplicate skills
    const allSkills = new Set([
      ...postsSkillsResult.rows.map(row => row.language),
      ...submissionsSkillsResult.rows.map(row => row.language)
    ]);

    res.json(Array.from(allSkills));
  } catch (error) {
    logger.error('Error fetching user skills:', error);
    res.status(500).json({ error: 'Failed to fetch user skills' });
  }
});

// Follow a user
router.post('/:userId/follow', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    if (followerId === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (existingFollow.rows.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    await query(
      'INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [followerId, userId]
    );

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    logger.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/:userId/follow', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    // Remove follow relationship
    const result = await query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    logger.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Check if current user is following another user
router.get('/:userId/follow-status', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    const result = await query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    res.json({ isFollowing: result.rows.length > 0 });
  } catch (error) {
    logger.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get current user's posts (me)
router.get('/me/posts', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      `SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar_url, u.college_id as author_college_id,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalResult = await query(
      'SELECT COUNT(*) as total FROM posts WHERE author_id = $1',
      [userId]
    );

    const posts = result.rows.map(row => ({
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

    res.json({
      posts,
      total: parseInt(totalResult.rows[0].total),
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    logger.error('Error fetching current user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get user posts
router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      `SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar_url, u.college_id as author_college_id,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalResult = await query(
      'SELECT COUNT(*) as total FROM posts WHERE author_id = $1',
      [userId]
    );

    const posts = result.rows.map(row => ({
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

    res.json({
      posts,
      total: parseInt(totalResult.rows[0].total),
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    logger.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

export default router;
