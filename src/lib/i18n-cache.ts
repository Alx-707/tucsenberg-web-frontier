/**
 * 企业级国际化缓存和性能优化
 * 提供翻译缓存、预加载、性能监控等功能
 */
import type { I18nMetrics, Locale, Messages } from '@/types/i18n';
import { CACHE_DURATIONS, CACHE_LIMITS } from '@/constants/i18n-constants';

// 缓存配置
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enablePersistence: boolean;
  storageKey: string;
}

// 缓存项
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

// 性能指标收集器
class I18nMetricsCollector {
  private metrics: I18nMetrics = {
    loadTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    translationCoverage: 0,
    localeUsage: { en: 0, zh: 0 },
  };

  private totalRequests = 0;
  private cacheHits = 0;
  private errors = 0;
  private loadTimes: number[] = [];

  recordLoadTime(time: number): void {
    this.loadTimes.push(time);
    this.metrics.loadTime =
      this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length;
  }

  recordCacheHit(): void {
    this.cacheHits++;
    this.totalRequests++;
    this.updateCacheHitRate();
  }

  recordCacheMiss(): void {
    this.totalRequests++;
    this.updateCacheHitRate();
  }

  recordError(): void {
    this.errors++;
    this.updateErrorRate();
  }

  recordLocaleUsage(locale: Locale): void {
    this.metrics.localeUsage[locale]++;
  }

  private updateCacheHitRate(): void {
    this.metrics.cacheHitRate =
      this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0;
  }

  private updateErrorRate(): void {
    this.metrics.errorRate =
      this.totalRequests > 0 ? this.errors / this.totalRequests : 0;
  }

  getMetrics(): I18nMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      loadTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      translationCoverage: 0,
      localeUsage: { en: 0, zh: 0 },
    };
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.errors = 0;
    this.loadTimes = [];
  }
}

// 高性能LRU缓存实现
class LRUCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private metricsCollector: I18nMetricsCollector;

  constructor(config: CacheConfig, metricsCollector: I18nMetricsCollector) {
    this.config = config;
    this.metricsCollector = metricsCollector;

    if (config.enablePersistence && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.metricsCollector.recordCacheMiss();
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.metricsCollector.recordCacheMiss();
      return null;
    }

    // Update access order (LRU)
    this.cache.delete(key);
    item.hits++;
    this.cache.set(key, item);

    this.metricsCollector.recordCacheHit();
    return item.data;
  }

  set(key: string, value: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;

    // Remove oldest item if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const item: CacheItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    };

    this.cache.set(key, item);

    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    if (this.config.enablePersistence && typeof window !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const items = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: items.reduce((sum, item) => sum + item.hits, 0),
      averageAge:
        items.length > 0
          ? items.reduce(
              (sum, item) => sum + (Date.now() - item.timestamp),
              0,
            ) / items.length
          : 0,
    };
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, item]) => {
          this.cache.set(key, item as CacheItem<T>);
        });
      }
    } catch {
      // 静默处理缓存加载错误，避免在生产环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        // 在开发环境中可以使用调试器或其他日志方案
        // console.warn('Failed to load i18n cache from storage:', error);
      }
    }
  }

  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch {
      // 静默处理缓存保存错误，避免在生产环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        // 在开发环境中可以使用调试器或其他日志方案
        // console.warn('Failed to save i18n cache to storage:', error);
      }
    }
  }
}

// 翻译预加载器
class TranslationPreloader {
  private cache: LRUCache<Messages>;
  private metricsCollector: I18nMetricsCollector;
  private preloadPromises = new Map<Locale, Promise<Messages>>();

  constructor(
    cache: LRUCache<Messages>,
    metricsCollector: I18nMetricsCollector,
  ) {
    this.cache = cache;
    this.metricsCollector = metricsCollector;
  }

  async preloadLocale(locale: Locale): Promise<Messages> {
    const cacheKey = `messages_${locale}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if already preloading
    if (this.preloadPromises.has(locale)) {
      return this.preloadPromises.get(locale)!;
    }

    // Start preloading
    const startTime = Date.now();
    const promise = this.loadMessages(locale)
      .then((messages) => {
        const loadTime = Date.now() - startTime;
        this.metricsCollector.recordLoadTime(loadTime);
        this.cache.set(cacheKey, messages);
        this.preloadPromises.delete(locale);
        return messages;
      })
      .catch((error) => {
        this.metricsCollector.recordError();
        this.preloadPromises.delete(locale);
        throw error;
      });

    this.preloadPromises.set(locale, promise);
    return promise;
  }

  private async loadMessages(locale: Locale): Promise<Messages> {
    try {
      const messages = await import(`../../messages/${locale}.json`);
      return messages.default;
    } catch {
      throw new Error(`Failed to load messages for locale: ${locale}`);
    }
  }

  preloadAll(): Promise<Messages[]> {
    const locales: Locale[] = ['en', 'zh'];
    return Promise.all(locales.map((locale) => this.preloadLocale(locale)));
  }

  warmupCache(): void {
    // Preload default locale immediately
    this.preloadLocale('en').catch(() => {
      // 静默处理预加载错误，避免在生产环境中输出日志
    });

    // Preload other locales after a short delay
    setTimeout(() => {
      this.preloadLocale('zh').catch(() => {
        // 静默处理预加载错误，避免在生产环境中输出日志
      });
    }, CACHE_LIMITS.MAX_CACHE_ENTRIES);
  }
}

// 主缓存管理器
export class I18nCacheManager {
  private cache: LRUCache<Messages>;
  private preloader: TranslationPreloader;
  private metricsCollector: I18nMetricsCollector;

  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      maxSize: CACHE_LIMITS.MAX_CACHE_ENTRIES,
      ttl: CACHE_DURATIONS.PERFORMANCE_CACHE,
      enablePersistence: true,
      storageKey: 'i18n_cache',
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.metricsCollector = new I18nMetricsCollector();
    this.cache = new LRUCache<Messages>(finalConfig, this.metricsCollector);
    this.preloader = new TranslationPreloader(
      this.cache,
      this.metricsCollector,
    );
  }

  async getMessages(locale: Locale): Promise<Messages> {
    this.metricsCollector.recordLocaleUsage(locale);
    return this.preloader.preloadLocale(locale);
  }

  preloadMessages(locale: Locale): Promise<Messages> {
    return this.preloader.preloadLocale(locale);
  }

  warmupCache(): void {
    this.preloader.warmupCache();
  }

  getMetrics(): I18nMetrics {
    return this.metricsCollector.getMetrics();
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache(): void {
    this.cache.clear();
  }

  resetMetrics(): void {
    this.metricsCollector.reset();
  }
}

// 全局缓存实例
export const i18nCache = new I18nCacheManager();

// 初始化缓存预热
if (typeof window !== 'undefined') {
  // 在浏览器环境中预热缓存
  i18nCache.warmupCache();
}
