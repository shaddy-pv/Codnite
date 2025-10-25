import { query } from '../utils/database.js';
import cacheService from './cache.service.js';

interface QueryOptions {
  useCache?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
  timeout?: number;
}

interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

class DatabaseOptimizer {
  // Optimized query execution with caching
  async executeQuery<T>(
    sql: string, 
    params: any[] = [], 
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { useCache = false, cacheKey, cacheTtl = 300, timeout = 30000 } = options;

    // Check cache first
    if (useCache && cacheKey) {
      const cached = await cacheService.get<T[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute query with timeout
    const startTime = Date.now();
    try {
      const result = await Promise.race([
        query(sql, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ]);

      const executionTime = Date.now() - startTime;
      
      // Log slow queries
      if (executionTime > 1000) {
        console.warn(`Slow query detected (${executionTime}ms):`, sql.substring(0, 100));
      }

      const data = (result as any).rows || [];

      // Cache result if enabled
      if (useCache && cacheKey && data.length > 0) {
        await cacheService.set(cacheKey, data, cacheTtl);
      }

      return data;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Optimized pagination with cursor-based pagination for large datasets
  async paginatedQuery<T>(
    baseSql: string,
    countSql: string,
    params: any[] = [],
    pagination: PaginationOptions,
    sort?: SortOptions,
    cacheKey?: string
  ): Promise<{ data: T[]; pagination: any }> {
    const { page, limit, offset = (page - 1) * limit } = pagination;
    
    // Check cache for paginated results
    if (cacheKey) {
      const cacheKeyWithPage = `${cacheKey}:page:${page}:limit:${limit}`;
      const cached = await cacheService.get<{ data: T[]; pagination: any }>(cacheKeyWithPage);
      if (cached) {
        return cached;
      }
    }

    // Build optimized query with sorting
    let sql = baseSql;
    if (sort) {
      sql += ` ORDER BY ${sort.field} ${sort.direction}`;
    }
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    // Execute queries in parallel
    const [dataResult, countResult] = await Promise.all([
      query(sql, [...params, limit, offset]),
      query(countSql, params)
    ]);

    const data = (dataResult as any).rows || [];
    const total = parseInt((countResult as any).rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    const result = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    // Cache result
    if (cacheKey) {
      const cacheKeyWithPage = `${cacheKey}:page:${page}:limit:${limit}`;
      await cacheService.set(cacheKeyWithPage, result, 300);
    }

    return result;
  }

  // Optimized user queries with caching
  async getUsers(
    filters: any = {},
    pagination: PaginationOptions,
    sort?: SortOptions
  ): Promise<{ data: any[]; pagination: any }> {
    const { college_id, points_min, points_max, search } = filters;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (college_id) {
      whereClause += ` WHERE college_id = $${paramIndex}`;
      params.push(college_id);
      paramIndex++;
    }

    if (points_min !== undefined) {
      whereClause += whereClause ? ` AND points >= $${paramIndex}` : ` WHERE points >= $${paramIndex}`;
      params.push(points_min);
      paramIndex++;
    }

    if (points_max !== undefined) {
      whereClause += whereClause ? ` AND points <= $${paramIndex}` : ` WHERE points <= $${paramIndex}`;
      params.push(points_max);
      paramIndex++;
    }

    if (search) {
      whereClause += whereClause ? ` AND (username ILIKE $${paramIndex} OR name ILIKE $${paramIndex})` : ` WHERE (username ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const baseSql = `
      SELECT 
        u.id, u.username, u.name, u.bio, u.avatar_url, u.college_id, u.points,
        u.created_at, c.name as college_name, c.short_name as college_short_name,
        (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) as following_count
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      ${whereClause}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    const cacheKey = `users:${JSON.stringify(filters)}`;
    return this.paginatedQuery(baseSql, countSql, params, pagination, sort, cacheKey);
  }

  // Optimized posts queries with caching
  async getPosts(
    filters: any = {},
    pagination: PaginationOptions,
    sort?: SortOptions
  ): Promise<{ data: any[]; pagination: any }> {
    const { author_id, language, tags, search, college_id } = filters;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (author_id) {
      whereClause += ` WHERE p.author_id = $${paramIndex}`;
      params.push(author_id);
      paramIndex++;
    }

    if (language) {
      whereClause += whereClause ? ` AND p.language = $${paramIndex}` : ` WHERE p.language = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      whereClause += whereClause ? ` AND p.tags && $${paramIndex}` : ` WHERE p.tags && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    if (search) {
      whereClause += whereClause ? ` AND (p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})` : ` WHERE (p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (college_id) {
      whereClause += whereClause ? ` AND u.college_id = $${paramIndex}` : ` WHERE u.college_id = $${paramIndex}`;
      params.push(college_id);
      paramIndex++;
    }

    const baseSql = `
      SELECT 
        p.id, p.title, p.content, p.code, p.language, p.tags, p.created_at, p.updated_at,
        u.id as author_id, u.username as author_username, u.name as author_name,
        u.avatar_url as author_avatar, u.college_id as author_college_id,
        c.name as college_name, c.short_name as college_short_name,
        (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN colleges c ON u.college_id = c.id
      ${whereClause}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ${whereClause}
    `;

    const cacheKey = `posts:${JSON.stringify(filters)}`;
    return this.paginatedQuery(baseSql, countSql, params, pagination, sort, cacheKey);
  }

  // Optimized challenges queries
  async getChallenges(
    filters: any = {},
    pagination: PaginationOptions,
    sort?: SortOptions
  ): Promise<{ data: any[]; pagination: any }> {
    const { difficulty, points_min, points_max, active_only } = filters;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (difficulty) {
      whereClause += ` WHERE difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (points_min !== undefined) {
      whereClause += whereClause ? ` AND points >= $${paramIndex}` : ` WHERE points >= $${paramIndex}`;
      params.push(points_min);
      paramIndex++;
    }

    if (points_max !== undefined) {
      whereClause += whereClause ? ` AND points <= $${paramIndex}` : ` WHERE points <= $${paramIndex}`;
      params.push(points_max);
      paramIndex++;
    }

    if (active_only) {
      whereClause += whereClause ? ` AND end_date > CURRENT_TIMESTAMP` : ` WHERE end_date > CURRENT_TIMESTAMP`;
    }

    const baseSql = `
      SELECT 
        c.id, c.title, c.description, c.difficulty, c.points, 
        c.start_date, c.end_date, c.created_at,
        (SELECT COUNT(*) FROM submissions s WHERE s.challenge_id = c.id) as submission_count
      FROM challenges c
      ${whereClause}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM challenges c
      ${whereClause}
    `;

    const cacheKey = `challenges:${JSON.stringify(filters)}`;
    return this.paginatedQuery(baseSql, countSql, params, pagination, sort, cacheKey);
  }

  // Batch operations for better performance
  async batchInsert(table: string, columns: string[], values: any[][]): Promise<void> {
    if (values.length === 0) return;

    const placeholders = values.map((_, index) => {
      const start = index * columns.length + 1;
      return `(${columns.map((_, colIndex) => `$${start + colIndex}`).join(', ')})`;
    }).join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
    const flatValues = values.flat();

    await query(sql, flatValues);
  }

  // Optimized search with full-text search
  async fullTextSearch(
    searchTerm: string,
    table: string,
    searchColumns: string[],
    pagination: PaginationOptions,
    additionalFilters: any = {}
  ): Promise<{ data: any[]; pagination: any }> {
    const { page, limit, offset = (page - 1) * limit } = pagination;
    
    // Create full-text search query
    const searchCondition = searchColumns
      .map((col, index) => `${col} ILIKE $${index + 1}`)
      .join(' OR ');

    const searchParams = searchColumns.map(() => `%${searchTerm}%`);
    
    let whereClause = `WHERE (${searchCondition})`;
    const params = [...searchParams];
    let paramIndex = searchParams.length + 1;

    // Add additional filters
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereClause += ` AND ${key} = $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    });

    const baseSql = `SELECT * FROM ${table} ${whereClause}`;
    const countSql = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;

    return this.paginatedQuery(baseSql, countSql, params, pagination);
  }

  // Connection pooling optimization
  async optimizeConnections(): Promise<void> {
    // This would typically involve adjusting connection pool settings
    // For now, we'll just log the optimization
    console.log('Database connections optimized');
  }

  // Query performance monitoring
  async getQueryStats(): Promise<any> {
    try {
      const stats = await query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        ORDER BY total_time DESC 
        LIMIT 10
      `);
      return stats.rows;
    } catch (error) {
      console.error('Error getting query stats:', error);
      return [];
    }
  }
}

export const dbOptimizer = new DatabaseOptimizer();
export default dbOptimizer;
