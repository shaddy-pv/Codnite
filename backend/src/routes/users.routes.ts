import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Get suggested users for a specific user
router.get('/suggested', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    // Simplified suggested users query - focus on same college and activity
    const suggestedUsersQuery = `
      SELECT DISTINCT
        u.id, u.username, u.name, u.avatar_url, u.points, u.bio,
        c.name as college_name, c.short_name as college_short_name,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT f.follower_id) as follower_count
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN follows f ON u.id = f.following_id
      WHERE u.id != $1
      AND u.id NOT IN (
        SELECT following_id FROM follows WHERE follower_id = $1
      )
      AND (
        u.college_id = (SELECT college_id FROM users WHERE id = $1)
        OR u.points > 0
        OR EXISTS (SELECT 1 FROM posts WHERE author_id = u.id)
      )
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points, u.bio, c.name, c.short_name
      ORDER BY 
        CASE WHEN u.college_id = (SELECT college_id FROM users WHERE id = $1) THEN 1 ELSE 0 END DESC,
        follower_count DESC,
        u.points DESC,
        post_count DESC
      LIMIT $2
    `;

    const result = await query(suggestedUsersQuery, [userId, limit]);

    const suggestedUsers = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url || '/default-avatar.svg',
      points: row.points || 0,
      bio: row.bio,
      college: {
        name: row.college_name,
        shortName: row.college_short_name,
      },
      stats: {
        postCount: parseInt(row.post_count) || 0,
        submissionCount: parseInt(row.submission_count) || 0,
        followerCount: parseInt(row.follower_count) || 0,
      },
    }));

    res.json({ suggestedUsers });
  } catch (error) {
    logger.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Failed to fetch suggested users' });
  }
});

// Get trending users (most active users in the last week)
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const timeframe = req.query.timeframe as string || 'week';

    const timeFilter = getTimeFilter(timeframe);

    const trendingUsersQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points,
        c.name as college_name, c.short_name as college_short_name,
        COUNT(DISTINCT p.id) as recent_post_count,
        COUNT(DISTINCT s.id) as recent_submission_count,
        COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.id END) as recent_accepted_count,
        COUNT(DISTINCT f.follower_id) as follower_count
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN follows f ON u.id = f.following_id
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points, c.name, c.short_name
      ORDER BY u.points DESC, recent_post_count DESC, follower_count DESC
      LIMIT $1
    `;

    const result = await query(trendingUsersQuery, [limit]);

    const trendingUsers = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      points: row.points,
      college: {
        name: row.college_name,
        shortName: row.college_short_name,
      },
      stats: {
        recentPostCount: parseInt(row.recent_post_count),
        recentSubmissionCount: parseInt(row.recent_submission_count),
        recentAcceptedCount: parseInt(row.recent_accepted_count),
        followerCount: parseInt(row.follower_count),
      },
      activityScore: parseInt(row.activity_score),
    }));

    res.json({ trendingUsers });
  } catch (error) {
    logger.error('Error fetching trending users:', error);
    res.status(500).json({ error: 'Failed to fetch trending users' });
  }
});

// Get users by college
router.get('/college/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const usersQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points, u.bio,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.id END) as accepted_count,
        COUNT(DISTINCT f.follower_id) as follower_count,
        u.created_at
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN follows f ON u.id = f.following_id
      WHERE u.college_id = $1
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points, u.bio, u.created_at
      ORDER BY u.points DESC, accepted_count DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM users WHERE college_id = $1';

    const [usersResult, countResult] = await Promise.all([
      query(usersQuery, [collegeId, limit, offset]),
      query(countQuery, [collegeId])
    ]);

    const users = usersResult.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      points: row.points,
      bio: row.bio,
      stats: {
        postCount: parseInt(row.post_count),
        submissionCount: parseInt(row.submission_count),
        acceptedCount: parseInt(row.accepted_count),
        followerCount: parseInt(row.follower_count),
      },
      joinedAt: row.created_at,
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching college users:', error);
    res.status(500).json({ error: 'Failed to fetch college users' });
  }
});

// Helper function to get time filter
function getTimeFilter(timeframe: string): string {
  switch (timeframe) {
    case 'day':
      return '1 day';
    case 'week':
      return '1 week';
    case 'month':
      return '1 month';
    case 'year':
      return '1 year';
    default:
      return '1 week';
  }
}

export default router;
