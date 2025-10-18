import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger';

const execAsync = promisify(exec);

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

class SecurityAuditor {
  private issues: SecurityIssue[] = [];

  async audit(): Promise<void> {
    logger.info('Starting security audit...');

    await this.checkDependencies();
    await this.checkEnvironmentVariables();
    await this.checkCodeSecurity();
    await this.checkFilePermissions();
    await this.checkSSLConfiguration();
    await this.checkDatabaseSecurity();
    await this.checkAuthenticationSecurity();

    this.generateReport();
  }

  private async checkDependencies(): Promise<void> {
    logger.info('Checking dependencies for vulnerabilities...');

    try {
      const { stdout } = await execAsync('npm audit --json');
      const auditResult = JSON.parse(stdout);

      if (auditResult.vulnerabilities) {
        Object.entries(auditResult.vulnerabilities).forEach(([packageName, vuln]: [string, any]) => {
          this.issues.push({
            severity: this.mapSeverity(vuln.severity),
            category: 'Dependencies',
            description: `Vulnerability in ${packageName}: ${vuln.title}`,
            recommendation: `Update ${packageName} to version ${vuln.recommendation || 'latest'}`
          });
        });
      }
    } catch (error) {
      logger.error('Failed to check dependencies:', error);
    }
  }

  private async checkEnvironmentVariables(): Promise<void> {
    logger.info('Checking environment variable security...');

    const envFile = path.join(process.cwd(), '.env');
    const envExampleFile = path.join(process.cwd(), 'env.example');

    try {
      const envContent = await fs.readFile(envFile, 'utf8');
      const envExampleContent = await fs.readFile(envExampleFile, 'utf8');

      // Check for hardcoded secrets
      const secretPatterns = [
        /password\s*=\s*['"][^'"]+['"]/gi,
        /secret\s*=\s*['"][^'"]+['"]/gi,
        /key\s*=\s*['"][^'"]+['"]/gi,
        /token\s*=\s*['"][^'"]+['"]/gi
      ];

      secretPatterns.forEach(pattern => {
        const matches = envContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            this.issues.push({
              severity: 'high',
              category: 'Environment Variables',
              description: `Potential hardcoded secret: ${match}`,
              file: '.env',
              recommendation: 'Use environment variables or secure secret management'
            });
          });
        }
      });

      // Check for missing required variables
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'];
      requiredVars.forEach(varName => {
        if (!envContent.includes(varName)) {
          this.issues.push({
            severity: 'critical',
            category: 'Environment Variables',
            description: `Missing required environment variable: ${varName}`,
            file: '.env',
            recommendation: `Add ${varName} to .env file`
          });
        }
      });

    } catch (error) {
      logger.error('Failed to check environment variables:', error);
    }
  }

  private async checkCodeSecurity(): Promise<void> {
    logger.info('Checking code for security issues...');

    const srcDir = path.join(process.cwd(), 'backend/src');
    const files = await this.getTypeScriptFiles(srcDir);

    for (const file of files) {
      await this.checkFileSecurity(file);
    }
  }

  private async getTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getTypeScriptFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async checkFileSecurity(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');

      // Check for SQL injection vulnerabilities
      const sqlPatterns = [
        /query\s*\(\s*['"`][^'"`]*\$\{[^}]*\}[^'"`]*['"`]/g,
        /query\s*\(\s*['"`][^'"`]*\+[^'"`]*['"`]/g
      ];

      sqlPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = this.findLineNumber(content, match);
            this.issues.push({
              severity: 'high',
              category: 'SQL Injection',
              description: `Potential SQL injection vulnerability: ${match}`,
              file: filePath,
              line: lineNumber,
              recommendation: 'Use parameterized queries instead of string concatenation'
            });
          });
        }
      });

      // Check for XSS vulnerabilities
      const xssPatterns = [
        /innerHTML\s*=\s*[^;]+/g,
        /outerHTML\s*=\s*[^;]+/g,
        /document\.write\s*\(/g
      ];

      xssPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = this.findLineNumber(content, match);
            this.issues.push({
              severity: 'medium',
              category: 'XSS',
              description: `Potential XSS vulnerability: ${match}`,
              file: filePath,
              line: lineNumber,
              recommendation: 'Use textContent or proper HTML escaping'
            });
          });
        }
      });

      // Check for hardcoded secrets in code
      const secretPatterns = [
        /password\s*:\s*['"][^'"]+['"]/gi,
        /secret\s*:\s*['"][^'"]+['"]/gi,
        /key\s*:\s*['"][^'"]+['"]/gi,
        /token\s*:\s*['"][^'"]+['"]/gi
      ];

      secretPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = this.findLineNumber(content, match);
            this.issues.push({
              severity: 'high',
              category: 'Hardcoded Secrets',
              description: `Hardcoded secret in code: ${match}`,
              file: filePath,
              line: lineNumber,
              recommendation: 'Move secrets to environment variables'
            });
          });
        }
      });

      // Check for missing input validation
      const validationPatterns = [
        /req\.body\./g,
        /req\.query\./g,
        /req\.params\./g
      ];

      validationPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = this.findLineNumber(content, match);
            // Check if there's validation nearby
            const context = this.getContext(content, lineNumber, 5);
            if (!context.includes('validate') && !context.includes('sanitize')) {
              this.issues.push({
                severity: 'medium',
                category: 'Input Validation',
                description: `Missing input validation: ${match}`,
                file: filePath,
                line: lineNumber,
                recommendation: 'Add input validation and sanitization'
              });
            }
          });
        }
      });

    } catch (error) {
      logger.error(`Failed to check file ${filePath}:`, error);
    }
  }

  private async checkFilePermissions(): Promise<void> {
    logger.info('Checking file permissions...');

    const sensitiveFiles = [
      '.env',
      'package.json',
      'package-lock.json',
      'docker-compose.yml',
      'Dockerfile'
    ];

    for (const file of sensitiveFiles) {
      try {
        const stats = await fs.stat(file);
        const permissions = stats.mode.toString(8);
        
        if (permissions.endsWith('777') || permissions.endsWith('666')) {
          this.issues.push({
            severity: 'medium',
            category: 'File Permissions',
            description: `File ${file} has overly permissive permissions: ${permissions}`,
            file: file,
            recommendation: 'Restrict file permissions to 644 or 600'
          });
        }
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  private async checkSSLConfiguration(): Promise<void> {
    logger.info('Checking SSL configuration...');

    try {
      const nginxConfig = await fs.readFile('nginx.conf', 'utf8');
      
      // Check for SSL configuration
      if (!nginxConfig.includes('ssl_certificate') || !nginxConfig.includes('ssl_certificate_key')) {
        this.issues.push({
          severity: 'high',
          category: 'SSL Configuration',
          description: 'SSL certificates not configured in Nginx',
          file: 'nginx.conf',
          recommendation: 'Configure SSL certificates for HTTPS'
        });
      }

      // Check for security headers
      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];

      securityHeaders.forEach(header => {
        if (!nginxConfig.includes(header)) {
          this.issues.push({
            severity: 'medium',
            category: 'Security Headers',
            description: `Missing security header: ${header}`,
            file: 'nginx.conf',
            recommendation: `Add ${header} header to Nginx configuration`
          });
        }
      });

    } catch (error) {
      logger.error('Failed to check SSL configuration:', error);
    }
  }

  private async checkDatabaseSecurity(): Promise<void> {
    logger.info('Checking database security...');

    try {
      const dbConfig = await fs.readFile('.env', 'utf8');
      
      // Check for default database credentials
      if (dbConfig.includes('postgres:postgres') || dbConfig.includes('admin:admin')) {
        this.issues.push({
          severity: 'high',
          category: 'Database Security',
          description: 'Default database credentials detected',
          file: '.env',
          recommendation: 'Change default database credentials'
        });
      }

      // Check for database URL format
      if (!dbConfig.includes('DATABASE_URL=')) {
        this.issues.push({
          severity: 'critical',
          category: 'Database Security',
          description: 'DATABASE_URL not configured',
          file: '.env',
          recommendation: 'Configure DATABASE_URL environment variable'
        });
      }

    } catch (error) {
      logger.error('Failed to check database security:', error);
    }
  }

  private async checkAuthenticationSecurity(): Promise<void> {
    logger.info('Checking authentication security...');

    try {
      const authFile = path.join(process.cwd(), 'backend/src/middleware/auth.ts');
      const content = await fs.readFile(authFile, 'utf8');

      // Check for JWT secret validation
      if (!content.includes('jwtSecret') || !content.includes('config.jwtSecret')) {
        this.issues.push({
          severity: 'high',
          category: 'Authentication',
          description: 'JWT secret not properly configured',
          file: authFile,
          recommendation: 'Ensure JWT secret is properly configured'
        });
      }

      // Check for password hashing
      if (!content.includes('bcrypt') && !content.includes('hash')) {
        this.issues.push({
          severity: 'high',
          category: 'Authentication',
          description: 'Password hashing not implemented',
          file: authFile,
          recommendation: 'Implement proper password hashing with bcrypt'
        });
      }

    } catch (error) {
      logger.error('Failed to check authentication security:', error);
    }
  }

  private mapSeverity(npmSeverity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (npmSeverity.toLowerCase()) {
      case 'low':
        return 'low';
      case 'moderate':
        return 'medium';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
      default:
        return 'medium';
    }
  }

  private findLineNumber(content: string, match: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 0;
  }

  private getContext(content: string, lineNumber: number, contextLines: number): string {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    return lines.slice(start, end).join('\n');
  }

  private generateReport(): void {
    logger.info('\n=== Security Audit Report ===');

    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');

    logger.info(`\nSummary:`);
    logger.info(`  Critical: ${criticalIssues.length}`);
    logger.info(`  High: ${highIssues.length}`);
    logger.info(`  Medium: ${mediumIssues.length}`);
    logger.info(`  Low: ${lowIssues.length}`);
    logger.info(`  Total: ${this.issues.length}`);

    if (criticalIssues.length > 0) {
      logger.info('\n=== CRITICAL ISSUES ===');
      criticalIssues.forEach(issue => {
        logger.info(`\n[CRITICAL] ${issue.category}`);
        logger.info(`  Description: ${issue.description}`);
        if (issue.file) logger.info(`  File: ${issue.file}`);
        if (issue.line) logger.info(`  Line: ${issue.line}`);
        logger.info(`  Recommendation: ${issue.recommendation}`);
      });
    }

    if (highIssues.length > 0) {
      logger.info('\n=== HIGH PRIORITY ISSUES ===');
      highIssues.forEach(issue => {
        logger.info(`\n[HIGH] ${issue.category}`);
        logger.info(`  Description: ${issue.description}`);
        if (issue.file) logger.info(`  File: ${issue.file}`);
        if (issue.line) logger.info(`  Line: ${issue.line}`);
        logger.info(`  Recommendation: ${issue.recommendation}`);
      });
    }

    if (mediumIssues.length > 0) {
      logger.info('\n=== MEDIUM PRIORITY ISSUES ===');
      mediumIssues.forEach(issue => {
        logger.info(`\n[MEDIUM] ${issue.category}`);
        logger.info(`  Description: ${issue.description}`);
        if (issue.file) logger.info(`  File: ${issue.file}`);
        if (issue.line) logger.info(`  Line: ${issue.line}`);
        logger.info(`  Recommendation: ${issue.recommendation}`);
      });
    }

    if (lowIssues.length > 0) {
      logger.info('\n=== LOW PRIORITY ISSUES ===');
      lowIssues.forEach(issue => {
        logger.info(`\n[LOW] ${issue.category}`);
        logger.info(`  Description: ${issue.description}`);
        if (issue.file) logger.info(`  File: ${issue.file}`);
        if (issue.line) logger.info(`  Line: ${issue.line}`);
        logger.info(`  Recommendation: ${issue.recommendation}`);
      });
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.issues.length,
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: lowIssues.length
      },
      issues: this.issues
    };

    fs.writeFile('security-audit-report.json', JSON.stringify(report, null, 2))
      .then(() => logger.info('\nSecurity audit report saved to security-audit-report.json'))
      .catch(error => logger.error('Failed to save security audit report:', error));

    // Exit with error code if critical issues found
    if (criticalIssues.length > 0) {
      logger.error('\nSecurity audit failed: Critical issues found');
      process.exit(1);
    }
  }
}

// Run security audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.audit().catch(error => {
    logger.error('Security audit failed:', error);
    process.exit(1);
  });
}

export default SecurityAuditor;