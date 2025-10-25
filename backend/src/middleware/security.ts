import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import logger from '../utils/logger.js';
import config from '../config/env.js';

// Enhanced security middleware for production
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.codnite.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.codnite.com", "wss://api.codnite.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginResourcePolicy: {
    policy: "cross-origin"
  },
  crossOriginOpenerPolicy: {
    policy: "same-origin"
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
    ambientLightSensor: [],
    autoplay: [],
    battery: [],
    displayCapture: [],
    documentDomain: [],
    encryptedMedia: [],
    executionWhileNotRendered: [],
    executionWhileOutOfViewport: [],
    fullscreen: [],
    pictureInPicture: [],
    publickeyCredentialsGet: [],
    screenWakeLock: [],
    syncXhr: [],
    webShare: [],
    xrSpatialTracking: []
  }
});

// Rate limiting per user (not just per IP)
export const createUserRateLimit = (windowMs: number, maxRequests: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/health';
    },
  });
};

// Enhanced rate limiting for authentication endpoints
export const authRateLimit = createUserRateLimit(
  config.rateLimit.windowMs,
  config.rateLimit.authMaxRequests
);

// General rate limiting
export const generalRateLimit = createUserRateLimit(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests
);

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// SQL injection prevention middleware
export const sqlInjectionPrevention = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/i,
    /(\bUNION\s+SELECT\b)/i,
    /(\bDROP\s+TABLE\b)/i,
    /(\bDELETE\s+FROM\b)/i,
    /(\bINSERT\s+INTO\b)/i,
    /(\bUPDATE\s+SET\b)/i,
    /(\bALTER\s+TABLE\b)/i,
    /(\bCREATE\s+TABLE\b)/i,
    /(\bEXEC\s*\()/i,
    /(\bSCRIPT\b)/i,
  ];

  const checkForSqlInjection = (input: any): boolean => {
    if (typeof input === 'string') {
      return sqlPatterns.some(pattern => pattern.test(input));
    }
    if (Array.isArray(input)) {
      return input.some(checkForSqlInjection);
    }
    if (input && typeof input === 'object') {
      return Object.values(input).some(checkForSqlInjection);
    }
    return false;
  };

  const hasSqlInjection = 
    checkForSqlInjection(req.body) ||
    checkForSqlInjection(req.query) ||
    checkForSqlInjection(req.params);

  if (hasSqlInjection) {
    logger.warn('SQL injection attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return res.status(400).json({
      error: 'Invalid input detected',
    });
  }

  next();
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  ];

  const checkForXSS = (input: any): boolean => {
    if (typeof input === 'string') {
      return xssPatterns.some(pattern => pattern.test(input));
    }
    if (Array.isArray(input)) {
      return input.some(checkForXSS);
    }
    if (input && typeof input === 'object') {
      return Object.values(input).some(checkForXSS);
    }
    return false;
  };

  const hasXSS = 
    checkForXSS(req.body) ||
    checkForXSS(req.query) ||
    checkForXSS(req.params);

  if (hasXSS) {
    logger.warn('XSS attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return res.status(400).json({
      error: 'Invalid input detected',
    });
  }

  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and health checks
  if (req.method === 'GET' || req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  // Skip CSRF for API endpoints that don't modify state
  if (req.path.startsWith('/api/') && ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check for CSRF token
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
    });
    return res.status(403).json({
      error: 'CSRF token validation failed',
    });
  }

  next();
};

// Request size limiting middleware
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = config.upload.maxFileSize;
  const contentLength = parseInt(req.get('content-length') || '0', 10);

  if (contentLength > maxSize) {
    logger.warn('Request size limit exceeded', {
      ip: req.ip,
      contentLength,
      maxSize,
      path: req.path,
    });
    return res.status(413).json({
      error: 'Request entity too large',
      maxSize,
    });
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Add CSP header
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );

  next();
};

// Request logging middleware
export const requestLogging = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP request', logData);
    } else {
      logger.info('HTTP request', logData);
    }
  });

  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.url,
    userId: req.user?.id,
  });

  // Don't leak error details in production
  if (config.nodeEnv === 'production') {
    res.status(500).json({
      error: 'Internal server error',
    });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
};

export default {
  securityMiddleware,
  authRateLimit,
  generalRateLimit,
  sanitizeInput,
  sqlInjectionPrevention,
  xssProtection,
  csrfProtection,
  requestSizeLimit,
  securityHeaders,
  requestLogging,
  errorHandler,
  notFoundHandler,
};
