import { Pool } from 'pg';
import config from '../config/env.js';
import logger from './logger.js';

/**
 * Database Optimizer
 * 
 * This script optimizes the PostgreSQL database by:
 * - Analyzing tables and updating statistics
 * - Reindexing tables for better performance
 * - Identifying and optimizing slow queries
 * - Cleaning up unused data
 * - Optimizing connection pool settings
 */

interface OptimizationResult {
  operation: string;
  duration: number;
  success: boolean;
  details?: string;
  recommendations?: string[];
}

interface QueryAnalysis {
  query: string;
  meanTime: number;
  calls: number;
  totalTime: number;
  rows: number;
  sharedBlksHit: number;
  sharedBlksRead: number;
}

interface TableStats {
  tableName: string;
  rowCount: number;
  totalSize: number;
  indexSize: number;
  tableSize: number;
  lastAnalyzed: Date;
}

class DatabaseOptimizer {
  private pool: Pool;
  private results: OptimizationResult[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async optimize(): Promise<void> {
    logger.info('🚀 Starting database optimization...');

    try {
      // Check database connection
      await this.checkConnection();

      // Analyze tables
      await this.analyzeTables();

      // Update statistics
      await this.updateStatistics();

      // Reindex tables
      await this.reindexTables();

      // Analyze slow queries
      await this.analyzeSlowQueries();

      // Optimize connection pool
      await this.optimizeConnectionPool();

      // Clean up unused data
      await this.cleanupUnusedData();

      // Generate report
      this.generateReport();

      logger.info('✅ Database optimization completed successfully!');

    } catch (error) {
      logger.error('❌ Database optimization failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async checkConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.pool.query('SELECT 1');
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Connection Check',
        duration,
        success: true,
        details: 'Database connection successful',
      });
      
      logger.info('✅ Database connection verified');
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Connection Check',
        duration,
        success: false,
        details: `Connection failed: ${error}`,
      });
      
      throw error;
    }
  }

  private async analyzeTables(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get list of tables
      const tablesResult = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      
      // Analyze each table
      for (const table of tables) {
        await this.pool.query(`ANALYZE ${table}`);
        logger.info(`📊 Analyzed table: ${table}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Table Analysis',
        duration,
        success: true,
        details: `Analyzed ${tables.length} tables`,
        recommendations: [
          'Run ANALYZE regularly to keep statistics up to date',
          'Consider running VACUUM ANALYZE for better performance',
        ],
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Table Analysis',
        duration,
        success: false,
        details: `Analysis failed: ${error}`,
      });
      
      throw error;
    }
  }

  private async updateStatistics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update pg_stat_statements
      await this.pool.query('SELECT pg_stat_statements_reset()');
      
      // Update database statistics
      await this.pool.query('ANALYZE');
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Statistics Update',
        duration,
        success: true,
        details: 'Database statistics updated',
        recommendations: [
          'Monitor pg_stat_statements for query performance',
          'Regular statistics updates improve query planning',
        ],
      });
      
      logger.info('📈 Database statistics updated');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Statistics Update',
        duration,
        success: false,
        details: `Statistics update failed: ${error}`,
      });
      
      throw error;
    }
  }

  private async reindexTables(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Reindex all tables
      await this.pool.query('REINDEX DATABASE codnite_prod');
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Table Reindexing',
        duration,
        success: true,
        details: 'All tables reindexed successfully',
        recommendations: [
          'Reindex tables after bulk data changes',
          'Monitor index usage with pg_stat_user_indexes',
        ],
      });
      
      logger.info('🔍 Tables reindexed successfully');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Table Reindexing',
        duration,
        success: false,
        details: `Reindexing failed: ${error}`,
      });
      
      throw error;
    }
  }

  private async analyzeSlowQueries(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get slow queries from pg_stat_statements
      const slowQueriesResult = await this.pool.query(`
        SELECT 
          query,
          mean_time,
          calls,
          total_time,
          rows,
          shared_blks_hit,
          shared_blks_read
        FROM pg_stat_statements 
        WHERE mean_time > 1000
        ORDER BY mean_time DESC 
        LIMIT 10
      `);
      
      const slowQueries: QueryAnalysis[] = slowQueriesResult.rows.map(row => ({
        query: row.query,
        meanTime: parseFloat(row.mean_time),
        calls: parseInt(row.calls),
        totalTime: parseFloat(row.total_time),
        rows: parseInt(row.rows),
        sharedBlksHit: parseInt(row.shared_blks_hit),
        sharedBlksRead: parseInt(row.shared_blks_read),
      }));
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Slow Query Analysis',
        duration,
        success: true,
        details: `Found ${slowQueries.length} slow queries`,
        recommendations: [
          'Review slow queries and optimize them',
          'Consider adding indexes for frequently queried columns',
          'Use EXPLAIN ANALYZE to understand query execution plans',
        ],
      });
      
      logger.info(`🐌 Found ${slowQueries.length} slow queries`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Slow Query Analysis',
        duration,
        success: false,
        details: `Slow query analysis failed: ${error}`,
      });
      
      throw error;
    }
  }

  private async optimizeConnectionPool(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check current connection settings
      const settingsResult = await this.pool.query(`
        SELECT name, setting, unit, context 
        FROM pg_settings 
        WHERE name IN (
          'max_connections',
          'shared_buffers',
          'effective_cache_size',
          'work_mem',
          'maintenance_work_mem'
        )
      `);
      
      const settings = settingsResult.rows;
      
      // Optimize connection settings
      const optimizations = [
        'ALTER SYSTEM SET shared_buffers = \'256MB\'',
        'ALTER SYSTEM SET effective_cache_size = \'1GB\'',
        'ALTER SYSTEM SET work_mem = \'4MB\'',
        'ALTER SYSTEM SET maintenance_work_mem = \'64MB\'',
        'ALTER SYSTEM SET random_page_cost = 1.1',
        'ALTER SYSTEM SET effective_io_concurrency = 200',
      ];
      
      for (const optimization of optimizations) {
        await this.pool.query(optimization);
      }
      
      // Reload configuration
      await this.pool.query('SELECT pg_reload_conf()');
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Connection Pool Optimization',
        duration,
        success: true,
        details: 'Connection pool settings optimized',
        recommendations: [
          'Monitor connection usage with pg_stat_activity',
          'Adjust settings based on actual workload',
          'Consider connection pooling for high-traffic applications',
        ],
      });
      
      logger.info('🔧 Connection pool optimized');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Connection Pool Optimization',
        duration,
        success: false,
        details: `Connection pool optimization failed: ${error}`,
      });
      
      throw error;
    }
  }

  private async cleanupUnusedData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Vacuum and analyze database
      await this.pool.query('VACUUM ANALYZE');
      
      // Clean up old logs (if any)
      await this.pool.query(`
        DELETE FROM logs 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Data Cleanup',
        duration,
        success: true,
        details: 'Unused data cleaned up',
        recommendations: [
          'Run VACUUM regularly to reclaim disk space',
          'Consider partitioning large tables',
          'Implement data retention policies',
        ],
      });
      
      logger.info('🧹 Data cleanup completed');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation: 'Data Cleanup',
        duration,
        success: false,
        details: `Data cleanup failed: ${error}`,
      });
      
      throw error;
    }
  }

  private generateReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: this.results.length,
        successfulOperations: this.results.filter(r => r.success).length,
        failedOperations: this.results.filter(r => !r.success).length,
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      },
      operations: this.results,
      recommendations: this.getOverallRecommendations(),
    };

    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, 'database-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    this.generateMarkdownReport(report);
  }

  private getOverallRecommendations(): string[] {
    const recommendations: string[] = [
      'Run database optimization regularly (weekly)',
      'Monitor query performance with pg_stat_statements',
      'Set up automated VACUUM and ANALYZE jobs',
      'Consider read replicas for read-heavy workloads',
      'Implement connection pooling for better resource utilization',
      'Monitor disk space and plan for growth',
      'Regular backup and recovery testing',
      'Performance testing after schema changes',
    ];

    return recommendations;
  }

  private generateMarkdownReport(report: any): void {
    const markdown = `# Database Optimization Report

Generated on: ${report.timestamp}

## Summary

- **Total Operations**: ${report.summary.totalOperations}
- **Successful Operations**: ${report.summary.successfulOperations}
- **Failed Operations**: ${report.summary.failedOperations}
- **Total Duration**: ${report.summary.totalDuration}ms

## Operations

| Operation | Duration | Status | Details |
|-----------|----------|--------|---------|
${report.operations.map((op: OptimizationResult) => 
  `| ${op.operation} | ${op.duration}ms | ${op.success ? '✅' : '❌'} | ${op.details || 'N/A'} |`
).join('\n')}

## Recommendations

${report.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Next Steps

1. Review the optimization results
2. Implement recommended improvements
3. Set up regular optimization schedules
4. Monitor database performance
5. Plan for future scaling needs

---

*This report was generated automatically by the database optimizer.*
`;

    const fs = require('fs');
    const path = require('path');
    
    const markdownPath = path.join(__dirname, 'database-optimization-report.md');
    fs.writeFileSync(markdownPath, markdown);
  }
}

// Run database optimization if called directly
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  optimizer.optimize().catch(error => {
    logger.error('Database optimization failed:', error);
    process.exit(1);
  });
}

export default DatabaseOptimizer;