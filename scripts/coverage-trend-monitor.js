#!/usr/bin/env node

/**
 * 覆盖率趋势监控系统
 *
 * 监控测试覆盖率变化趋势，提供预警和分析功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CoverageTrendMonitor {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'reports', 'coverage-trends');
    this.coverageDir = path.join(process.cwd(), 'coverage');
    this.thresholds = {
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
    };
    this.alertThresholds = {
      decline: -5, // 下降5%触发警报
      criticalLevel: 70, // 低于70%触发严重警报
    };

    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 收集当前覆盖率数据
   */
  async collectCoverageData() {
    console.log('📊 收集覆盖率数据...');

    try {
      // 运行覆盖率测试
      console.log('🧪 运行测试以生成覆盖率报告...');
      execSync('pnpm test:coverage --run --reporter=json', {
        stdio: 'pipe',
        timeout: 180000,
      });

      // 读取覆盖率数据
      const coverageJsonPath = path.join(
        this.coverageDir,
        'coverage-summary.json',
      );

      if (!fs.existsSync(coverageJsonPath)) {
        throw new Error('覆盖率报告文件不存在');
      }

      const rawData = fs.readFileSync(coverageJsonPath, 'utf8');
      const coverageData = JSON.parse(rawData);

      const timestamp = new Date().toISOString();
      const data = {
        timestamp,
        total: coverageData.total,
        files: Object.keys(coverageData).filter((key) => key !== 'total')
          .length,
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
      };

      // 保存数据点
      this.saveCoverageDataPoint(data);

      console.log('✅ 覆盖率数据收集完成');
      return data;
    } catch (error) {
      console.error('❌ 覆盖率数据收集失败:', error.message);

      // 返回默认数据以避免中断流程
      const timestamp = new Date().toISOString();
      return {
        timestamp,
        total: {
          lines: { pct: 0 },
          functions: { pct: 0 },
          branches: { pct: 0 },
          statements: { pct: 0 },
        },
        files: 0,
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
        error: error.message,
      };
    }
  }

  /**
   * 保存覆盖率数据点
   */
  saveCoverageDataPoint(data) {
    const filename = `coverage-${Date.now()}.json`;
    const filepath = path.join(this.dataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    // 清理旧数据（保留最近30天）
    this.cleanupOldData();
  }

  /**
   * 清理旧数据
   */
  cleanupOldData() {
    try {
      const files = fs.readdirSync(this.dataDir);
      const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30天前

      files.forEach((file) => {
        if (file.startsWith('coverage-') && file.endsWith('.json')) {
          const timestamp = parseInt(
            file.replace('coverage-', '').replace('.json', ''),
          );
          if (timestamp < cutoffTime) {
            fs.unlinkSync(path.join(this.dataDir, file));
          }
        }
      });
    } catch (error) {
      console.warn('⚠️  清理旧数据时出错:', error.message);
    }
  }

  /**
   * 分析覆盖率趋势
   */
  analyzeTrends() {
    console.log('📈 分析覆盖率趋势...');

    const dataPoints = this.loadHistoricalData();

    if (dataPoints.length < 2) {
      return {
        status: 'insufficient-data',
        message: '数据点不足，无法分析趋势',
        dataPoints: dataPoints.length,
      };
    }

    const latest = dataPoints[dataPoints.length - 1];
    const previous = dataPoints[dataPoints.length - 2];

    const trends = {};
    const alerts = [];

    ['lines', 'functions', 'branches', 'statements'].forEach((metric) => {
      const currentPct = latest.total[metric]?.pct || 0;
      const previousPct = previous.total[metric]?.pct || 0;
      const change = currentPct - previousPct;
      const changePercent = previousPct > 0 ? (change / previousPct) * 100 : 0;

      trends[metric] = {
        current: currentPct,
        previous: previousPct,
        change,
        changePercent,
        trend: this.calculateTrend(change),
        status: this.getMetricStatus(currentPct, metric),
      };

      // 检查警报条件
      if (change < this.alertThresholds.decline) {
        alerts.push({
          type: 'decline',
          metric,
          severity: 'warning',
          message: `${metric} 覆盖率下降 ${Math.abs(change).toFixed(1)}%`,
          current: currentPct,
          previous: previousPct,
        });
      }

      if (currentPct < this.alertThresholds.criticalLevel) {
        alerts.push({
          type: 'critical-level',
          metric,
          severity: 'critical',
          message: `${metric} 覆盖率 ${currentPct}% 低于临界水平`,
          current: currentPct,
          threshold: this.alertThresholds.criticalLevel,
        });
      }

      if (currentPct < this.thresholds[metric]) {
        alerts.push({
          type: 'below-threshold',
          metric,
          severity: 'medium',
          message: `${metric} 覆盖率 ${currentPct}% 低于目标 ${this.thresholds[metric]}%`,
          current: currentPct,
          threshold: this.thresholds[metric],
        });
      }
    });

    // 计算总体趋势
    const overallTrend = this.calculateOverallTrend(trends);

    return {
      status: 'success',
      timestamp: latest.timestamp,
      trends,
      overallTrend,
      alerts,
      dataPoints: dataPoints.length,
      timespan: this.calculateTimespan(dataPoints),
    };
  }

  /**
   * 加载历史数据
   */
  loadHistoricalData() {
    try {
      const files = fs
        .readdirSync(this.dataDir)
        .filter(
          (file) => file.startsWith('coverage-') && file.endsWith('.json'),
        )
        .sort();

      return files
        .slice(-30)
        .map((file) => {
          const content = fs.readFileSync(
            path.join(this.dataDir, file),
            'utf8',
          );
          return JSON.parse(content);
        })
        .filter((data) => data.total && !data.error);
    } catch (error) {
      console.warn('⚠️  加载历史数据时出错:', error.message);
      return [];
    }
  }

  /**
   * 计算趋势方向
   */
  calculateTrend(change) {
    if (change > 1) return 'improving';
    if (change < -1) return 'declining';
    return 'stable';
  }

  /**
   * 获取指标状态
   */
  getMetricStatus(current, metric) {
    const threshold = this.thresholds[metric];
    if (current >= threshold) return 'good';
    if (current >= threshold * 0.9) return 'warning';
    return 'poor';
  }

  /**
   * 计算总体趋势
   */
  calculateOverallTrend(trends) {
    const trendValues = Object.values(trends);
    const improvingCount = trendValues.filter(
      (t) => t.trend === 'improving',
    ).length;
    const decliningCount = trendValues.filter(
      (t) => t.trend === 'declining',
    ).length;

    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
  }

  /**
   * 计算时间跨度
   */
  calculateTimespan(dataPoints) {
    if (dataPoints.length < 2) return null;

    const first = new Date(dataPoints[0].timestamp);
    const last = new Date(dataPoints[dataPoints.length - 1].timestamp);
    const diffDays = Math.ceil((last - first) / (1000 * 60 * 60 * 24));

    return {
      days: diffDays,
      from: first.toISOString().split('T')[0],
      to: last.toISOString().split('T')[0],
    };
  }

  /**
   * 生成趋势报告
   */
  generateTrendReport(analysis) {
    console.log('\n📊 覆盖率趋势报告');
    console.log('='.repeat(50));

    if (analysis.status === 'insufficient-data') {
      console.log('⚠️ ', analysis.message);
      return;
    }

    console.log(`📅 时间跨度: ${analysis.timespan?.days || 0} 天`);
    console.log(
      `📈 总体趋势: ${this.getTrendEmoji(analysis.overallTrend)} ${analysis.overallTrend}`,
    );
    console.log(`🚨 警报数量: ${analysis.alerts.length}`);

    console.log('\n📊 各项指标:');
    Object.entries(analysis.trends).forEach(([metric, data]) => {
      const emoji = this.getTrendEmoji(data.trend);
      const statusEmoji = this.getStatusEmoji(data.status);
      console.log(
        `  ${statusEmoji} ${metric}: ${data.current.toFixed(1)}% ${emoji} (${data.change >= 0 ? '+' : ''}${data.change.toFixed(1)}%)`,
      );
    });

    if (analysis.alerts.length > 0) {
      console.log('\n🚨 警报详情:');
      analysis.alerts.forEach((alert) => {
        const severityEmoji = this.getSeverityEmoji(alert.severity);
        console.log(`  ${severityEmoji} ${alert.message}`);
      });
    }

    // 保存报告
    const reportPath = path.join(
      this.dataDir,
      `trend-report-${Date.now()}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`\n💾 报告已保存: ${reportPath}`);
  }

  getTrendEmoji(trend) {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'good':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '❓';
    }
  }

  getSeverityEmoji(severity) {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'medium':
        return '🟠';
      default:
        return '🔵';
    }
  }

  getCurrentCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * 生成覆盖率徽章
   */
  generateCoverageBadge(analysis) {
    if (analysis.status === 'insufficient-data') return;

    const linesCoverage = analysis.trends.lines?.current || 0;
    const color =
      linesCoverage >= 85
        ? 'brightgreen'
        : linesCoverage >= 70
          ? 'yellow'
          : 'red';

    const badgeUrl = `https://img.shields.io/badge/coverage-${linesCoverage.toFixed(1)}%25-${color}`;

    const badgePath = path.join(this.dataDir, 'coverage-badge.json');
    fs.writeFileSync(
      badgePath,
      JSON.stringify(
        {
          url: badgeUrl,
          coverage: linesCoverage,
          color,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    console.log(`🏷️  覆盖率徽章: ${badgeUrl}`);
  }
}

// 主执行函数
async function main() {
  const monitor = new CoverageTrendMonitor();

  try {
    // 收集当前覆盖率数据
    const currentData = await monitor.collectCoverageData();

    // 分析趋势
    const analysis = monitor.analyzeTrends();

    // 生成报告
    monitor.generateTrendReport(analysis);

    // 生成徽章
    monitor.generateCoverageBadge(analysis);

    // 如果有严重警报，退出码为1
    if (
      analysis.alerts &&
      analysis.alerts.some((alert) => alert.severity === 'critical')
    ) {
      console.log('\n🔴 检测到严重覆盖率问题，请立即处理！');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 覆盖率趋势监控失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CoverageTrendMonitor };
