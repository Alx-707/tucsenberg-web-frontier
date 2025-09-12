import React from 'react';

/**
 * 性能监控相关类型定义
 */

// 扩展Performance接口以包含memory属性
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  networkLatency?: number;
}

/**
 * 性能警告接口
 */
export interface PerformanceAlert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  data?: Record<string, string | number | boolean>;
}

/**
 * 性能警告系统接口
 */
export interface PerformanceAlertSystem {
  addAlert: (_alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) => void;
  getAlerts: () => PerformanceAlert[];
  getAlertHistory: () => PerformanceAlert[];
  clearAlerts: () => void;
}

/**
 * 性能警告阈值接口
 */
export interface PerformanceAlertThresholds {
  loadTime?: number;
  renderTime?: number;
  memoryUsage?: number;
}

/**
 * 性能监控选项接口
 */
export interface UsePerformanceMonitorOptions {
  enableAlerts?: boolean;
  alertThresholds?: {
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;
  };
  monitoringInterval?: number;
  enableMemoryMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  enableRenderTimeMonitoring?: boolean;
  enableLoadTimeMonitoring?: boolean;
  enableAutoBaseline?: boolean;
  maxAlerts?: number;
  autoBaseline?: boolean;
}

/**
 * 性能监控返回值参数接口
 */
export interface PerformanceMonitorReturnParams {
  isMonitoring: boolean;
  metrics: PerformanceMetrics | null;
  alerts: PerformanceAlert[];
  error: string | null;
  getMetrics: () => PerformanceMetrics | null;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  measureLoadTime: () => void;
  measureRenderTime: () => void;
  refreshMetrics: () => void;
  clearAlerts: () => void;
  performanceAlertSystem: PerformanceAlertSystem;
}

/**
 * 性能监控状态接口
 */
export interface PerformanceMonitorState {
  enableAlerts: boolean;
  alertThresholds: Required<PerformanceAlertThresholds>;
  monitoringInterval: number;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableRenderTimeMonitoring: boolean;
  enableLoadTimeMonitoring: boolean;
  enableAutoBaseline: boolean;
  maxAlerts: number;
}

/**
 * 性能测量函数接口
 */
export interface PerformanceMeasurements {
  measureLoadTime: () => void;
  measureRenderTime: () => void;
  measureMemoryUsage: () => void;
}

/**
 * 监控控制函数接口
 */
export interface MonitoringControls {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  refreshMetrics: () => void;
}

/**
 * 性能监控Hook返回值类型
 */
export type UsePerformanceMonitorReturn = {
  isMonitoring: boolean;
  metrics: PerformanceMetrics | null;
  alerts: PerformanceAlert[];
  error: string | null;
  getMetrics: () => PerformanceMetrics | null;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  measureLoadTime: () => void;
  measureRenderTime: () => void;
  refreshMetrics: () => void;
  clearAlerts: () => void;
  performanceAlertSystem: PerformanceAlertSystem;
};

/**
 * 性能基准数据接口
 */
export interface PerformanceBaseline {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

/**
 * 性能趋势数据接口
 */
export interface PerformanceTrend {
  metric: keyof PerformanceMetrics;
  values: number[];
  timestamps: number[];
  trend: 'improving' | 'degrading' | 'stable';
}

/**
 * 性能报告接口
 */
export interface PerformanceReport {
  summary: PerformanceMetrics;
  baseline?: PerformanceBaseline;
  trends: PerformanceTrend[];
  alerts: PerformanceAlert[];
  recommendations: string[];
  timestamp: number;
}
