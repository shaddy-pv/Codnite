import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import usersRoutes from './routes/users.routes';
import postRoutes from './routes/post.routes';
import challengeRoutes from './routes/challenge.routes';
import problemRoutes from './routes/problem.routes';
import followRoutes from './routes/follow.routes';
import notificationRoutes from './routes/notification.routes';
import collegeRoutes from './routes/college.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import chatRoutes from './routes/chat.routes';
import searchRoutes from './routes/search.routes';
import recommendationRoutes from './routes/recommendations.routes';
import executionRoutes from './routes/execution.routes';
import commentsRoutes from './routes/comments.routes';
import socialRoutes from './routes/social.routes';
import optimizedRoutes from './routes/optimized.routes';
import databaseViewerRoutes from './routes/database-viewer.routes';
import { NotificationService } from './services/notification.service';
import testNotificationRoutes from './routes/test-notifications.routes';
import levelRoutes from './routes/level.routes';
import uploadRoutes from './routes/upload.routes';
import config from './config/env';

// Import utilities
import logger, { morganStream } from './utils/logger';
import { testConnection, closePool, query } from './utils/database';
// import { initializeDatabase } from './utils/schema'; // Removed - not used
import MigrationRunner from './utils/migrate';
import cacheService from './services/cache.service';
import dbOptimizer from './services/database-optimizer.service';
import cdnService from './services/cdn.service';
import { 
  performanceMonitor, 
  errorTracker, 
  securityMonitor, 
  rateLimitMonitor,
  startMemoryMonitoring
} from './middleware/monitoring';
import { 
  healthCheck as enhancedHealthCheck,
  livenessProbe,
  readinessProbe,
  metrics
} from './utils/health-checks';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Create notification service instance
const notificationService = new NotificationService(io);

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

// Logging middleware with Winston integration
if (config.nodeEnv === 'development') {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Monitoring middleware
app.use(performanceMonitor);
app.use(securityMonitor);
app.use(rateLimitMonitor);

// Rate limiting with enhanced configuration - DISABLED FOR DEVELOPMENT
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 1000, // Increased limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and development
    return req.path === '/api/health' || config.nodeEnv === 'development';
  },
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 1000, // Increased limit for development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return config.nodeEnv === 'development';
  },
});

// Only apply rate limiting in production
if (config.nodeEnv === 'production') {
  app.use(limiter);
}

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// CORS configuration with enhanced security
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS origin check:', origin);
    console.log('Allowed origins:', config.corsOrigins);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      console.log('No origin provided, allowing request');
      return callback(null, true);
    }
    
    // In development, be more permissive
    if (config.nodeEnv === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
        console.log('Development origin allowed:', origin);
        return callback(null, true);
      }
    }
    
    if (config.corsOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
}));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000,
}));

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Mock responses removed - using proper route handlers

// Routes
if (config.nodeEnv === 'production') {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}
app.use('/api/users', usersRoutes);
app.use('/api/user', userRoutes);
app.use('/api/posts', postRoutes(notificationService));
app.use('/api/challenges', challengeRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/follows', followRoutes(notificationService));
app.use('/api/notifications', notificationRoutes(notificationService));
app.use('/api/colleges', collegeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api', commentsRoutes(notificationService));
app.use('/api/optimized', optimizedRoutes);
app.use('/api/db', databaseViewerRoutes);
app.use('/api/test-notifications', testNotificationRoutes(notificationService));
app.use('/api/upload', uploadRoutes);
app.use('/api/level', levelRoutes);

// Enhanced health check with detailed information
app.get('/api/health', enhancedHealthCheck);

// Kubernetes-compatible health check endpoints
app.get('/health', enhancedHealthCheck);
app.get('/health/live', livenessProbe);
app.get('/health/ready', readinessProbe);

// Metrics endpoint for monitoring
app.get('/api/metrics', metrics);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
  });
  
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Enhanced error handling middleware
app.use(errorTracker);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth['token'];
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const userId = decoded.userId;

    // Verify user exists
    const result = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    (socket as any).userId = userId;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket: any) => {
  logger.info('User connected', { 
    socketId: socket.id, 
    userId: socket.userId 
  });
  
  // Join user-specific room for notifications
  const userRoom = `user_${socket.userId}`;
  socket.join(userRoom);
  logger.info('User joined notification room', { 
    socketId: socket.id, 
    userId: socket.userId,
    room: userRoom 
  });
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    logger.info('User joined room', { 
      socketId: socket.id, 
      userId: socket.userId,
      roomId 
    });
    socket.emit('joined_room', { roomId });
  });
  
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    logger.info('User left room', { 
      socketId: socket.id, 
      userId: socket.userId,
      roomId 
    });
    socket.emit('left_room', { roomId });
  });

  // Handle notification preferences
  socket.on('update_notification_preferences', async (preferences) => {
    try {
      await query(
        'UPDATE users SET notification_preferences = $1 WHERE id = $2',
        [JSON.stringify(preferences), socket.userId]
      );
      logger.info('Updated notification preferences', { 
        userId: socket.userId,
        preferences 
      });
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
    }
  });
  
  socket.on('disconnect', () => {
    logger.info('User disconnected', { 
      socketId: socket.id, 
      userId: socket.userId 
    });
  });
});

// Initialize monitoring
startMemoryMonitoring();

// Graceful shutdown with cleanup
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      await closePool();
      logger.info('Database connection closed.');
      
      await cacheService.disconnect();
      logger.info('Cache service disconnected.');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async () => {
  try {
    // Test database connection and initialize schema
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    logger.info('Database connected successfully');
    
    // Initialize database schema using migrations
    const migrationRunner = MigrationRunner.getInstance();
    try {
      await migrationRunner.ensureMigrationsTable();
      await migrationRunner.migrateUp();
      logger.info('Database migrations completed successfully');
    } catch (migrationError) {
      logger.warn('Migration failed, but continuing with existing database:', migrationError.message);
      // Continue startup even if migrations fail - database might already be set up
    }
    
    // Initialize services
    await cacheService.connect();
    await dbOptimizer.optimizeConnections();
    
    // Health check for services
    const cacheHealth = await cacheService.healthCheck();
    const cdnHealth = await cdnService.healthCheck();
    
    logger.info('Services initialized', {
      cache: cacheHealth ? 'connected' : 'disconnected',
      cdn: cdnHealth ? 'connected' : 'disconnected'
    });
    
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
        healthCheck: `http://localhost:${config.port}/api/health`,
        metrics: `http://localhost:${config.port}/api/metrics`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };