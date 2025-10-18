import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Database viewer - show all tables and data
router.get('/tables', async (req, res) => {
  try {
    // Get all table names
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    
    res.json({
      message: 'Database Tables',
      tables: tables,
      totalTables: tables.length
    });
  } catch (error) {
    logger.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get all data from a specific table
router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Get table data
    const dataResult = await query(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 100`);
    
    // Get table info
    const infoResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);

    res.json({
      tableName: tableName,
      columns: infoResult.rows,
      data: dataResult.rows,
      totalRows: dataResult.rows.length,
      message: `Data from ${tableName} table`
    });
  } catch (error) {
    logger.error(`Error fetching data from ${req.params.tableName}:`, error);
    res.status(500).json({ error: `Failed to fetch data from ${req.params.tableName}` });
  }
});

// Get users data
router.get('/users', async (req, res) => {
  try {
    const usersResult = await query(`
      SELECT 
        id, email, username, name, bio, avatar_url, github_username, 
        linkedin_url, college_id, points, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      message: 'All Users in Database',
      users: usersResult.rows,
      totalUsers: usersResult.rows.length
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get posts data
router.get('/posts', async (req, res) => {
  try {
    const postsResult = await query(`
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at, p.updated_at,
        u.username as author_username, u.name as author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({
      message: 'All Posts in Database',
      posts: postsResult.rows,
      totalPosts: postsResult.rows.length
    });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get follows data
router.get('/follows', async (req, res) => {
  try {
    const followsResult = await query(`
      SELECT 
        f.id, f.created_at,
        follower.username as follower_username, follower.name as follower_name,
        following.username as following_username, following.name as following_name
      FROM follows f
      JOIN users follower ON f.follower_id = follower.id
      JOIN users following ON f.following_id = following.id
      ORDER BY f.created_at DESC
    `);

    res.json({
      message: 'All Follows in Database',
      follows: followsResult.rows,
      totalFollows: followsResult.rows.length
    });
  } catch (error) {
    logger.error('Error fetching follows:', error);
    res.status(500).json({ error: 'Failed to fetch follows' });
  }
});

// Get problems data
router.get('/problems', async (req, res) => {
  try {
    const problemsResult = await query(`
      SELECT 
        id, title, description, difficulty, acceptance_rate, 
        tags, companies, created_at, updated_at
      FROM problems 
      ORDER BY created_at DESC
    `);

    res.json({
      message: 'All Problems in Database',
      problems: problemsResult.rows,
      totalProblems: problemsResult.rows.length
    });
  } catch (error) {
    logger.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Get colleges data
router.get('/colleges', async (req, res) => {
  try {
    const collegesResult = await query(`
      SELECT 
        id, name, short_name, logo_url, location, rank, description, 
        created_at, updated_at
      FROM colleges 
      ORDER BY rank ASC
    `);

    res.json({
      message: 'All Colleges in Database',
      colleges: collegesResult.rows,
      totalColleges: collegesResult.rows.length
    });
  } catch (error) {
    logger.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Database summary
router.get('/summary', async (req, res) => {
  try {
    const [usersCount, postsCount, followsCount, problemsCount, collegesCount] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM posts'),
      query('SELECT COUNT(*) as count FROM follows'),
      query('SELECT COUNT(*) as count FROM problems'),
      query('SELECT COUNT(*) as count FROM colleges')
    ]);

    res.json({
      message: 'Database Summary',
      summary: {
        users: parseInt(usersCount.rows[0].count),
        posts: parseInt(postsCount.rows[0].count),
        follows: parseInt(followsCount.rows[0].count),
        problems: parseInt(problemsCount.rows[0].count),
        colleges: parseInt(collegesCount.rows[0].count)
      }
    });
  } catch (error) {
    logger.error('Error fetching database summary:', error);
    res.status(500).json({ error: 'Failed to fetch database summary' });
  }
});

export default router;
