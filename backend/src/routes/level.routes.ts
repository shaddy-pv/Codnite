import { Request, Response } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import express from 'express';

const router = express.Router();

// Level calculation logic
const calculateLevel = (points: number): { level: number; currentLevelPoints: number; nextLevelPoints: number; progress: number } => {
  // Level progression: 0-100, 100-300, 300-600, 600-1000, 1000-1500, 1500-2100, 2100-2800, 2800-3600, 3600-4500, 4500+
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  
  let level = 1;
  for (let i = 1; i < levelThresholds.length; i++) {
    if (points >= levelThresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentLevelPoints = levelThresholds[level - 1] || 0;
  const nextLevelPoints = levelThresholds[level] || levelThresholds[levelThresholds.length - 1];
  const progress = levelThresholds.length > level ? 
    ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100 : 100;
  
  return {
    level,
    currentLevelPoints,
    nextLevelPoints,
    progress: Math.min(progress, 100)
  };
};

// Get user level and progress data
export const getUserLevel = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user points and achievements
    const userResult = await query(
      `SELECT 
        u.points,
        COUNT(DISTINCT s.id) as challenges_completed,
        COUNT(DISTINCT ps.id) as problems_solved,
        COUNT(DISTINCT p.id) as posts_created,
        COUNT(DISTINCT c.id) as comments_made
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'accepted'
      LEFT JOIN problem_submissions ps ON u.id = ps.user_id AND ps.status = 'accepted'
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN comments c ON u.id = c.author_id
      WHERE u.id = $1
      GROUP BY u.id, u.points`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const levelData = calculateLevel(user.points);

    // Get achievement badges
    const achievements = await query(
      `SELECT 
        CASE 
          WHEN $1 >= 1000 THEN 'gold'
          WHEN $1 >= 500 THEN 'silver'
          WHEN $1 >= 100 THEN 'bronze'
          ELSE 'none'
        END as trophy_badge,
        CASE 
          WHEN $2 >= 50 THEN 'gold'
          WHEN $2 >= 20 THEN 'silver'
          WHEN $2 >= 5 THEN 'bronze'
          ELSE 'none'
        END as code_badge,
        CASE 
          WHEN $3 >= 100 THEN 'gold'
          WHEN $3 >= 50 THEN 'silver'
          WHEN $3 >= 10 THEN 'bronze'
          ELSE 'none'
        END as check_badge,
        CASE 
          WHEN $4 >= 20 THEN 'gold'
          WHEN $4 >= 10 THEN 'silver'
          WHEN $4 >= 3 THEN 'bronze'
          ELSE 'none'
        END as star_badge
      `,
      [user.points, user.challenges_completed, user.problems_solved, user.posts_created]
    );

    const badges = achievements.rows[0];

    res.json({
      level: levelData.level,
      points: user.points,
      currentLevelPoints: levelData.currentLevelPoints,
      nextLevelPoints: levelData.nextLevelPoints,
      progress: levelData.progress,
      stats: {
        challengesCompleted: parseInt(user.challenges_completed),
        problemsSolved: parseInt(user.problems_solved),
        postsCreated: parseInt(user.posts_created),
        commentsMade: parseInt(user.comments_made)
      },
      badges: {
        trophy: badges.trophy_badge,
        code: badges.code_badge,
        check: badges.check_badge,
        star: badges.star_badge
      }
    });
  } catch (error) {
    console.error('Error getting user level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get leaderboard for levels
export const getLevelLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(
      `SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points,
        COUNT(DISTINCT s.id) as challenges_completed,
        COUNT(DISTINCT ps.id) as problems_solved,
        COUNT(DISTINCT p.id) as posts_created
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'accepted'
      LEFT JOIN problem_submissions ps ON u.id = ps.user_id AND ps.status = 'accepted'
      LEFT JOIN posts p ON u.id = p.author_id
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points
      ORDER BY u.points DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const leaderboard = result.rows.map((user, index) => ({
      rank: offset + index + 1,
      ...user,
      level: calculateLevel(user.points).level,
      challengesCompleted: parseInt(user.challenges_completed),
      problemsSolved: parseInt(user.problems_solved),
      postsCreated: parseInt(user.posts_created)
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting level leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user points (for when they complete challenges/problems)
export const updateUserPoints = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { points, reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!points || typeof points !== 'number') {
      return res.status(400).json({ error: 'Points must be a number' });
    }

    // Update user points
    await query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [points, userId]
    );

    // Get updated level data
    const userResult = await query('SELECT points FROM users WHERE id = $1', [userId]);
    const newPoints = userResult.rows[0].points;
    const levelData = calculateLevel(newPoints);

    res.json({
      success: true,
      newPoints,
      level: levelData.level,
      progress: levelData.progress,
      reason
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set up routes
router.get('/user', authenticateToken, getUserLevel);
router.get('/leaderboard', getLevelLeaderboard);
router.post('/points', authenticateToken, updateUserPoints);

export default router;
