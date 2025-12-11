import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageManager } from '@/lib/locale-storage-local';
import { isLocaleDetectionHistory } from '@/lib/locale-storage-types';
import {
  addDetectionRecord,
  createDefaultHistory,
  getDetectionHistory,
  getHistorySummary,
  HistoryCacheManager,
  needsCleanup,
  updateDetectionHistory,
  validateHistoryData,
} from '../locale-storage-history-core';

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
    isLocaleDetectionHistory: vi.fn((obj) => {
      return (
        obj &&
        typeof obj === 'object' &&
        'history' in obj &&
        'lastUpdated' in obj &&
        Array.isArray(obj.history)
      );
    }),
  };
});

function createValidHistory(overrides = {}) {
  return {
    detections: [],
    history: [
      {
        locale: 'en' as const,
        source: 'browser',
        timestamp: Date.now(),
        confidence: 0.9,
        metadata: {},
      },
    ],
    lastUpdated: Date.now(),
    totalDetections: 1,
    ...overrides,
  };
}

describe('locale-storage-history-core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HistoryCacheManager.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('HistoryCacheManager', () => {
    describe('getCachedHistory', () => {
      it('should return null when cache is empty', () => {
        const result = HistoryCacheManager.getCachedHistory();
        expect(result).toBeNull();
      });

      it('should return cached history', () => {
        const history = createValidHistory();
        HistoryCacheManager.updateCache(history);

        const result = HistoryCacheManager.getCachedHistory();
        expect(result).toEqual(history);
      });

      it('should return null when cache is expired', () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        const history = createValidHistory();
        HistoryCacheManager.updateCache(history);

        // Advance time beyond TTL (10 minutes)
        vi.setSystemTime(now + 11 * 60 * 1000);

        const result = HistoryCacheManager.getCachedHistory();
        expect(result).toBeNull();
      });
    });

    describe('updateCache', () => {
      it('should update cache with history', () => {
        const history = createValidHistory();
        HistoryCacheManager.updateCache(history);

        const status = HistoryCacheManager.getCacheStatus();
        expect(status.isCached).toBe(true);
      });
    });

    describe('clearCache', () => {
      it('should clear cache', () => {
        const history = createValidHistory();
        HistoryCacheManager.updateCache(history);

        HistoryCacheManager.clearCache();

        const status = HistoryCacheManager.getCacheStatus();
        expect(status.isCached).toBe(false);
      });
    });

    describe('getCacheStatus', () => {
      it('should return cache status', () => {
        const history = createValidHistory();
        HistoryCacheManager.updateCache(history);

        const status = HistoryCacheManager.getCacheStatus();

        expect(status).toHaveProperty('isCached');
        expect(status).toHaveProperty('cacheAge');
        expect(status).toHaveProperty('cacheSize');
        expect(status.isCached).toBe(true);
        expect(status.cacheSize).toBeGreaterThan(0);
      });

      it('should report not cached when empty', () => {
        const status = HistoryCacheManager.getCacheStatus();
        expect(status.isCached).toBe(false);
        expect(status.cacheSize).toBe(0);
      });
    });
  });

  describe('addDetectionRecord', () => {
    it('should add detection record successfully', () => {
      const history = createValidHistory({ history: [] });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const result = addDetectionRecord({
        locale: 'zh',
        source: 'browser',
        confidence: 0.8,
      });

      expect(result.success).toBe(true);
      expect(LocalStorageManager.set).toHaveBeenCalled();
    });

    it('should clamp confidence to 0-1 range', () => {
      const history = createValidHistory({ history: [] });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      addDetectionRecord({
        locale: 'en',
        source: 'browser',
        confidence: 1.5,
      });

      const setCall = vi.mocked(LocalStorageManager.set).mock.calls[0];
      const savedHistory = setCall[1] as { history: { confidence: number }[] };
      expect(savedHistory.history[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should include metadata', () => {
      const history = createValidHistory({ history: [] });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      addDetectionRecord({
        locale: 'en',
        source: 'browser',
        confidence: 0.9,
        metadata: { custom: 'data' },
      });

      const setCall = vi.mocked(LocalStorageManager.set).mock.calls[0];
      const savedHistory = setCall[1] as {
        history: { metadata: Record<string, unknown> }[];
      };
      expect(savedHistory.history[0].metadata).toEqual({ custom: 'data' });
    });

    it('should clear cache after adding', () => {
      const history = createValidHistory({ history: [] });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      HistoryCacheManager.updateCache(history);

      addDetectionRecord({
        locale: 'en',
        source: 'browser',
        confidence: 0.9,
      });

      // Cache should be cleared
      const status = HistoryCacheManager.getCacheStatus();
      expect(status.isCached).toBe(false);
    });

    it('should catch and return errors', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = addDetectionRecord({
        locale: 'en',
        source: 'browser',
        confidence: 0.9,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });
  });

  describe('getDetectionHistory', () => {
    it('should return cached history', () => {
      const history = createValidHistory();
      HistoryCacheManager.updateCache(history);

      const result = getDetectionHistory();

      expect(result.success).toBe(true);
      expect(result.source).toBe('memory');
      expect(result.data).toEqual(history);
    });

    it('should return history from localStorage', () => {
      const history = createValidHistory();
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const result = getDetectionHistory();

      expect(result.success).toBe(true);
      expect(result.source).toBe('localStorage');
      expect(result.data).toEqual(history);
    });

    it('should create default history when none exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = getDetectionHistory();

      expect(result.success).toBe(true);
      expect(result.data?.history).toEqual([]);
      expect(LocalStorageManager.set).toHaveBeenCalled();
    });

    it('should return error for invalid history data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue({ invalid: true });
      vi.mocked(isLocaleDetectionHistory).mockReturnValue(false);

      const result = getDetectionHistory();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid history data');
    });

    it('should update cache after loading from storage', () => {
      const history = createValidHistory();
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      getDetectionHistory();

      const status = HistoryCacheManager.getCacheStatus();
      expect(status.isCached).toBe(true);
    });

    it('should catch and return errors', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = getDetectionHistory();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Read error');
    });
  });

  describe('updateDetectionHistory', () => {
    it('should add record to history', () => {
      const history = createValidHistory({ history: [] });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const record = {
        locale: 'zh' as const,
        source: 'browser',
        timestamp: Date.now(),
        confidence: 0.9,
        metadata: {},
      };

      const result = updateDetectionHistory(record);

      expect(result.success).toBe(true);
      expect(result.data?.history[0]).toEqual(record);
    });

    it('should prepend record to beginning of history', () => {
      const existingRecord = {
        locale: 'en' as const,
        source: 'browser',
        timestamp: Date.now() - 1000,
        confidence: 0.8,
        metadata: {},
      };
      const history = createValidHistory({ history: [existingRecord] });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const newRecord = {
        locale: 'zh' as const,
        source: 'geo',
        timestamp: Date.now(),
        confidence: 0.9,
        metadata: {},
      };

      const result = updateDetectionHistory(newRecord);

      expect(result.data?.history[0].locale).toBe('zh');
      expect(result.data?.history[1].locale).toBe('en');
    });

    it('should limit history size', () => {
      const largeHistory = Array.from({ length: 150 }, (_, i) => ({
        locale: 'en' as const,
        source: 'browser',
        timestamp: Date.now() - i * 1000,
        confidence: 0.9,
        metadata: {},
      }));
      const history = createValidHistory({ history: largeHistory });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const newRecord = {
        locale: 'zh' as const,
        source: 'browser',
        timestamp: Date.now(),
        confidence: 0.9,
        metadata: {},
      };

      const result = updateDetectionHistory(newRecord);

      expect(result.data?.history.length).toBeLessThanOrEqual(100);
    });

    it('should update lastUpdated timestamp', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const history = createValidHistory({
        history: [],
        lastUpdated: now - 10000,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const record = {
        locale: 'en' as const,
        source: 'browser',
        timestamp: now,
        confidence: 0.9,
        metadata: {},
      };

      const result = updateDetectionHistory(record);

      expect(result.data?.lastUpdated).toBe(now);
    });
  });

  describe('validateHistoryData', () => {
    it('should return true for valid history', () => {
      const history = createValidHistory();
      vi.mocked(isLocaleDetectionHistory).mockReturnValue(true);

      const result = validateHistoryData(history);

      expect(result).toBe(true);
    });

    it('should return false for invalid history', () => {
      vi.mocked(isLocaleDetectionHistory).mockReturnValue(false);

      const result = validateHistoryData({ invalid: true });

      expect(result).toBe(false);
    });
  });

  describe('createDefaultHistory', () => {
    it('should create default history structure', () => {
      const history = createDefaultHistory();

      expect(history.detections).toEqual([]);
      expect(history.history).toEqual([]);
      expect(history.lastUpdated).toBeGreaterThan(0);
      expect(history.totalDetections).toBe(0);
    });
  });

  describe('getHistorySummary', () => {
    it('should return summary for valid history', () => {
      const history = createValidHistory();
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const summary = getHistorySummary();

      expect(summary.totalRecords).toBe(1);
      expect(summary.lastUpdated).toBeGreaterThan(0);
      expect(summary).toHaveProperty('cacheStatus');
    });

    it('should return empty summary when no history', () => {
      // When localStorage returns null, getDetectionHistory creates a default history
      // So we need to test with an empty history, not null
      vi.mocked(LocalStorageManager.get).mockReturnValue({
        detections: [],
        history: [],
        lastUpdated: Date.now(),
        totalDetections: 0,
      });

      const summary = getHistorySummary();

      expect(summary.totalRecords).toBe(0);
      // lastUpdated will still have a timestamp from the default history
      expect(summary.lastUpdated).toBeGreaterThan(0);
    });

    it('should calculate oldest and newest records', () => {
      const now = Date.now();
      const history = createValidHistory({
        history: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: now,
            confidence: 0.9,
            metadata: {},
          },
          {
            locale: 'zh',
            source: 'browser',
            timestamp: now - 10000,
            confidence: 0.8,
            metadata: {},
          },
        ],
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const summary = getHistorySummary();

      expect(summary.newestRecord).toBe(now);
      expect(summary.oldestRecord).toBe(now - 10000);
    });
  });

  describe('needsCleanup', () => {
    it('should return no cleanup needed for fresh history', () => {
      const now = Date.now();
      const history = createValidHistory({
        history: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: now,
            confidence: 0.9,
            metadata: {},
          },
        ],
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const result = needsCleanup();

      expect(result.needsCleanup).toBe(false);
      expect(result.expiredCount).toBe(0);
    });

    it('should detect expired records', () => {
      const now = Date.now();
      const oldTimestamp = now - 60 * 24 * 60 * 60 * 1000; // 60 days ago
      const history = createValidHistory({
        history: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: oldTimestamp,
            confidence: 0.9,
            metadata: {},
          },
        ],
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const result = needsCleanup();

      expect(result.needsCleanup).toBe(true);
      expect(result.expiredCount).toBe(1);
    });

    it('should detect too many records', () => {
      const largeHistory = Array.from({ length: 150 }, (_, i) => ({
        locale: 'en' as const,
        source: 'browser',
        timestamp: Date.now() - i * 1000,
        confidence: 0.9,
        metadata: {},
      }));
      const history = createValidHistory({ history: largeHistory });
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const result = needsCleanup();

      expect(result.needsCleanup).toBe(true);
      expect(result.totalCount).toBe(150);
    });

    it('should return recommendations', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = needsCleanup();

      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
