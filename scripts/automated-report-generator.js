#!/usr/bin/env node

/**
 * 自动化报告生成系统
 *
 * 整合所有质量监控数据，生成综合性的质量报告
 */

const fs = require('fs');
const path = require('path');
const { QualityDashboard } = require('./quality-dashboard');
const { CoverageTrendMonitor } = require('./coverage-trend-monitor');
const {
  PerformanceBenchmarkMonitor,
} = require('./performance-benchmark-monitor');
const { QualityGate } = require('./quality-gate');

class AutomatedReportGenerator {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.outputDir = path.join(this.reportsDir, 'automated');
    this.templateDir = path.join(__dirname, 'templates');

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.reportsDir, this.outputDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 生成完整的自动化报告
   */
  async generateComprehensiveReport() {
    console.log('📊 开始生成综合质量报告...\n');

    const reportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.getProjectVersion(),
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
        environment: process.env.NODE_ENV || 'development',
        generator: 'AutomatedReportGenerator',
      },
      summary: {},
      sections: {},
    };

    try {
      // 1. 质量仪表板数据
      console.log('📈 收集质量仪表板数据...');
      const dashboard = new QualityDashboard();
      reportData.sections.dashboard = await dashboard.generateQualityReport();

      // 2. 覆盖率趋势数据
      console.log('📊 收集覆盖率趋势数据...');
      const coverageMonitor = new CoverageTrendMonitor();
      await coverageMonitor.collectCoverageData();
      reportData.sections.coverageTrends = coverageMonitor.analyzeTrends();

      // 3. 性能基准数据
      console.log('⚡ 收集性能基准数据...');
      const performanceMonitor = new PerformanceBenchmarkMonitor();
      const { benchmarks, analysis } = await performanceMonitor.runBenchmarks();
      reportData.sections.performance = { benchmarks, analysis };

      // 4. 质量门禁数据
      console.log('🚪 收集质量门禁数据...');
      const qualityGate = new QualityGate();
      reportData.sections.qualityGate = await qualityGate.executeQualityGates();

      // 5. 生成综合摘要
      reportData.summary = this.generateComprehensiveSummary(
        reportData.sections,
      );

      // 6. 生成各种格式的报告
      await this.generateReports(reportData);

      console.log('\n✅ 综合质量报告生成完成！');
      return reportData;
    } catch (error) {
      console.error('❌ 报告生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 生成综合摘要
   */
  generateComprehensiveSummary(sections) {
    const summary = {
      overallScore: 0,
      status: 'unknown',
      highlights: [],
      concerns: [],
      recommendations: [],
      metrics: {
        coverage: 0,
        performance: 0,
        quality: 0,
        security: 0,
      },
      trends: {
        coverage: 'stable',
        performance: 'stable',
        quality: 'stable',
      },
    };

    // 计算覆盖率指标
    if (sections.dashboard?.coverage?.current) {
      summary.metrics.coverage = sections.dashboard.coverage.current.lines || 0;
    }

    // 计算性能指标
    if (sections.performance?.analysis?.summary) {
      const perfSummary = sections.performance.analysis.summary;
      summary.metrics.performance = Math.round(
        (perfSummary.successfulMetrics / perfSummary.totalMetrics) * 100,
      );
    }

    // 计算质量指标
    if (sections.qualityGate?.summary) {
      const gateSummary = sections.qualityGate.summary;
      const totalGates =
        gateSummary.passed + gateSummary.failed + gateSummary.warnings;
      summary.metrics.quality =
        totalGates > 0
          ? Math.round((gateSummary.passed / totalGates) * 100)
          : 0;
    }

    // 计算安全指标
    if (sections.qualityGate?.gates?.security) {
      const securityGate = sections.qualityGate.gates.security;
      summary.metrics.security = securityGate.status === 'passed' ? 100 : 0;
    }

    // 计算总体评分
    const weights = {
      coverage: 0.3,
      performance: 0.2,
      quality: 0.3,
      security: 0.2,
    };
    summary.overallScore = Math.round(
      Object.entries(weights).reduce((score, [metric, weight]) => {
        return score + summary.metrics[metric] * weight;
      }, 0),
    );

    // 确定总体状态
    summary.status =
      summary.overallScore >= 90
        ? 'excellent'
        : summary.overallScore >= 80
          ? 'good'
          : summary.overallScore >= 70
            ? 'warning'
            : 'poor';

    // 收集亮点和关注点
    this.collectHighlightsAndConcerns(sections, summary);

    // 生成建议
    this.generateRecommendations(summary);

    return summary;
  }

  /**
   * 收集亮点和关注点
   */
  collectHighlightsAndConcerns(sections, summary) {
    // 覆盖率亮点和关注点
    if (sections.coverageTrends?.trends) {
      Object.entries(sections.coverageTrends.trends).forEach(
        ([metric, data]) => {
          if (data.trend === 'improving') {
            summary.highlights.push(`${metric} 覆盖率持续提升`);
          } else if (data.trend === 'declining') {
            summary.concerns.push(`${metric} 覆盖率呈下降趋势`);
          }
        },
      );
    }

    // 性能亮点和关注点
    if (sections.performance?.analysis?.improvements?.length > 0) {
      summary.highlights.push(
        `性能优化: ${sections.performance.analysis.improvements.length} 项改进`,
      );
    }
    if (sections.performance?.analysis?.regressions?.length > 0) {
      summary.concerns.push(
        `性能回归: ${sections.performance.analysis.regressions.length} 项问题`,
      );
    }

    // 质量门禁关注点
    if (sections.qualityGate?.summary?.blocked) {
      summary.concerns.push('质量门禁检查失败，构建被阻塞');
    }

    // 安全关注点
    const securityGate = sections.qualityGate?.gates?.security;
    if (securityGate?.status === 'failed') {
      summary.concerns.push('发现安全漏洞需要修复');
    }
  }

  /**
   * 生成建议
   */
  generateRecommendations(summary) {
    if (summary.metrics.coverage < 85) {
      summary.recommendations.push('增加单元测试以提高代码覆盖率至85%以上');
    }

    if (summary.metrics.performance < 80) {
      summary.recommendations.push('优化构建和测试性能，减少CI/CD时间');
    }

    if (summary.metrics.quality < 90) {
      summary.recommendations.push(
        '修复代码质量问题，确保ESLint和TypeScript检查通过',
      );
    }

    if (summary.metrics.security < 100) {
      summary.recommendations.push('修复安全漏洞，确保依赖包安全');
    }

    if (summary.concerns.length > summary.highlights.length) {
      summary.recommendations.push('关注质量趋势，建立持续改进机制');
    }
  }

  /**
   * 生成各种格式的报告
   */
  async generateReports(reportData) {
    console.log('📝 生成报告文件...');

    // 1. JSON 格式报告
    const jsonPath = path.join(
      this.outputDir,
      `comprehensive-report-${Date.now()}.json`,
    );
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 JSON报告: ${jsonPath}`);

    // 2. HTML 格式报告
    const htmlPath = path.join(this.outputDir, 'comprehensive-report.html');
    const htmlContent = this.generateHTMLReport(reportData);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`🌐 HTML报告: ${htmlPath}`);

    // 3. Markdown 格式报告
    const mdPath = path.join(this.outputDir, 'comprehensive-report.md');
    const mdContent = this.generateMarkdownReport(reportData);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`📝 Markdown报告: ${mdPath}`);

    // 4. 简化的摘要报告
    const summaryPath = path.join(this.outputDir, 'quality-summary.json');
    fs.writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          timestamp: reportData.metadata.timestamp,
          summary: reportData.summary,
        },
        null,
        2,
      ),
    );
    console.log(`📊 摘要报告: ${summaryPath}`);
  }

  /**
   * 生成 HTML 报告
   */
  generateHTMLReport(reportData) {
    const { summary, metadata } = reportData;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>综合质量报告 - ${metadata.branch}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .score-circle { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 20px; }
        .score-excellent { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .score-good { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
        .score-warning { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
        .score-poor { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .highlight { padding: 10px; margin: 5px 0; border-left: 4px solid #10b981; background: #f0fdf4; }
        .concern { padding: 10px; margin: 5px 0; border-left: 4px solid #ef4444; background: #fef2f2; }
        .recommendation { padding: 10px; margin: 5px 0; border-left: 4px solid #3b82f6; background: #eff6ff; }
        .timestamp { color: #6b7280; font-size: 0.9em; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status-excellent { background: #10b981; color: white; }
        .status-good { background: #3b82f6; color: white; }
        .status-warning { background: #f59e0b; color: white; }
        .status-poor { background: #ef4444; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>综合质量报告</h1>
            <p class="timestamp">生成时间: ${new Date(metadata.timestamp).toLocaleString('zh-CN')}</p>
            <p>分支: <strong>${metadata.branch}</strong> | 提交: <strong>${metadata.commit?.substring(0, 8) || 'unknown'}</strong></p>
            
            <div class="score-circle score-${summary.status}">
                ${summary.overallScore}/100
            </div>
            <div style="text-align: center;">
                <span class="status-badge status-${summary.status}">${summary.status}</span>
            </div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>测试覆盖率</h3>
                <div class="metric-value" style="color: ${summary.metrics.coverage >= 85 ? '#10b981' : '#ef4444'}">
                    ${summary.metrics.coverage}%
                </div>
                <p>代码覆盖率</p>
            </div>
            
            <div class="metric-card">
                <h3>性能评分</h3>
                <div class="metric-value" style="color: ${summary.metrics.performance >= 80 ? '#10b981' : '#ef4444'}">
                    ${summary.metrics.performance}%
                </div>
                <p>构建和测试性能</p>
            </div>
            
            <div class="metric-card">
                <h3>代码质量</h3>
                <div class="metric-value" style="color: ${summary.metrics.quality >= 90 ? '#10b981' : '#ef4444'}">
                    ${summary.metrics.quality}%
                </div>
                <p>质量门禁通过率</p>
            </div>
            
            <div class="metric-card">
                <h3>安全评分</h3>
                <div class="metric-value" style="color: ${summary.metrics.security >= 100 ? '#10b981' : '#ef4444'}">
                    ${summary.metrics.security}%
                </div>
                <p>安全漏洞检查</p>
            </div>
        </div>
        
        ${
          summary.highlights.length > 0
            ? `
        <div class="section">
            <h3>🌟 亮点</h3>
            ${summary.highlights.map((highlight) => `<div class="highlight">${highlight}</div>`).join('')}
        </div>
        `
            : ''
        }
        
        ${
          summary.concerns.length > 0
            ? `
        <div class="section">
            <h3>⚠️ 关注点</h3>
            ${summary.concerns.map((concern) => `<div class="concern">${concern}</div>`).join('')}
        </div>
        `
            : ''
        }
        
        ${
          summary.recommendations.length > 0
            ? `
        <div class="section">
            <h3>💡 改进建议</h3>
            ${summary.recommendations.map((rec) => `<div class="recommendation">${rec}</div>`).join('')}
        </div>
        `
            : ''
        }
    </div>
</body>
</html>`;
  }

  /**
   * 生成 Markdown 报告
   */
  generateMarkdownReport(reportData) {
    const { summary, metadata } = reportData;

    return `# 综合质量报告

**生成时间**: ${new Date(metadata.timestamp).toLocaleString('zh-CN')}  
**分支**: ${metadata.branch}  
**提交**: ${metadata.commit?.substring(0, 8) || 'unknown'}  

## 📊 总体评分

**${summary.overallScore}/100** (${summary.status})

## 📈 关键指标

| 指标 | 评分 | 状态 |
|------|------|------|
| 测试覆盖率 | ${summary.metrics.coverage}% | ${summary.metrics.coverage >= 85 ? '✅' : '❌'} |
| 性能评分 | ${summary.metrics.performance}% | ${summary.metrics.performance >= 80 ? '✅' : '❌'} |
| 代码质量 | ${summary.metrics.quality}% | ${summary.metrics.quality >= 90 ? '✅' : '❌'} |
| 安全评分 | ${summary.metrics.security}% | ${summary.metrics.security >= 100 ? '✅' : '❌'} |

${
  summary.highlights.length > 0
    ? `
## 🌟 亮点

${summary.highlights.map((highlight) => `- ${highlight}`).join('\n')}
`
    : ''
}

${
  summary.concerns.length > 0
    ? `
## ⚠️ 关注点

${summary.concerns.map((concern) => `- ${concern}`).join('\n')}
`
    : ''
}

${
  summary.recommendations.length > 0
    ? `
## 💡 改进建议

${summary.recommendations.map((rec) => `- ${rec}`).join('\n')}
`
    : ''
}

---
*报告由自动化质量监控系统生成*`;
  }

  getProjectVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  getCurrentCommit() {
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getCurrentBranch() {
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
      }).trim();
    } catch {
      return 'unknown';
    }
  }
}

// 主执行函数
async function main() {
  const generator = new AutomatedReportGenerator();

  try {
    const report = await generator.generateComprehensiveReport();

    console.log('\n📊 报告摘要:');
    console.log(
      `总体评分: ${report.summary.overallScore}/100 (${report.summary.status})`,
    );
    console.log(`亮点: ${report.summary.highlights.length} 项`);
    console.log(`关注点: ${report.summary.concerns.length} 项`);
    console.log(`建议: ${report.summary.recommendations.length} 项`);

    // 如果评分过低，退出码为1
    if (report.summary.overallScore < 70) {
      console.log('\n⚠️  质量评分过低，请关注改进建议');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 自动化报告生成失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AutomatedReportGenerator };
