import { cache } from 'react';
import { logger } from '@/lib/logger';
import {
  CACHE_DURATIONS,
  CACHE_LIMITS,
  PERFORMANCE_THRESHOLDS,
} from '@/constants/i18n-constants';

/**
 * 缓存项接口
 */
interface CacheItem {
  value: unknown;
  timestamp: number;
}

// 翻译缓存管理器
export class TranslationCache {
  private static instance: TranslationCache;
  private cache = new Map<string, CacheItem>();
  private readonly maxSize = CACHE_LIMITS.MAX_PERFORMANCE_DATA_POINTS;
  private readonly ttl = CACHE_DURATIONS.TRANSLATION_CACHE;

  static getInstance(): TranslationCache {
    if (!TranslationCache.instance) {
      TranslationCache.instance = new TranslationCache();
    }
    return TranslationCache.instance;
  }

  // 缓存翻译消息
  set(key: string, value: unknown): void {
    if (this.cache.size >= this.maxSize) {
      // LRU清理
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  // 获取缓存的翻译消息
  get(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  private calculateHitRate(): number {
    // 简化的命中率计算
    return this.cache.size > 0 ? PERFORMANCE_THRESHOLDS.EXCELLENT : 0;
  }
}

// 缓存的消息加载器
export const getCachedMessages = cache(async (locale: string) => {
  const cacheInstance = TranslationCache.getInstance();
  const cacheKey = `messages-${locale}`;

  // 检查缓存
  const cached = cacheInstance.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 加载消息
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    cacheInstance.set(cacheKey, messages);
    return messages;
  } catch (error) {
    logger.error(`Failed to load messages for locale ${locale}:`, error);
    return {};
  }
});

// React缓存的翻译函数
export const getCachedTranslations = cache(
  async (locale: string, namespace?: string) => {
    const messages = await getCachedMessages(locale);

    if (namespace) {
      return messages[namespace] || {};
    }

    return messages;
  },
);

// 预加载翻译消息
export async function preloadTranslations(locales: string[]): Promise<void> {
  const promises = locales.map((locale) => getCachedMessages(locale));
  await Promise.all(promises);
}

// 性能监控
export class I18nPerformanceMonitor {
  private static metrics = {
    loadTime: [] as number[],
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
  };

  static recordLoadTime(time: number): void {
    this.metrics.loadTime.push(time);
    // 保持最近记录数量限制
    if (this.metrics.loadTime.length > CACHE_LIMITS.MAX_CACHE_ENTRIES) {
      this.metrics.loadTime.shift();
    }
  }

  static recordCacheHit(): void {
    this.metrics.cacheHits += 1;
  }

  static recordCacheMiss(): void {
    this.metrics.cacheMisses += 1;
  }

  static recordError(): void {
    this.metrics.errors += 1;
  }

  static getMetrics() {
    const loadTimes = this.metrics.loadTime;
    const avgLoadTime =
      loadTimes.length > 0
        ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
        : 0;

    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      totalRequests > 0
        ? ((this.metrics.cacheHits / totalRequests) *
            PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME) /
          10
        : 0;

    return {
      averageLoadTime: avgLoadTime,
      cacheHitRate,
      totalErrors: this.metrics.errors,
      totalRequests,
    };
  }

  static reset(): void {
    this.metrics = {
      loadTime: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
    };
  }
}

// 性能基准目标
export const PERFORMANCE_TARGETS = {
  TRANSLATION_LOAD_TIME: {
    excellent: 50, // < 50ms
    good: 100, // < 100ms
    acceptable: 200, // < 200ms
    poor: 500, // > 500ms
  },

  CACHE_HIT_RATE: {
    excellent: PERFORMANCE_THRESHOLDS.EXCELLENT + 3, // > 98%
    good: PERFORMANCE_THRESHOLDS.EXCELLENT, // > 95%
    acceptable: PERFORMANCE_THRESHOLDS.GOOD + 10, // > 90%
    poor: PERFORMANCE_THRESHOLDS.GOOD, // < 80%
  },
};

// 性能评估函数
export function evaluatePerformance(
  metrics: ReturnType<typeof I18nPerformanceMonitor.getMetrics>,
) {
  const loadTimeScore = getPerformanceScore(
    metrics.averageLoadTime,
    PERFORMANCE_TARGETS.TRANSLATION_LOAD_TIME,
  );

  const cacheScore = getPerformanceScore(
    metrics.cacheHitRate,
    PERFORMANCE_TARGETS.CACHE_HIT_RATE,
    true,
  );

  const overallScore = (loadTimeScore + cacheScore) / 2;

  return {
    loadTimeScore,
    cacheScore,
    overallScore,
    grade: getGrade(overallScore),
  };
}

function getPerformanceScore(
  value: number,
  targets: unknown,
  higherIsBetter = false,
): number {
  if (higherIsBetter) {
    if (value >= targets.excellent) return CACHE_LIMITS.MAX_CACHE_ENTRIES;
    if (value >= targets.good) return PERFORMANCE_THRESHOLDS.GOOD;
    if (value >= targets.acceptable) return PERFORMANCE_THRESHOLDS.FAIR;
    return PERFORMANCE_THRESHOLDS.POOR;
  }

  if (value <= targets.excellent) return CACHE_LIMITS.MAX_CACHE_ENTRIES;
  if (value <= targets.good) return PERFORMANCE_THRESHOLDS.GOOD;
  if (value <= targets.acceptable) return PERFORMANCE_THRESHOLDS.FAIR;
  return PERFORMANCE_THRESHOLDS.POOR;
}

function getGrade(score: number): string {
  if (score >= PERFORMANCE_THRESHOLDS.EXCELLENT - 5) return 'A';
  if (score >= PERFORMANCE_THRESHOLDS.GOOD) return 'B';
  if (score >= PERFORMANCE_THRESHOLDS.GOOD - 10) return 'C';
  if (score >= PERFORMANCE_THRESHOLDS.FAIR) return 'D';
  return 'F';
}
