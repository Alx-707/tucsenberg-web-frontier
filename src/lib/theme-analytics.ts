'use client';

import * as Sentry from '@sentry/nextjs';

/**
 * 主题切换性能指标接口
 */
export interface ThemePerformanceMetrics {
  switchDuration: number;
  fromTheme: string;
  toTheme: string;
  timestamp: number;
  userAgent: string;
  viewportSize: { width: number; height: number };
  supportsViewTransitions: boolean;
}

/**
 * 主题使用统计接口
 */
export interface ThemeUsageStats {
  theme: string;
  count: number;
  lastUsed: number;
  sessionDuration: number;
}

/**
 * 主题切换模式分析接口
 */
export interface ThemeSwitchPattern {
  sequence: string[];
  frequency: number;
  avgDuration: number;
  timeOfDay: number;
}

/**
 * 主题分析配置
 */
export interface ThemeAnalyticsConfig {
  enabled: boolean;
  performanceThreshold: number; // 性能告警阈值（毫秒）
  sampleRate: number; // 采样率 (0-1)
  enableDetailedTracking: boolean;
  enableUserBehaviorAnalysis: boolean;
}

/**
 * 主题分析管理器
 * 负责收集、分析和报告主题相关的性能和使用数据
 */
export class ThemeAnalytics {
  private config: ThemeAnalyticsConfig;
  private performanceMetrics: ThemePerformanceMetrics[] = [];
  private usageStats: Map<string, ThemeUsageStats> = new Map();
  private switchPatterns: ThemeSwitchPattern[] = [];
  private currentTheme: string = 'system';
  private sessionStartTime: number = Date.now();
  private lastSwitchTime: number = 0;

  /**
   * 获取当前主题
   */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  constructor(config?: Partial<ThemeAnalyticsConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      performanceThreshold: 100, // 100ms
      sampleRate: 0.1, // 10% 采样
      enableDetailedTracking: true,
      enableUserBehaviorAnalysis: true,
      ...config,
    };

    // 初始化Sentry自定义标签
    if (this.config.enabled) {
      Sentry.setTag('feature', 'theme-analytics');
    }
  }

  /**
   * 记录主题切换性能
   */
  recordThemeSwitch(
    fromTheme: string,
    toTheme: string,
    startTime: number,
    endTime: number,
    supportsViewTransitions: boolean = false,
  ): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return;
    }

    const switchDuration = endTime - startTime;
    const now = Date.now();

    const metrics: ThemePerformanceMetrics = {
      switchDuration,
      fromTheme,
      toTheme,
      timestamp: now,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewportSize: this.getViewportSize(),
      supportsViewTransitions,
    };

    // 存储性能指标
    this.performanceMetrics.push(metrics);
    this.lastSwitchTime = now;

    // 更新使用统计
    this.updateUsageStats(toTheme, now);

    // 发送到Sentry
    this.sendPerformanceMetrics(metrics);

    // 检查性能阈值
    if (switchDuration > this.config.performanceThreshold) {
      this.reportPerformanceIssue(metrics);
    }

    // 分析切换模式
    if (this.config.enableUserBehaviorAnalysis) {
      this.analyzeSwitchPattern(fromTheme, toTheme, switchDuration);
    }

    // 清理旧数据
    this.cleanupOldData();
  }

  /**
   * 记录主题偏好
   */
  recordThemePreference(theme: string): void {
    if (!this.config.enabled) return;

    this.currentTheme = theme;

    // 发送用户偏好数据到Sentry
    Sentry.setUser({
      themePreference: theme,
    });

    Sentry.addBreadcrumb({
      category: 'theme',
      message: `Theme preference set to ${theme}`,
      level: 'info',
      data: {
        theme,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * 获取性能统计摘要
   */
  getPerformanceSummary(): {
    avgSwitchTime: number;
    maxSwitchTime: number;
    minSwitchTime: number;
    totalSwitches: number;
    slowSwitches: number;
    viewTransitionsUsage: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        avgSwitchTime: 0,
        maxSwitchTime: 0,
        minSwitchTime: 0,
        totalSwitches: 0,
        slowSwitches: 0,
        viewTransitionsUsage: 0,
      };
    }

    const durations = this.performanceMetrics.map((m) => m.switchDuration);
    const slowSwitches = this.performanceMetrics.filter(
      (m) => m.switchDuration > this.config.performanceThreshold,
    ).length;
    const viewTransitionsUsage = this.performanceMetrics.filter(
      (m) => m.supportsViewTransitions,
    ).length;

    return {
      avgSwitchTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxSwitchTime: Math.max(...durations),
      minSwitchTime: Math.min(...durations),
      totalSwitches: this.performanceMetrics.length,
      slowSwitches,
      viewTransitionsUsage,
    };
  }

  /**
   * 获取主题使用统计
   */
  getUsageStatistics(): ThemeUsageStats[] {
    return Array.from(this.usageStats.values()).sort(
      (a, b) => b.count - a.count,
    );
  }

  /**
   * 发送性能报告到Sentry
   */
  sendPerformanceReport(): void {
    if (!this.config.enabled) return;

    const summary = this.getPerformanceSummary();
    const usageStats = this.getUsageStatistics();

    // 发送自定义事件到Sentry
    Sentry.addBreadcrumb({
      category: 'theme-analytics',
      message: 'Theme performance report',
      level: 'info',
      data: {
        performance: summary,
        usage: usageStats,
        patterns: this.switchPatterns,
        sessionDuration: Date.now() - this.sessionStartTime,
      },
    });

    // 发送性能指标
    Sentry.setMeasurement(
      'theme.avg_switch_time',
      summary.avgSwitchTime,
      'millisecond',
    );
    Sentry.setMeasurement(
      'theme.max_switch_time',
      summary.maxSwitchTime,
      'millisecond',
    );
    Sentry.setMeasurement(
      'theme.total_switches',
      summary.totalSwitches,
      'none',
    );
    Sentry.setMeasurement(
      'theme.slow_switches_ratio',
      summary.totalSwitches > 0
        ? summary.slowSwitches / summary.totalSwitches
        : 0,
      'ratio',
    );
    Sentry.setMeasurement(
      'theme.view_transitions_usage',
      summary.totalSwitches > 0
        ? summary.viewTransitionsUsage / summary.totalSwitches
        : 0,
      'ratio',
    );
  }

  /**
   * 私有方法：检查是否应该采样
   */
  private shouldSample(): boolean {
    // 使用crypto.getRandomValues()替代Math.random()以提高安全性
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const maxUint32 = 0xffffffff;
      return (array[0] ?? 0) / maxUint32 < this.config.sampleRate;
    }
    // 回退到Math.random()（仅在crypto不可用时）
    return Math.random() < this.config.sampleRate;
  }

  /**
   * 私有方法：获取视口大小
   */
  private getViewportSize(): { width: number; height: number } {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * 私有方法：发送性能指标到Sentry
   */
  private sendPerformanceMetrics(metrics: ThemePerformanceMetrics): void {
    Sentry.addBreadcrumb({
      category: 'theme-performance',
      message: `Theme switched from ${metrics.fromTheme} to ${metrics.toTheme}`,
      level: 'info',
      data: {
        duration: metrics.switchDuration,
        supportsViewTransitions: metrics.supportsViewTransitions,
        viewport: metrics.viewportSize,
      },
    });
  }

  /**
   * 私有方法：报告性能问题
   */
  private reportPerformanceIssue(metrics: ThemePerformanceMetrics): void {
    Sentry.captureMessage(
      `Slow theme switch detected: ${metrics.switchDuration}ms`,
      'warning',
    );

    Sentry.setContext('theme-performance-issue', {
      duration: metrics.switchDuration,
      threshold: this.config.performanceThreshold,
      fromTheme: metrics.fromTheme,
      toTheme: metrics.toTheme,
      supportsViewTransitions: metrics.supportsViewTransitions,
      viewport: metrics.viewportSize,
    });
  }

  /**
   * 私有方法：更新使用统计
   */
  private updateUsageStats(theme: string, timestamp: number): void {
    const existing = this.usageStats.get(theme);
    if (existing) {
      existing.count += 1;
      existing.lastUsed = timestamp;
      existing.sessionDuration += timestamp - this.lastSwitchTime;
    } else {
      this.usageStats.set(theme, {
        theme,
        count: 1,
        lastUsed: timestamp,
        sessionDuration: 0,
      });
    }
  }

  /**
   * 私有方法：分析切换模式
   */
  private analyzeSwitchPattern(
    fromTheme: string,
    toTheme: string,
    duration: number,
  ): void {
    // 这里可以实现更复杂的模式分析逻辑
    // 目前简化为记录基本的切换序列
    const sequence = [fromTheme, toTheme];
    const sequenceLength = 2;
    const avgDivisor = 2;

    const existing = this.switchPatterns.find(
      (p) =>
        p.sequence.length === sequenceLength &&
        p.sequence[0] === fromTheme &&
        p.sequence[1] === toTheme,
    );

    if (existing) {
      existing.frequency += 1;
      existing.avgDuration = (existing.avgDuration + duration) / avgDivisor;
    } else {
      this.switchPatterns.push({
        sequence,
        frequency: 1,
        avgDuration: duration,
        timeOfDay: new Date().getHours(),
      });
    }
  }

  /**
   * 私有方法：清理旧数据
   */
  private cleanupOldData(): void {
    const hoursInDay = 24;
    const minutesInHour = 60;
    const secondsInMinute = 60;
    const millisecondsInSecond = 1000;
    const maxAge =
      hoursInDay * minutesInHour * secondsInMinute * millisecondsInSecond; // 24小时
    const cutoff = Date.now() - maxAge;

    // 清理旧的性能指标
    this.performanceMetrics = this.performanceMetrics.filter(
      (m) => m.timestamp > cutoff,
    );

    // 限制数据量
    const maxMetrics = 1000;
    if (this.performanceMetrics.length > maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-maxMetrics);
    }
  }
}

// 全局实例
export const themeAnalytics = new ThemeAnalytics();

// 导出便捷函数
export const recordThemeSwitch =
  themeAnalytics.recordThemeSwitch.bind(themeAnalytics);
export const recordThemePreference =
  themeAnalytics.recordThemePreference.bind(themeAnalytics);
export const sendThemeReport =
  themeAnalytics.sendPerformanceReport.bind(themeAnalytics);
