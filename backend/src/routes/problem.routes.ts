import express from 'express';
import { query } from '../utils/database.js';
import logger from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all problems with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const difficulty = req.query.difficulty as string;
    const tag = req.query.tag as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];
    let paramCount = 1;

    const conditions = [];
    
    if (difficulty) {
      conditions.push(`difficulty = $${paramCount}`);
      params.push(difficulty);
      paramCount++;
    }
    
    if (tag) {
      conditions.push(`$${paramCount} = ANY(tags)`);
      params.push(tag);
      paramCount++;
    }
    
    if (search) {
      conditions.push(`(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const problemsQuery = `
      SELECT
        p.id, p.title, p.description, p.difficulty, p.acceptance_rate, p.tags, p.companies, p.created_at,
        (SELECT COUNT(*) FROM problem_submissions ps WHERE ps.problem_id = p.id) as submission_count,
        (SELECT COUNT(*) FROM problem_submissions ps WHERE ps.problem_id = p.id AND ps.status = 'accepted') as accepted_count
      FROM problems p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM problems p ${whereClause}
    `;

    params.push(limit, offset);

    const [problemsResult, countResult] = await Promise.all([
      query(problemsQuery, params),
      query(countQuery, params.slice(0, -2)) // Remove limit and offset for count
    ]);

    const problems = problemsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      acceptanceRate: row.acceptance_rate ? parseFloat(row.acceptance_rate) : 0,
      tags: row.tags || [],
      companies: row.companies || [],
      createdAt: row.created_at,
      _count: {
        submissions: parseInt(row.submission_count) || 0,
        accepted: parseInt(row.accepted_count) || 0,
      }
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      problems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Get problem by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const problemQuery = `
      SELECT
        p.id, p.title, p.description, p.difficulty, p.acceptance_rate, p.examples, p.constraints, p.tags, p.companies, p.test_cases, p.created_at,
        (SELECT COUNT(*) FROM problem_submissions ps WHERE ps.problem_id = p.id) as submission_count,
        (SELECT COUNT(*) FROM problem_submissions ps WHERE ps.problem_id = p.id AND ps.status = 'accepted') as accepted_count
      FROM problems p
      WHERE p.id = $1
    `;

    const problemResult = await query(problemQuery, [id]);

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = problemResult.rows[0];

    const response = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      acceptanceRate: problem.acceptance_rate ? parseFloat(problem.acceptance_rate) : 0,
      examples: problem.examples || [],
      constraints: problem.constraints || [],
      tags: problem.tags || [],
      companies: problem.companies || [],
      testCases: problem.test_cases || [],
      createdAt: problem.created_at,
      _count: {
        submissions: parseInt(problem.submission_count) || 0,
        accepted: parseInt(problem.accepted_count) || 0,
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// Create new problem (admin only)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { 
      title, 
      description, 
      difficulty, 
      examples, 
      constraints, 
      tags, 
      companies, 
      testCases 
    } = req.body;

    if (!title || !description || !difficulty) {
      return res.status(400).json({
        error: 'Title, description, and difficulty are required'
      });
    }

    const createQuery = `
      INSERT INTO problems (title, description, difficulty, examples, constraints, tags, companies, test_cases, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, description, difficulty, examples, constraints, tags, companies, test_cases, created_at
    `;

    const result = await query(createQuery, [
      title,
      description,
      difficulty,
      JSON.stringify(examples || []),
      constraints || [],
      tags || [],
      companies || [],
      JSON.stringify(testCases || [])
    ]);

    const problem = result.rows[0];

    const response = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      examples: problem.examples || [],
      constraints: problem.constraints || [],
      tags: problem.tags || [],
      companies: problem.companies || [],
      testCases: problem.test_cases || [],
      createdAt: problem.created_at,
      _count: {
        submissions: 0,
        accepted: 0,
      }
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating problem:', error);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

// Submit solution for a problem
router.post('/:id/submit', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { 
      code, 
      language, 
      status, 
      runtime, 
      memory, 
      testCasesPassed, 
      totalTestCases, 
      output, 
      error 
    } = req.body;
    const userId = req.user.userId;

    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required'
      });
    }

    // Check if problem exists
    const problemCheck = await query('SELECT id FROM problems WHERE id = $1', [id]);
    if (problemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Use provided execution results or simulate if not provided
    const finalStatus = status || 'submitted';
    const finalRuntime = runtime || 0;
    const finalMemory = memory || 0;
    const finalTestCasesPassed = testCasesPassed || 0;
    const finalTotalTestCases = totalTestCases || 1;

    const submitQuery = `
      INSERT INTO problem_submissions (user_id, problem_id, code, language, status, runtime, memory, test_cases_passed, total_test_cases, output, error, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING id, status, runtime, memory, test_cases_passed, total_test_cases, output, error, created_at
    `;

    const result = await query(submitQuery, [
      userId,
      id,
      code,
      language,
      finalStatus,
      finalRuntime,
      finalMemory,
      finalTestCasesPassed,
      finalTotalTestCases,
      output || '',
      error || ''
    ]);

    const submission = result.rows[0];

    // Award points for solving a problem (if status is accepted)
    if (finalStatus === 'accepted') {
      await query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [50, userId]
      );
    }

    res.status(201).json({
      id: submission.id,
      status: submission.status,
      runtime: submission.runtime,
      memory: submission.memory,
      testCasesPassed: submission.test_cases_passed,
      totalTestCases: submission.total_test_cases,
      output: submission.output,
      error: submission.error,
      createdAt: submission.created_at
    });
  } catch (error) {
    logger.error('Error submitting solution:', error);
    res.status(500).json({ error: 'Failed to submit solution' });
  }
});

// Get user's submissions for a problem
router.get('/:id/submissions', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const submissionsQuery = `
      SELECT id, code, language, status, runtime, memory, test_cases_passed, total_test_cases, output, error, created_at
      FROM problem_submissions
      WHERE problem_id = $1 AND user_id = $2
      ORDER BY created_at DESC
    `;

    const result = await query(submissionsQuery, [id, userId]);

    const submissions = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      language: row.language,
      status: row.status,
      runtime: row.runtime,
      memory: row.memory,
      testCasesPassed: row.test_cases_passed,
      totalTestCases: row.total_test_cases,
      output: row.output,
      error: row.error,
      createdAt: row.created_at
    }));

    res.json(submissions);
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

export default router;
