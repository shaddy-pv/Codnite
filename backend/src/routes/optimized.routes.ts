import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import cacheService from '../services/cache.service.js';
import dbOptimizer from '../services/database-optimizer.service.js';
import cdnService from '../services/cdn.service.js';

const router = Router();

// Optimized posts endpoint with caching
router.get('/posts/optimized', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, author_id, language, tags, search, college_id } = req.query;
    
    const filters = {
      author_id: author_id as string,
      language: language as string,
      tags: tags ? (tags as string).split(',') : undefined,
      search: search as string,
      college_id: college_id as string
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const sort = { field: 'created_at', direction: 'DESC' as const };

    const result = await dbOptimizer.getPosts(filters, pagination, sort);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching optimized posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Optimized users endpoint with caching
router.get('/users/optimized', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, college_id, points_min, points_max, search } = req.query;
    
    const filters = {
      college_id: college_id as string,
      points_min: points_min ? parseInt(points_min as string) : undefined,
      points_max: points_max ? parseInt(points_max as string) : undefined,
      search: search as string
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const sort = { field: 'points', direction: 'DESC' as const };

    const result = await dbOptimizer.getUsers(filters, pagination, sort);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching optimized users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Optimized challenges endpoint with caching
router.get('/challenges/optimized', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, difficulty, points_min, points_max, active_only } = req.query;
    
    const filters = {
      difficulty: difficulty as string,
      points_min: points_min ? parseInt(points_min as string) : undefined,
      points_max: points_max ? parseInt(points_max as string) : undefined,
      active_only: active_only === 'true'
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const sort = { field: 'created_at', direction: 'DESC' as const };

    const result = await dbOptimizer.getChallenges(filters, pagination, sort);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching optimized challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// File upload endpoint with CDN
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    // This would typically use multer middleware to handle file uploads
    // For now, we'll create a mock implementation
    
    const { fileName, fileType, folder = 'uploads' } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'File name and type are required' });
    }

    // In a real implementation, you'd get the file buffer from multer
    const mockFileBuffer = Buffer.from('mock file content');
    
    const result = await cdnService.uploadFile(mockFileBuffer, fileName, folder, {
      optimize: true,
      quality: 80,
      format: 'auto'
    });

    res.json({
      url: result.url,
      publicId: result.publicId,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Generate optimized image URL
router.post('/images/optimize', authenticateToken, async (req, res) => {
  try {
    const { originalUrl, width, height, quality, format, crop } = req.body;
    
    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    const optimizedUrl = cdnService.generateImageUrl(originalUrl, {
      width,
      height,
      quality,
      format,
      crop
    });

    res.json({ optimizedUrl });
  } catch (error) {
    console.error('Error optimizing image:', error);
    res.status(500).json({ error: 'Failed to optimize image' });
  }
});

// Cache management endpoints
router.post('/cache/clear', authenticateToken, async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      await cacheService.invalidatePattern(pattern);
    } else {
      // Clear all cache (this would be more sophisticated in production)
      await cacheService.invalidatePattern('*');
    }

    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

router.get('/cache/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// Database performance monitoring
router.get('/db/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await dbOptimizer.getQueryStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({ error: 'Failed to get database stats' });
  }
});

// Full-text search endpoint
router.get('/search/optimized', authenticateToken, async (req, res) => {
  try {
    const { q, table = 'posts', page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchColumns = table === 'posts' 
      ? ['title', 'content'] 
      : table === 'users' 
        ? ['username', 'name', 'bio']
        : ['title', 'description'];

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await dbOptimizer.fullTextSearch(
      q as string,
      table as string,
      searchColumns,
      pagination
    );

    res.json(result);
  } catch (error) {
    console.error('Error performing optimized search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Batch operations endpoint
router.post('/batch/insert', authenticateToken, async (req, res) => {
  try {
    const { table, columns, values } = req.body;
    
    if (!table || !columns || !values) {
      return res.status(400).json({ error: 'Table, columns, and values are required' });
    }

    await dbOptimizer.batchInsert(table, columns, values);
    
    res.json({ message: 'Batch insert completed successfully' });
  } catch (error) {
    console.error('Error performing batch insert:', error);
    res.status(500).json({ error: 'Failed to perform batch insert' });
  }
});

export default router;
