/**
 * 主题分析相关类型定义
 * Theme analytics type definitions
 */

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
 * 性能摘要接口
 */
export interface ThemePerformanceSummary {
  totalSwitches: number;
  averageDuration: number;
  slowSwitches: number;
  fastestSwitch: number;
  slowestSwitch: number;
  mostUsedTheme: string;
  viewTransitionSupport: boolean;
}

/**
 * 主题分析事件类型
 */
export type ThemeAnalyticsEvent = 
  | 'theme-switch'
  | 'theme-preference'
  | 'performance-issue'
  | 'usage-pattern';

/**
 * 主题分析数据接口
 */
export interface ThemeAnalyticsData {
  event: ThemeAnalyticsEvent;
  timestamp: number;
  data: Record<string, unknown>;
}
