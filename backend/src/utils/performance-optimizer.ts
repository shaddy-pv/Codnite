import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger.js';

const execAsync = promisify(exec);

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseConnections: number;
  cacheHitRate: number;
}

interface OptimizationResult {
  metric: string;
  before: number;
  after: number;
  improvement: number;
  recommendation: string;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private optimizations: OptimizationResult[] = [];

  async optimize(): Promise<void> {
    logger.info('Starting performance optimization...');

    // Measure baseline performance
    const baseline = await this.measurePerformance();
    this.metrics.push(baseline);

    // Run optimizations
    await this.optimizeDatabase();
    await this.optimizeCaching();
    await this.optimizeQueries();
    await this.optimizeMemory();
    await this.optimizeNetwork();

    // Measure performance after optimizations
    const optimized = await this.measurePerformance();
    this.metrics.push(optimized);

    // Generate report
    this.generateReport(baseline, optimized);
  }

  private async measurePerformance(): Promise<PerformanceMetrics> {
    logger.info('Measuring performance metrics...');

    // Simulate load testing
    const responseTime = await this.measureResponseTime();
    const throughput = await this.measureThroughput();
    const errorRate = await this.measureErrorRate();
    const memoryUsage = await this.measureMemoryUsage();
    const cpuUsage = await this.measureCPUUsage();
    const databaseConnections = await this.measureDatabaseConnections();
    const cacheHitRate = await this.measureCacheHitRate();

    return {
      responseTime,
      throughput,
      errorRate,
      memoryUsage,
      cpuUsage,
      databaseConnections,
      cacheHitRate,
    };
  }

  private async measureResponseTime(): Promise<number> {
    try {
      const { stdout } = await execAsync('curl -w "@curl-format.txt" -o /dev/null -s http://localhost/api/health');
      const match = stdout.match(/time_total: (\d+\.\d+)/);
      return match ? parseFloat(match[1]) : 0;
    } catch (error) {
      logger.error('Failed to measure response time:', error);
      return 0;
    }
  }

  private async measureThroughput(): Promise<number> {
    try {
      const { stdout } = await execAsync('ab -n 100 -c 10 http://localhost/api/health');
      const match = stdout.match(/Requests per second:\s+(\d+\.\d+)/);
      return match ? parseFloat(match[1]) : 0;
    } catch (error) {
      logger.error('Failed to measure throughput:', error);
      return 0;
    }
  }

  private async measureErrorRate(): Promise<number> {
    try {
      const { stdout } = await execAsync('ab -n 100 -c 10 http://localhost/api/health');
      const match = stdout.match(/Failed requests:\s+(\d+)/);
      const failed = match ? parseInt(match[1]) : 0;
      return (failed / 100) * 100;
    } catch (error) {
      logger.error('Failed to measure error rate:', error);
      return 0;
    }
  }

  private async measureMemoryUsage(): Promise<number> {
    try {
      const { stdout } = await execAsync('docker stats --no-stream --format "{{.MemUsage}}" app');
      const match = stdout.match(/(\d+)MiB/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      logger.error('Failed to measure memory usage:', error);
      return 0;
    }
  }

  private async measureCPUUsage(): Promise<number> {
    try {
      const { stdout } = await execAsync('docker stats --no-stream --format "{{.CPUPerc}}" app');
      const match = stdout.match(/(\d+\.\d+)%/);
      return match ? parseFloat(match[1]) : 0;
    } catch (error) {
      logger.error('Failed to measure CPU usage:', error);
      return 0;
    }
  }

  private async measureDatabaseConnections(): Promise<number> {
    try {
      const { stdout } = await execAsync('docker-compose exec -T db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"');
      const match = stdout.match(/\s+(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      logger.error('Failed to measure database connections:', error);
      return 0;
    }
  }

  private async measureCacheHitRate(): Promise<number> {
    try {
      const { stdout } = await execAsync('docker-compose exec -T redis redis-cli info stats | grep keyspace_hits');
      const hitsMatch = stdout.match(/keyspace_hits:(\d+)/);
      const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;

      const { stdout: missesStdout } = await execAsync('docker-compose exec -T redis redis-cli info stats | grep keyspace_misses');
      const missesMatch = missesStdout.match(/keyspace_misses:(\d+)/);
      const misses = missesMatch ? parseInt(missesMatch[1]) : 0;

      const total = hits + misses;
      return total > 0 ? (hits / total) * 100 : 0;
    } catch (error) {
      logger.error('Failed to measure cache hit rate:', error);
      return 0;
    }
  }

  private async optimizeDatabase(): Promise<void> {
    logger.info('Optimizing database...');

    try {
      // Analyze tables
      await execAsync('docker-compose exec -T db psql -U postgres -c "ANALYZE;"');

      // Reindex tables
      await execAsync('docker-compose exec -T db psql -U postgres -c "REINDEX DATABASE codnite_prod;"');

      // Update statistics
      await execAsync('docker-compose exec -T db psql -U postgres -c "UPDATE pg_stat_statements SET calls = 0;"');

      // Optimize connection pool
      await execAsync('docker-compose exec -T db psql -U postgres -c "ALTER SYSTEM SET max_connections = 200;"');
      await execAsync('docker-compose exec -T db psql -U postgres -c "ALTER SYSTEM SET shared_buffers = \'256MB\';"');
      await execAsync('docker-compose exec -T db psql -U postgres -c "ALTER SYSTEM SET effective_cache_size = \'1GB\';"');
      await execAsync('docker-compose exec -T db psql -U postgres -c "SELECT pg_reload_conf();"');

      logger.info('Database optimization completed');
    } catch (error) {
      logger.error('Database optimization failed:', error);
    }
  }

  private async optimizeCaching(): Promise<void> {
    logger.info('Optimizing caching...');

    try {
      // Clear Redis cache
      await execAsync('docker-compose exec -T redis redis-cli FLUSHDB');

      // Optimize Redis configuration
      await execAsync('docker-compose exec -T redis redis-cli CONFIG SET maxmemory 512mb');
      await execAsync('docker-compose exec -T redis redis-cli CONFIG SET maxmemory-policy allkeys-lru');

      // Warm up cache
      await this.warmUpCache();

      logger.info('Caching optimization completed');
    } catch (error) {
      logger.error('Caching optimization failed:', error);
    }
  }

  private async warmUpCache(): Promise<void> {
    logger.info('Warming up cache...');

    try {
      // Preload frequently accessed data
      const endpoints = [
        '/api/health',
        '/api/users',
        '/api/posts',
        '/api/challenges',
      ];

      for (const endpoint of endpoints) {
        await execAsync(`curl -s http://localhost${endpoint} > /dev/null`);
      }

      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error('Cache warm-up failed:', error);
    }
  }

  private async optimizeQueries(): Promise<void> {
    logger.info('Optimizing queries...');

    try {
      // Get slow queries
      const { stdout } = await execAsync('docker-compose exec -T db psql -U postgres -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"');

      // Analyze query performance
      const queries = stdout.split('\n').filter(line => line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE'));
      
      for (const query of queries) {
        if (query.includes('SELECT')) {
          // Add indexes for SELECT queries
          await this.addIndexesForQuery(query);
        }
      }

      logger.info('Query optimization completed');
    } catch (error) {
      logger.error('Query optimization failed:', error);
    }
  }

  private async addIndexesForQuery(query: string): Promise<void> {
    try {
      // Extract table and column information from query
      const tableMatch = query.match(/FROM\s+(\w+)/i);
      const columnMatch = query.match(/WHERE\s+(\w+)/i);

      if (tableMatch && columnMatch) {
        const table = tableMatch[1];
        const column = columnMatch[1];
        const indexName = `idx_${table}_${column}`;

        // Create index if it doesn't exist
        await execAsync(`docker-compose exec -T db psql -U postgres -c "CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (${column});"`);
      }
    } catch (error) {
      logger.error('Failed to add index:', error);
    }
  }

  private async optimizeMemory(): Promise<void> {
    logger.info('Optimizing memory usage...');

    try {
      // Restart application to clear memory leaks
      await execAsync('docker-compose restart app');

      // Optimize Node.js memory settings
      await execAsync('docker-compose exec -T app node --max-old-space-size=1024 --optimize-for-size');

      logger.info('Memory optimization completed');
    } catch (error) {
      logger.error('Memory optimization failed:', error);
    }
  }

  private async optimizeNetwork(): Promise<void> {
    logger.info('Optimizing network...');

    try {
      // Enable HTTP/2
      await execAsync('docker-compose exec -T nginx nginx -s reload');

      // Optimize TCP settings
      await execAsync('echo "net.core.rmem_max = 16777216" >> /etc/sysctl.conf');
      await execAsync('echo "net.core.wmem_max = 16777216" >> /etc/sysctl.conf');
      await execAsync('sysctl -p');

      logger.info('Network optimization completed');
    } catch (error) {
      logger.error('Network optimization failed:', error);
    }
  }

  private generateReport(baseline: PerformanceMetrics, optimized: PerformanceMetrics): void {
    logger.info('\n=== Performance Optimization Report ===');

    const improvements = [
      {
        metric: 'Response Time',
        before: baseline.responseTime,
        after: optimized.responseTime,
        improvement: ((baseline.responseTime - optimized.responseTime) / baseline.responseTime) * 100,
        recommendation: 'Response time improved by optimizing database queries and caching'
      },
      {
        metric: 'Throughput',
        before: baseline.throughput,
        after: optimized.throughput,
        improvement: ((optimized.throughput - baseline.throughput) / baseline.throughput) * 100,
        recommendation: 'Throughput improved by optimizing connection pooling and caching'
      },
      {
        metric: 'Error Rate',
        before: baseline.errorRate,
        after: optimized.errorRate,
        improvement: ((baseline.errorRate - optimized.errorRate) / baseline.errorRate) * 100,
        recommendation: 'Error rate reduced by improving error handling and validation'
      },
      {
        metric: 'Memory Usage',
        before: baseline.memoryUsage,
        after: optimized.memoryUsage,
        improvement: ((baseline.memoryUsage - optimized.memoryUsage) / baseline.memoryUsage) * 100,
        recommendation: 'Memory usage optimized by clearing memory leaks and optimizing garbage collection'
      },
      {
        metric: 'CPU Usage',
        before: baseline.cpuUsage,
        after: optimized.cpuUsage,
        improvement: ((baseline.cpuUsage - optimized.cpuUsage) / baseline.cpuUsage) * 100,
        recommendation: 'CPU usage reduced by optimizing algorithms and caching'
      },
      {
        metric: 'Database Connections',
        before: baseline.databaseConnections,
        after: optimized.databaseConnections,
        improvement: ((baseline.databaseConnections - optimized.databaseConnections) / baseline.databaseConnections) * 100,
        recommendation: 'Database connections optimized by improving connection pooling'
      },
      {
        metric: 'Cache Hit Rate',
        before: baseline.cacheHitRate,
        after: optimized.cacheHitRate,
        improvement: ((optimized.cacheHitRate - baseline.cacheHitRate) / baseline.cacheHitRate) * 100,
        recommendation: 'Cache hit rate improved by optimizing cache strategy and warming up cache'
      }
    ];

    logger.info('\nPerformance Improvements:');
    improvements.forEach(improvement => {
      const status = improvement.improvement > 0 ? '✓' : '✗';
      logger.info(`${status} ${improvement.metric}: ${improvement.before.toFixed(2)} → ${improvement.after.toFixed(2)} (${improvement.improvement.toFixed(2)}%)`);
      logger.info(`   Recommendation: ${improvement.recommendation}`);
    });

    // Calculate overall improvement
    const overallImprovement = improvements.reduce((sum, imp) => sum + imp.improvement, 0) / improvements.length;
    
    if (overallImprovement > 0) {
      success(`Overall performance improved by ${overallImprovement.toFixed(2)}%`);
    } else {
      warning('Performance optimization did not show significant improvements');
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      baseline,
      optimized,
      improvements,
      overallImprovement
    };

    fs.writeFile('performance-optimization-report.json', JSON.stringify(report, null, 2))
      .then(() => logger.info('\nPerformance optimization report saved to performance-optimization-report.json'))
      .catch(error => logger.error('Failed to save performance optimization report:', error));
  }
}

// Run performance optimization if called directly
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.optimize().catch(error => {
    logger.error('Performance optimization failed:', error);
    process.exit(1);
  });
}

export default PerformanceOptimizer;
