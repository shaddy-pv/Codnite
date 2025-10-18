import { Router } from 'express';
import { query } from '../utils/database';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';
import { NotificationService } from '../services/notification.service';

const createFollowRoutes = (notificationService: NotificationService) => {
  const router = Router();

// Follow a user
router.post('/:userId', authenticate, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    if (followerId === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollowResult = await query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (existingFollowResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    await query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, userId]
    );

    // Send notification using the notification service
    await notificationService.notifyNewFollower(followerId, userId);

    res.json({ success: true, message: 'Successfully followed user' });
  } catch (error) {
    logger.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/:userId', authenticate, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.userId;

    const result = await query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    res.json({ success: true, message: 'Successfully unfollowed user' });
  } catch (error) {
    logger.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get followers of a user
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const followersQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.college_id, u.points,
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM follows WHERE following_id = $1';

    const [followersResult, countResult] = await Promise.all([
      query(followersQuery, [userId, limit, offset]),
      query(countQuery, [userId])
    ]);

    const followers = followersResult.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      collegeId: row.college_id,
      points: row.points,
      followedAt: row.followed_at,
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get users that a user is following
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const followingQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.college_id, u.points,
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM follows WHERE follower_id = $1';

    const [followingResult, countResult] = await Promise.all([
      query(followingQuery, [userId, limit, offset]),
      query(countQuery, [userId])
    ]);

    const following = followingResult.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      collegeId: row.college_id,
      points: row.points,
      followedAt: row.followed_at,
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Check if current user follows a specific user
router.get('/:userId/status', authenticate, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const result = await query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [currentUserId, userId]
    );

    res.json({ isFollowing: result.rows.length > 0 });
  } catch (error) {
    logger.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get follow counts for a user
router.get('/:userId/counts', async (req, res) => {
  try {
    const { userId } = req.params;

    const followersCountResult = await query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [userId]
    );

    const followingCountResult = await query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [userId]
    );

    res.json({
      followersCount: parseInt(followersCountResult.rows[0].count),
      followingCount: parseInt(followingCountResult.rows[0].count),
    });
  } catch (error) {
    logger.error('Error fetching follow counts:', error);
    res.status(500).json({ error: 'Failed to fetch follow counts' });
  }
});

  return router;
};

export default createFollowRoutes;
