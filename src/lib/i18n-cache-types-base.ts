/**
 * 国际化缓存基础类型定义
 * I18n Cache Base Type Definitions
 *
 * 提供缓存系统所需的基础类型、接口和常量定义
 */

import type { I18nMetrics, Locale, Messages } from '@/types/i18n';

/**
 * 缓存配置接口
 * Cache configuration interface
 */
export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enablePersistence: boolean;
  storageKey: string;
}

/**
 * 缓存项接口
 * Cache item interface
 */
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * 缓存统计信息
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  totalHits: number;
  averageAge: number;
}

/**
 * 预加载配置
 * Preload configuration
 */
export interface PreloadConfig {
  enablePreload: boolean;
  preloadLocales: Locale[];
  batchSize: number;
  delayBetweenBatches: number;
  timeout: number;
}

/**
 * 缓存操作结果
 * Cache operation result
 */
export interface CacheOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache: boolean;
  loadTime?: number;
}

/**
 * 缓存事件类型
 * Cache event types
 */
export type CacheEventType =
  | 'hit'
  | 'miss'
  | 'set'
  | 'delete'
  | 'clear'
  | 'expire'
  | 'preload_start'
  | 'preload_complete'
  | 'preload_error';

/**
 * 缓存事件
 * Cache event
 */
export interface CacheEvent<T = unknown> {
  type: CacheEventType;
  key?: string;
  data?: T;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 缓存监听器
 * Cache event listener
 */
export type CacheEventListener<T = unknown> = (event: CacheEvent<T>) => void;

/**
 * 缓存策略
 * Cache strategy
 */
export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl';

/**
 * 缓存配置验证
 * Cache configuration validation
 */
export interface CacheConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 缓存健康检查
 * Cache health check
 */
export interface CacheHealthCheck {
  isHealthy: boolean;
  issues: string[];
  performance: {
    hitRate: number;
    averageLoadTime: number;
    errorRate: number;
  };
  recommendations: string[];
}

/**
 * 缓存调试信息
 * Cache debug information
 */
export interface CacheDebugInfo {
  config: CacheConfig;
  stats: CacheStats;
  metrics: I18nMetrics;
  recentEvents: CacheEvent[];
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

/**
 * 默认缓存配置
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
  enablePersistence: true,
  storageKey: 'i18n_cache',
};

/**
 * 默认预加载配置
 * Default preload configuration
 */
export const DEFAULT_PRELOAD_CONFIG: PreloadConfig = {
  enablePreload: true,
  preloadLocales: ['en', 'zh'],
  batchSize: 5,
  delayBetweenBatches: 100,
  timeout: 5000,
};

/**
 * 缓存常量
 * Cache constants
 */
export const CACHE_CONSTANTS = {
  MIN_TTL: 1000, // 1 second
  MAX_TTL: 24 * 60 * 60 * 1000, // 24 hours
  MIN_CACHE_SIZE: 10,
  MAX_CACHE_SIZE: 10000,
  DEFAULT_BATCH_SIZE: 5,
  MAX_CONCURRENT_LOADS: 10,
  METRICS_RESET_INTERVAL: 60 * 60 * 1000, // 1 hour
  HEALTH_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * 缓存错误类型
 * Cache error types
 */
export class CacheError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'CACHE_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'CacheError';
    this.code = code;
    this.details = details;
  }
}

/**
 * 缓存验证错误
 * Cache validation error
 */
export class CacheValidationError extends CacheError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CACHE_VALIDATION_ERROR', details);
    this.name = 'CacheValidationError';
  }
}

/**
 * 缓存存储错误
 * Cache storage error
 */
export class CacheStorageError extends CacheError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CACHE_STORAGE_ERROR', details);
    this.name = 'CacheStorageError';
  }
}

/**
 * 缓存序列化错误
 * Cache serialization error
 */
export class CacheSerializationError extends CacheError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CACHE_SERIALIZATION_ERROR', details);
    this.name = 'CacheSerializationError';
  }
}

/**
 * 类型守卫函数
 * Type guard functions
 */
export function isCacheItem<T>(value: unknown): value is CacheItem<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'timestamp' in value &&
    'ttl' in value &&
    'hits' in value
  );
}

export function isCacheConfig(value: unknown): value is CacheConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    'maxSize' in value &&
    'ttl' in value &&
    'enablePersistence' in value &&
    'storageKey' in value
  );
}

export function isCacheEvent(value: unknown): value is CacheEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'timestamp' in value
  );
}

/**
 * 基础工具函数
 * Basic utility functions
 */
export function createCacheKey(locale: Locale, namespace?: string, key?: string): string {
  const parts = [locale];
  if (namespace) parts.push(namespace);
  if (key) parts.push(key);
  return parts.join(':');
}

export function parseCacheKey(cacheKey: string): { locale: Locale; namespace?: string; key?: string } {
  const parts = cacheKey.split(':');
  return {
    locale: parts[0] as Locale,
    namespace: parts[1],
    key: parts[2],
  };
}

/**
 * 缓存配置验证函数
 * Cache configuration validation function
 */
export function validateCacheConfig(config: Partial<CacheConfig>): CacheConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.maxSize !== undefined) {
    if (config.maxSize < CACHE_CONSTANTS.MIN_CACHE_SIZE) {
      errors.push(`maxSize must be at least ${CACHE_CONSTANTS.MIN_CACHE_SIZE}`);
    }
    if (config.maxSize > CACHE_CONSTANTS.MAX_CACHE_SIZE) {
      errors.push(`maxSize must not exceed ${CACHE_CONSTANTS.MAX_CACHE_SIZE}`);
    }
  }

  if (config.ttl !== undefined) {
    if (config.ttl < CACHE_CONSTANTS.MIN_TTL) {
      errors.push(`ttl must be at least ${CACHE_CONSTANTS.MIN_TTL}ms`);
    }
    if (config.ttl > CACHE_CONSTANTS.MAX_TTL) {
      warnings.push(`ttl is very high (${config.ttl}ms), consider reducing it`);
    }
  }

  if (config.storageKey !== undefined) {
    if (typeof config.storageKey !== 'string' || config.storageKey.length === 0) {
      errors.push('storageKey must be a non-empty string');
    }
  }

  if (config.enablePersistence !== undefined) {
    if (typeof config.enablePersistence !== 'boolean') {
      errors.push('enablePersistence must be a boolean');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
