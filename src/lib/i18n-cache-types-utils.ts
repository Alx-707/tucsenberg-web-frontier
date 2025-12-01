/**
 * 国际化缓存工具函数
 * I18n Cache Utility Functions
 *
 * 提供缓存系统所需的工具函数、验证器和辅助方法
 */

import type { Locale } from '@/types/i18n';
import type { CacheStats } from '@/lib/i18n-cache-types-base';
import {
  ANIMATION_DURATION_VERY_SLOW,
  BYTES_PER_KB,
  COUNT_PAIR,
  COUNT_TEN,
  HOURS_PER_DAY,
  ONE,
  SECONDS_PER_MINUTE,
  ZERO,
} from '@/constants';
import { COUNT_256 } from '@/constants/count';

/**
 * 缓存键工具函数
 * Cache key utility functions
 */
export const CacheKeyUtils = {
  /**
   * 创建缓存键
   * Create cache key
   */
  create(locale: Locale, namespace?: string, key?: string): string {
    const parts: string[] = [locale];
    if (namespace) parts.push(namespace);
    if (key) parts.push(key);
    return parts.join(':');
  },

  /**
   * 解析缓存键
   * Parse cache key
   */
  parse(cacheKey: string): {
    locale: Locale;
    namespace?: string;
    key?: string;
  } {
    const parts = cacheKey.split(':');
    const [loc, ns, k] = parts;
    const result: {
      locale: Locale;
      namespace?: string;
      key?: string;
    } = {
      locale: (loc ?? '') as Locale,
    };

    if (ns) {
      result.namespace = ns;
    }

    if (k) {
      result.key = k;
    }

    return result;
  },

  /**
   * 验证缓存键格式
   * Validate cache key format
   */
  validate(key: string): boolean {
    return (
      typeof key === 'string' && key.length > ZERO && key.length <= COUNT_256
    );
  },

  /**
   * 标准化缓存键
   * Normalize cache key
   */
  normalize(key: string): string {
    return key
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9:_-]/g, '_');
  },

  /**
   * 生成通配符模式
   * Generate wildcard pattern
   */
  createPattern(locale?: Locale, namespace?: string): string {
    const parts: string[] = [];
    if (locale) parts.push(locale);
    else parts.push('*');
    if (namespace) parts.push(namespace);
    else parts.push('*');
    parts.push('*');
    return parts.join(':');
  },
} as const;

/**
 * 缓存时间工具函数
 * Cache time utility functions
 */
export const CacheTimeUtils = {
  /**
   * 检查是否过期
   * Check if expired
   */
  isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  },

  /**
   * 计算剩余时间
   * Calculate remaining time
   */
  getRemainingTime(timestamp: number, ttl: number): number {
    const elapsed = Date.now() - timestamp;
    return Math.max(ZERO, ttl - elapsed);
  },

  /**
   * 格式化时间
   * Format time
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / ANIMATION_DURATION_VERY_SLOW);
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    const hours = Math.floor(minutes / SECONDS_PER_MINUTE);
    const days = Math.floor(hours / HOURS_PER_DAY);

    if (days > ZERO) return `${days}d ${hours % HOURS_PER_DAY}h`;
    if (hours > ZERO) return `${hours}h ${minutes % SECONDS_PER_MINUTE}m`;
    if (minutes > ZERO) return `${minutes}m ${seconds % SECONDS_PER_MINUTE}s`;
    return `${seconds}s`;
  },

  /**
   * 解析时间字符串
   * Parse time string
   */
  parseTimeString(timeStr: string): number {
    const match = timeStr.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) throw new Error(`Invalid time format: ${timeStr}`);

    const [, value, unit] = match;
    if (!value || !unit) throw new Error(`Invalid time format: ${timeStr}`);

    let multiplier = ONE;
    switch (unit) {
      case 'ms':
        multiplier = ONE;
        break;
      case 's':
        multiplier = ANIMATION_DURATION_VERY_SLOW;
        break;
      case 'm':
        multiplier = SECONDS_PER_MINUTE * ANIMATION_DURATION_VERY_SLOW;
        break;
      case 'h':
        multiplier =
          SECONDS_PER_MINUTE *
          SECONDS_PER_MINUTE *
          ANIMATION_DURATION_VERY_SLOW;
        break;
      case 'd':
        multiplier =
          HOURS_PER_DAY *
          SECONDS_PER_MINUTE *
          SECONDS_PER_MINUTE *
          ANIMATION_DURATION_VERY_SLOW;
        break;
      default:
        throw new Error(`Invalid time format: ${timeStr}`);
    }

    return parseInt(value, COUNT_TEN) * multiplier;
  },
} as const;

/**
 * 缓存大小工具函数
 * Cache size utility functions
 */
export const CacheSizeUtils = {
  /**
   * 估算对象大小
   * Estimate object size
   */
  estimateSize(obj: unknown): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch {
      return ZERO;
    }
  },

  /**
   * 格式化字节大小
   * Format byte size
   */
  formatBytes(bytes: number): string {
    let size = bytes;
    let unitIndex = 0;
    while (size >= BYTES_PER_KB && unitIndex < 4) {
      size /= BYTES_PER_KB;
      unitIndex += 1;
    }
    const unitLabel =
      unitIndex === 0
        ? 'B'
        : unitIndex === 1
          ? 'KB'
          : unitIndex === 2
            ? 'MB'
            : unitIndex === 3
              ? 'GB'
              : 'TB';
    return `${size.toFixed(COUNT_PAIR)} ${unitLabel}`;
  },

  /**
   * 解析大小字符串
   * Parse size string
   */
  parseSize(sizeStr: string): number {
    const upper = sizeStr.trim().toUpperCase();
    const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
    const unit = units.find((u) => upper.endsWith(u));
    if (!unit) throw new Error(`Invalid size format: ${sizeStr}`);

    const numberPart = upper.slice(0, -unit.length).trim();
    // Validate numberPart without regex: digits with at most one dot
    let dotCount = 0;
    for (let i = 0; i < numberPart.length; i++) {
      const code = numberPart.charCodeAt(i);
      if (code === 46) {
        // '.'
        dotCount += 1;
        if (dotCount > 1) throw new Error(`Invalid size format: ${sizeStr}`);
        continue;
      }
      if (code < 48 || code > 57)
        throw new Error(`Invalid size format: ${sizeStr}`);
    }
    const value = parseFloat(numberPart);
    if (!Number.isFinite(value))
      throw new Error(`Invalid size format: ${sizeStr}`);

    const multiplier = (() => {
      switch (unit) {
        case 'B':
          return ONE;
        case 'KB':
          return BYTES_PER_KB;
        case 'MB':
          return BYTES_PER_KB * BYTES_PER_KB;
        case 'GB':
          return BYTES_PER_KB * BYTES_PER_KB * BYTES_PER_KB;
        case 'TB':
          return BYTES_PER_KB * BYTES_PER_KB * BYTES_PER_KB * BYTES_PER_KB;
        default:
          return ONE;
      }
    })();
    return value * multiplier;
  },
} as const;

/**
 * 缓存统计工具函数
 * Cache statistics utility functions
 */
export const CacheStatsUtils = {
  /**
   * 计算命中率
   * Calculate hit rate
   */
  calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    return total > ZERO ? hits / total : ZERO;
  },

  /**
   * 计算平均年龄
   * Calculate average age
   */
  calculateAverageAge(items: Array<{ timestamp: number }>): number {
    if (items.length === ZERO) return ZERO;
    const now = Date.now();
    const totalAge = items.reduce(
      (sum, item) => sum + (now - item.timestamp),
      ZERO,
    );
    return totalAge / items.length;
  },

  /**
   * 生成统计报告
   * Generate statistics report
   */
  generateReport(stats: CacheStats): string {
    const parts = [
      'Cache Statistics:',
      `- Size: ${stats.size} items`,
      `- Total Hits: ${stats.totalHits}`,
      `- Average Age: ${CacheTimeUtils.formatDuration(stats.averageAge)}`,
    ];
    return parts.join('\n');
  },

  /**
   * 比较统计数据
   * Compare statistics
   */
  compareStats(
    before: CacheStats,
    after: CacheStats,
  ): {
    sizeDiff: number;
    hitsDiff: number;
    ageDiff: number;
  } {
    return {
      sizeDiff: after.size - before.size,
      hitsDiff: after.totalHits - before.totalHits,
      ageDiff: after.averageAge - before.averageAge,
    };
  },
} as const;

/**
 * 缓存序列化工具函数
 * Cache serialization utility functions
 */
export const CacheSerializationUtils = {
  /**
   * 序列化数据
   * Serialize data
   */
  serialize(data: unknown): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      throw new Error(
        `Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },

  /**
   * 反序列化数据
   * Deserialize data
   */
  deserialize<T>(data: string): T {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      throw new Error(
        `Deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },

  /**
   * 安全序列化
   * Safe serialize
   */
  safeSerialize(data: unknown, fallback = '{}'): string {
    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  },

  /**
   * 安全反序列化
   * Safe deserialize
   */
  safeDeserialize<T>(data: string, fallback: T): T {
    try {
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  },
} as const;

// Re-export from split modules for backward compatibility
export { CacheDebugUtils } from '@/lib/i18n-cache-debug-utils';
export { CacheEventUtils } from '@/lib/i18n-cache-event-utils';
export { CacheValidationUtils } from '@/lib/i18n-cache-validation-utils';
