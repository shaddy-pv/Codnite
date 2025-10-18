import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';
import CodeExecutionService, { ExecutionRequest } from '../services/CodeExecutionService';

const router = Router();
const executionService = new CodeExecutionService();

// Get all challenges
router.get('/', async (req, res) => {
  try {
    const challengesQuery = `
      SELECT 
        c.id, c.title, c.description, c.difficulty, c.points, 
        c.start_date, c.end_date, c.created_at,
        COUNT(s.id) as submission_count
      FROM challenges c
      LEFT JOIN submissions s ON c.id = s.challenge_id
      GROUP BY c.id, c.title, c.description, c.difficulty, c.points, 
               c.start_date, c.end_date, c.created_at
      ORDER BY c.created_at DESC
    `;

    const result = await query(challengesQuery);
    
    const challenges = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      points: row.points,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      _count: {
        submissions: parseInt(row.submission_count) || 0
      }
    }));

    res.json(challenges);
  } catch (error) {
    logger.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Get challenge by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const challengeQuery = `
      SELECT 
        c.id, c.title, c.description, c.difficulty, c.points, 
        c.start_date, c.end_date, c.created_at,
        COUNT(s.id) as submission_count
      FROM challenges c
      LEFT JOIN submissions s ON c.id = s.challenge_id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.description, c.difficulty, c.points, 
               c.start_date, c.end_date, c.created_at
    `;

    const result = await query(challengeQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const row = result.rows[0];
    const challenge = {
      id: row.id,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      points: row.points,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      _count: {
        submissions: parseInt(row.submission_count) || 0
      }
    };

    res.json(challenge);
  } catch (error) {
    logger.error('Error fetching challenge:', error);
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

// Create new challenge
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { title, description, difficulty, points, startDate, endDate } = req.body;
    const userId = req.user.userId;

    if (!title || !description || !difficulty || !points) {
      return res.status(400).json({ 
        error: 'Title, description, difficulty, and points are required' 
      });
    }

    const createQuery = `
      INSERT INTO challenges (title, description, difficulty, points, start_date, end_date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, title, description, difficulty, points, start_date, end_date, created_at
    `;

    const startDateValue = startDate ? new Date(startDate) : new Date();
    const endDateValue = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await query(createQuery, [
      title,
      description,
      difficulty,
      parseInt(points),
      startDateValue,
      endDateValue
    ]);

    const challenge = result.rows[0];

    const response = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      points: challenge.points,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      createdAt: challenge.created_at,
      _count: {
        submissions: 0,
      }
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Submit solution to challenge
router.post('/:id/submit', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { code, language } = req.body;
    const userId = req.user.userId;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Code and language are required' 
      });
    }

    // Get challenge details
    const challengeQuery = `
      SELECT id, title, points, start_date, end_date
      FROM challenges 
      WHERE id = $1
    `;
    
    const challengeResult = await query(challengeQuery, [id]);
    
    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    // Check if challenge is still active
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    
    if (now < startDate || now > endDate) {
      return res.status(400).json({ error: 'Challenge is not currently active' });
    }

    // Check if user already submitted for this challenge
    const existingSubmissionQuery = `
      SELECT id FROM submissions 
      WHERE challenge_id = $1 AND user_id = $2
    `;
    
    const existingSubmission = await query(existingSubmissionQuery, [id, userId]);
    
    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a solution for this challenge' });
    }

    // Create submission
    const submissionQuery = `
      INSERT INTO submissions (user_id, challenge_id, code, language, status, score, created_at)
      VALUES ($1, $2, $3, $4, 'accepted', 100, CURRENT_TIMESTAMP)
      RETURNING id, status, score, created_at
    `;

    const submissionResult = await query(submissionQuery, [
      userId,
      id,
      code,
      language
    ]);

    const submission = submissionResult.rows[0];

    // Award points for completing challenge
    await query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [challenge.points, userId]
    );

    res.status(201).json({
      submissionId: submission.id,
      score: submission.score,
      status: submission.status,
      pointsAwarded: challenge.points,
      message: `Congratulations! You earned ${challenge.points} points for completing this challenge.`
    });

  } catch (error) {
    logger.error('Error submitting solution:', error);
    res.status(500).json({ error: 'Failed to submit solution' });
  }
});

// Get user's submissions for a challenge
router.get('/:id/submissions', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const submissionsQuery = `
      SELECT s.id, s.code, s.language, s.status, s.score, s.created_at,
             u.id as user_id, u.username, u.name
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.challenge_id = $1 AND s.user_id = $2
      ORDER BY s.created_at DESC
    `;

    const submissionsResult = await query(submissionsQuery, [id, userId]);

    const submissions = submissionsResult.rows.map(row => ({
      id: row.id,
      code: row.code,
      language: row.language,
      status: row.status,
      score: row.score,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        username: row.username,
        name: row.name,
      }
    }));

    res.json(submissions);
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get leaderboard for a challenge
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;

    const leaderboardQuery = `
      SELECT s.id, s.code, s.language, s.status, s.score, s.created_at,
             u.id as user_id, u.username, u.name
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.challenge_id = $1 AND s.status = 'accepted'
      ORDER BY s.score DESC, s.created_at ASC
    `;

    const submissionsResult = await query(leaderboardQuery, [id]);

    const submissions = submissionsResult.rows.map(row => ({
      id: row.id,
      code: row.code,
      language: row.language,
      status: row.status,
      score: row.score,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        username: row.username,
        name: row.name,
      }
    }));

    res.json(submissions);
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
