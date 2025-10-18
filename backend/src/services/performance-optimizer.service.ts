import { query } from '../utils/database';
import cacheService from './cache.service';
import logger from '../utils/logger';

interface QueryOptimization {
  query: string;
  params: any[];
  cacheKey?: string;
  cacheTtl?: number;
}

interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  resultCount: number;
  memoryUsage: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private slowQueries: Array<{ query: string; time: number; timestamp: number }> = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Optimized database query with caching
  async optimizedQuery<T>(
    sql: string,
    params: any[] = [],
    options: {
      cacheKey?: string;
      cacheTtl?: number;
      useCache?: boolean;
    } = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const { cacheKey, cacheTtl = 300, useCache = true } = options;

    // Try cache first
    if (useCache && cacheKey) {
      const cached = await cacheService.get<T[]>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for query: ${cacheKey}`);
        return cached;
      }
    }

    // Execute query
    const result = await query(sql, params);
    const queryTime = Date.now() - startTime;

    // Log slow queries
    if (queryTime > this.SLOW_QUERY_THRESHOLD) {
      this.slowQueries.push({
        query: sql,
        time: queryTime,
        timestamp: Date.now(),
      });
      logger.warn(`Slow query detected: ${queryTime}ms`, { sql, params });
    }

    // Cache result
    if (useCache && cacheKey && result.rows.length > 0) {
      await cacheService.set(cacheKey, result.rows, cacheTtl);
    }

    return result.rows;
  }

  // Optimized user queries
  async getUsersWithCache(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<any[]> {
    const offset = (page - 1) * limit;
    const cacheKey = `users:${page}:${limit}:${search || 'all'}`;
    
    return this.optimizedQuery(
      `
        SELECT id, username, name, bio, points, created_at
        FROM users
        ${search ? 'WHERE username ILIKE $3 OR name ILIKE $3' : ''}
        ORDER BY points DESC, created_at DESC
        LIMIT $1 OFFSET $2
      `,
      search ? [limit, offset, `%${search}%`] : [limit, offset],
      { cacheKey, cacheTtl: 300 }
    );
  }

  async getUserByIdWithCache(userId: string): Promise<any> {
    const cacheKey = `user:${userId}`;
    
    const users = await this.optimizedQuery(
      'SELECT * FROM users WHERE id = $1',
      [userId],
      { cacheKey, cacheTtl: 3600 }
    );
    
    return users[0] || null;
  }

  // Optimized post queries
  async getPostsWithCache(
    page: number = 1,
    limit: number = 10,
    authorId?: string,
    search?: string
  ): Promise<any[]> {
    const offset = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}:${authorId || 'all'}:${search || 'all'}`;
    
    let whereClause = '';
    let params: any[] = [limit, offset];
    
    if (authorId) {
      whereClause = 'WHERE p.author_id = $3';
      params.push(authorId);
    }
    
    if (search) {
      const searchParam = `%${search}%`;
      if (whereClause) {
        whereClause += ' AND (p.title ILIKE $4 OR p.content ILIKE $4)';
        params.push(searchParam);
      } else {
        whereClause = 'WHERE p.title ILIKE $3 OR p.content ILIKE $3';
        params.push(searchParam);
      }
    }
    
    return this.optimizedQuery(
      `
        SELECT p.*, u.username, u.name as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      params,
      { cacheKey, cacheTtl: 300 }
    );
  }

  async getPostByIdWithCache(postId: string): Promise<any> {
    const cacheKey = `post:${postId}`;
    
    const posts = await this.optimizedQuery(
      `
        SELECT p.*, u.username, u.name as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = $1
      `,
      [postId],
      { cacheKey, cacheTtl: 1800 }
    );
    
    return posts[0] || null;
  }

  // Optimized challenge queries
  async getChallengesWithCache(
    page: number = 1,
    limit: number = 10,
    difficulty?: string
  ): Promise<any[]> {
    const offset = (page - 1) * limit;
    const cacheKey = `challenges:${page}:${limit}:${difficulty || 'all'}`;
    
    const whereClause = difficulty ? 'WHERE difficulty = $3' : '';
    const params = difficulty ? [limit, offset, difficulty] : [limit, offset];
    
    return this.optimizedQuery(
      `
        SELECT * FROM challenges
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      params,
      { cacheKey, cacheTtl: 600 }
    );
  }

  async getChallengeByIdWithCache(challengeId: string): Promise<any> {
    const cacheKey = `challenge:${challengeId}`;
    
    const challenges = await this.optimizedQuery(
      'SELECT * FROM challenges WHERE id = $1',
      [challengeId],
      { cacheKey, cacheTtl: 3600 }
    );
    
    return challenges[0] || null;
  }

  // Optimized problem queries
  async getProblemsWithCache(
    page: number = 1,
    limit: number = 10,
    difficulty?: string,
    tags?: string[]
  ): Promise<any[]> {
    const offset = (page - 1) * limit;
    const cacheKey = `problems:${page}:${limit}:${difficulty || 'all'}:${tags?.join(',') || 'all'}`;
    
    let whereClause = '';
    let params: any[] = [limit, offset];
    let paramIndex = 3;
    
    if (difficulty) {
      whereClause = 'WHERE difficulty = $3';
      params.push(difficulty);
      paramIndex++;
    }
    
    if (tags && tags.length > 0) {
      const tagCondition = tags.map((_, index) => `$${paramIndex + index}`).join(',');
      if (whereClause) {
        whereClause += ` AND tags && ARRAY[${tagCondition}]`;
      } else {
        whereClause = `WHERE tags && ARRAY[${tagCondition}]`;
      }
      params.push(...tags);
    }
    
    return this.optimizedQuery(
      `
        SELECT * FROM problems
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      params,
      { cacheKey, cacheTtl: 600 }
    );
  }

  async getProblemByIdWithCache(problemId: string): Promise<any> {
    const cacheKey = `problem:${problemId}`;
    
    const problems = await this.optimizedQuery(
      'SELECT * FROM problems WHERE id = $1',
      [problemId],
      { cacheKey, cacheTtl: 3600 }
    );
    
    return problems[0] || null;
  }

  // Optimized search queries
  async searchWithCache(
    query: string,
    type: 'posts' | 'users' | 'challenges' | 'problems' = 'posts',
    page: number = 1,
    limit: number = 10
  ): Promise<any[]> {
    const offset = (page - 1) * limit;
    const cacheKey = `search:${type}:${Buffer.from(query).toString('base64')}:${page}:${limit}`;
    
    const searchTerm = `%${query}%`;
    
    switch (type) {
      case 'posts':
        return this.optimizedQuery(
          `
            SELECT p.*, u.username, u.name as author_name
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.title ILIKE $3 OR p.content ILIKE $3
            ORDER BY p.created_at DESC
            LIMIT $1 OFFSET $2
          `,
          [limit, offset, searchTerm],
          { cacheKey, cacheTtl: 1800 }
        );
        
      case 'users':
        return this.optimizedQuery(
          `
            SELECT id, username, name, bio, points, created_at
            FROM users
            WHERE username ILIKE $3 OR name ILIKE $3 OR bio ILIKE $3
            ORDER BY points DESC
            LIMIT $1 OFFSET $2
          `,
          [limit, offset, searchTerm],
          { cacheKey, cacheTtl: 1800 }
        );
        
      case 'challenges':
        return this.optimizedQuery(
          `
            SELECT * FROM challenges
            WHERE title ILIKE $3 OR description ILIKE $3
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
          `,
          [limit, offset, searchTerm],
          { cacheKey, cacheTtl: 1800 }
        );
        
      case 'problems':
        return this.optimizedQuery(
          `
            SELECT * FROM problems
            WHERE title ILIKE $3 OR description ILIKE $3
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
          `,
          [limit, offset, searchTerm],
          { cacheKey, cacheTtl: 1800 }
        );
        
      default:
        return [];
    }
  }

  // Cache invalidation
  async invalidateUserCache(userId: string): Promise<void> {
    await cacheService.del(`user:${userId}`);
    await cacheService.invalidatePattern('users:*');
  }

  async invalidatePostCache(postId: string): Promise<void> {
    await cacheService.del(`post:${postId}`);
    await cacheService.invalidatePattern('posts:*');
  }

  async invalidateChallengeCache(challengeId: string): Promise<void> {
    await cacheService.del(`challenge:${challengeId}`);
    await cacheService.invalidatePattern('challenges:*');
  }

  async invalidateProblemCache(problemId: string): Promise<void> {
    await cacheService.del(`problem:${problemId}`);
    await cacheService.invalidatePattern('problems:*');
  }

  // Performance monitoring
  getSlowQueries(): Array<{ query: string; time: number; timestamp: number }> {
    return [...this.slowQueries];
  }

  clearSlowQueries(): void {
    this.slowQueries = [];
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    return {
      queryTime: 0,
      cacheHit: false,
      resultCount: 0,
      memoryUsage: memoryUsage.heapUsed,
    };
  }

  // Database connection optimization
  async optimizeConnections(): Promise<void> {
    try {
      // Set connection pool settings
      await query(`
        ALTER SYSTEM SET max_connections = 100;
        ALTER SYSTEM SET shared_buffers = '256MB';
        ALTER SYSTEM SET effective_cache_size = '1GB';
        ALTER SYSTEM SET work_mem = '4MB';
        ALTER SYSTEM SET maintenance_work_mem = '64MB';
        ALTER SYSTEM SET checkpoint_completion_target = 0.9;
        ALTER SYSTEM SET wal_buffers = '16MB';
        ALTER SYSTEM SET default_statistics_target = 100;
      `);
      
      logger.info('Database connections optimized');
    } catch (error) {
      logger.error('Failed to optimize database connections:', error);
    }
  }

  // Index optimization
  async optimizeIndexes(): Promise<void> {
    try {
      // Create indexes for frequently queried columns
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC)',
        'CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)',
        'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_posts_title ON posts USING gin(to_tsvector(\'english\', title))',
        'CREATE INDEX IF NOT EXISTS idx_posts_content ON posts USING gin(to_tsvector(\'english\', content))',
        'CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty)',
        'CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty)',
        'CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING gin(tags)',
        'CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)',
        'CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)',
        'CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)',
        'CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)',
        'CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)',
        'CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id)',
        'CREATE INDEX IF NOT EXISTS idx_problem_submissions_user_id ON problem_submissions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_problem_submissions_problem_id ON problem_submissions(problem_id)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
        'CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id)',
        'CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query)',
        'CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name)',
        'CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id)',
        'CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id)',
        'CREATE INDEX IF NOT EXISTS idx_mentions_post_id ON mentions(post_id)',
        'CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user_id ON mentions(mentioned_user_id)',
      ];

      for (const indexQuery of indexes) {
        await query(indexQuery);
      }
      
      logger.info('Database indexes optimized');
    } catch (error) {
      logger.error('Failed to optimize database indexes:', error);
    }
  }

  // Query analysis
  async analyzeQueries(): Promise<any> {
    try {
      const result = await query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements
        ORDER BY total_time DESC
        LIMIT 20
      `);
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to analyze queries:', error);
      return [];
    }
  }
}

export default PerformanceOptimizer;
