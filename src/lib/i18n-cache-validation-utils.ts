/**
 * 缓存验证工具函数
 * Cache Validation Utility Functions
 */

import type { AdvancedCacheConfig } from '@/lib/i18n-cache-types-advanced';
import type {
  CacheConfig,
  CacheConfigValidation,
  CacheItem,
} from '@/lib/i18n-cache-types-base';
import {
  ANIMATION_DURATION_VERY_SLOW,
  HOURS_PER_DAY,
  ONE,
  SECONDS_PER_MINUTE,
  ZERO,
} from '@/constants';
import { COUNT_100000, MAGIC_9 } from '@/constants/count';

/**
 * 缓存验证工具函数
 */
export const CacheValidationUtils = {
  /**
   * 验证缓存项
   */
  validateItem<T>(item: unknown): item is CacheItem<T> {
    return (
      typeof item === 'object' &&
      item !== null &&
      'data' in item &&
      'timestamp' in item &&
      'ttl' in item &&
      'hits' in item &&
      typeof (item as CacheItem<T>).timestamp === 'number' &&
      typeof (item as CacheItem<T>).ttl === 'number' &&
      typeof (item as CacheItem<T>).hits === 'number'
    );
  },

  /**
   * 验证缓存配置
   */
  validateConfig(config: Partial<CacheConfig>): CacheConfigValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxSize !== undefined) {
      if (typeof config.maxSize !== 'number' || config.maxSize < ONE) {
        errors.push('maxSize must be a positive number');
      } else if (config.maxSize > COUNT_100000) {
        warnings.push('maxSize is very large, consider reducing it');
      }
    }

    if (config.ttl !== undefined) {
      if (typeof config.ttl !== 'number' || config.ttl < ZERO) {
        errors.push('ttl must be a non-negative number');
      } else if (
        config.ttl >
        HOURS_PER_DAY *
          SECONDS_PER_MINUTE *
          SECONDS_PER_MINUTE *
          ANIMATION_DURATION_VERY_SLOW
      ) {
        warnings.push('ttl is very long (>24h), consider reducing it');
      }
    }

    if (config.storageKey !== undefined) {
      if (
        typeof config.storageKey !== 'string' ||
        config.storageKey.length === ZERO
      ) {
        errors.push('storageKey must be a non-empty string');
      }
    }

    if (config.enablePersistence !== undefined) {
      if (typeof config.enablePersistence !== 'boolean') {
        errors.push('enablePersistence must be a boolean');
      }
    }

    return {
      isValid: errors.length === ZERO,
      errors,
      warnings,
    };
  },

  /**
   * 验证高级配置
   */
  validateAdvancedConfig(
    config: Partial<AdvancedCacheConfig>,
  ): CacheConfigValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证基础配置
    const baseValidation = this.validateConfig(config);
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);

    // 验证压缩配置
    if (config.compression) {
      if (
        config.compression.enableCompression &&
        config.compression.threshold < ZERO
      ) {
        errors.push('compression threshold must be non-negative');
      }
      if (
        config.compression.level !== undefined &&
        (config.compression.level < ONE || config.compression.level > MAGIC_9)
      ) {
        errors.push('compression level must be between 1 and 9');
      }
    }

    // 验证性能配置
    if (config.performance) {
      if (
        config.performance.maxConcurrentLoads !== undefined &&
        config.performance.maxConcurrentLoads < ONE
      ) {
        errors.push('maxConcurrentLoads must be at least 1');
      }
      if (
        config.performance.loadTimeout !== undefined &&
        config.performance.loadTimeout < ANIMATION_DURATION_VERY_SLOW
      ) {
        warnings.push(
          'loadTimeout is very short (<1s), consider increasing it',
        );
      }
    }

    return {
      isValid: errors.length === ZERO,
      errors,
      warnings,
    };
  },
} as const;
