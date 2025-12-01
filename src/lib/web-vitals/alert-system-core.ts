/**
 * 性能预警系统 - 核心类
 * Performance Alert System - Core Class
 */

import {
  AlertSystemChecker,
  type AlertInfo,
} from '@/lib/web-vitals/alert-system-checker';
import {
  AlertSystemSender,
  type AlertHistoryEntry,
} from '@/lib/web-vitals/alert-system-sender';
import type {
  DetailedWebVitals,
  PerformanceAlertConfig,
  RegressionDetectionResult,
} from '@/lib/web-vitals/types';
import { PERCENTAGE_HALF, ZERO } from '@/constants';
import { MAGIC_70 } from '@/constants/count';
import { WEB_VITALS_CONSTANTS } from '@/constants/test-constants';

/**
 * 性能预警系统核心类
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
      score: { warning: MAGIC_70, critical: PERCENTAGE_HALF },
    },
    channels: {
      console: true,
      storage: true,
    },
  };

  private sender = new AlertSystemSender();

  /**
   * 应用单个指标阈值覆盖
   */
  private applyMetricThreshold(
    target: { warning: number; critical: number },
    source: { warning?: number; critical?: number } | undefined,
  ): void {
    if (!source || typeof source !== 'object') return;
    if (typeof source.warning === 'number') {
      target.warning = source.warning;
    }
    if (typeof source.critical === 'number') {
      target.critical = source.critical;
    }
  }

  /**
   * 应用所有阈值覆盖
   */
  private applyThresholdOverrides(
    thresholds: PerformanceAlertConfig['thresholds'] | undefined,
  ): void {
    if (!thresholds || typeof thresholds !== 'object') return;
    const currentThresholds = this.config.thresholds;
    this.applyMetricThreshold(currentThresholds.cls, thresholds.cls);
    this.applyMetricThreshold(currentThresholds.lcp, thresholds.lcp);
    this.applyMetricThreshold(currentThresholds.fid, thresholds.fid);
    this.applyMetricThreshold(currentThresholds.fcp, thresholds.fcp);
    this.applyMetricThreshold(currentThresholds.ttfb, thresholds.ttfb);
    this.applyMetricThreshold(currentThresholds.score, thresholds.score);
  }

  /**
   * 应用通道配置覆盖
   */
  private applyChannelOverrides(
    channels: PerformanceAlertConfig['channels'] | undefined,
  ): void {
    if (!channels || typeof channels !== 'object') return;
    if ('console' in channels && typeof channels.console === 'boolean') {
      this.config.channels.console = channels.console;
    }
    if ('storage' in channels && typeof channels.storage === 'boolean') {
      this.config.channels.storage = channels.storage;
    }
    if ('webhook' in channels && typeof channels.webhook === 'string') {
      this.config.channels.webhook = channels.webhook;
    }
    if ('callback' in channels && typeof channels.callback === 'function') {
      this.config.channels.callback = channels.callback;
    }
  }

  /**
   * 应用部分配置
   */
  private applyPartialConfig(
    partialConfig: Partial<PerformanceAlertConfig>,
  ): void {
    if (typeof partialConfig.enabled === 'boolean') {
      this.config.enabled = partialConfig.enabled;
    }
    this.applyThresholdOverrides(partialConfig.thresholds);
    this.applyChannelOverrides(partialConfig.channels);
  }

  /**
   * 应用通知配置
   */
  private applyNotificationConfig(config: {
    console?: boolean;
    storage?: boolean;
    webhook?: string;
  }): void {
    if (typeof config.console === 'boolean') {
      this.config.channels.console = config.console;
    }
    if (typeof config.storage === 'boolean') {
      this.config.channels.storage = config.storage;
    }
    if (typeof config.webhook === 'string' && config.webhook) {
      this.config.channels.webhook = config.webhook;
    }
  }

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
    const { notifications, webhook } = config;
    if (notifications) {
      this.applyNotificationConfig(notifications);
    }

    this.applyPartialConfig(config);

    if (typeof webhook === 'string' && webhook) {
      this.config.channels.webhook = webhook;
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

    const alerts: AlertInfo[] = [];

    // 检查核心指标阈值
    AlertSystemChecker.checkMetricThresholds(metrics, this.config, alerts);

    // 检查回归预警
    if (regressionResult) {
      AlertSystemChecker.checkRegressionAlerts(regressionResult, alerts);
    }

    // 发送预警
    if (alerts.length > ZERO) {
      this.sender.sendAlerts(alerts, this.config);
    }
  }

  /**
   * 检查指标并触发警报 (测试方法)
   */
  checkMetrics(metrics: Record<string, number>): void {
    if (!this.config.enabled) return;

    const alerts = AlertSystemChecker.checkMetrics(metrics, this.config);

    if (alerts.length > ZERO) {
      this.sender.sendAlerts(alerts, this.config);
    }
  }

  /**
   * 发送单个警报 (测试方法)
   */
  sendAlert(args: {
    severity: 'warning' | 'critical';
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const payload: {
      severity: 'warning' | 'critical';
      message: string;
      config: PerformanceAlertConfig;
      data?: Record<string, unknown>;
    } = {
      severity: args.severity,
      message: args.message,
      config: this.config,
    };

    if (args.data !== undefined) {
      payload.data = args.data;
    }

    return this.sender.sendAlert(payload);
  }

  /**
   * 获取警报历史 (测试方法)
   */
  getAlertHistory(): AlertHistoryEntry[] {
    return this.sender.getAlertHistory();
  }

  /**
   * 清除警报历史 (测试方法)
   */
  clearAlertHistory(): void {
    this.sender.clearAlertHistory();
  }

  /**
   * 清除历史记录的别名方法 (测试兼容)
   */
  clearHistory(): void {
    this.sender.clearHistory();
  }

  /**
   * 获取当前配置
   */
  getConfig(): PerformanceAlertConfig {
    const { enabled, thresholds, channels } = this.config;

    return {
      enabled,
      thresholds,
      channels,
    };
  }

  /**
   * 检查系统是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 启用/禁用预警系统
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * 获取历史记录统计
   */
  getHistoryStats(): {
    total: number;
    warnings: number;
    criticals: number;
    lastAlert?: AlertHistoryEntry;
  } {
    return this.sender.getHistoryStats();
  }

  /**
   * 根据条件过滤历史记录
   */
  filterHistory(filter: {
    severity?: 'warning' | 'critical';
    metric?: string;
    startTime?: number;
    endTime?: number;
  }): AlertHistoryEntry[] {
    return this.sender.filterHistory(filter);
  }
}
