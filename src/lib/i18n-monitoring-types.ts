/**
 * 企业级国际化监控和错误追踪 - 类型定义
 * 提供翻译错误监控、性能追踪、质量保证等功能的类型定义
 */

import type { Locale } from '@/types/i18n';

// 错误级别
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// 监控事件类型
export enum MonitoringEventType {
  TRANSLATION_MISSING = 'translation_missing',
  TRANSLATION_ERROR = 'translation_error',
  LOCALE_SWITCH = 'locale_switch',
  CACHE_MISS = 'cache_miss',
  PERFORMANCE_ISSUE = 'performance_issue',
  QUALITY_ISSUE = 'quality_issue',
}

// 监控事件
export interface MonitoringEvent {
  id: string;
  type: MonitoringEventType;
  level: ErrorLevel;
  timestamp: number;
  locale: Locale;
  message: string;
  metadata?: Record<string, string | number | boolean | Record<string, unknown> | unknown[]>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

// 性能阈值配置
export interface PerformanceThresholds {
  translationLoadTime: number; // ms
  cacheHitRate: number; // percentage
  errorRate: number; // percentage
  memoryUsage: number; // MB
}

// 质量阈值配置
export interface QualityThresholds {
  completeness: number; // percentage
  consistency: number; // percentage
  accuracy: number; // percentage
  freshness: number; // days
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  enablePerformanceTracking: boolean;
  enableQualityTracking: boolean;
  performanceThresholds: PerformanceThresholds;
  qualityThresholds: QualityThresholds;
  maxEvents: number;
  flushInterval: number; // ms
  remoteEndpoint?: string;
}

// 性能数据结构
export interface PerformanceData {
  loadTimes: number[];
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  totalRequests: number;
}
