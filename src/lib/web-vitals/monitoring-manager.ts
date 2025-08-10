import { WEB_VITALS_CONSTANTS } from '@/constants/test-constants';
import { logger } from '@/lib/logger';
import { PerformanceAlertSystem } from './alert-system';
import { PerformanceBaselineManager } from './baseline-manager';
import { EnhancedWebVitalsCollector } from './collector';
import { PERFORMANCE_THRESHOLDS } from './constants';
import { PerformanceRegressionDetector } from './regression-detector';
import type {
    DetailedWebVitals,
    PerformanceAlertConfig,
    PerformanceBaseline,
    RegressionDetectionResult,
} from './types';

/**
 * 集成的性能监控管理器
 * 统一管理所有性能监控功能
 */
export class PerformanceMonitoringManager {
  private collector: EnhancedWebVitalsCollector;
  private baselineManager: PerformanceBaselineManager;
  private regressionDetector: PerformanceRegressionDetector;
  private alertSystem: PerformanceAlertSystem;
  private isInitialized = false;

  constructor() {
    this.collector = new EnhancedWebVitalsCollector();
    this.baselineManager = new PerformanceBaselineManager();
    this.regressionDetector = new PerformanceRegressionDetector();
    this.alertSystem = new PerformanceAlertSystem();
  }

  /**
   * 初始化性能监控系统
   */
  initialize(config?: {
    alertConfig?: Partial<PerformanceAlertConfig>;
    autoBaseline?: boolean;
    cleanupInterval?: number;
  }): void {
    if (this.isInitialized) return;

    // 配置预警系统
    if (config?.alertConfig) {
      this.alertSystem.configure(config.alertConfig);
    }

    // 设置自动清理
    if (config?.cleanupInterval) {
      setInterval(() => {
        this.baselineManager.cleanupOldBaselines();
      }, config.cleanupInterval);
    }

    // 设置自动基准保存
    if (config?.autoBaseline !== false) {
      this.setupAutoBaseline();
    }

    this.isInitialized = true;
    logger.info('Performance monitoring system initialized');
  }

  /**
   * 执行完整的性能监控流程
   */
  performFullMonitoring(buildInfo?: PerformanceBaseline['buildInfo']): {
    metrics: DetailedWebVitals;
    baseline: PerformanceBaseline | null;
    regressionResult: RegressionDetectionResult | null;
    report: string;
  } {
    try {
      // 1. 收集当前性能指标
      const metrics = this.collector.getDetailedMetrics();

      // 2. 获取基准数据
      const page = this.extractPageIdentifier(metrics.page.url);
      const locale = this.extractLocale(metrics.page.url);
      const baseline = this.baselineManager.getRecentBaseline(page, locale);

      // 3. 检测回归
      let regressionResult: RegressionDetectionResult | null = null;
      if (baseline) {
        regressionResult = this.regressionDetector.detectRegression(
          metrics,
          baseline,
        );
      }

      // 4. 检查预警
      this.alertSystem.checkAndAlert(metrics, regressionResult || undefined);

      // 5. 保存新的基准数据（如果需要）
      if (this.shouldSaveBaseline(metrics, baseline)) {
        this.baselineManager.saveBaseline(metrics, buildInfo);
      }

      // 6. 生成综合报告
      const report = this.generateComprehensiveReport(
        metrics,
        baseline,
        regressionResult,
      );

      return {
        metrics,
        baseline,
        regressionResult,
        report,
      };
    } catch (error) {
      logger.error('Failed to perform full monitoring', { error });
      throw error;
    }
  }

  /**
   * 生成报告头部信息
   */
  private generateReportHeader(metrics: DetailedWebVitals): string[] {
    const lines: string[] = [];
    lines.push('📊 综合性能监控报告');
    lines.push('='.repeat(WEB_VITALS_CONSTANTS.REPORT_ITEM_LIMIT));
    lines.push(`🕐 时间: ${new Date(metrics.page.timestamp).toLocaleString()}`);
    lines.push(`📄 页面: ${metrics.page.title}`);
    lines.push(`🌐 URL: ${metrics.page.url}`);
    lines.push('');
    return lines;
  }

  /**
   * 生成核心指标部分
   */
  private generateCoreMetricsSection(metrics: DetailedWebVitals): string[] {
    const lines: string[] = [];
    lines.push('🎯 核心 Web Vitals:');
    lines.push(
      `  CLS: ${metrics.cls.toFixed(WEB_VITALS_CONSTANTS.DECIMAL_PLACES_THREE)} ${this.getMetricStatus('cls', metrics.cls)}`,
    );
    lines.push(
      `  FID: ${Math.round(metrics.fid)}ms ${this.getMetricStatus('fid', metrics.fid)}`,
    );
    lines.push(
      `  LCP: ${Math.round(metrics.lcp)}ms ${this.getMetricStatus('lcp', metrics.lcp)}`,
    );
    lines.push(
      `  FCP: ${Math.round(metrics.fcp)}ms ${this.getMetricStatus('fcp', metrics.fcp)}`,
    );
    lines.push(
      `  TTFB: ${Math.round(metrics.ttfb)}ms ${this.getMetricStatus('ttfb', metrics.ttfb)}`,
    );
    lines.push('');
    return lines;
  }

  /**
   * 生成基准对比部分
   */
  private generateBaselineComparisonSection(
    metrics: DetailedWebVitals,
    baseline: PerformanceBaseline,
  ): string[] {
    const lines: string[] = [];
    lines.push('📈 与基准对比:');
    lines.push(
      `  基准时间: ${new Date(baseline.timestamp).toLocaleString()}`,
    );

    const metricsToCompare: Array<keyof PerformanceBaseline['metrics']> = [
      'cls',
      'fid',
      'lcp',
      'fcp',
      'ttfb',
    ];

    metricsToCompare.forEach((metric) => {
      // 安全的对象属性访问，避免对象注入
      const safeMetrics = new Map(Object.entries(metrics));
      const safeBaseline = new Map(Object.entries(baseline.metrics));
      const current = safeMetrics.get(metric) as number;
      const baselineValue = safeBaseline.get(metric);

      if (current && baselineValue) {
        const change = current - baselineValue;
        const changePercent =
          (change / baselineValue) * WEB_VITALS_CONSTANTS.PERFECT_SCORE;
        const trend = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
        lines.push(
          `  ${metric.toUpperCase()}: ${trend} ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
        );
      }
    });

    lines.push('');
    return lines;
  }

  /**
   * 生成慢速资源部分
   */
  private generateSlowResourcesSection(metrics: DetailedWebVitals): string[] {
    const lines: string[] = [];

    if (metrics.resourceTiming.slowResources.length > 0) {
      lines.push('🐌 慢速资源:');
      metrics.resourceTiming.slowResources
        .slice(0, WEB_VITALS_CONSTANTS.SCORE_MULTIPLIER_POOR)
        .forEach((resource, index) => {
          lines.push(
            `  ${index + 1}. ${resource.type}: ${resource.duration}ms - ${resource.name.split('/').pop()}`,
          );
        });
      lines.push('');
    }

    return lines;
  }

  /**
   * 生成环境信息部分
   */
  private generateEnvironmentSection(metrics: DetailedWebVitals): string[] {
    const lines: string[] = [];
    lines.push('💻 环境信息:');
    lines.push(
      `  视口: ${metrics.device.viewport.width}x${metrics.device.viewport.height}`,
    );

    if (metrics.device.memory) {
      lines.push(`  内存: ${metrics.device.memory}GB`);
    }

    if (metrics.device.cores) {
      lines.push(`  CPU核心: ${metrics.device.cores}`);
    }

    if (metrics.connection) {
      lines.push(
        `  网络: ${metrics.connection.effectiveType} (${metrics.connection.downlink}Mbps)`,
      );
    }

    return lines;
  }

  /**
   * 生成综合性能报告
   */
  generateComprehensiveReport(
    metrics: DetailedWebVitals,
    baseline: PerformanceBaseline | null,
    regressionResult: RegressionDetectionResult | null,
  ): string {
    const sections: string[][] = [];

    // 添加各个部分
    sections.push(this.generateReportHeader(metrics));
    sections.push(this.generateCoreMetricsSection(metrics));

    // 基准对比
    if (baseline) {
      sections.push(this.generateBaselineComparisonSection(metrics, baseline));
    }

    // 回归检测结果
    if (regressionResult) {
      sections.push([
        this.regressionDetector.generateRegressionReport(regressionResult),
        '',
      ]);
    }

    // 慢速资源
    sections.push(this.generateSlowResourcesSection(metrics));

    // 环境信息
    sections.push(this.generateEnvironmentSection(metrics));

    // 合并所有部分
    return sections.flat().join('\n');
  }

  /**
   * 获取指标状态的辅助函数
   */
  private getStandardMetricStatus(
    value: number,
    goodThreshold: number,
    needsImprovementThreshold: number,
  ): string {
    if (value <= goodThreshold) return '🟢';
    if (value <= needsImprovementThreshold) return '🟡';
    return '🔴';
  }

  /**
   * 获取指标状态
   */
  private getMetricStatus(metric: string, value: number): string {
    const thresholds = PERFORMANCE_THRESHOLDS;

    // 定义指标阈值映射
    const metricThresholds = {
      cls: {
        good: thresholds.CLS_GOOD,
        needsImprovement: thresholds.CLS_NEEDS_IMPROVEMENT,
      },
      fid: {
        good: thresholds.FID_GOOD,
        needsImprovement: thresholds.FID_NEEDS_IMPROVEMENT,
      },
      lcp: {
        good: thresholds.LCP_GOOD,
        needsImprovement: thresholds.LCP_NEEDS_IMPROVEMENT,
      },
      fcp: {
        good: thresholds.FCP_GOOD,
        needsImprovement: WEB_VITALS_CONSTANTS.FCP_NEEDS_IMPROVEMENT_THRESHOLD,
      },
      ttfb: {
        good: thresholds.TTFB_GOOD,
        needsImprovement: thresholds.TTFB_NEEDS_IMPROVEMENT,
      },
    };

    const threshold = metricThresholds[metric as keyof typeof metricThresholds];
    if (!threshold) {
      return '';
    }

    return this.getStandardMetricStatus(
      value,
      threshold.good,
      threshold.needsImprovement,
    );
  }

  /**
   * 设置自动基准保存
   */
  private setupAutoBaseline(): void {
    // 页面加载完成后延迟保存基准
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const metrics = this.collector.getDetailedMetrics();
          if (this.isValidMetrics(metrics)) {
            this.baselineManager.saveBaseline(metrics);
          }
        }, WEB_VITALS_CONSTANTS.BASELINE_SAVE_DELAY); // 等待5秒确保所有指标收集完成
      });
    }
  }

  /**
   * 判断是否应该保存基准数据
   */
  private shouldSaveBaseline(
    _metrics: DetailedWebVitals,
    baseline: PerformanceBaseline | null,
  ): boolean {
    if (!baseline) return true; // 没有基准数据时总是保存

    // 如果距离上次基准超过24小时，保存新基准
    const hoursSinceBaseline =
      (Date.now() - baseline.timestamp) /
      (WEB_VITALS_CONSTANTS.MILLISECONDS_PER_SECOND *
        WEB_VITALS_CONSTANTS.SECONDS_PER_MINUTE *
        WEB_VITALS_CONSTANTS.MINUTES_PER_HOUR);
    return hoursSinceBaseline > WEB_VITALS_CONSTANTS.BASELINE_REFRESH_HOURS;
  }

  /**
   * 验证指标数据有效性
   */
  private isValidMetrics(metrics: DetailedWebVitals): boolean {
    return metrics.lcp > 0 && metrics.fcp > 0 && metrics.ttfb > 0;
  }

  /**
   * 提取页面标识符
   */
  private extractPageIdentifier(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * 提取locale
   */
  private extractLocale(url: string): string {
    const match = url.match(/\/([a-z]{2})(?:\/|$)/);
    return match?.[1] ?? 'en';
  }

  /**
   * 获取性能摘要
   */
  getPerformanceSummary(): {
    metrics: DetailedWebVitals;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  } {
    const metrics = this.collector.getDetailedMetrics();
    const report = this.collector.generateDiagnosticReport();

    const grade = this.calculateGrade(report.analysis.score);

    return {
      metrics,
      score: report.analysis.score,
      grade,
    };
  }

  /**
   * 计算性能等级
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= WEB_VITALS_CONSTANTS.GRADE_A_THRESHOLD) return 'A';
    if (score >= WEB_VITALS_CONSTANTS.GRADE_B_THRESHOLD) return 'B';
    if (score >= WEB_VITALS_CONSTANTS.GRADE_C_THRESHOLD) return 'C';
    if (score >= WEB_VITALS_CONSTANTS.GRADE_D_THRESHOLD) return 'D';
    return 'F';
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.collector.cleanup();
    this.isInitialized = false;
  }
}
