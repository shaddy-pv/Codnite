# Codnite Production Monitoring Setup
# ===================================

# Sentry Configuration
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '0.1'),
  tracesSampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '0.1'),
  profilesSampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '0.1'),
  integrations: [
    new ProfilingIntegration(),
  ],
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  },
});

export { Sentry };

# New Relic Configuration
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

# Performance Monitoring
export const performanceMonitor = {
  startTimer: (name: string) => {
    const start = process.hrtime.bigint();
    return {
      end: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  },

  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const timer = performanceMonitor.startTimer(name);
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  }
};

# Health Check Endpoint
export const healthCheck = {
  async checkDatabase() {
    try {
      const { query } = await import('../utils/database');
      await query('SELECT 1');
      return { status: 'healthy', responseTime: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async checkRedis() {
    try {
      const redis = await import('redis');
      const client = redis.createClient({ url: process.env.REDIS_URL });
      await client.connect();
      await client.ping();
      await client.disconnect();
      return { status: 'healthy', responseTime: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async checkDiskSpace() {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.statfs('/');
      const freeSpace = stats.bavail * stats.bsize;
      const totalSpace = stats.blocks * stats.bsize;
      const usedPercentage = ((totalSpace - freeSpace) / totalSpace) * 100;
      
      return {
        status: usedPercentage > 90 ? 'warning' : 'healthy',
        freeSpace: freeSpace,
        totalSpace: totalSpace,
        usedPercentage: usedPercentage
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  async checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedPercentage = ((totalMem - freeMem) / totalMem) * 100;

    return {
      status: usedPercentage > 90 ? 'warning' : 'healthy',
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      systemUsedPercentage: usedPercentage
    };
  },

  async getSystemInfo() {
    const os = require('os');
    return {
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      nodeVersion: process.version,
      pid: process.pid,
      memoryUsage: process.memoryUsage()
    };
  }
};