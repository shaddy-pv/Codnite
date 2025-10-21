import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Helper function to get college ID from either UUID or slug
const getCollegeId = async (idOrSlug: string): Promise<string | null> => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  
  if (isUUID) {
    // It's already a UUID, return as is
    return idOrSlug;
  } else {
    // It's a slug, look up the college ID
    const result = await query('SELECT id FROM colleges WHERE LOWER(short_name) = LOWER($1)', [idOrSlug]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  }
};

// Get all colleges
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let collegesQuery = `
      SELECT 
        c.id, c.name, c.short_name, c.logo_url, c.location, c.city, c.state, c.rank, c.description,
        COUNT(u.id) as member_count
      FROM colleges c
      LEFT JOIN users u ON c.id = u.college_id
    `;
    const queryParams: any[] = [];

    if (search) {
      collegesQuery += ' WHERE c.name ILIKE $1 OR c.short_name ILIKE $1';
      queryParams.push(`%${search}%`);
    }

    collegesQuery += `
      GROUP BY c.id, c.name, c.short_name, c.logo_url, c.location, c.city, c.state, c.rank, c.description
      ORDER BY c.rank ASC NULLS LAST, c.name ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM colleges c
      ${search ? 'WHERE c.name ILIKE $1 OR c.short_name ILIKE $1' : ''}
    `;
    const countParams = search ? [`%${search}%`] : [];

    const [collegesResult, countResult] = await Promise.all([
      query(collegesQuery, queryParams),
      query(countQuery, countParams)
    ]);

    const colleges = collegesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      logoUrl: row.logo_url,
      location: row.location,
      city: row.city,
      state: row.state,
      rank: row.rank,
      description: row.description,
      memberCount: parseInt(row.member_count),
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      colleges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Get college by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = await getCollegeId(id);

    if (!collegeId) {
      return res.status(404).json({ error: 'College not found' });
    }

    const collegeQuery = `
      SELECT 
        c.id, c.name, c.short_name, c.logo_url, c.location, c.city, c.state, c.rank, c.description,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(DISTINCT p.id) as post_count
      FROM colleges c
      LEFT JOIN users u ON c.id = u.college_id
      LEFT JOIN posts p ON u.id = p.author_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.short_name, c.logo_url, c.location, c.city, c.state, c.rank, c.description
    `;

    const result = await query(collegeQuery, [collegeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    const college = result.rows[0];
    res.json({
      id: college.id,
      name: college.name,
      shortName: college.short_name,
      logoUrl: college.logo_url,
      location: college.location,
      city: college.city,
      state: college.state,
      rank: college.rank,
      description: college.description,
      memberCount: parseInt(college.member_count),
      postCount: parseInt(college.post_count),
    });
  } catch (error) {
    logger.error('Error fetching college:', error);
    res.status(500).json({ error: 'Failed to fetch college' });
  }
});

// Get college members
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = await getCollegeId(id);

    if (!collegeId) {
      return res.status(404).json({ error: 'College not found' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const membersQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points, u.created_at,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT f2.follower_id) as follower_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      LEFT JOIN follows f2 ON u.id = f2.following_id
      WHERE u.college_id = $1
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points, u.created_at
      ORDER BY u.points DESC, u.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = 'SELECT COUNT(*) as total FROM users WHERE college_id = $1';

    const [membersResult, countResult] = await Promise.all([
      query(membersQuery, [collegeId, limit, offset]),
      query(countQuery, [collegeId])
    ]);

    const members = membersResult.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      points: row.points,
      createdAt: row.created_at,
      postCount: parseInt(row.post_count),
      submissionCount: parseInt(row.submission_count),
      followerCount: parseInt(row.follower_count),
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching college members:', error);
    res.status(500).json({ error: 'Failed to fetch college members' });
  }
});

// Get college leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = await getCollegeId(id);

    if (!collegeId) {
      return res.status(404).json({ error: 'College not found' });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboardQuery = `
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.points,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.id END) as accepted_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN submissions s ON u.id = s.user_id
      WHERE u.college_id = $1
      GROUP BY u.id, u.username, u.name, u.avatar_url, u.points
      ORDER BY u.points DESC, accepted_count DESC
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
      postCount: parseInt(row.post_count),
      submissionCount: parseInt(row.submission_count),
      acceptedCount: parseInt(row.accepted_count),
    }));

    res.json({ leaderboard });
  } catch (error) {
    logger.error('Error fetching college leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch college leaderboard' });
  }
});

// Get college posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = await getCollegeId(id);

    if (!collegeId) {
      return res.status(404).json({ error: 'College not found' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const postsQuery = `
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.college_id, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name, u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.college_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM posts p
      WHERE p.college_id = $1
    `;

    const [postsResult, countResult] = await Promise.all([
      query(postsQuery, [collegeId, limit, offset]),
      query(countQuery, [collegeId])
    ]);

    const posts = postsResult.rows.map(row => ({
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
        avatarUrl: row.author_avatar,
      },
      _count: {
        comments: parseInt(row.comment_count),
        likes: parseInt(row.like_count),
      }
    }));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching college posts:', error);
    res.status(500).json({ error: 'Failed to fetch college posts' });
  }
});

// Create college (admin only - for now, any authenticated user can create)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { name, shortName, logoUrl, location, rank, description } = req.body;

    if (!name || !shortName) {
      return res.status(400).json({ error: 'Name and short name are required' });
    }

    const result = await query(
      `INSERT INTO colleges (name, short_name, logo_url, location, rank, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, short_name, logo_url, location, rank, description, created_at`,
      [name, shortName, logoUrl, location, rank, description]
    );

    const college = result.rows[0];
    res.status(201).json({
      id: college.id,
      name: college.name,
      shortName: college.short_name,
      logoUrl: college.logo_url,
      location: college.location,
      rank: college.rank,
      description: college.description,
      createdAt: college.created_at,
    });
  } catch (error) {
    logger.error('Error creating college:', error);
    res.status(500).json({ error: 'Failed to create college' });
  }
});

export default router;
