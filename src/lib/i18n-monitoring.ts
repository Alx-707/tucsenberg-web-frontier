/**
 * 企业级国际化监控和错误追踪
 * 提供翻译错误监控、性能追踪、质量保证等功能
 */
import type { I18nMetrics, Locale, TranslationError } from '@/types/i18n';
import {
  CACHE_LIMITS,
  MONITORING_CONFIG,
  PERFORMANCE_THRESHOLDS,
  REPORTING_THRESHOLDS,
  TIME_UNITS,
} from '@/constants/i18n-constants';

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
  metadata?: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

// 性能阈值配置
interface PerformanceThresholds {
  translationLoadTime: number; // ms
  cacheHitRate: number; // percentage
  errorRate: number; // percentage
  memoryUsage: number; // MB
}

// 质量阈值配置
interface QualityThresholds {
  completeness: number; // percentage
  consistency: number; // percentage
  accuracy: number; // percentage
  freshness: number; // days
}

// 监控配置
interface MonitoringConfig {
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

// 事件收集器
class EventCollector {
  private events: MonitoringEvent[] = [];
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;

    if (config.enabled && config.flushInterval > 0) {
      setInterval(() => this.flush(), config.flushInterval);
    }
  }

  addEvent(event: Omit<MonitoringEvent, 'id' | 'timestamp'>): void {
    if (!this.config.enabled) return;

    const fullEvent: MonitoringEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    };

    if (typeof navigator !== 'undefined') {
      fullEvent.userAgent = navigator.userAgent;
    }

    if (typeof window !== 'undefined') {
      fullEvent.url = window.location.href;
    }

    this.events.push(fullEvent);

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(fullEvent);
    }

    // Trim events if exceeding max
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // Send critical events immediately
    if (fullEvent.level === ErrorLevel.CRITICAL) {
      this.sendEvent(fullEvent);
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .substr(
        MONITORING_CONFIG.ERROR_SAMPLE_RATE / 50,
        MONITORING_CONFIG.PERFORMANCE_SAMPLE_RATE - 1,
      )}`;
  }

  private logToConsole(event: MonitoringEvent): void {
    const logMethod = this.getLogMethod(event.level);
    logMethod(`[I18n Monitor] ${event.type}: ${event.message}`, {
      locale: event.locale,
      metadata: event.metadata,
      timestamp: new Date(event.timestamp).toISOString(),
    });
  }

  private getLogMethod(level: ErrorLevel) {
    switch (level) {
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        return console.error;
      case ErrorLevel.WARNING:
        return console.warn;
      default:
        return console.info;
    }
  }

  private async sendEvent(event: MonitoringEvent): Promise<void> {
    if (!this.config.enableRemoteLogging || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send monitoring event:', error);
    }
  }

  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events: eventsToSend }),
        });
      } catch (error) {
        console.error('Failed to flush monitoring events:', error);
        // Re-add events if sending failed
        this.events.unshift(...eventsToSend);
      }
    }
  }

  getEvents(): MonitoringEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

// 性能监控器
class PerformanceMonitor {
  private config: MonitoringConfig;
  private eventCollector: EventCollector;
  private performanceData: {
    loadTimes: number[];
    cacheHits: number;
    cacheMisses: number;
    errors: number;
    totalRequests: number;
  } = {
    loadTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    totalRequests: 0,
  };

  constructor(config: MonitoringConfig, eventCollector: EventCollector) {
    this.config = config;
    this.eventCollector = eventCollector;
  }

  recordLoadTime(time: number, locale: Locale): void {
    if (!this.config.enablePerformanceTracking) return;

    this.performanceData.loadTimes.push(time);
    this.performanceData.totalRequests++;

    // Check if load time exceeds threshold
    if (time > this.config.performanceThresholds.translationLoadTime) {
      this.eventCollector.addEvent({
        type: MonitoringEventType.PERFORMANCE_ISSUE,
        level: ErrorLevel.WARNING,
        locale,
        message: `Translation load time exceeded threshold: ${time}ms`,
        metadata: {
          loadTime: time,
          threshold: this.config.performanceThresholds.translationLoadTime,
        },
      });
    }
  }

  recordCacheHit(locale: Locale): void {
    this.performanceData.cacheHits++;
    this.performanceData.totalRequests++;
    this.checkCacheHitRate(locale);
  }

  recordCacheMiss(locale: Locale): void {
    this.performanceData.cacheMisses++;
    this.performanceData.totalRequests++;
    this.checkCacheHitRate(locale);

    this.eventCollector.addEvent({
      type: MonitoringEventType.CACHE_MISS,
      level: ErrorLevel.INFO,
      locale,
      message: 'Translation cache miss',
      metadata: {
        cacheHitRate: this.getCacheHitRate(),
        totalRequests: this.performanceData.totalRequests,
      },
    });
  }

  recordError(error: TranslationError, locale: Locale): void {
    this.performanceData.errors++;
    this.performanceData.totalRequests++;

    const level =
      error.code === 'MISSING_KEY' ? ErrorLevel.WARNING : ErrorLevel.ERROR;

    this.eventCollector.addEvent({
      type: MonitoringEventType.TRANSLATION_ERROR,
      level,
      locale,
      message: error.message,
      metadata: {
        errorCode: error.code,
        key: error.key,
        params: error.params,
        errorRate: this.getErrorRate(),
      },
    });
  }

  private checkCacheHitRate(locale: Locale): void {
    const hitRate = this.getCacheHitRate();
    if (hitRate < this.config.performanceThresholds.cacheHitRate) {
      this.eventCollector.addEvent({
        type: MonitoringEventType.PERFORMANCE_ISSUE,
        level: ErrorLevel.WARNING,
        locale,
        message: `Cache hit rate below threshold: ${hitRate.toFixed(2)}%`,
        metadata: {
          cacheHitRate: hitRate,
          threshold: this.config.performanceThresholds.cacheHitRate,
        },
      });
    }
  }

  private getCacheHitRate(): number {
    const total =
      this.performanceData.cacheHits + this.performanceData.cacheMisses;
    return total > 0
      ? (this.performanceData.cacheHits / total) *
          CACHE_LIMITS.MAX_CACHE_ENTRIES
      : 0;
  }

  private getErrorRate(): number {
    return this.performanceData.totalRequests > 0
      ? (this.performanceData.errors / this.performanceData.totalRequests) *
          CACHE_LIMITS.MAX_CACHE_ENTRIES
      : 0;
  }

  getMetrics(): I18nMetrics {
    const avgLoadTime =
      this.performanceData.loadTimes.length > 0
        ? this.performanceData.loadTimes.reduce((a, b) => a + b, 0) /
          this.performanceData.loadTimes.length
        : 0;

    return {
      loadTime: avgLoadTime,
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
      translationCoverage: 0, // To be calculated by quality monitor
      localeUsage: { en: 0, zh: 0 }, // To be calculated by usage tracker
    };
  }

  reset(): void {
    this.performanceData = {
      loadTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      totalRequests: 0,
    };
  }
}

// 主监控管理器
export class I18nMonitor {
  private config: MonitoringConfig;
  private eventCollector: EventCollector;
  private performanceMonitor: PerformanceMonitor;

  constructor(config?: Partial<MonitoringConfig>) {
    const defaultConfig: MonitoringConfig = {
      enabled: process.env.NODE_ENV === 'production',
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      enablePerformanceTracking: true,
      enableQualityTracking: true,
      performanceThresholds: {
        translationLoadTime: PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME,
        cacheHitRate: PERFORMANCE_THRESHOLDS.GOOD,
        errorRate: REPORTING_THRESHOLDS.ERROR_RATE_ALERT,
        memoryUsage: CACHE_LIMITS.MAX_DETECTION_HISTORY,
      },
      qualityThresholds: {
        completeness: PERFORMANCE_THRESHOLDS.EXCELLENT,
        consistency: PERFORMANCE_THRESHOLDS.GOOD + 10,
        accuracy: PERFORMANCE_THRESHOLDS.EXCELLENT + 3,
        freshness: CACHE_LIMITS.MAX_DETECTION_HISTORY,
      },
      maxEvents: CACHE_LIMITS.MAX_PERFORMANCE_DATA_POINTS,
      flushInterval: TIME_UNITS.MINUTE,
    };

    const endpoint = process.env['NEXT_PUBLIC_I18N_MONITORING_ENDPOINT'];
    if (endpoint) {
      defaultConfig.remoteEndpoint = endpoint;
    }

    this.config = { ...defaultConfig, ...config };
    this.eventCollector = new EventCollector(this.config);
    this.performanceMonitor = new PerformanceMonitor(
      this.config,
      this.eventCollector,
    );
  }

  // Public API methods
  recordTranslationMissing(key: string, locale: Locale): void {
    this.eventCollector.addEvent({
      type: MonitoringEventType.TRANSLATION_MISSING,
      level: ErrorLevel.WARNING,
      locale,
      message: `Missing translation for key: ${key}`,
      metadata: { key },
    });
  }

  recordLocaleSwitch(
    fromLocale: Locale,
    toLocale: Locale,
    duration: number,
  ): void {
    this.eventCollector.addEvent({
      type: MonitoringEventType.LOCALE_SWITCH,
      level: ErrorLevel.INFO,
      locale: toLocale,
      message: `Locale switched from ${fromLocale} to ${toLocale}`,
      metadata: { fromLocale, toLocale, duration },
    });
  }

  recordLoadTime(time: number, locale: Locale): void {
    this.performanceMonitor.recordLoadTime(time, locale);
  }

  recordCacheHit(locale: Locale): void {
    this.performanceMonitor.recordCacheHit(locale);
  }

  recordCacheMiss(locale: Locale): void {
    this.performanceMonitor.recordCacheMiss(locale);
  }

  recordError(error: TranslationError, locale: Locale): void {
    this.performanceMonitor.recordError(error, locale);
  }

  getMetrics(): I18nMetrics {
    return this.performanceMonitor.getMetrics();
  }

  getEvents(): MonitoringEvent[] {
    return this.eventCollector.getEvents();
  }

  async flush(): Promise<void> {
    await this.eventCollector.flush();
  }

  reset(): void {
    this.eventCollector.clearEvents();
    this.performanceMonitor.reset();
  }
}

// 全局监控实例
export const i18nMonitor = new I18nMonitor();
