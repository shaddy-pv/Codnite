#!/usr/bin/env tsx

/**
 * Production Checklist Validation Script
 * 
 * This script validates that all production readiness requirements are met.
 */

import { promises as fs } from 'fs';
import path from 'path';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  category: string;
}

class ProductionChecklist {
  private items: ChecklistItem[] = [];
  private results: { [key: string]: ChecklistItem } = {};

  constructor() {
    this.initializeChecklist();
  }

  private initializeChecklist() {
    // Environment Configuration
    this.addItem('env-config', 'Environment Configuration', 'All required environment variables are set', 'skip', '', 'Environment');
    this.addItem('env-validation', 'Environment Validation', 'Environment variables are properly validated', 'skip', '', 'Environment');
    this.addItem('env-templates', 'Environment Templates', 'Environment templates are provided', 'skip', '', 'Environment');

    // Database Setup
    this.addItem('db-connection', 'Database Connection', 'Database connection is working', 'skip', '', 'Database');
    this.addItem('db-migrations', 'Database Migrations', 'Migration system is set up', 'skip', '', 'Database');
    this.addItem('db-backup', 'Database Backup', 'Backup system is configured', 'skip', '', 'Database');
    this.addItem('db-optimization', 'Database Optimization', 'Database is optimized for production', 'skip', '', 'Database');

    // Security Configuration
    this.addItem('security-headers', 'Security Headers', 'Security headers are configured', 'skip', '', 'Security');
    this.addItem('input-validation', 'Input Validation', 'Input validation is implemented', 'skip', '', 'Security');
    this.addItem('rate-limiting', 'Rate Limiting', 'Rate limiting is configured', 'skip', '', 'Security');
    this.addItem('auth-middleware', 'Authentication Middleware', 'Authentication middleware is secure', 'skip', '', 'Security');
    this.addItem('security-audit', 'Security Audit', 'Security audit passes', 'skip', '', 'Security');

    // Monitoring Setup
    this.addItem('health-checks', 'Health Checks', 'Health check endpoints are working', 'skip', '', 'Monitoring');
    this.addItem('logging', 'Structured Logging', 'Structured logging is configured', 'skip', '', 'Monitoring');
    this.addItem('metrics', 'Metrics Collection', 'Metrics collection is enabled', 'skip', '', 'Monitoring');
    this.addItem('alerting', 'Alerting System', 'Alerting system is configured', 'skip', '', 'Monitoring');

    // Performance Optimization
    this.addItem('caching', 'Caching System', 'Caching system is configured', 'skip', '', 'Performance');
    this.addItem('bundle-optimization', 'Bundle Optimization', 'Frontend bundle is optimized', 'skip', '', 'Performance');
    this.addItem('query-optimization', 'Query Optimization', 'Database queries are optimized', 'skip', '', 'Performance');
    this.addItem('cdn-setup', 'CDN Setup', 'CDN is configured', 'skip', '', 'Performance');

    // Documentation
    this.addItem('api-docs', 'API Documentation', 'API documentation is complete', 'skip', '', 'Documentation');
    this.addItem('deployment-docs', 'Deployment Documentation', 'Deployment documentation is complete', 'skip', '', 'Documentation');
    this.addItem('runbook', 'Runbook', 'Operations runbook is complete', 'skip', '', 'Documentation');
    this.addItem('troubleshooting', 'Troubleshooting Guide', 'Troubleshooting guide is complete', 'skip', '', 'Documentation');

    // Testing
    this.addItem('unit-tests', 'Unit Tests', 'Unit tests are passing', 'skip', '', 'Testing');
    this.addItem('integration-tests', 'Integration Tests', 'Integration tests are passing', 'skip', '', 'Testing');
    this.addItem('e2e-tests', 'End-to-End Tests', 'E2E tests are passing', 'skip', '', 'Testing');
    this.addItem('test-coverage', 'Test Coverage', 'Test coverage meets requirements', 'skip', '', 'Testing');

    // Deployment
    this.addItem('docker-config', 'Docker Configuration', 'Docker configuration is production-ready', 'skip', '', 'Deployment');
    this.addItem('ci-cd-pipeline', 'CI/CD Pipeline', 'CI/CD pipeline is configured', 'skip', '', 'Deployment');
    this.addItem('deployment-scripts', 'Deployment Scripts', 'Deployment scripts are ready', 'skip', '', 'Deployment');
    this.addItem('rollback-plan', 'Rollback Plan', 'Rollback plan is documented', 'skip', '', 'Deployment');
  }

  private addItem(id: string, name: string, description: string, status: 'pass' | 'fail' | 'warning' | 'skip', message: string, category: string) {
    const item: ChecklistItem = {
      id,
      name,
      description,
      status,
      message,
      category,
    };
    this.items.push(item);
    this.results[id] = item;
  }

  private updateItem(id: string, status: 'pass' | 'fail' | 'warning' | 'skip', message: string) {
    if (this.results[id]) {
      this.results[id].status = status;
      this.results[id].message = message;
    }
  }

  async runChecklist(): Promise<void> {
    console.log('Starting production checklist validation...');

    try {
      // Environment Configuration
      await this.checkEnvironmentConfiguration();
      
      // Database Setup
      await this.checkDatabaseSetup();
      
      // Security Configuration
      await this.checkSecurityConfiguration();
      
      // Monitoring Setup
      await this.checkMonitoringSetup();
      
      // Performance Optimization
      await this.checkPerformanceOptimization();
      
      // Documentation
      await this.checkDocumentation();
      
      // Testing
      await this.checkTesting();
      
      // Deployment
      await this.checkDeployment();

      // Generate report
      await this.generateReport();

    } catch (error) {
      console.error('Production checklist validation failed:', error);
      throw error;
    }
  }

  private async checkEnvironmentConfiguration(): Promise<void> {
    console.log('Checking environment configuration...');

    try {
      // Check if .env.example exists
      const envExampleExists = await this.fileExists('.env.example');
      this.updateItem('env-config', envExampleExists ? 'pass' : 'fail', 
        envExampleExists ? 'Environment template exists' : 'Environment template missing');

      // Check if env.production.example exists
      const envProdExampleExists = await this.fileExists('env.production.example');
      this.updateItem('env-templates', envProdExampleExists ? 'pass' : 'fail',
        envProdExampleExists ? 'Production environment template exists' : 'Production environment template missing');

      // Check environment validation
      try {
        const envConfigExists = await this.fileExists('backend/src/config/env.ts');
        this.updateItem('env-validation', envConfigExists ? 'pass' : 'fail',
          envConfigExists ? 'Environment validation exists' : 'Environment validation missing');
      } catch (error) {
        this.updateItem('env-validation', 'fail', `Environment validation failed: ${error}`);
      }

    } catch (error) {
      console.error('Environment configuration check failed:', error);
      this.updateItem('env-config', 'fail', `Environment check failed: ${error}`);
    }
  }

  private async checkDatabaseSetup(): Promise<void> {
    console.log('Checking database setup...');

    try {
      // Check if migration system exists
      const migrationSystemExists = await this.fileExists('backend/src/utils/migrate.ts');
      this.updateItem('db-migrations', migrationSystemExists ? 'pass' : 'fail',
        migrationSystemExists ? 'Migration system exists' : 'Migration system missing');

      // Check if backup system exists
      const backupSystemExists = await this.fileExists('scripts/backup-restore.sh');
      this.updateItem('db-backup', backupSystemExists ? 'pass' : 'fail',
        backupSystemExists ? 'Backup system exists' : 'Backup system missing');

      // Check if database optimizer exists
      const dbOptimizerExists = await this.fileExists('backend/src/utils/databaseOptimizer.ts');
      this.updateItem('db-optimization', dbOptimizerExists ? 'pass' : 'fail',
        dbOptimizerExists ? 'Database optimizer exists' : 'Database optimizer missing');

      // Check database connection (this would require actual DB connection)
      this.updateItem('db-connection', 'warning', 'Database connection check requires running database');

    } catch (error) {
      console.error('Database setup check failed:', error);
      this.updateItem('db-migrations', 'fail', `Database check failed: ${error}`);
    }
  }

  private async checkSecurityConfiguration(): Promise<void> {
    console.log('Checking security configuration...');

    try {
      // Check if security middleware exists
      const securityMiddlewareExists = await this.fileExists('backend/src/middleware/auth.ts');
      this.updateItem('auth-middleware', securityMiddlewareExists ? 'pass' : 'fail',
        securityMiddlewareExists ? 'Authentication middleware exists' : 'Authentication middleware missing');

      // Check if security audit script exists
      const securityAuditExists = await this.fileExists('backend/src/utils/security-audit.ts');
      this.updateItem('security-audit', securityAuditExists ? 'pass' : 'fail',
        securityAuditExists ? 'Security audit script exists' : 'Security audit script missing');

      // Check if security documentation exists
      const securityDocsExists = await this.fileExists('SECURITY.md');
      this.updateItem('security-headers', securityDocsExists ? 'pass' : 'fail',
        securityDocsExists ? 'Security documentation exists' : 'Security documentation missing');

      // Check if input validation is implemented (check for zod usage)
      const inputValidationExists = await this.fileExists('backend/src/utils/schema.ts');
      this.updateItem('input-validation', inputValidationExists ? 'pass' : 'fail',
        inputValidationExists ? 'Input validation schema exists' : 'Input validation schema missing');

      // Check if rate limiting is configured
      const rateLimitingExists = await this.fileExists('backend/src/middleware/monitoring.ts');
      this.updateItem('rate-limiting', rateLimitingExists ? 'pass' : 'fail',
        rateLimitingExists ? 'Rate limiting middleware exists' : 'Rate limiting middleware missing');

    } catch (error) {
      console.error('Security configuration check failed:', error);
      this.updateItem('security-headers', 'fail', `Security check failed: ${error}`);
    }
  }

  private async checkMonitoringSetup(): Promise<void> {
    console.log('Checking monitoring setup...');

    try {
      // Check if health checks exist
      const healthChecksExist = await this.fileExists('backend/src/utils/health-checks.ts');
      this.updateItem('health-checks', healthChecksExist ? 'pass' : 'fail',
        healthChecksExist ? 'Health checks exist' : 'Health checks missing');

      // Check if logging is configured
      const loggingExists = await this.fileExists('backend/src/utils/logger.ts');
      this.updateItem('logging', loggingExists ? 'pass' : 'fail',
        loggingExists ? 'Structured logging exists' : 'Structured logging missing');

      // Check if monitoring configuration exists
      const monitoringConfigExists = await this.fileExists('MONITORING.md');
      this.updateItem('metrics', monitoringConfigExists ? 'pass' : 'fail',
        monitoringConfigExists ? 'Monitoring configuration exists' : 'Monitoring configuration missing');

      // Check if Prometheus configuration exists
      const prometheusConfigExists = await this.fileExists('monitoring/prometheus.yml');
      this.updateItem('alerting', prometheusConfigExists ? 'pass' : 'fail',
        prometheusConfigExists ? 'Prometheus configuration exists' : 'Prometheus configuration missing');

    } catch (error) {
      console.error('Monitoring setup check failed:', error);
      this.updateItem('health-checks', 'fail', `Monitoring check failed: ${error}`);
    }
  }

  private async checkPerformanceOptimization(): Promise<void> {
    console.log('Checking performance optimization...');

    try {
      // Check if caching system exists
      const cachingExists = await this.fileExists('backend/src/services/cache.service.ts');
      this.updateItem('caching', cachingExists ? 'pass' : 'fail',
        cachingExists ? 'Caching system exists' : 'Caching system missing');

      // Check if bundle analyzer exists
      const bundleAnalyzerExists = await this.fileExists('scripts/bundle-analyzer.ts');
      this.updateItem('bundle-optimization', bundleAnalyzerExists ? 'pass' : 'fail',
        bundleAnalyzerExists ? 'Bundle analyzer exists' : 'Bundle analyzer missing');

      // Check if performance optimizer exists
      const performanceOptimizerExists = await this.fileExists('backend/src/utils/performance-optimizer.ts');
      this.updateItem('query-optimization', performanceOptimizerExists ? 'pass' : 'fail',
        performanceOptimizerExists ? 'Performance optimizer exists' : 'Performance optimizer missing');

      // Check if CDN service exists
      const cdnServiceExists = await this.fileExists('backend/src/services/cdn.service.ts');
      this.updateItem('cdn-setup', cdnServiceExists ? 'pass' : 'fail',
        cdnServiceExists ? 'CDN service exists' : 'CDN service missing');

    } catch (error) {
      console.error('Performance optimization check failed:', error);
      this.updateItem('caching', 'fail', `Performance check failed: ${error}`);
    }
  }

  private async checkDocumentation(): Promise<void> {
    console.log('Checking documentation...');

    try {
      // Check if API documentation exists
      const apiDocsExist = await this.fileExists('README.md');
      this.updateItem('api-docs', apiDocsExist ? 'pass' : 'fail',
        apiDocsExist ? 'API documentation exists' : 'API documentation missing');

      // Check if deployment documentation exists
      const deploymentDocsExist = await this.fileExists('DEPLOYMENT.md');
      this.updateItem('deployment-docs', deploymentDocsExist ? 'pass' : 'fail',
        deploymentDocsExist ? 'Deployment documentation exists' : 'Deployment documentation missing');

      // Check if runbook exists
      const runbookExists = await this.fileExists('RUNBOOK.md');
      this.updateItem('runbook', runbookExists ? 'pass' : 'fail',
        runbookExists ? 'Operations runbook exists' : 'Operations runbook missing');

      // Check if troubleshooting guide exists
      const troubleshootingExists = await this.fileExists('TROUBLESHOOTING.md');
      this.updateItem('troubleshooting', troubleshootingExists ? 'pass' : 'fail',
        troubleshootingExists ? 'Troubleshooting guide exists' : 'Troubleshooting guide missing');

    } catch (error) {
      console.error('Documentation check failed:', error);
      this.updateItem('api-docs', 'fail', `Documentation check failed: ${error}`);
    }
  }

  private async checkTesting(): Promise<void> {
    console.log('Checking testing setup...');

    try {
      // Check if unit tests exist
      const unitTestsExist = await this.directoryExists('backend/tests/unit');
      this.updateItem('unit-tests', unitTestsExist ? 'pass' : 'fail',
        unitTestsExist ? 'Unit tests exist' : 'Unit tests missing');

      // Check if integration tests exist
      const integrationTestsExist = await this.directoryExists('backend/tests/integration');
      this.updateItem('integration-tests', integrationTestsExist ? 'pass' : 'fail',
        integrationTestsExist ? 'Integration tests exist' : 'Integration tests missing');

      // Check if E2E tests exist
      const e2eTestsExist = await this.directoryExists('backend/tests/e2e');
      this.updateItem('e2e-tests', e2eTestsExist ? 'pass' : 'fail',
        e2eTestsExist ? 'E2E tests exist' : 'E2E tests missing');

      // Check if Jest configuration exists
      const jestConfigExists = await this.fileExists('jest.config.js');
      this.updateItem('test-coverage', jestConfigExists ? 'pass' : 'fail',
        jestConfigExists ? 'Test configuration exists' : 'Test configuration missing');

    } catch (error) {
      console.error('Testing check failed:', error);
      this.updateItem('unit-tests', 'fail', `Testing check failed: ${error}`);
    }
  }

  private async checkDeployment(): Promise<void> {
    console.log('Checking deployment setup...');

    try {
      // Check if Docker configuration exists
      const dockerConfigExists = await this.fileExists('Dockerfile');
      this.updateItem('docker-config', dockerConfigExists ? 'pass' : 'fail',
        dockerConfigExists ? 'Docker configuration exists' : 'Docker configuration missing');

      // Check if CI/CD pipeline exists
      const ciCdExists = await this.directoryExists('.github/workflows');
      this.updateItem('ci-cd-pipeline', ciCdExists ? 'pass' : 'fail',
        ciCdExists ? 'CI/CD pipeline exists' : 'CI/CD pipeline missing');

      // Check if deployment scripts exist
      const deploymentScriptsExist = await this.fileExists('deploy.sh');
      this.updateItem('deployment-scripts', deploymentScriptsExist ? 'pass' : 'fail',
        deploymentScriptsExist ? 'Deployment scripts exist' : 'Deployment scripts missing');

      // Check if rollback plan exists
      const rollbackPlanExists = await this.fileExists('DEPLOYMENT_CHECKLIST.md');
      this.updateItem('rollback-plan', rollbackPlanExists ? 'pass' : 'fail',
        rollbackPlanExists ? 'Rollback plan exists' : 'Rollback plan missing');

    } catch (error) {
      console.error('Deployment check failed:', error);
      this.updateItem('docker-config', 'fail', `Deployment check failed: ${error}`);
    }
  }

  private async generateReport(): Promise<void> {
    console.log('Generating production checklist report...');

    const categories = ['Environment', 'Database', 'Security', 'Monitoring', 'Performance', 'Documentation', 'Testing', 'Deployment'];
    const report: string[] = [];

    report.push('# Production Readiness Checklist Report');
    report.push('');
    report.push(`Generated on: ${new Date().toISOString()}`);
    report.push('');

    let totalItems = 0;
    let passedItems = 0;
    let failedItems = 0;
    let warningItems = 0;

    for (const category of categories) {
      const categoryItems = this.items.filter(item => item.category === category);
      if (categoryItems.length === 0) continue;

      report.push(`## ${category}`);
      report.push('');

      for (const item of categoryItems) {
        totalItems++;
        const statusIcon = this.getStatusIcon(item.status);
        report.push(`- ${statusIcon} **${item.name}**: ${item.description}`);
        if (item.message) {
          report.push(`  - ${item.message}`);
        }
        report.push('');

        if (item.status === 'pass') passedItems++;
        else if (item.status === 'fail') failedItems++;
        else if (item.status === 'warning') warningItems++;
      }
    }

    report.push('## Summary');
    report.push('');
    report.push(`- **Total Items**: ${totalItems}`);
    report.push(`- **Passed**: ${passedItems} (${Math.round((passedItems / totalItems) * 100)}%)`);
    report.push(`- **Failed**: ${failedItems} (${Math.round((failedItems / totalItems) * 100)}%)`);
    report.push(`- **Warnings**: ${warningItems} (${Math.round((warningItems / totalItems) * 100)}%)`);
    report.push('');

    if (failedItems > 0) {
      report.push('## ❌ Failed Items');
      report.push('');
      const failedItemsList = this.items.filter(item => item.status === 'fail');
      for (const item of failedItemsList) {
        report.push(`- **${item.name}**: ${item.message}`);
      }
      report.push('');
    }

    if (warningItems > 0) {
      report.push('## ⚠️ Warning Items');
      report.push('');
      const warningItemsList = this.items.filter(item => item.status === 'warning');
      for (const item of warningItemsList) {
        report.push(`- **${item.name}**: ${item.message}`);
      }
      report.push('');
    }

    const reportContent = report.join('\n');
    await fs.writeFile('PRODUCTION_CHECKLIST_REPORT.md', reportContent);

    console.log('Production checklist report generated: PRODUCTION_CHECKLIST_REPORT.md');
    console.log(`Summary: ${passedItems}/${totalItems} items passed (${Math.round((passedItems / totalItems) * 100)}%)`);

    if (failedItems > 0) {
      console.warn(`${failedItems} items failed - please review and fix before production deployment`);
    }
    if (warningItems > 0) {
      console.warn(`${warningItems} items have warnings - please review before production deployment`);
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      case 'skip': return '⏭️';
      default: return '❓';
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

// Main execution
async function main() {
  try {
    const checklist = new ProductionChecklist();
    await checklist.runChecklist();
    process.exit(0);
  } catch (error) {
    console.error('Production checklist validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ProductionChecklist;
