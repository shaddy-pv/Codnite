import { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config } from '../config/env';
import logger from './logger';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

// Health check status
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    application: ServiceHealth;
  };
  metrics: {
    memory: MemoryMetrics;
    cpu: CPUMetrics;
    disk: DiskMetrics;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

interface CPUMetrics {
  usage: number;
  loadAverage: number[];
}

interface DiskMetrics {
  used: number;
  total: number;
  percentage: number;
}

class HealthChecker {
  private dbPool: Pool;
  private redis: Redis;

  constructor() {
    this.dbPool = new Pool({
      connectionString: config.databaseUrl,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    });

    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      connectTimeout: 5000,
      lazyConnect: true,
    });
  }

  async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const client = await this.dbPool.connect();
      await client.query('SELECT 1');
      client.release();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkApplication(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Check if application is responsive
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          memoryUsage,
          cpuUsage,
          pid: process.pid,
        },
      };
    } catch (error) {
      logger.error('Application health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getMemoryMetrics(): Promise<MemoryMetrics> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    
    return {
      used: memoryUsage.heapUsed,
      total: totalMemory,
      percentage: (memoryUsage.heapUsed / totalMemory) * 100,
    };
  }

  async getCPUMetrics(): Promise<CPUMetrics> {
    const cpus = os.cpus();
    
    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const usage = 100 - ~~(100 * totalIdle / totalTick);
    
    return {
      usage: usage || 0,
      loadAverage: os.loadavg(),
    };
  }

  async getDiskMetrics(): Promise<DiskMetrics> {
    try {
      const stats = await fs.statfs('/');
      const total = stats.bavail * stats.bsize;
      const used = (stats.blocks - stats.bavail) * stats.bsize;
      
      return {
        used,
        total,
        percentage: (used / (used + total)) * 100,
      };
    } catch (error) {
      logger.error('Failed to get disk metrics:', error);
      return {
        used: 0,
        total: 0,
        percentage: 0,
      };
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis, application, memory, cpu, disk] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkApplication(),
      this.getMemoryMetrics(),
      this.getCPUMetrics(),
      this.getDiskMetrics(),
    ]);

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (database.status === 'unhealthy' || redis.status === 'unhealthy') {
      status = 'unhealthy';
    } else if (application.status === 'unhealthy' || memory.percentage > 90 || cpu.usage > 80) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      services: {
        database,
        redis,
        application,
      },
      metrics: {
        memory,
        cpu,
        disk,
      },
    };
  }

  async close(): Promise<void> {
    await this.dbPool.end();
    await this.redis.quit();
  }
}

// Create singleton instance
const healthChecker = new HealthChecker();

// Enhanced health check endpoint
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = await healthChecker.getHealthStatus();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
};

// Kubernetes liveness probe
export const livenessProbe = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = await healthChecker.getHealthStatus();
    
    if (healthStatus.status === 'unhealthy') {
      res.status(503).json({ status: 'unhealthy' });
    } else {
      res.status(200).json({ status: 'healthy' });
    }
  } catch (error) {
    logger.error('Liveness probe failed:', error);
    res.status(503).json({ status: 'unhealthy' });
  }
};

// Kubernetes readiness probe
export const readinessProbe = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = await healthChecker.getHealthStatus();
    
    if (healthStatus.status === 'healthy') {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  } catch (error) {
    logger.error('Readiness probe failed:', error);
    res.status(503).json({ status: 'not ready' });
  }
};

// Metrics endpoint for Prometheus
export const metrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = await healthChecker.getHealthStatus();
    
    const metrics = [
      `# HELP application_health_status Application health status (1=healthy, 0=unhealthy)`,
      `# TYPE application_health_status gauge`,
      `application_health_status{service="database"} ${healthStatus.services.database.status === 'healthy' ? 1 : 0}`,
      `application_health_status{service="redis"} ${healthStatus.services.redis.status === 'healthy' ? 1 : 0}`,
      `application_health_status{service="application"} ${healthStatus.services.application.status === 'healthy' ? 1 : 0}`,
      ``,
      `# HELP application_memory_usage_bytes Application memory usage in bytes`,
      `# TYPE application_memory_usage_bytes gauge`,
      `application_memory_usage_bytes ${healthStatus.metrics.memory.used}`,
      ``,
      `# HELP application_memory_usage_percentage Application memory usage percentage`,
      `# TYPE application_memory_usage_percentage gauge`,
      `application_memory_usage_percentage ${healthStatus.metrics.memory.percentage}`,
      ``,
      `# HELP application_cpu_usage_percentage Application CPU usage percentage`,
      `# TYPE application_cpu_usage_percentage gauge`,
      `application_cpu_usage_percentage ${healthStatus.metrics.cpu.usage}`,
      ``,
      `# HELP application_disk_usage_percentage Application disk usage percentage`,
      `# TYPE application_disk_usage_percentage gauge`,
      `application_disk_usage_percentage ${healthStatus.metrics.disk.percentage}`,
      ``,
      `# HELP application_uptime_seconds Application uptime in seconds`,
      `# TYPE application_uptime_seconds gauge`,
      `application_uptime_seconds ${healthStatus.uptime}`,
    ].join('\n');
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed:', error);
    res.status(500).json({ error: 'Metrics endpoint failed' });
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing health checker...');
  await healthChecker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing health checker...');
  await healthChecker.close();
  process.exit(0);
});

export default healthChecker;