import { ALERT_SYSTEM_CONSTANTS } from '@/constants/performance-constants';
import { WEB_VITALS_CONSTANTS } from '@/constants/test-constants';
import {
  extractCoreMetrics,
  formatMetricValue,
  getDefaultConnection,
  getDefaultDevice,
  getDefaultPage,
  getDefaultResourceTiming,
} from './alert-helpers';
import {
  sendConsoleAlerts,
  sendWebhookNotification,
  storeAlerts,
} from './alert-notifications';
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
  configure(
    config: Partial<PerformanceAlertConfig> & {
      notifications?: {
        console?: boolean;
        storage?: boolean;
        webhook?: string;
      };
      webhook?: string;
    },
  ): void {
    // 处理测试中的notifications配置
    if ('notifications' in config) {
      const { notifications } = config;
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
      const { notifications: _notifications, ...restConfig } = config;
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
          message: `🔴 ${name} 严重超标: ${formatMetricValue(key, value)} (阈值: ${formatMetricValue(key, thresholds.critical)})`,
          metric: key,
          value,
          threshold: thresholds.critical,
        });
      } else if (value >= thresholds.warning) {
        alerts.push({
          type: 'metric',
          severity: 'warning',
          message: `🟡 ${name} 超出警告线: ${formatMetricValue(key, value)} (阈值: ${formatMetricValue(key, thresholds.warning)})`,
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
        id: `alert-${Date.now()}-${Math.random().toString(ALERT_SYSTEM_CONSTANTS.RANDOM_ID_BASE).substr(ALERT_SYSTEM_CONSTANTS.RANDOM_ID_START, ALERT_SYSTEM_CONSTANTS.RANDOM_ID_LENGTH)}`,
        timestamp: Date.now(),
        severity: alert.severity,
        message: alert.message,
        level: alert.severity, // 为了兼容测试
        ...(alert.metric && { metric: alert.metric }),
        ...(alert.value !== undefined && { value: alert.value }),
        ...(alert.threshold !== undefined && { threshold: alert.threshold }),
      };
      this.alertHistory.push(historyEntry);
    });

    // 限制历史记录大小
    if (this.alertHistory.length > 100) {
      this.alertHistory.splice(0, this.alertHistory.length - 100);
    }

    // 控制台通知
    if (this.config.channels.console) {
      sendConsoleAlerts(alerts);
    }

    // 存储通知
    if (this.config.channels.storage) {
      storeAlerts(alerts);
    }

    // 回调通知
    if (this.config.channels.callback) {
      alerts.forEach((alert) => {
        const performanceAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(ALERT_SYSTEM_CONSTANTS.RANDOM_ID_BASE).substr(ALERT_SYSTEM_CONSTANTS.RANDOM_ID_START, ALERT_SYSTEM_CONSTANTS.RANDOM_ID_LENGTH)}`,
          timestamp: Date.now(),
          severity: alert.severity,
          metric: alert.metric || 'unknown',
          value: alert.value || 0,
          threshold: alert.threshold || 0,
          message: alert.message,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : '',
          context: {},
        };
        this.config.channels.callback!(performanceAlert);
      });
    }
  }

  /**
   * 检查指标并触发警报 (测试方法)
   */
  checkMetrics(metrics: Record<string, number>): void {
    if (!this.config.enabled) return;

    const alerts: Array<{
      type: 'metric' | 'regression';
      severity: 'warning' | 'critical';
      message: string;
      metric?: string;
      value?: number;
    }> = [];

    // 安全地转换 Record<string, number> 为 DetailedWebVitals 兼容格式
    const detailedMetrics = this.convertToDetailedWebVitals(metrics);
    this.checkMetricThresholds(detailedMetrics, alerts);

    if (alerts.length > 0) {
      this.sendAlerts(alerts);
    }
  }

  /**
   * 发送单个警报 (测试方法)
   */
  sendAlert(
    severity: 'warning' | 'critical',
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const alert = {
      type: 'metric' as const,
      severity,
      message,
      ...data,
    };

    // 直接添加到历史记录，不通过sendAlerts避免重复
    const alertId = this.generateAlertId();
    const historyEntry = {
      id: alertId,
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
      sendConsoleAlerts([alert]);
    }

    // 处理webhook通知
    if (this.config.channels?.webhook) {
      return sendWebhookNotification(alert, this.config.channels.webhook);
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
   * 生成唯一的警报ID
   */
  private generateAlertId(): string {
    const timestamp = Date.now();
    const randomPart = Math.random()
      .toString(ALERT_SYSTEM_CONSTANTS.RANDOM_ID_BASE)
      .substr(
        ALERT_SYSTEM_CONSTANTS.RANDOM_ID_START,
        ALERT_SYSTEM_CONSTANTS.RANDOM_ID_LENGTH,
      );
    return `alert-${timestamp}-${randomPart}`;
  }

  /**
   * 安全地将 Record<string, number> 转换为 DetailedWebVitals 格式
   */
  private convertToDetailedWebVitals(
    metrics: Record<string, number>,
  ): DetailedWebVitals {
    return {
      ...extractCoreMetrics(metrics),
      resourceTiming: getDefaultResourceTiming(),
      connection: getDefaultConnection(),
      device: getDefaultDevice(),
      page: getDefaultPage(),
    };
  }
}
