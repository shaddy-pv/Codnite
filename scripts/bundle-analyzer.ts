import { analyze } from 'vite-bundle-analyzer';
import { build } from 'vite';
import { resolve } from 'path';

/**
 * Bundle Analyzer Script
 * 
 * This script analyzes the bundle size and provides insights into:
 * - Bundle composition
 * - Duplicate dependencies
 * - Large modules
 * - Optimization opportunities
 */

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  chunks: ChunkInfo[];
  duplicates: DuplicateInfo[];
  recommendations: string[];
}

interface ModuleInfo {
  name: string;
  size: number;
  gzippedSize: number;
  percentage: number;
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: ModuleInfo[];
}

interface DuplicateInfo {
  name: string;
  count: number;
  totalSize: number;
  locations: string[];
}

class BundleAnalyzer {
  private analysis: BundleAnalysis | null = null;

  async analyze(): Promise<void> {
    console.log('🔍 Starting bundle analysis...');

    try {
      // Build the application
      console.log('📦 Building application...');
      await build({
        configFile: resolve(__dirname, 'vite.config.ts'),
        mode: 'analyze',
      });

      // Analyze the bundle
      console.log('🔬 Analyzing bundle...');
      this.analysis = await analyze({
        bundleDir: resolve(__dirname, 'dist'),
        outputDir: resolve(__dirname, 'bundle-analysis'),
        open: false,
        gzipSize: true,
        brotliSize: true,
      });

      // Generate report
      this.generateReport();

      console.log('✅ Bundle analysis completed!');
      console.log(`📊 Report saved to: ${resolve(__dirname, 'bundle-analysis')}`);

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      process.exit(1);
    }
  }

  private generateReport(): void {
    if (!this.analysis) return;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSize: this.analysis.totalSize,
        gzippedSize: this.analysis.gzippedSize,
        compressionRatio: ((this.analysis.totalSize - this.analysis.gzippedSize) / this.analysis.totalSize * 100).toFixed(2),
        moduleCount: this.analysis.modules.length,
        chunkCount: this.analysis.chunks.length,
        duplicateCount: this.analysis.duplicates.length,
      },
      modules: this.analysis.modules.slice(0, 20), // Top 20 modules
      chunks: this.analysis.chunks,
      duplicates: this.analysis.duplicates,
      recommendations: this.analysis.recommendations,
    };

    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, 'bundle-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    this.generateMarkdownReport(report);
  }

  private generateMarkdownReport(report: any): void {
    const markdown = `# Bundle Analysis Report

Generated on: ${report.timestamp}

## Summary

- **Total Size**: ${(report.summary.totalSize / 1024 / 1024).toFixed(2)} MB
- **Gzipped Size**: ${(report.summary.gzippedSize / 1024 / 1024).toFixed(2)} MB
- **Compression Ratio**: ${report.summary.compressionRatio}%
- **Module Count**: ${report.summary.moduleCount}
- **Chunk Count**: ${report.summary.chunkCount}
- **Duplicate Count**: ${report.summary.duplicateCount}

## Top Modules

| Module | Size | Gzipped | Percentage |
|--------|------|---------|------------|
${report.modules.map((module: ModuleInfo) => 
  `| ${module.name} | ${(module.size / 1024).toFixed(2)} KB | ${(module.gzippedSize / 1024).toFixed(2)} KB | ${module.percentage.toFixed(2)}% |`
).join('\n')}

## Chunks

| Chunk | Size | Gzipped | Modules |
|-------|------|---------|---------|
${report.chunks.map((chunk: ChunkInfo) => 
  `| ${chunk.name} | ${(chunk.size / 1024).toFixed(2)} KB | ${(chunk.gzippedSize / 1024).toFixed(2)} KB | ${chunk.modules.length} |`
).join('\n')}

## Duplicates

${report.duplicates.length > 0 ? report.duplicates.map((dup: DuplicateInfo) => 
  `- **${dup.name}**: ${dup.count} instances, ${(dup.totalSize / 1024).toFixed(2)} KB total`
).join('\n') : 'No duplicates found'}

## Recommendations

${report.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Next Steps

1. Review the bundle analysis report
2. Implement recommended optimizations
3. Monitor bundle size changes
4. Set up bundle size budgets
5. Regular analysis and optimization

---

*This report was generated automatically by the bundle analyzer.*
`;

    const fs = require('fs');
    const path = require('path');
    
    const markdownPath = path.join(__dirname, 'bundle-analysis-report.md');
    fs.writeFileSync(markdownPath, markdown);
  }
}

// Run bundle analysis if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('Bundle analysis failed:', error);
    process.exit(1);
  });
}

export default BundleAnalyzer;