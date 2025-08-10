#!/usr/bin/env node

/**
 * 质量监控仪表板
 *
 * 提供实时的测试质量监控、覆盖率趋势分析和性能基准监控
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QualityDashboard {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.coverageDir = path.join(process.cwd(), 'coverage');
    this.qualityThresholds = {
      coverage: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
      performance: {
        buildTime: 60000, // 60秒
        testTime: 120000, // 2分钟
        bundleSize: 50 * 1024, // 50KB
      },
      quality: {
        eslintErrors: 0,
        eslintWarnings: 10,
        typeErrors: 0,
        duplicateCode: 5, // 5%
      },
    };

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.reportsDir, this.coverageDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 生成完整的质量报告
   */
  async generateQualityReport() {
    console.log('🚀 生成质量监控报告...\n');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overall: 'unknown',
        score: 0,
        issues: [],
        recommendations: [],
      },
      coverage: await this.analyzeCoverage(),
      performance: await this.analyzePerformance(),
      codeQuality: await this.analyzeCodeQuality(),
      trends: await this.analyzeTrends(),
      alerts: await this.checkAlerts(),
    };

    // 计算总体评分
    report.summary = this.calculateOverallScore(report);

    // 保存报告
    const reportPath = path.join(
      this.reportsDir,
      `quality-report-${Date.now()}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 生成HTML仪表板
    await this.generateHTMLDashboard(report);

    console.log(`📊 质量报告已生成: ${reportPath}`);
    return report;
  }

  /**
   * 分析测试覆盖率
   */
  async analyzeCoverage() {
    console.log('📈 分析测试覆盖率...');

    try {
      // 检查是否存在覆盖率报告
      const coverageJsonPath = path.join(
        this.coverageDir,
        'coverage-summary.json',
      );

      if (!fs.existsSync(coverageJsonPath)) {
        console.log('⚠️  覆盖率报告不存在，尝试生成...');
        try {
          execSync('pnpm test --run --coverage --passWithNoTests', {
            stdio: 'pipe',
            timeout: 120000,
          });
        } catch (error) {
          console.log('⚠️  无法生成覆盖率报告，创建默认文件');
          // 创建默认覆盖率文件
          const defaultCoverage = {
            total: {
              lines: { pct: 0 },
              functions: { pct: 0 },
              branches: { pct: 0 },
              statements: { pct: 0 },
            },
          };
          try {
            fs.writeFileSync(
              coverageJsonPath,
              JSON.stringify(defaultCoverage, null, 2),
            );
          } catch (writeError) {
            console.log('⚠️  无法创建默认覆盖率文件');
          }
        }
      }

      let coverageData = {
        lines: { pct: 0 },
        functions: { pct: 0 },
        branches: { pct: 0 },
        statements: { pct: 0 },
      };

      if (fs.existsSync(coverageJsonPath)) {
        const rawData = fs.readFileSync(coverageJsonPath, 'utf8');
        const coverage = JSON.parse(rawData);
        coverageData = coverage.total || coverageData;
      }

      const analysis = {
        current: {
          lines: coverageData.lines.pct,
          functions: coverageData.functions.pct,
          branches: coverageData.branches.pct,
          statements: coverageData.statements.pct,
        },
        thresholds: this.qualityThresholds.coverage,
        status: 'unknown',
        issues: [],
        trend: 'stable',
      };

      // 检查阈值
      Object.keys(analysis.current).forEach((metric) => {
        const current = analysis.current[metric];
        const threshold = analysis.thresholds[metric];

        if (current < threshold) {
          analysis.issues.push({
            type: 'coverage',
            metric,
            current,
            threshold,
            severity: current < threshold * 0.8 ? 'high' : 'medium',
            message: `${metric} 覆盖率 ${current}% 低于阈值 ${threshold}%`,
          });
        }
      });

      analysis.status =
        analysis.issues.length === 0
          ? 'good'
          : analysis.issues.some((i) => i.severity === 'high')
            ? 'poor'
            : 'warning';

      return analysis;
    } catch (error) {
      console.error('❌ 覆盖率分析失败:', error.message);
      return {
        current: { lines: 0, functions: 0, branches: 0, statements: 0 },
        thresholds: this.qualityThresholds.coverage,
        status: 'error',
        issues: [
          { type: 'coverage', message: '覆盖率分析失败', severity: 'high' },
        ],
        trend: 'unknown',
      };
    }
  }

  /**
   * 分析性能指标
   */
  async analyzePerformance() {
    console.log('⚡ 分析性能指标...');

    const performance = {
      build: await this.measureBuildTime(),
      test: await this.measureTestTime(),
      bundle: await this.analyzeBundleSize(),
      status: 'unknown',
      issues: [],
    };

    // 检查性能阈值
    if (performance.build.time > this.qualityThresholds.performance.buildTime) {
      performance.issues.push({
        type: 'performance',
        metric: 'build',
        current: performance.build.time,
        threshold: this.qualityThresholds.performance.buildTime,
        severity: 'medium',
        message: `构建时间 ${performance.build.time}ms 超过阈值`,
      });
    }

    if (performance.test.time > this.qualityThresholds.performance.testTime) {
      performance.issues.push({
        type: 'performance',
        metric: 'test',
        current: performance.test.time,
        threshold: this.qualityThresholds.performance.testTime,
        severity: 'medium',
        message: `测试时间 ${performance.test.time}ms 超过阈值`,
      });
    }

    performance.status = performance.issues.length === 0 ? 'good' : 'warning';
    return performance;
  }

  /**
   * 测量构建时间
   */
  async measureBuildTime() {
    try {
      const startTime = Date.now();
      execSync('pnpm build', { stdio: 'pipe', timeout: 120000 });
      const endTime = Date.now();

      return {
        time: endTime - startTime,
        status: 'success',
      };
    } catch (error) {
      return {
        time: 0,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * 测量测试时间
   */
  async measureTestTime() {
    try {
      const startTime = Date.now();
      execSync('pnpm test --run --reporter=json', {
        stdio: 'pipe',
        timeout: 180000,
      });
      const endTime = Date.now();

      return {
        time: endTime - startTime,
        status: 'success',
      };
    } catch (error) {
      return {
        time: 0,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * 分析包大小
   */
  async analyzeBundleSize() {
    try {
      // 检查构建输出
      const buildDir = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildDir)) {
        return { size: 0, status: 'no-build' };
      }

      // 简单的大小估算
      const getDirectorySize = (dirPath) => {
        let totalSize = 0;
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              totalSize += getDirectorySize(filePath);
            } else {
              totalSize += stats.size;
            }
          });
        }
        return totalSize;
      };

      const size = getDirectorySize(buildDir);
      return {
        size,
        sizeFormatted: this.formatBytes(size),
        status: 'success',
      };
    } catch (error) {
      return {
        size: 0,
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * 分析代码质量
   */
  async analyzeCodeQuality() {
    console.log('🔍 分析代码质量...');

    const quality = {
      eslint: await this.runESLintAnalysis(),
      typescript: await this.runTypeScriptAnalysis(),
      duplication: await this.runDuplicationAnalysis(),
      status: 'unknown',
      issues: [],
    };

    // 汇总问题
    [quality.eslint, quality.typescript, quality.duplication].forEach(
      (analysis) => {
        if (analysis.issues) {
          quality.issues.push(...analysis.issues);
        }
      },
    );

    quality.status =
      quality.issues.length === 0
        ? 'good'
        : quality.issues.some((i) => i.severity === 'high')
          ? 'poor'
          : 'warning';

    return quality;
  }

  /**
   * ESLint 分析
   */
  async runESLintAnalysis() {
    try {
      const result = execSync('pnpm lint:check', {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return {
        errors: 0,
        warnings: 0,
        status: 'good',
        issues: [],
      };
    } catch (error) {
      // 解析 ESLint 输出
      const output = error.stdout || error.stderr || '';
      const errorMatch = output.match(/(\d+) error/);
      const warningMatch = output.match(/(\d+) warning/);

      const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
      const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;

      const issues = [];
      if (errors > this.qualityThresholds.quality.eslintErrors) {
        issues.push({
          type: 'eslint',
          metric: 'errors',
          current: errors,
          threshold: this.qualityThresholds.quality.eslintErrors,
          severity: 'high',
          message: `ESLint 错误数量 ${errors} 超过阈值`,
        });
      }

      if (warnings > this.qualityThresholds.quality.eslintWarnings) {
        issues.push({
          type: 'eslint',
          metric: 'warnings',
          current: warnings,
          threshold: this.qualityThresholds.quality.eslintWarnings,
          severity: 'medium',
          message: `ESLint 警告数量 ${warnings} 超过阈值`,
        });
      }

      return {
        errors,
        warnings,
        status: errors > 0 ? 'poor' : 'warning',
        issues,
      };
    }
  }

  /**
   * TypeScript 分析
   */
  async runTypeScriptAnalysis() {
    try {
      execSync('pnpm type-check', { stdio: 'pipe' });
      return {
        errors: 0,
        status: 'good',
        issues: [],
      };
    } catch (error) {
      return {
        errors: 1,
        status: 'poor',
        issues: [
          {
            type: 'typescript',
            metric: 'errors',
            current: 1,
            threshold: 0,
            severity: 'high',
            message: 'TypeScript 类型检查失败',
          },
        ],
      };
    }
  }

  /**
   * 代码重复分析
   */
  async runDuplicationAnalysis() {
    try {
      execSync('pnpm duplication:check', { stdio: 'pipe' });
      return {
        percentage: 0,
        status: 'good',
        issues: [],
      };
    } catch (error) {
      return {
        percentage: 10, // 假设值
        status: 'warning',
        issues: [
          {
            type: 'duplication',
            metric: 'percentage',
            current: 10,
            threshold: this.qualityThresholds.quality.duplicateCode,
            severity: 'medium',
            message: '代码重复率较高',
          },
        ],
      };
    }
  }

  /**
   * 分析趋势
   */
  async analyzeTrends() {
    console.log('📊 分析质量趋势...');

    // 读取历史报告
    const reports = this.getHistoricalReports();

    if (reports.length < 2) {
      return {
        coverage: 'insufficient-data',
        performance: 'insufficient-data',
        quality: 'insufficient-data',
      };
    }

    const latest = reports[reports.length - 1];
    const previous = reports[reports.length - 2];

    return {
      coverage: this.calculateTrend(
        latest.coverage?.current?.lines || 0,
        previous.coverage?.current?.lines || 0,
      ),
      performance: this.calculateTrend(
        previous.performance?.build?.time || 0,
        latest.performance?.build?.time || 0,
      ),
      quality: this.calculateTrend(
        previous.codeQuality?.issues?.length || 0,
        latest.codeQuality?.issues?.length || 0,
      ),
    };
  }

  /**
   * 检查警报
   */
  async checkAlerts() {
    console.log('🚨 检查质量警报...');

    const alerts = [];

    // 这里可以添加更多的警报逻辑
    // 例如：连续多次构建失败、覆盖率持续下降等

    return alerts;
  }

  /**
   * 计算总体评分
   */
  calculateOverallScore(report) {
    let score = 100;
    const issues = [];
    const recommendations = [];

    // 覆盖率评分 (40%)
    const coverageScore = this.calculateCoverageScore(report.coverage);
    score -= (100 - coverageScore) * 0.4;

    // 性能评分 (30%)
    const performanceScore = this.calculatePerformanceScore(report.performance);
    score -= (100 - performanceScore) * 0.3;

    // 代码质量评分 (30%)
    const qualityScore = this.calculateQualityScore(report.codeQuality);
    score -= (100 - qualityScore) * 0.3;

    // 收集问题和建议
    [report.coverage, report.performance, report.codeQuality].forEach(
      (section) => {
        if (section.issues) {
          issues.push(...section.issues);
        }
      },
    );

    // 生成建议
    if (coverageScore < 80) {
      recommendations.push('增加单元测试以提高代码覆盖率');
    }
    if (performanceScore < 80) {
      recommendations.push('优化构建和测试性能');
    }
    if (qualityScore < 80) {
      recommendations.push('修复代码质量问题');
    }

    const overall =
      score >= 90
        ? 'excellent'
        : score >= 80
          ? 'good'
          : score >= 70
            ? 'warning'
            : 'poor';

    return {
      overall,
      score: Math.round(score),
      issues,
      recommendations,
    };
  }

  calculateCoverageScore(coverage) {
    if (!coverage.current) return 0;

    const weights = {
      lines: 0.3,
      functions: 0.3,
      branches: 0.2,
      statements: 0.2,
    };
    let score = 0;

    Object.keys(weights).forEach((metric) => {
      const current = coverage.current[metric] || 0;
      const threshold = coverage.thresholds[metric] || 85;
      score += Math.min((current / threshold) * 100, 100) * weights[metric];
    });

    return Math.round(score);
  }

  calculatePerformanceScore(performance) {
    let score = 100;

    if (
      performance.build?.time > this.qualityThresholds.performance.buildTime
    ) {
      score -= 30;
    }
    if (performance.test?.time > this.qualityThresholds.performance.testTime) {
      score -= 30;
    }

    return Math.max(score, 0);
  }

  calculateQualityScore(quality) {
    let score = 100;

    if (quality.issues) {
      quality.issues.forEach((issue) => {
        switch (issue.severity) {
          case 'high':
            score -= 20;
            break;
          case 'medium':
            score -= 10;
            break;
          case 'low':
            score -= 5;
            break;
        }
      });
    }

    return Math.max(score, 0);
  }

  calculateTrend(current, previous) {
    if (previous === 0) return 'stable';
    const change = ((current - previous) / previous) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  getHistoricalReports() {
    try {
      const files = fs
        .readdirSync(this.reportsDir)
        .filter(
          (file) =>
            file.startsWith('quality-report-') && file.endsWith('.json'),
        )
        .sort();

      return files.slice(-10).map((file) => {
        const content = fs.readFileSync(
          path.join(this.reportsDir, file),
          'utf8',
        );
        return JSON.parse(content);
      });
    } catch (error) {
      return [];
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成HTML仪表板
   */
  async generateHTMLDashboard(report) {
    const html = this.generateDashboardHTML(report);
    const dashboardPath = path.join(this.reportsDir, 'quality-dashboard.html');
    fs.writeFileSync(dashboardPath, html);
    console.log(`🌐 HTML仪表板已生成: ${dashboardPath}`);
  }

  generateDashboardHTML(report) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>质量监控仪表板</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .status-excellent { color: #10b981; }
        .status-good { color: #3b82f6; }
        .status-warning { color: #f59e0b; }
        .status-poor { color: #ef4444; }
        .issues { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .issue { padding: 10px; margin: 5px 0; border-left: 4px solid #ef4444; background: #fef2f2; }
        .timestamp { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>质量监控仪表板</h1>
            <p class="timestamp">生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
            <div class="metric-value status-${report.summary.overall}">
                总体评分: ${report.summary.score}/100 (${report.summary.overall})
            </div>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <h3>测试覆盖率</h3>
                <div class="metric-value status-${report.coverage.status}">
                    ${report.coverage.current?.lines || 0}%
                </div>
                <p>行覆盖率 (目标: ${report.coverage.thresholds?.lines || 85}%)</p>
            </div>

            <div class="metric-card">
                <h3>构建性能</h3>
                <div class="metric-value status-${report.performance.status}">
                    ${report.performance.build?.time ? Math.round(report.performance.build.time / 1000) : 0}s
                </div>
                <p>构建时间</p>
            </div>

            <div class="metric-card">
                <h3>代码质量</h3>
                <div class="metric-value status-${report.codeQuality.status}">
                    ${report.codeQuality.issues?.length || 0}
                </div>
                <p>质量问题数量</p>
            </div>
        </div>

        ${
          report.summary.issues.length > 0
            ? `
        <div class="issues">
            <h3>质量问题</h3>
            ${report.summary.issues
              .map(
                (issue) => `
                <div class="issue">
                    <strong>${issue.type}</strong>: ${issue.message}
                </div>
            `,
              )
              .join('')}
        </div>
        `
            : ''
        }

        ${
          report.summary.recommendations.length > 0
            ? `
        <div class="issues">
            <h3>改进建议</h3>
            ${report.summary.recommendations
              .map(
                (rec) => `
                <div class="issue" style="border-color: #3b82f6; background: #eff6ff;">
                    ${rec}
                </div>
            `,
              )
              .join('')}
        </div>
        `
            : ''
        }
    </div>
</body>
</html>`;
  }
}

// 主执行函数
async function main() {
  const dashboard = new QualityDashboard();

  try {
    const report = await dashboard.generateQualityReport();

    console.log('\n📊 质量监控报告摘要:');
    console.log(
      `总体评分: ${report.summary.score}/100 (${report.summary.overall})`,
    );
    console.log(`问题数量: ${report.summary.issues.length}`);
    console.log(`建议数量: ${report.summary.recommendations.length}`);

    if (report.summary.overall === 'poor') {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 质量监控失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { QualityDashboard };
