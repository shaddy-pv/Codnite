import { Router, Request, Response } from 'express';
import { healthCheck } from '../utils/monitoring';
import logger from '../utils/logger';

const router = Router();

// Basic health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const checks = await Promise.allSettled([
      healthCheck.checkDatabase(),
      healthCheck.checkRedis(),
      healthCheck.checkMemory(),
      healthCheck.checkDiskSpace()
    ]);

    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy', error: checks[0].reason },
        redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy', error: checks[1].reason },
        memory: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'unhealthy', error: checks[2].reason },
        disk: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'unhealthy', error: checks[3].reason }
      }
    };

    // Determine overall status
    const hasUnhealthy = Object.values(results.checks).some((check: any) => check.status === 'unhealthy');
    const hasWarning = Object.values(results.checks).some((check: any) => check.status === 'warning');
    
    if (hasUnhealthy) {
      results.status = 'unhealthy';
      res.status(503);
    } else if (hasWarning) {
      results.status = 'warning';
      res.status(200);
    }

    res.json(results);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const [systemInfo, checks] = await Promise.all([
      healthCheck.getSystemInfo(),
      Promise.allSettled([
        healthCheck.checkDatabase(),
        healthCheck.checkRedis(),
        healthCheck.checkMemory(),
        healthCheck.checkDiskSpace()
      ])
    ]);

    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      system: systemInfo,
      checks: {
        database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy', error: checks[0].reason },
        redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy', error: checks[1].reason },
        memory: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'unhealthy', error: checks[2].reason },
        disk: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'unhealthy', error: checks[3].reason }
      }
    };

    // Determine overall status
    const hasUnhealthy = Object.values(results.checks).some((check: any) => check.status === 'unhealthy');
    const hasWarning = Object.values(results.checks).some((check: any) => check.status === 'warning');
    
    if (hasUnhealthy) {
      results.status = 'unhealthy';
      res.status(503);
    } else if (hasWarning) {
      results.status = 'warning';
      res.status(200);
    }

    res.json(results);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

// Readiness check (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const checks = await Promise.allSettled([
      healthCheck.checkDatabase(),
      healthCheck.checkRedis()
    ]);

    const isReady = checks.every(check => 
      check.status === 'fulfilled' && check.value.status === 'healthy'
    );

    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({ status: 'not ready' });
  }
});

// Liveness check (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (for Prometheus)
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const systemInfo = await healthCheck.getSystemInfo();
    const memUsage = process.memoryUsage();
    
    const metrics = `
# HELP node_memory_heap_used_bytes Memory usage of the V8 heap
# TYPE node_memory_heap_used_bytes gauge
node_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP node_memory_heap_total_bytes Total memory of the V8 heap
# TYPE node_memory_heap_total_bytes gauge
node_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP node_memory_external_bytes Memory usage of C++ objects bound to JavaScript objects
# TYPE node_memory_external_bytes gauge
node_memory_external_bytes ${memUsage.external}

# HELP node_memory_rss_bytes Resident Set Size
# TYPE node_memory_rss_bytes gauge
node_memory_rss_bytes ${memUsage.rss}

# HELP node_process_uptime_seconds Process uptime in seconds
# TYPE node_process_uptime_seconds gauge
node_process_uptime_seconds ${process.uptime()}

# HELP node_cpu_count Number of CPU cores
# TYPE node_cpu_count gauge
node_cpu_count ${systemInfo.cpuCount}

# HELP node_load_average_1m 1-minute load average
# TYPE node_load_average_1m gauge
node_load_average_1m ${systemInfo.loadAverage[0]}

# HELP node_load_average_5m 5-minute load average
# TYPE node_load_average_5m gauge
node_load_average_5m ${systemInfo.loadAverage[1]}

# HELP node_load_average_15m 15-minute load average
# TYPE node_load_average_15m gauge
node_load_average_15m ${systemInfo.loadAverage[2]}
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed:', error);
    res.status(500).json({ error: 'Metrics collection failed' });
  }
});

export default router;
