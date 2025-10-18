import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Get global leaderboard
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const timeframe = req.query.timeframe as string || 'all'; // all, week, month, year
    const collegeId = req.query.college_id as string;

    let whereClause = '';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add timeframe filter
    if (timeframe !== 'all') {
      const timeFilter = getTimeFilter(timeframe);
      whereClause += ` WHERE ${timeFilter}`;
      paramIndex++;
    }

    // Add college filter
    if (collegeId) {
      whereClause += whereClause ? ` AND u.college_id = $${paramIndex}` : ` WHERE u.college_id = $${paramIndex}`;
      queryParams.push(collegeId);
      paramIndex++;
    }

    const leaderboardQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points, u.college_id,
        c.name as college_name, c.short_name as college_short_name,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.id END) as accepted_count,
        COUNT(DISTINCT ps.id) as problem_submission_count,
        COUNT(DISTINCT CASE WHEN ps.status = 'accepted' THEN ps.id END) as problem_accepted_count,
        COUNT(DISTINCT f2.follower_id) as follower_count,
        u.created_at
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN problem_submissions ps ON u.id = ps.user_id
      LEFT JOIN follows f2 ON u.id = f2.following_id
      ${whereClause}
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points, u.college_id, c.name, c.short_name, u.created_at
      ORDER BY u.points DESC, accepted_count DESC, problem_accepted_count DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN problem_submissions ps ON u.id = ps.user_id
      ${whereClause}
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset

    const [leaderboardResult, countResult] = await Promise.all([
      query(leaderboardQuery, queryParams),
      query(countQuery, countParams)
    ]);

    const leaderboard = leaderboardResult.rows.map((row, index) => ({
      rank: offset + index + 1,
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      points: row.points,
      college: {
        id: row.college_id,
        name: row.college_name,
        shortName: row.college_short_name,
      },
      stats: {
        postCount: parseInt(row.post_count),
        submissionCount: parseInt(row.submission_count),
        acceptedCount: parseInt(row.accepted_count),
        problemSubmissionCount: parseInt(row.problem_submission_count),
        problemAcceptedCount: parseInt(row.problem_accepted_count),
        followerCount: parseInt(row.follower_count),
      },
      joinedAt: row.created_at,
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      leaderboard,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      timeframe,
      filters: {
        collegeId
      }
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get college leaderboard
router.get('/college/:collegeId', async (req, res) => {
  try {
    const { collegeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const leaderboardQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.id END) as accepted_count,
        COUNT(DISTINCT ps.id) as problem_submission_count,
        COUNT(DISTINCT CASE WHEN ps.status = 'accepted' THEN ps.id END) as problem_accepted_count,
        COUNT(DISTINCT f2.follower_id) as follower_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN problem_submissions ps ON u.id = ps.user_id
      LEFT JOIN follows f2 ON u.id = f2.following_id
      WHERE u.college_id = $1
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points
      ORDER BY u.points DESC, accepted_count DESC, problem_accepted_count DESC
      LIMIT $2
    `;

    const result = await query(leaderboardQuery, [collegeId, limit]);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      points: row.points,
      stats: {
        postCount: parseInt(row.post_count),
        submissionCount: parseInt(row.submission_count),
        acceptedCount: parseInt(row.accepted_count),
        problemSubmissionCount: parseInt(row.problem_submission_count),
        problemAcceptedCount: parseInt(row.problem_accepted_count),
        followerCount: parseInt(row.follower_count),
      },
    }));

    res.json({ leaderboard });
  } catch (error) {
    logger.error('Error fetching college leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch college leaderboard' });
  }
});

// Get user's rank and stats
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's global rank
    const globalRankQuery = `
      SELECT COUNT(*) + 1 as rank
      FROM users u2
      WHERE u2.points > (
        SELECT u1.points 
        FROM users u1 
        WHERE u1.id = $1
      )
    `;

    // Get user's college rank
    const collegeRankQuery = `
      SELECT COUNT(*) + 1 as rank
      FROM users u2
      WHERE u2.college_id = (
        SELECT u1.college_id 
        FROM users u1 
        WHERE u1.id = $1
      ) AND u2.points > (
        SELECT u1.points 
        FROM users u1 
        WHERE u1.id = $1
      )
    `;

    // Get user's detailed stats
    const userStatsQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points, u.college_id,
        c.name as college_name, c.short_name as college_short_name,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.id END) as accepted_count,
        COUNT(DISTINCT ps.id) as problem_submission_count,
        COUNT(DISTINCT CASE WHEN ps.status = 'accepted' THEN ps.id END) as problem_accepted_count,
        COUNT(DISTINCT f2.follower_id) as follower_count,
        COUNT(DISTINCT f1.following_id) as following_count,
        u.created_at
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN problem_submissions ps ON u.id = ps.user_id
      LEFT JOIN follows f2 ON u.id = f2.following_id
      LEFT JOIN follows f1 ON u.id = f1.follower_id
      WHERE u.id = $1
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points, u.college_id, c.name, c.short_name, u.created_at
    `;

    const [globalRankResult, collegeRankResult, userStatsResult] = await Promise.all([
      query(globalRankQuery, [userId]),
      query(collegeRankQuery, [userId]),
      query(userStatsQuery, [userId])
    ]);

    if (userStatsResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userStats = userStatsResult.rows[0];
    const globalRank = parseInt(globalRankResult.rows[0].rank);
    const collegeRank = parseInt(collegeRankResult.rows[0].rank);

    res.json({
      user: {
        id: userStats.id,
        username: userStats.username,
        name: userStats.name,
        avatarUrl: userStats.avatar_url,
        points: userStats.points,
        college: {
          id: userStats.college_id,
          name: userStats.college_name,
          shortName: userStats.college_short_name,
        },
        joinedAt: userStats.created_at,
      },
      ranks: {
        global: globalRank,
        college: collegeRank,
      },
      stats: {
        postCount: parseInt(userStats.post_count),
        submissionCount: parseInt(userStats.submission_count),
        acceptedCount: parseInt(userStats.accepted_count),
        problemSubmissionCount: parseInt(userStats.problem_submission_count),
        problemAcceptedCount: parseInt(userStats.problem_accepted_count),
        followerCount: parseInt(userStats.follower_count),
        followingCount: parseInt(userStats.following_count),
      },
    });
  } catch (error) {
    logger.error('Error fetching user leaderboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch user leaderboard stats' });
  }
});

// Helper function to get time filter
function getTimeFilter(timeframe: string): string {
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `u.created_at >= '${startDate.toISOString()}'`;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `u.created_at >= '${startDate.toISOString()}'`;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return `u.created_at >= '${startDate.toISOString()}'`;
    default:
      return '';
  }
}

export default router;
