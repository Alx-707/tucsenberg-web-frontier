/**
 * 性能监控核心指标管理
 * Performance Monitoring Core Metrics Management
 * 
 * 负责性能指标的记录、存储、清理和实时分析功能
 */

import type {
  PerformanceMetrics,
  PerformanceConfig,
  PerformanceMetricType,
  PerformanceMetricSource,
} from './performance-monitoring-types';
import { MB } from '@/constants/units';
import { logger } from '@/lib/logger';

/**
 * 指标管理器
 * Metrics manager
 */
export class PerformanceMetricsManager {
  private metrics: PerformanceMetrics[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private config: PerformanceConfig;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.setupPeriodicCleanup();
  }

  /**
   * 设置定期清理
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    const cleanupInterval = this.config.global?.dataRetentionTime || 5 * 60 * 1000; // 5分钟
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, cleanupInterval);
  }

  /**
   * 清理旧指标
   * Cleanup old metrics
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const retentionTime = this.config.global?.dataRetentionTime || 5 * 60 * 1000;
    const maxMetrics = this.config.global?.maxMetrics || 1000;

    // 按时间清理
    this.metrics = this.metrics.filter(metric => 
      now - metric.timestamp < retentionTime
    );

    // 按数量清理（保留最新的）
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxMetrics);
    }
  }

  /**
   * 生成指标ID
   * Generate metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录性能指标
   * Record performance metric
   */
  recordMetric(metric: Omit<PerformanceMetrics, 'timestamp'>): void {
    if (!this.config.global?.enabled) {
      return;
    }

    // 检查特定类型是否启用
    const moduleConfig = this.getModuleConfig(metric.type);
    if (!moduleConfig?.enabled) {
      return;
    }

    const fullMetric: PerformanceMetrics = {
      ...metric,
      id: metric.id || this.generateMetricId(),
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);
    
    // 实时分析
    this.analyzeRealtimeMetric(fullMetric);

    // 立即清理如果超出限制
    const maxMetrics = this.config.global?.maxMetrics || 1000;
    if (this.metrics.length > maxMetrics * 1.1) { // 10%缓冲
      this.cleanupOldMetrics();
    }
  }

  /**
   * 获取模块配置
   * Get module configuration
   */
  private getModuleConfig(type: PerformanceMetricType) {
    switch (type) {
      case 'component':
        return this.config.component;
      case 'network':
        return this.config.network;
      case 'bundle':
        return this.config.bundle;
      default:
        return null;
    }
  }

  /**
   * 实时分析指标
   * Analyze realtime metric
   */
  private analyzeRealtimeMetric(metric: PerformanceMetrics): void {
    // 检查是否有性能问题需要立即关注
    const moduleConfig = this.getModuleConfig(metric.type);
    if (!moduleConfig?.thresholds) {
      return;
    }

    let isSlowPerformance = false;
    let threshold = 0;

    switch (metric.type) {
      case 'component':
        threshold = moduleConfig.thresholds.renderTime || 100;
        isSlowPerformance = (metric.value || 0) > threshold;
        break;
      case 'network':
        threshold = moduleConfig.thresholds.responseTime || 1000;
        isSlowPerformance = (metric.value || 0) > threshold;
        break;
      case 'bundle':
        threshold = moduleConfig.thresholds.size || MB; // 1MB
        isSlowPerformance = (metric.value || 0) > threshold;
        break;
    }

    if (isSlowPerformance) {
      logger.warn(`Performance warning: ${metric.type} metric exceeded threshold`, {
        metric: metric.name,
        value: metric.value,
        threshold,
        source: metric.source,
      });
    }
  }

  /**
   * 获取所有指标
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 获取指定时间窗口内的指标
   * Get metrics within time window
   */
  getMetricsInTimeWindow(timeWindow: number): PerformanceMetrics[] {
    const now = Date.now();
    return this.metrics.filter(metric => 
      now - metric.timestamp <= timeWindow
    );
  }

  /**
   * 按类型获取指标
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetricType): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  /**
   * 按来源获取指标
   * Get metrics by source
   */
  getMetricsBySource(source: PerformanceMetricSource): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.source === source);
  }

  /**
   * 获取指标统计
   * Get metrics statistics
   */
  getMetricsStats(): {
    total: number;
    byType: Record<PerformanceMetricType, number>;
    bySource: Record<PerformanceMetricSource, number>;
    timeRange: {
      oldest: number;
      newest: number;
      span: number;
    };
    averageValue: number;
  } {
    const stats = {
      total: this.metrics.length,
      byType: {} as Record<PerformanceMetricType, number>,
      bySource: {} as Record<PerformanceMetricSource, number>,
      timeRange: {
        oldest: 0,
        newest: 0,
        span: 0,
      },
      averageValue: 0,
    };

    if (this.metrics.length === 0) {
      return stats;
    }

    // 统计类型分布
    this.metrics.forEach(metric => {
      stats.byType[metric.type] = (stats.byType[metric.type] || 0) + 1;
      stats.bySource[metric.source] = (stats.bySource[metric.source] || 0) + 1;
    });

    // 计算时间范围
    const timestamps = this.metrics.map(m => m.timestamp);
    stats.timeRange.oldest = Math.min(...timestamps);
    stats.timeRange.newest = Math.max(...timestamps);
    stats.timeRange.span = stats.timeRange.newest - stats.timeRange.oldest;

    // 计算平均值
    const totalValue = this.metrics.reduce((sum, metric) => sum + (metric.value || 0), 0);
    stats.averageValue = totalValue / this.metrics.length;

    return stats;
  }

  /**
   * 计算每分钟平均指标数
   * Calculate average metrics per minute
   */
  calculateAverageMetricsPerMinute(): number {
    if (this.metrics.length === 0) {
      return 0;
    }

    const stats = this.getMetricsStats();
    const timeSpanMinutes = stats.timeRange.span / (60 * 1000);
    
    return timeSpanMinutes > 0 ? this.metrics.length / timeSpanMinutes : 0;
  }

  /**
   * 获取最近的指标
   * Get recent metrics
   */
  getRecentMetrics(count = 10): PerformanceMetrics[] {
    return this.metrics
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * 查找特定指标
   * Find specific metric
   */
  findMetric(id: string): PerformanceMetrics | undefined {
    return this.metrics.find(metric => metric.id === id);
  }

  /**
   * 删除指标
   * Remove metric
   */
  removeMetric(id: string): boolean {
    const index = this.metrics.findIndex(metric => metric.id === id);
    if (index > -1) {
      this.metrics.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 清空所有指标
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.metrics = [];
  }

  /**
   * 更新配置
   * Update configuration
   */
  updateConfig(newConfig: PerformanceConfig): void {
    this.config = newConfig;
    
    // 重新设置清理间隔
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.setupPeriodicCleanup();
  }

  /**
   * 导出指标数据
   * Export metrics data
   */
  exportMetrics(): {
    metrics: PerformanceMetrics[];
    exportTime: number;
    stats: ReturnType<typeof this.getMetricsStats>;
  } {
    return {
      metrics: [...this.metrics],
      exportTime: Date.now(),
      stats: this.getMetricsStats(),
    };
  }

  /**
   * 导入指标数据
   * Import metrics data
   */
  importMetrics(data: PerformanceMetrics[], replace = false): number {
    if (replace) {
      this.metrics = [];
    }

    let importedCount = 0;
    data.forEach(metric => {
      // 验证指标数据
      if (this.isValidMetric(metric)) {
        this.metrics.push(metric);
        importedCount += 1;
      }
    });

    // 清理重复和过期数据
    this.cleanupOldMetrics();

    return importedCount;
  }

  /**
   * 验证指标数据
   * Validate metric data
   */
  private isValidMetric(metric: unknown): metric is PerformanceMetrics {
    if (!metric || typeof metric !== 'object') {
      return false;
    }

    const m = metric as PerformanceMetrics;
    return !!(
      m.id &&
      m.name &&
      m.type &&
      m.source &&
      typeof m.timestamp === 'number' &&
      m.timestamp > 0
    );
  }

  /**
   * 销毁管理器
   * Destroy manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.metrics = [];
  }
}

/**
 * 创建指标管理器
 * Create metrics manager
 */
export function createMetricsManager(config: PerformanceConfig): PerformanceMetricsManager {
  return new PerformanceMetricsManager(config);
}
