import dotenv from 'dotenv';

dotenv.config();

// Environment variable validation
const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};

// Check for missing required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  );
}

// Validate JWT secret strength in production
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET!.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production');
}

// Validate database URL format
const dbUrlPattern = /^postgresql:\/\/.+/;
if (!dbUrlPattern.test(process.env.DATABASE_URL!)) {
  throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
}

// Validate port number
const port = parseInt(process.env.PORT || '5000', 10);
if (isNaN(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number (1-65535)');
}

// Validate rate limiting values
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10);
const authRateLimitMaxRequests = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '100', 10);

if (isNaN(rateLimitWindowMs) || rateLimitWindowMs < 1000) {
  throw new Error('RATE_LIMIT_WINDOW_MS must be at least 1000ms');
}

if (isNaN(rateLimitMaxRequests) || rateLimitMaxRequests < 1) {
  throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1');
}

if (isNaN(authRateLimitMaxRequests) || authRateLimitMaxRequests < 1) {
  throw new Error('AUTH_RATE_LIMIT_MAX_REQUESTS must be at least 1');
}

// Validate bcrypt rounds
const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
if (isNaN(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
  throw new Error('BCRYPT_ROUNDS must be between 10 and 15');
}

// Validate file upload size
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
if (isNaN(maxFileSize) || maxFileSize < 1024) {
  throw new Error('MAX_FILE_SIZE must be at least 1024 bytes');
}

// Validate cache TTL
const cacheTtl = parseInt(process.env.CACHE_TTL || '3600', 10);
if (isNaN(cacheTtl) || cacheTtl < 60) {
  throw new Error('CACHE_TTL must be at least 60 seconds');
}

// Validate max connections
const maxConnections = parseInt(process.env.MAX_CONNECTIONS || '100', 10);
if (isNaN(maxConnections) || maxConnections < 1 || maxConnections > 1000) {
  throw new Error('MAX_CONNECTIONS must be between 1 and 1000');
}

// Log configuration validation
console.log('Environment configuration validated successfully');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);
console.log(`Database: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')}`);
console.log(`Rate limiting: ${rateLimitMaxRequests} requests per ${rateLimitWindowMs}ms`);
console.log(`Auth rate limiting: ${authRateLimitMaxRequests} requests per ${rateLimitWindowMs}ms`);
console.log(`Bcrypt rounds: ${bcryptRounds}`);
console.log(`Max file size: ${maxFileSize} bytes`);
console.log(`Cache TTL: ${cacheTtl} seconds`);
console.log(`Max connections: ${maxConnections}`);

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS?.split(',') || [process.env.FRONTEND_URL!])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:4173'],
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: rateLimitWindowMs,
    maxRequests: rateLimitMaxRequests,
    authMaxRequests: authRateLimitMaxRequests,
  },
  
  // Security configuration
  security: {
    bcryptRounds,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET!,
  },
  
  // Monitoring configuration
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    newRelicKey: process.env.NEW_RELIC_LICENSE_KEY,
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  
  // Email configuration
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL || 'noreply@codnite.com',
  },
  
  // File upload configuration
  upload: {
    maxFileSize,
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ],
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.AWS_S3_BUCKET,
    },
  },
  
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  // CDN configuration
  cdn: {
    provider: process.env.CDN_PROVIDER || 'local',
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || '',
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
  },
  
  // SSL configuration
  ssl: {
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },
  
  // Performance configuration
  performance: {
    enableCaching: process.env.ENABLE_CACHING === 'true',
    cacheTtl,
    maxConnections,
  },
  
  // Backup configuration
  backup: {
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  },
};

export default config;
