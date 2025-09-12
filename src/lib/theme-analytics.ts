/**
 * 主题分析服务 - 统一导出入口
 * Theme analytics service - unified export entry
 */

// 导出核心类
export { ThemeAnalytics } from './theme-analytics-core';

// 导出工具类
export { ThemeAnalyticsUtils } from './theme-analytics-utils';

// 导出所有类型
export type {
  ThemePerformanceMetrics,
  ThemeUsageStats,
  ThemeSwitchPattern,
  ThemeAnalyticsConfig,
  ThemePerformanceSummary,
  ThemeAnalyticsEvent,
  ThemeAnalyticsData,
} from './theme-analytics-types';

// 创建默认实例
import { ThemeAnalytics } from './theme-analytics-core';
export const themeAnalytics = new ThemeAnalytics();

// 导出便利函数，用于向后兼容
export const recordThemePreference = (theme: string) => themeAnalytics.recordThemePreference(theme);
export const recordThemeSwitch = (fromTheme: string, toTheme: string, duration?: number) =>
  themeAnalytics.recordThemeSwitch(fromTheme, toTheme, duration);
export const sendThemeReport = () => themeAnalytics.sendReport();






