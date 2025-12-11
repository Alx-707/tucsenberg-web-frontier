import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CacheConfig, MetricsCollector } from '@/lib/i18n-cache-types';
import { createLRUCache, LRUCache } from '../i18n-lru-cache';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createMockMetricsCollector(): MetricsCollector {
  return {
    recordLoadTime: vi.fn(),
    recordCacheHit: vi.fn(),
    recordCacheMiss: vi.fn(),
    recordError: vi.fn(),
    recordLocaleUsage: vi.fn(),
    recordTranslationCoverage: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      totalLoadTime: 0,
      averageLoadTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      errors: 0,
    }),
    reset: vi.fn(),
  };
}

function createDefaultConfig(overrides?: Partial<CacheConfig>): CacheConfig {
  return {
    maxSize: 100,
    ttl: 60000,
    enablePersistence: false,
    storageKey: 'test-cache',
    ...overrides,
  };
}

// Helper to create a mock localStorage
function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('LRUCache', () => {
  let cache: LRUCache<string>;
  let metricsCollector: MetricsCollector;
  let config: CacheConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    metricsCollector = createMockMetricsCollector();
    config = createDefaultConfig();
    cache = new LRUCache<string>(config, metricsCollector);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create cache with provided config', () => {
      expect(cache.size()).toBe(0);
    });

    it('should load from storage when persistence is enabled in browser', () => {
      const mockStorage = createMockLocalStorage();
      const storedData = {
        key1: {
          data: 'value1',
          timestamp: Date.now(),
          ttl: 60000,
          hits: 0,
        },
      };
      mockStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      expect(mockStorage.getItem).toHaveBeenCalledWith('test-cache');
      expect(persistentCache.size()).toBe(1);

      vi.unstubAllGlobals();
    });

    it('should handle corrupted storage data gracefully', () => {
      const mockStorage = createMockLocalStorage();
      mockStorage.getItem.mockReturnValue('invalid json');
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      expect(persistentCache.size()).toBe(0);

      vi.unstubAllGlobals();
    });

    it('should filter out invalid cache items from storage', () => {
      const mockStorage = createMockLocalStorage();
      const storedData = {
        'valid-key': {
          data: 'value',
          timestamp: Date.now(),
          ttl: 60000,
          hits: 0,
        },
        'invalid-key': { data: 'missing fields' },
      };
      mockStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      expect(persistentCache.size()).toBe(1);

      vi.unstubAllGlobals();
    });

    it('should reject keys with invalid characters from storage', () => {
      const mockStorage = createMockLocalStorage();
      const storedData = {
        'valid-key': {
          data: 'value',
          timestamp: Date.now(),
          ttl: 60000,
          hits: 0,
        },
        'invalid key with spaces': {
          data: 'value2',
          timestamp: Date.now(),
          ttl: 60000,
          hits: 0,
        },
      };
      mockStorage.getItem.mockReturnValue(JSON.stringify(storedData));
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      expect(persistentCache.size()).toBe(1);

      vi.unstubAllGlobals();
    });
  });

  describe('get', () => {
    it('should return null and record miss for non-existent key', () => {
      const result = cache.get('nonexistent');

      expect(result).toBeNull();
      expect(metricsCollector.recordCacheMiss).toHaveBeenCalled();
    });

    it('should return value and record hit for existing key', () => {
      cache.set('key1', 'value1');

      const result = cache.get('key1');

      expect(result).toBe('value1');
      expect(metricsCollector.recordCacheHit).toHaveBeenCalled();
    });

    it('should return null and record miss for expired key', () => {
      cache.set('key1', 'value1', 1000);

      vi.advanceTimersByTime(1001);

      const result = cache.get('key1');

      expect(result).toBeNull();
      expect(metricsCollector.recordCacheMiss).toHaveBeenCalled();
    });

    it('should update access order (LRU behavior)', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it most recently used
      cache.get('key1');

      const keys = Array.from(cache.keys());
      expect(keys[keys.length - 1]).toBe('key1');
    });

    it('should increment hit count on access', () => {
      cache.set('key1', 'value1');

      cache.get('key1');
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();
      expect(stats.totalHits).toBe(3);
    });
  });

  describe('set', () => {
    it('should store value with default TTL', () => {
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');
    });

    it('should store value with custom TTL', () => {
      cache.set('key1', 'value1', 5000);

      vi.advanceTimersByTime(4999);
      expect(cache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(2);
      expect(cache.get('key1')).toBeNull();
    });

    it('should evict oldest entry when cache is full', () => {
      const smallConfig = createDefaultConfig({ maxSize: 3 });
      const smallCache = new LRUCache<string>(smallConfig, metricsCollector);

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBeNull(); // Evicted
      expect(smallCache.get('key4')).toBe('value4');
      expect(smallCache.size()).toBe(3);
    });

    it('should save to storage when persistence is enabled', () => {
      const mockStorage = createMockLocalStorage();
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      persistentCache.set('key1', 'value1');

      expect(mockStorage.setItem).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key1', 'value1');

      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', () => {
      cache.set('key1', 'value1', 1000);

      vi.advanceTimersByTime(1001);

      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing key and return true', () => {
      cache.set('key1', 'value1');

      const result = cache.delete('key1');

      expect(result).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const result = cache.delete('nonexistent');

      expect(result).toBe(false);
    });

    it('should save to storage after delete when persistence is enabled', () => {
      const mockStorage = createMockLocalStorage();
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      persistentCache.set('key1', 'value1');
      mockStorage.setItem.mockClear();

      persistentCache.delete('key1');

      expect(mockStorage.setItem).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.size()).toBe(0);
    });

    it('should remove storage when persistence is enabled', () => {
      const mockStorage = createMockLocalStorage();
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      persistentCache.clear();

      expect(mockStorage.removeItem).toHaveBeenCalledWith('test-cache');

      vi.unstubAllGlobals();
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct count', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.size()).toBe(2);
    });
  });

  describe('keys', () => {
    it('should return empty iterator for empty cache', () => {
      const keys = Array.from(cache.keys());

      expect(keys).toEqual([]);
    });

    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const keys = Array.from(cache.keys());

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('values', () => {
    it('should return empty iterator for empty cache', () => {
      const values = Array.from(cache.values());

      expect(values).toEqual([]);
    });

    it('should return all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const values = Array.from(cache.values());

      expect(values).toContain('value1');
      expect(values).toContain('value2');
    });
  });

  describe('entries', () => {
    it('should return empty iterator for empty cache', () => {
      const entries = Array.from(cache.entries());

      expect(entries).toEqual([]);
    });

    it('should return all key-value pairs', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const entries = Array.from(cache.entries());

      expect(entries).toContainEqual(['key1', 'value1']);
      expect(entries).toContainEqual(['key2', 'value2']);
    });
  });

  describe('getStats', () => {
    it('should return empty stats for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.averageAge).toBe(0);
    });

    it('should return correct stats', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1');
      cache.get('key1');

      vi.advanceTimersByTime(1000);

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.totalHits).toBe(2);
      expect(stats.averageAge).toBeGreaterThan(0);
    });
  });

  describe('getDetailedStats', () => {
    it('should return detailed stats for empty cache', () => {
      const stats = cache.getDetailedStats();

      expect(stats.size).toBe(0);
      expect(stats.utilizationRate).toBe(0);
    });

    it('should return detailed stats with distributions', () => {
      cache.set('key1', 'value1', 10000);
      cache.set('key2', 'value2', 20000);
      cache.get('key1');
      cache.get('key1');

      vi.advanceTimersByTime(500);

      const stats = cache.getDetailedStats();

      expect(stats.size).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.ageDistribution).toBeDefined();
      expect(stats.hitDistribution).toBeDefined();
      expect(stats.ttlDistribution).toBeDefined();
      expect(stats.utilizationRate).toBe(2);
    });

    it('should count expired items correctly', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 5000);

      vi.advanceTimersByTime(2000);

      const stats = cache.getDetailedStats();

      expect(stats.expiredItems).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should return 0 when no items expired', () => {
      cache.set('key1', 'value1');

      const cleaned = cache.cleanup();

      expect(cleaned).toBe(0);
    });

    it('should remove expired items and return count', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 2000);
      cache.set('key3', 'value3', 5000);

      vi.advanceTimersByTime(2500);

      const cleaned = cache.cleanup();

      expect(cleaned).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.get('key3')).toBe('value3');
    });

    it('should save to storage after cleanup when persistence is enabled', () => {
      const mockStorage = createMockLocalStorage();
      vi.stubGlobal('localStorage', mockStorage);

      const persistentConfig = createDefaultConfig({ enablePersistence: true });
      const persistentCache = new LRUCache<string>(
        persistentConfig,
        metricsCollector,
      );

      persistentCache.set('key1', 'value1', 1000);
      mockStorage.setItem.mockClear();

      vi.advanceTimersByTime(1500);

      persistentCache.cleanup();

      expect(mockStorage.setItem).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('warmup', () => {
    it('should add all entries to cache', () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3', ttl: 5000 },
      ];

      cache.warmup(entries);

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('getMultiple', () => {
    it('should return map with all requested keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const result = cache.getMultiple(['key1', 'key2', 'key3']);

      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBe('value2');
      expect(result.get('key3')).toBeNull();
    });
  });

  describe('setMultiple', () => {
    it('should set all entries', () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ];

      cache.setMultiple(entries);

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('deleteMultiple', () => {
    it('should delete all specified keys and return count', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const deleted = cache.deleteMultiple(['key1', 'key3', 'nonexistent']);

      expect(deleted).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('memory estimation', () => {
    it('should estimate memory for string values', () => {
      cache.set('key1', 'short');
      cache.set('key2', 'a much longer string value');

      const stats = cache.getDetailedStats();

      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should estimate memory for object values', () => {
      const objectCache = new LRUCache<Record<string, unknown>>(
        config,
        metricsCollector,
      );

      objectCache.set('key1', { nested: { value: 'test' }, array: [1, 2, 3] });

      const stats = objectCache.getDetailedStats();

      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should estimate memory for array values', () => {
      const arrayCache = new LRUCache<string[]>(config, metricsCollector);

      arrayCache.set('key1', ['item1', 'item2', 'item3']);

      const stats = arrayCache.getDetailedStats();

      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should handle null and undefined values', () => {
      const mixedCache = new LRUCache<unknown>(config, metricsCollector);

      mixedCache.set('key1', null);
      mixedCache.set('key2', undefined);

      const stats = mixedCache.getDetailedStats();

      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should handle boolean and number values', () => {
      const mixedCache = new LRUCache<unknown>(config, metricsCollector);

      mixedCache.set('key1', true);
      mixedCache.set('key2', 42);

      const stats = mixedCache.getDetailedStats();

      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('median calculation', () => {
    it('should calculate median for odd number of items', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 2000);
      cache.set('key3', 'value3', 3000);

      const stats = cache.getDetailedStats();

      expect(stats.ttlDistribution.median).toBe(2000);
    });

    it('should calculate median for even number of items', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 2000);
      cache.set('key3', 'value3', 3000);
      cache.set('key4', 'value4', 4000);

      const stats = cache.getDetailedStats();

      expect(stats.ttlDistribution.median).toBe(2500);
    });
  });
});

describe('createLRUCache', () => {
  it('should create LRUCache instance', () => {
    const metricsCollector = createMockMetricsCollector();
    const config = createDefaultConfig();

    const cache = createLRUCache<string>(config, metricsCollector);

    expect(cache).toBeInstanceOf(LRUCache);
  });
});
