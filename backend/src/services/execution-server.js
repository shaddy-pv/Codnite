import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import CodeExecutionService from './CodeExecutionService';
import logger from './utils/logger';

const app = express();
const executionService = new CodeExecutionService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (req, res) => {
  try {
    const isHealthy = await executionService.healthCheck();
    res.json({ 
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'code-execution',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      service: 'code-execution',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Execute code endpoint
app.post('/execute', async (req, res) => {
  try {
    const { code, language, testCases, timeLimit, memoryLimit } = req.body;

    if (!code || !language || !testCases) {
      return res.status(400).json({ 
        error: 'Missing required fields: code, language, testCases' 
      });
    }

    const results = await executionService.executeCode({
      code,
      language,
      testCases,
      timeLimit: timeLimit || 5,
      memoryLimit: memoryLimit || 64
    });

    res.json({ results });
  } catch (error) {
    logger.error('Execution error:', error);
    res.status(500).json({ 
      error: 'Failed to execute code',
      details: error.message 
    });
  }
});

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Code execution service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
