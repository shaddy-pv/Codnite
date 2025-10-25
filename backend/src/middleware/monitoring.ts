import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Log performance metrics
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.id,
    });
    
    // Add response time header
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error tracking middleware
export const errorTracker = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
    body: req.body,
    query: req.query,
    params: req.params,
  });
  
  next(error);
};

// Security monitoring middleware
export const securityMonitor = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /eval\(/i,  // Code injection
    /javascript:/i,  // JavaScript protocol
  ];
  
  const url = req.url;
  const userAgent = req.get('User-Agent') || '';
  const body = JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent) || pattern.test(body)) {
      logger.warn('Suspicious activity detected', {
        pattern: pattern.toString(),
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id,
        timestamp: new Date().toISOString(),
      });
      
      // You might want to block the request or add additional monitoring
      break;
    }
  }
  
  next();
};

// Rate limiting monitor
export const rateLimitMonitor = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const endpoint = req.path;
  
  // Track request frequency (this is a simple in-memory implementation)
  // In production, you'd want to use Redis or similar
  if (!global.requestCounts) {
    global.requestCounts = new Map();
  }
  
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!global.requestCounts.has(key)) {
    global.requestCounts.set(key, []);
  }
  
  const requests = global.requestCounts.get(key);
  
  // Remove old requests outside the window
  const validRequests = requests.filter((time: number) => now - time < windowMs);
  validRequests.push(now);
  global.requestCounts.set(key, validRequests);
  
  // Log if approaching rate limit
  const threshold = 80; // 80% of rate limit
  if (validRequests.length > threshold) {
    logger.warn('Rate limit threshold approaching', {
      ip,
      endpoint,
      requestCount: validRequests.length,
      threshold,
      requestId: req.id,
    });
  }
  
  next();
};

// Database query monitoring
export const dbQueryMonitor = (prisma: any) => {
  prisma.$on('query', (e: any) => {
    logger.debug('Database query executed', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    // Log slow queries
    if (e.duration > 1000) { // Queries taking more than 1 second
      logger.warn('Slow database query detected', {
        query: e.query,
        duration: `${e.duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  prisma.$on('error', (e: any) => {
    logger.error('Database error', {
      error: e.message,
      timestamp: new Date().toISOString(),
    });
  });
};

// Memory usage monitoring
export const memoryMonitor = () => {
  const memUsage = process.memoryUsage();
  
  logger.info('Memory usage', {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    timestamp: new Date().toISOString(),
  });
  
  // Alert if memory usage is high
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) { // Alert if heap usage exceeds 500MB
    logger.warn('High memory usage detected', {
      heapUsed: `${heapUsedMB}MB`,
      timestamp: new Date().toISOString(),
    });
  }
};

// Start memory monitoring
export const startMemoryMonitoring = () => {
  // Monitor memory every 5 minutes
  setInterval(memoryMonitor, 5 * 60 * 1000);
  
  // Initial memory check
  memoryMonitor();
};

// Health check with detailed metrics
export const healthCheck = (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(uptime)}s`,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    cpu: process.cpuUsage(),
    version: process.version,
    platform: process.platform,
    nodeEnv: process.env.NODE_ENV,
  };
  
  res.json(health);
};
