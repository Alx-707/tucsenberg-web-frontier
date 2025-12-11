import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageManager } from '@/lib/locale-storage-local';
import { estimateStorageSize } from '@/lib/locale-storage-types';
import {
  calculateHealthCheck,
  calculateStorageEfficiency,
  calculateStorageStats,
  getStorageStats,
  performHealthCheck,
} from '../locale-storage-analytics-core';

// Mock dependencies
vi.mock('@/lib/locale-storage-local', () => ({
  LocalStorageManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/lib/locale-storage-types', async () => {
  const actual = await vi.importActual('@/lib/locale-storage-types');
  return {
    ...actual,
    estimateStorageSize: vi.fn((value) => {
      if (value === null || value === undefined) return 0;
      return JSON.stringify(value).length * 2;
    }),
  };
});

function createValidPreference(overrides = {}) {
  return {
    locale: 'en',
    confidence: 0.9,
    lastUpdated: Date.now(),
    source: 'user',
    ...overrides,
  };
}

function createValidHistory(overrides = {}) {
  return {
    history: [
      {
        locale: 'en',
        detectedLocale: 'en',
        timestamp: Date.now(),
      },
    ],
    lastUpdated: Date.now(),
    ...overrides,
  };
}

function createStatsInput(
  overrides: Partial<{
    totalEntries: number;
    totalSize: number;
    lastAccessed: number;
    lastModified: number;
    accessCount: number;
    errorCount: number;
    freshness: number;
    hasOverride: boolean;
    historyStats: {
      totalEntries: number;
      uniqueLocales: number;
      oldestEntry: number;
      newestEntry: number;
    };
  }> = {},
) {
  return {
    totalEntries: 3,
    totalSize: 2048,
    lastAccessed: Date.now(),
    lastModified: Date.now(),
    accessCount: 5,
    errorCount: 1,
    freshness: 0.9,
    hasOverride: false,
    historyStats: {
      totalEntries: 5,
      uniqueLocales: 2,
      oldestEntry: Date.now() - 1000,
      newestEntry: Date.now(),
    },
    ...overrides,
  };
}

describe('locale-storage-analytics-core', () => {
  let originalLocalStorage: Storage;
  let originalSessionStorage: Storage;
  let originalDocument: Document;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T00:00:00Z'));

    // Store original globals
    originalLocalStorage = globalThis.localStorage;
    originalSessionStorage = globalThis.sessionStorage;
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();

    // Restore original globals
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      writable: true,
    });
  });

  describe('calculateStorageStats', () => {
    it('should return minimal values when storage is empty', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(estimateStorageSize).mockReturnValue(0);

      const stats = calculateStorageStats();

      // detectionHistory always has a fallback value { history: [], lastUpdated: 0 }
      // so totalEntries is 1 (the fallback counts as an entry)
      expect(stats.totalEntries).toBe(1);
      expect(stats.totalSize).toBe(0);
      expect(stats.historyStats.totalEntries).toBe(0);
    });

    it('should calculate stats from stored data', () => {
      const now = Date.now();
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'user-locale-preference') {
          return createValidPreference({ lastUpdated: now });
        }
        if (key === 'locale-detection-history') {
          return createValidHistory({
            history: [
              { locale: 'en', timestamp: now },
              { locale: 'zh', timestamp: now - 1000 },
            ],
            lastUpdated: now,
          });
        }
        return null;
      });
      vi.mocked(estimateStorageSize).mockImplementation((value) =>
        value === null || value === undefined ? 0 : 100,
      );

      const stats = calculateStorageStats();

      expect(stats.totalEntries).toBe(2); // preference + history
      expect(stats.totalSize).toBe(200); // 2 * 100 (preference + history, fallback is null=0)
      expect(stats.historyStats.totalEntries).toBe(2);
      expect(stats.historyStats.uniqueLocales).toBe(2);
    });

    it('should calculate hasOverride when source is user_override', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'user-locale-preference') {
          return createValidPreference({ source: 'user_override' });
        }
        return null;
      });

      const stats = calculateStorageStats();

      expect(stats.hasOverride).toBe(true);
    });

    it('should calculate freshness based on data age', () => {
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'user-locale-preference') {
          return createValidPreference({ lastUpdated: threeDaysAgo });
        }
        return null;
      });

      const stats = calculateStorageStats();

      expect(stats.freshness).toBeLessThan(1);
      expect(stats.freshness).toBeGreaterThan(0);
    });

    it('should handle fallback locale with lastUpdated', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'fallback-locale') {
          return { locale: 'en', lastUpdated: Date.now() };
        }
        return null;
      });

      const stats = calculateStorageStats();

      // detectionHistory always has a fallback value { history: [], lastUpdated: 0 }
      // which counts as 1 entry, plus fallbackLocale = 2 total
      expect(stats.totalEntries).toBe(2);
    });

    it('should handle history with detectedLocale field', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'locale-detection-history') {
          return createValidHistory({
            history: [
              { detectedLocale: 'en', timestamp: Date.now() },
              { detectedLocale: 'zh', timestamp: Date.now() - 1000 },
            ],
          });
        }
        return null;
      });

      const stats = calculateStorageStats();

      expect(stats.historyStats.uniqueLocales).toBe(2);
    });
  });

  describe('getStorageStats', () => {
    it('should return success result with stats', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = getStorageStats();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.source).toBe('localStorage');
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return error result when exception occurs', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = getStorageStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });

    it('should handle non-Error exceptions', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw 'string error';
      });

      const result = getStorageStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('calculateHealthCheck', () => {
    it('should return healthy status for normal storage', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'user-locale-preference') {
          return createValidPreference();
        }
        return null;
      });
      vi.mocked(estimateStorageSize).mockReturnValue(100);

      const health = calculateHealthCheck();

      expect(health.isHealthy).toBe(true);
      expect(health.status).toBe('healthy');
      expect(health.issues).toHaveLength(0);
    });

    it('should detect localStorage unavailability', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(estimateStorageSize).mockReturnValue(0);

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          setItem: () => {
            throw new Error('blocked');
          },
          removeItem: () => {
            throw new Error('blocked');
          },
        },
        writable: true,
      });

      const health = calculateHealthCheck();

      expect(
        health.issues.some((i) => i.message === 'localStorage不可用'),
      ).toBe(true);
      expect(health.performance.availability).toBe(0);
    });

    it('should detect cookie unavailability', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(estimateStorageSize).mockReturnValue(0);

      Object.defineProperty(globalThis, 'document', {
        value: {
          get cookie() {
            throw new Error('disabled');
          },
          set cookie(_val: string) {
            throw new Error('disabled');
          },
        },
        writable: true,
      });

      const health = calculateHealthCheck();

      expect(health.issues.some((i) => i.message === 'Cookies不可用')).toBe(
        true,
      );
    });

    it('should detect stale data', () => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'user-locale-preference') {
          return createValidPreference({ lastUpdated: tenDaysAgo });
        }
        return null;
      });

      const health = calculateHealthCheck();

      expect(health.issues.some((i) => i.message === '数据过期')).toBe(true);
    });

    it('should detect large storage usage', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'user-locale-preference') {
          return createValidPreference();
        }
        return null;
      });
      // Return size > 80% of 5MB
      vi.mocked(estimateStorageSize).mockReturnValue(4.5 * 1024 * 1024);

      const health = calculateHealthCheck();

      expect(health.issues.some((i) => i.message === '存储空间使用过多')).toBe(
        true,
      );
    });

    it('should detect too many history entries', () => {
      const largeHistory = Array.from({ length: 1200 }, (_, i) => ({
        locale: 'en',
        timestamp: Date.now() - i * 1000,
      }));

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'locale-detection-history') {
          return createValidHistory({ history: largeHistory });
        }
        return null;
      });

      const health = calculateHealthCheck();

      expect(health.issues.some((i) => i.message === '历史记录过多')).toBe(
        true,
      );
    });

    it('should return warning status for moderate issues', () => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

      // Create stale data AND unavailable cookies to trigger multiple moderate issues
      // Stale data: -0.2, cookies unavailable: -0.2 = total 0.6 (warning range: 0.5-0.8)
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === 'user-locale-preference') {
          return createValidPreference({ lastUpdated: tenDaysAgo });
        }
        return null;
      });

      Object.defineProperty(globalThis, 'document', {
        value: {
          get cookie() {
            throw new Error('disabled');
          },
          set cookie(_val: string) {
            throw new Error('disabled');
          },
        },
        writable: true,
      });

      const health = calculateHealthCheck();

      expect(health.status).toBe('warning');
    });

    it('should return error status for severe issues', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          setItem: () => {
            throw new Error('blocked');
          },
          removeItem: () => {
            throw new Error('blocked');
          },
        },
        writable: true,
      });
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: {
          setItem: () => {
            throw new Error('blocked');
          },
          removeItem: () => {
            throw new Error('blocked');
          },
        },
        writable: true,
      });
      Object.defineProperty(globalThis, 'document', {
        value: {
          get cookie() {
            throw new Error('disabled');
          },
          set cookie(_val: string) {
            throw new Error('disabled');
          },
        },
        writable: true,
      });

      const health = calculateHealthCheck();

      expect(health.status).toBe('error');
      expect(health.isHealthy).toBe(false);
    });

    it('should include storage utilization info', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(estimateStorageSize).mockReturnValue(1024);

      const health = calculateHealthCheck();

      expect(health.storage.used).toBeDefined();
      expect(health.storage.available).toBeDefined();
      expect(health.storage.quota).toBe(5 * 1024 * 1024);
      expect(health.storage.utilization).toBeDefined();
    });
  });

  describe('performHealthCheck', () => {
    it('should return success result with health check data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = performHealthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.isHealthy).toBeDefined();
    });

    it('should return error result when exception occurs', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Health check error');
      });

      const result = performHealthCheck();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Health check error');
    });

    it('should include response time', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = performHealthCheck();

      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateStorageEfficiency', () => {
    it('should return value between 0 and 1', () => {
      const stats = createStatsInput();

      const efficiency = calculateStorageEfficiency(stats);

      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });

    it('should return higher efficiency for fresh data', () => {
      const freshStats = createStatsInput({ freshness: 0.95 });
      const staleStats = createStatsInput({ freshness: 0.1 });

      const freshEfficiency = calculateStorageEfficiency(freshStats);
      const staleEfficiency = calculateStorageEfficiency(staleStats);

      expect(freshEfficiency).toBeGreaterThan(staleEfficiency);
    });

    it('should return higher efficiency for smaller storage', () => {
      const smallStats = createStatsInput({ totalSize: 512 });
      const largeStats = createStatsInput({ totalSize: 10 * 1024 * 1024 });

      const smallEfficiency = calculateStorageEfficiency(smallStats);
      const largeEfficiency = calculateStorageEfficiency(largeStats);

      expect(smallEfficiency).toBeGreaterThan(largeEfficiency);
    });

    it('should return higher efficiency for fewer history entries', () => {
      const fewEntriesStats = createStatsInput({
        historyStats: {
          totalEntries: 5,
          uniqueLocales: 2,
          oldestEntry: 0,
          newestEntry: 0,
        },
      });
      const manyEntriesStats = createStatsInput({
        historyStats: {
          totalEntries: 500,
          uniqueLocales: 10,
          oldestEntry: 0,
          newestEntry: 0,
        },
      });

      const fewEfficiency = calculateStorageEfficiency(fewEntriesStats);
      const manyEfficiency = calculateStorageEfficiency(manyEntriesStats);

      expect(fewEfficiency).toBeGreaterThan(manyEfficiency);
    });

    it('should handle edge case of zero total size', () => {
      const stats = createStatsInput({ totalSize: 0 });

      const efficiency = calculateStorageEfficiency(stats);

      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });

    it('should handle edge case of zero history entries', () => {
      const stats = createStatsInput({
        historyStats: {
          totalEntries: 0,
          uniqueLocales: 0,
          oldestEntry: 0,
          newestEntry: 0,
        },
      });

      const efficiency = calculateStorageEfficiency(stats);

      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });

    it('should clamp result to 0-1 range even with extreme values', () => {
      const extremeStats = createStatsInput({
        freshness: -0.5,
        totalSize: Number.MAX_SAFE_INTEGER,
        historyStats: {
          totalEntries: Number.MAX_SAFE_INTEGER,
          uniqueLocales: 0,
          oldestEntry: 0,
          newestEntry: 0,
        },
      });

      const efficiency = calculateStorageEfficiency(extremeStats);

      expect(efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });
  });
});
