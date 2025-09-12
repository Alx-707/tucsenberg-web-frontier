/**
 * 国际化缓存基础类型定义 - 主入口
 * I18n Cache Base Type Definitions - Main Entry Point
 *
 * 统一的国际化缓存类型入口，整合所有类型定义模块
 */

// 重新导出所有模块的功能
export * from './i18n-cache-types-base';
export * from './i18n-cache-types-interfaces';
export * from './i18n-cache-types-advanced';
export * from './i18n-cache-types-utils';

// 向后兼容的重新导出
import type { I18nMetrics, Locale, Messages } from '@/types/i18n';

import type {
  CacheConfig,
  CacheItem,
  CacheStats,
  PreloadConfig,
  CacheOperationResult,
  CacheEventType,
  CacheEvent,
  CacheEventListener,
  CacheStrategy,
  CacheConfigValidation,
  CacheHealthCheck,
  CacheDebugInfo,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_PRELOAD_CONFIG,
  CACHE_CONSTANTS,
  CacheError,
  CacheValidationError,
  CacheStorageError,
  CacheSerializationError,
} from './i18n-cache-types-base';

import type {
  CacheStorage,
  PersistentStorage,
  MetricsCollector,
  Preloader,
  CacheManager,
  SerializationOptions,
  CacheExportData,
  CacheSyncOptions,
  CachePartitionConfig,
  CacheCompressionConfig,
  CacheEncryptionConfig,
  CacheMonitoringConfig,
  CacheBackupConfig,
  CacheRecoveryOptions,
  CachePerformanceConfig,
  CacheSecurityConfig,
  CacheObserver,
  CacheMiddleware,
  CacheStrategyInterface,
  CacheAdapter,
  CacheFactory,
  CacheEventEmitter,
  CachePlugin,
  CacheLifecycleHooks,
  CacheStatsCollector,
} from './i18n-cache-types-interfaces';

import type {
  AdvancedCacheConfig,
  CacheClusterConfig,
  CacheShardingConfig,
  CacheWarmingConfig,
  CacheInvalidationConfig,
  CacheConsistencyConfig,
  CacheRateLimitConfig,
  CacheQualityConfig,
  CacheExtensionConfig,
  CacheEnvironmentConfig,
  DEFAULT_ADVANCED_CACHE_CONFIG,
} from './i18n-cache-types-advanced';

import {
  CacheConfigFactory,
} from './i18n-cache-types-advanced';

import {
  CacheKeyUtils,
  CacheTimeUtils,
  CacheSizeUtils,
  CacheStatsUtils,
  CacheValidationUtils,
  CacheSerializationUtils,
  CacheEventUtils,
  CacheDebugUtils,
} from './i18n-cache-types-utils';

// ==================== 向后兼容的类型别名 ====================

/**
 * 向后兼容的类型别名
 * Backward compatible type aliases
 */
export type {
  // 基础类型
  CacheConfig as Config,
  CacheItem as Item,
  CacheStats as Stats,
  CacheEvent as Event,
  CacheManager as Manager,

  // 高级配置
  AdvancedCacheConfig as AdvancedConfig,
  CacheClusterConfig as ClusterConfig,
  CacheShardingConfig as ShardingConfig,

  // 接口
  CacheStorage as Storage,
  PersistentStorage as PersistentStore,
  MetricsCollector as Metrics,
  Preloader as PreloadManager,

  // 工具类型
  CacheEventType as EventType,
  CacheStrategy as Strategy,
  CacheEventListener as EventListener,
};
