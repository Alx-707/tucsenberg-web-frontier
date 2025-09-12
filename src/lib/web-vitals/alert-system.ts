/**
 * 性能预警系统 - 统一导出入口
 * Performance Alert System - Unified Export Entry
 */

// 导出核心类
export { PerformanceAlertSystem } from './alert-system-core';

// 导出子模块
export { AlertSystemChecker } from './alert-system-checker';
export { AlertSystemSender } from './alert-system-sender';

// 导出类型
export type { AlertInfo } from './alert-system-checker';
export type { AlertHistoryEntry } from './alert-system-sender';

// 导出原有类型
export type {
  DetailedWebVitals,
  PerformanceAlertConfig,
  RegressionDetectionResult,
} from './types';


