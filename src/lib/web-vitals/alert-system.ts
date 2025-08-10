import { logger } from '@/lib/logger';
import { WEB_VITALS_CONSTANTS } from '@/constants/test-constants';
import type {
  DetailedWebVitals,
  PerformanceAlertConfig,
  RegressionDetectionResult,
} from './types';

/**
 * 性能预警系统
 * 负责监控性能指标并发送预警通知
 */
export class PerformanceAlertSystem {
  private config: PerformanceAlertConfig = {
    enabled: true,
    thresholds: {
      cls: {
        warning: WEB_VITALS_CONSTANTS.CLS_GOOD_THRESHOLD,
        critical: WEB_VITALS_CONSTANTS.CLS_NEEDS_IMPROVEMENT_THRESHOLD,
      },
      lcp: {
        warning: WEB_VITALS_CONSTANTS.LCP_GOOD_THRESHOLD,
        critical: WEB_VITALS_CONSTANTS.LCP_NEEDS_IMPROVEMENT_THRESHOLD,
      },
      fid: {
        warning: WEB_VITALS_CONSTANTS.FID_GOOD_THRESHOLD,
        critical: WEB_VITALS_CONSTANTS.FID_NEEDS_IMPROVEMENT_THRESHOLD,
      },
      fcp: {
        warning: WEB_VITALS_CONSTANTS.FCP_GOOD_THRESHOLD,
        critical: WEB_VITALS_CONSTANTS.FCP_NEEDS_IMPROVEMENT_THRESHOLD,
      },
      ttfb: {
        warning: WEB_VITALS_CONSTANTS.TTFB_GOOD_THRESHOLD,
        critical: WEB_VITALS_CONSTANTS.TTFB_NEEDS_IMPROVEMENT_THRESHOLD,
      },
      score: { warning: 70, critical: 50 },
    },
    channels: {
      console: true,
      storage: true,
    },
  };

  // 警报历史记录
  private alertHistory: Array<{
    id: string;
    timestamp: number;
    severity: 'warning' | 'critical';
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
    level?: 'warning' | 'critical'; // 为了兼容测试
  }> = [];

  /**
   * 配置预警系统
   */
  configure(config: Partial<PerformanceAlertConfig> & { notifications?: any; webhook?: string }): void {
    // 处理测试中的notifications配置
    if ('notifications' in config) {
      const notifications = config.notifications;
      if (notifications) {
        this.config.channels = {
          ...this.config.channels,
          console: notifications.console ?? this.config.channels.console,
          storage: notifications.storage ?? this.config.channels.storage,
        };

        // 处理webhook配置
        if (notifications.webhook) {
          this.config.channels.webhook = notifications.webhook;
        }
      }

      // 移除notifications属性，避免类型错误
      const { notifications: _, ...restConfig } = config;
      this.config = { ...this.config, ...restConfig };
    } else {
      this.config = { ...this.config, ...config };
    }

    // 直接处理webhook配置
    if ('webhook' in config && config.webhook) {
      this.config.channels = this.config.channels || {};
      this.config.channels.webhook = config.webhook;
    }
  }

  /**
   * 检查性能指标并发送预警
   */
  checkAndAlert(
    metrics: DetailedWebVitals,
    regressionResult?: RegressionDetectionResult,
  ): void {
    if (!this.config.enabled) return;

    const alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
      threshold?: number;
    }> = [];

    // 检查核心指标阈值
    this.checkMetricThresholds(metrics, alerts);

    // 检查回归预警
    if (regressionResult) {
      this.checkRegressionAlerts(regressionResult, alerts);
    }

    // 发送预警
    if (alerts.length > 0) {
      this.sendAlerts(alerts);
    }
  }

  /**
   * 检查指标阈值
   */
  private checkMetricThresholds(
    metrics: DetailedWebVitals,
    alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
      threshold?: number;
    }>,
  ): void {
    const metricsToCheck = [
      { key: 'cls', value: metrics.cls, name: 'Cumulative Layout Shift' },
      { key: 'fid', value: metrics.fid, name: 'First Input Delay' },
      { key: 'lcp', value: metrics.lcp, name: 'Largest Contentful Paint' },
      { key: 'fcp', value: metrics.fcp, name: 'First Contentful Paint' },
      { key: 'ttfb', value: metrics.ttfb, name: 'Time to First Byte' },
    ] as const;

    metricsToCheck.forEach(({ key, value, name }) => {
      if (!value) return;

      // 安全的对象属性访问，避免对象注入
      const safeThresholds = new Map(Object.entries(this.config.thresholds));
      const thresholds = safeThresholds.get(key);
      if (!thresholds) return;

      if (value >= thresholds.critical) {
        alerts.push({
          type: 'metric',
          severity: 'critical',
          message: `🔴 ${name} 严重超标: ${this.formatMetricValue(key, value)} (阈值: ${this.formatMetricValue(key, thresholds.critical)})`,
          metric: key,
          value,
          threshold: thresholds.critical,
        });
      } else if (value >= thresholds.warning) {
        alerts.push({
          type: 'metric',
          severity: 'warning',
          message: `🟡 ${name} 超出警告线: ${this.formatMetricValue(key, value)} (阈值: ${this.formatMetricValue(key, thresholds.warning)})`,
          metric: key,
          value,
          threshold: thresholds.warning,
        });
      }
    });
  }

  /**
   * 检查回归预警
   */
  private checkRegressionAlerts(
    regressionResult: RegressionDetectionResult,
    alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
      threshold?: number;
    }>,
  ): void {
    if (regressionResult.summary.criticalRegressions > 0) {
      alerts.push({
        type: 'regression',
        severity: 'critical',
        message: `🚨 检测到 ${regressionResult.summary.criticalRegressions} 个关键性能回归`,
      });
    } else if (regressionResult.summary.totalRegressions > 0) {
      alerts.push({
        type: 'regression',
        severity: 'warning',
        message: `⚠️ 检测到 ${regressionResult.summary.totalRegressions} 个性能回归`,
      });
    }
  }

  /**
   * 发送预警
   */
  private sendAlerts(
    alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
      threshold?: number;
    }>,
  ): void {
    // 添加到历史记录
    alerts.forEach((alert) => {
      const historyEntry = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        severity: alert.severity,
        message: alert.message,
        level: alert.severity, // 为了兼容测试
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
      };
      this.alertHistory.push(historyEntry);
    });

    // 限制历史记录大小
    if (this.alertHistory.length > 100) {
      this.alertHistory.splice(0, this.alertHistory.length - 100);
    }

    // 控制台通知
    if (this.config.channels.console) {
      this.sendConsoleAlerts(alerts);
    }

    // 存储通知
    if (this.config.channels.storage) {
      this.storeAlerts(alerts);
    }

    // 回调通知
    if (this.config.channels.callback) {
      alerts.forEach((alert) => {
        const performanceAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          severity: alert.severity,
          metric: alert.metric || 'unknown',
          value: alert.value || 0,
          threshold: alert.threshold || 0,
          message: alert.message,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          context: {},
        };
        this.config.channels.callback!(performanceAlert);
      });
    }
  }

  /**
   * 发送控制台预警
   */
  private sendConsoleAlerts(
    alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
      threshold?: number;
    }>,
  ): void {
    // 直接使用console.warn以确保在测试环境中可以被Mock
    console.warn('🚨 性能预警系统', {
      alertCount: alerts.length,
      alerts: alerts.map((alert) => ({
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
      })),
    });

    alerts.forEach((alert) => {
      if (alert.severity === 'critical') {
        console.warn(alert.message, {
          type: alert.type,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
        });
      } else {
        console.warn(alert.message, {
          type: alert.type,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
        });
      }
    });
  }

  /**
   * 存储预警到本地存储
   */
  private storeAlerts(
    alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
      threshold?: number;
    }>,
  ): void {
    try {
      const storedAlerts = JSON.parse(
        localStorage.getItem('performance-alerts') || '[]',
      );
      const newAlerts = alerts.map((alert) => ({
        ...alert,
        timestamp: Date.now(),
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      storedAlerts.push(...newAlerts);

      // 只保留最近100个预警
      if (storedAlerts.length > 100) {
        storedAlerts.splice(0, storedAlerts.length - 100);
      }

      localStorage.setItem('performance-alerts', JSON.stringify(storedAlerts));
    } catch (error) {
      logger.error('Failed to store alerts', { error });
    }
  }

  /**
   * 格式化指标值
   */
  private formatMetricValue(metric: string, value: number): string {
    switch (metric) {
      case 'cls':
        return value.toFixed(WEB_VITALS_CONSTANTS.DECIMAL_PLACES_THREE);
      case 'fid':
      case 'lcp':
      case 'fcp':
      case 'ttfb':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  }

  /**
   * 检查指标并触发警报 (测试方法)
   */
  checkMetrics(metrics: any): void {
    if (!this.config.enabled) return;

    const alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
    }> = [];

    this.checkMetricThresholds(metrics, alerts);

    if (alerts.length > 0) {
      this.sendAlerts(alerts);
    }
  }

  /**
   * 发送单个警报 (测试方法)
   */
  sendAlert(severity: 'warning' | 'critical', message: string, data?: any): Promise<void> {
    const alert = {
      type: 'metric' as const,
      severity,
      message,
      ...data,
    };

    // 直接添加到历史记录，不通过sendAlerts避免重复
    const historyEntry = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity,
      message,
      level: severity, // 为了兼容测试
      ...data,
    };
    this.alertHistory.push(historyEntry);

    // 限制历史记录大小
    if (this.alertHistory.length > 100) {
      this.alertHistory.splice(0, this.alertHistory.length - 100);
    }

    // 直接发送通知，不通过sendAlerts避免重复添加历史
    if (this.config.channels.console) {
      this.sendConsoleAlerts([alert]);
    }

    // 处理webhook通知
    if (this.config.channels?.webhook) {
      return this.sendWebhookNotification(alert);
    }

    return Promise.resolve();
  }

  /**
   * 获取警报历史 (测试方法)
   */
  getAlertHistory(): Array<{
    id: string;
    timestamp: number;
    severity: 'warning' | 'critical';
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
    level?: 'warning' | 'critical'; // 为了兼容测试
  }> {
    return [...this.alertHistory];
  }

  /**
   * 清除警报历史 (测试方法)
   */
  clearAlertHistory(): void {
    this.alertHistory = [];
  }

  /**
   * 清除历史记录的别名方法 (测试兼容)
   */
  clearHistory(): void {
    this.clearAlertHistory();
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhookNotification(alert: {
    type: 'metric' | 'regression';
    severity: 'warning' | 'critical';
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
  }): Promise<void> {
    if (!this.config.channels?.webhook) {
      return;
    }

    try {
      const payload = {
        alert: {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          severity: alert.severity,
          metric: alert.metric || 'unknown',
          value: alert.value || 0,
          threshold: alert.threshold || 0,
          message: alert.message,
          url: typeof window !== 'undefined' && window.location ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          context: {},
        },
      };

      await fetch(this.config.channels.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error('Failed to send webhook notification', { error });
    }
  }
}
