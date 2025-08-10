// 创建并导出全局实例
import { PerformanceAlertSystem } from './alert-system';
import { PerformanceBaselineManager } from './baseline-manager';
import { EnhancedWebVitalsCollector } from './collector';
import { PerformanceMonitoringManager } from './monitoring-manager';
import { PerformanceRegressionDetector } from './regression-detector';

/**
 * Web Vitals 增强监控系统
 * 统一导出所有类和实例
 */

// 导出类型
export type {
  DetailedWebVitals,
  PerformanceAlert,
  PerformanceAlertConfig,
  PerformanceBaseline,
  PerformanceMonitoringConfig,
  PerformanceMonitoringStatus,
  RegressionDetectionResult,
} from './types';

// 导出常量
export { PERFORMANCE_THRESHOLDS } from './constants';

// 导出类
export { PerformanceAlertSystem } from './alert-system';
export { PerformanceBaselineManager } from './baseline-manager';
export { EnhancedWebVitalsCollector } from './collector';
export { PerformanceMonitoringManager } from './monitoring-manager';
export { PerformanceRegressionDetector } from './regression-detector';

export const enhancedWebVitalsCollector = new EnhancedWebVitalsCollector();
export const performanceBaselineManager = new PerformanceBaselineManager();
export const performanceRegressionDetector =
  new PerformanceRegressionDetector();
export const performanceAlertSystem = new PerformanceAlertSystem();
export const performanceMonitoringManager = new PerformanceMonitoringManager();

// 默认导出监控管理器
export { performanceMonitoringManager as default };
