import Redis from 'ioredis';
import config from '../config/env';

class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.redis = new Redis({
      host: config.redis?.host || 'localhost',
      port: config.redis?.port || 6379,
      password: config.redis?.password,
      db: config.redis?.db || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
      this.isConnected = false;
      // Don't throw error, just log it
    });

    this.redis.on('close', () => {
      console.log('Redis connection closed');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Continue without Redis - graceful degradation
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.redis.disconnect();
    }
  }

  // Generic cache methods
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Cache with automatic key generation
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
    }
  }

  // Specific cache methods for different data types
  async cacheUser(userId: string, userData: any, ttlSeconds: number = 3600): Promise<void> {
    await this.set(`user:${userId}`, userData, ttlSeconds);
  }

  async getCachedUser(userId: string): Promise<any> {
    return await this.get(`user:${userId}`);
  }

  async cachePosts(posts: any[], ttlSeconds: number = 300): Promise<void> {
    await this.set('posts:all', posts, ttlSeconds);
  }

  async getCachedPosts(): Promise<any[]> {
    return await this.get('posts:all') || [];
  }

  async cacheUserPosts(userId: string, posts: any[], ttlSeconds: number = 300): Promise<void> {
    await this.set(`posts:user:${userId}`, posts, ttlSeconds);
  }

  async getCachedUserPosts(userId: string): Promise<any[]> {
    return await this.get(`posts:user:${userId}`) || [];
  }

  async cacheChallenges(challenges: any[], ttlSeconds: number = 600): Promise<void> {
    await this.set('challenges:all', challenges, ttlSeconds);
  }

  async getCachedChallenges(): Promise<any[]> {
    return await this.get('challenges:all') || [];
  }

  async cacheSearchResults(query: string, results: any[], ttlSeconds: number = 1800): Promise<void> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.set(key, results, ttlSeconds);
  }

  async getCachedSearchResults(query: string): Promise<any[]> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return await this.get(key) || [];
  }

  async cacheRecommendations(userId: string, type: string, recommendations: any[], ttlSeconds: number = 1800): Promise<void> {
    await this.set(`recommendations:${type}:${userId}`, recommendations, ttlSeconds);
  }

  async getCachedRecommendations(userId: string, type: string): Promise<any[]> {
    return await this.get(`recommendations:${type}:${userId}`) || [];
  }

  // Cache statistics
  async getStats(): Promise<any> {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      return { info, keyspace };
    } catch (error) {
      console.error('Redis stats error:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
export default cacheService;
