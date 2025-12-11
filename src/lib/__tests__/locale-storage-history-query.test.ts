import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDetectionHistory } from '@/lib/locale-storage-history-core';
import {
  getDetectionsByConfidence,
  getDetectionsByLocale,
  getDetectionsBySource,
  getDetectionsByTimeRange,
  getLocaleGroupStats,
  getRecentDetections,
  getSourceGroupStats,
  getTimeDistributionStats,
  getUniqueLocales,
  getUniqueSources,
  queryDetections,
  searchDetections,
} from '../locale-storage-history-query';

// Mock the core module
vi.mock('@/lib/locale-storage-history-core', () => ({
  getDetectionHistory: vi.fn(),
}));

function createMockHistory(
  records: Array<{
    locale: 'en' | 'zh';
    source: string;
    timestamp: number;
    confidence: number;
    metadata?: Record<string, unknown>;
  }>,
) {
  return {
    success: true,
    data: {
      detections: [],
      history: records.map((r) => ({
        locale: r.locale,
        source: r.source,
        timestamp: r.timestamp,
        confidence: r.confidence,
        metadata: r.metadata || {},
      })),
      lastUpdated: Date.now(),
      totalDetections: records.length,
    },
  };
}

describe('locale-storage-history-query', () => {
  const now = Date.now();
  const mockRecords = [
    {
      locale: 'en' as const,
      source: 'browser',
      timestamp: now,
      confidence: 0.9,
    },
    {
      locale: 'zh' as const,
      source: 'geo',
      timestamp: now - 1000,
      confidence: 0.8,
    },
    {
      locale: 'en' as const,
      source: 'browser',
      timestamp: now - 2000,
      confidence: 0.7,
    },
    {
      locale: 'zh' as const,
      source: 'browser',
      timestamp: now - 3000,
      confidence: 0.6,
    },
    {
      locale: 'en' as const,
      source: 'geo',
      timestamp: now - 4000,
      confidence: 0.5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDetectionHistory).mockReturnValue(
      createMockHistory(mockRecords),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRecentDetections', () => {
    it('should return recent detections with default limit', () => {
      const result = getRecentDetections();
      expect(result.length).toBe(5);
    });

    it('should return limited detections', () => {
      const result = getRecentDetections(3);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no history', () => {
      vi.mocked(getDetectionHistory).mockReturnValue({
        success: false,
        error: 'No data',
      });
      const result = getRecentDetections();
      expect(result).toEqual([]);
    });
  });

  describe('getDetectionsBySource', () => {
    it('should filter by source', () => {
      const result = getDetectionsBySource('browser');
      expect(result.length).toBe(3);
      expect(result.every((r) => r.source === 'browser')).toBe(true);
    });

    it('should return empty array for non-existent source', () => {
      const result = getDetectionsBySource('unknown');
      expect(result).toEqual([]);
    });
  });

  describe('getDetectionsByLocale', () => {
    it('should filter by locale', () => {
      const result = getDetectionsByLocale('en');
      expect(result.length).toBe(3);
      expect(result.every((r) => r.locale === 'en')).toBe(true);
    });

    it('should return empty array for non-existent locale', () => {
      vi.mocked(getDetectionHistory).mockReturnValue(createMockHistory([]));
      const result = getDetectionsByLocale('en');
      expect(result).toEqual([]);
    });
  });

  describe('getDetectionsByTimeRange', () => {
    it('should filter by time range', () => {
      const result = getDetectionsByTimeRange(now - 2500, now);
      expect(result.length).toBe(3);
    });

    it('should return empty for out-of-range', () => {
      const result = getDetectionsByTimeRange(now + 1000, now + 2000);
      expect(result).toEqual([]);
    });
  });

  describe('getDetectionsByConfidence', () => {
    it('should filter by confidence range', () => {
      const result = getDetectionsByConfidence(0.7, 0.9);
      expect(result.length).toBe(3);
      expect(
        result.every((r) => r.confidence >= 0.7 && r.confidence <= 0.9),
      ).toBe(true);
    });

    it('should use default maxConfidence', () => {
      const result = getDetectionsByConfidence(0.8);
      expect(result.length).toBe(2);
    });
  });

  describe('queryDetections', () => {
    it('should filter by locale', () => {
      const result = queryDetections({ locale: 'zh' });
      expect(result.totalCount).toBe(2);
    });

    it('should filter by source', () => {
      const result = queryDetections({ source: 'geo' });
      expect(result.totalCount).toBe(2);
    });

    it('should filter by multiple conditions', () => {
      const result = queryDetections({ locale: 'en', source: 'browser' });
      expect(result.totalCount).toBe(2);
    });

    it('should sort by timestamp ascending', () => {
      const result = queryDetections({ sortBy: 'timestamp', sortOrder: 'asc' });
      expect(result.records[0].timestamp).toBeLessThan(
        result.records[1].timestamp,
      );
    });

    it('should sort by confidence descending', () => {
      const result = queryDetections({
        sortBy: 'confidence',
        sortOrder: 'desc',
      });
      expect(result.records[0].confidence).toBeGreaterThanOrEqual(
        result.records[1].confidence,
      );
    });

    it('should paginate results', () => {
      const result = queryDetections({ offset: 2, limit: 2 });
      expect(result.records.length).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should indicate no more results', () => {
      const result = queryDetections({ offset: 0, limit: 10 });
      expect(result.hasMore).toBe(false);
    });
  });

  describe('searchDetections', () => {
    it('should search by locale', () => {
      const result = searchDetections('en');
      expect(result.length).toBe(3);
    });

    it('should search by source', () => {
      const result = searchDetections('geo');
      expect(result.length).toBe(2);
    });

    it('should be case insensitive', () => {
      const result = searchDetections('BROWSER');
      expect(result.length).toBe(3);
    });

    it('should search metadata', () => {
      const historyWithMetadata = createMockHistory([
        {
          locale: 'en',
          source: 'browser',
          timestamp: now,
          confidence: 0.9,
          metadata: { custom: 'searchable' },
        },
      ]);
      vi.mocked(getDetectionHistory).mockReturnValue(historyWithMetadata);

      const result = searchDetections('searchable');
      expect(result.length).toBe(1);
    });
  });

  describe('getUniqueLocales', () => {
    it('should return unique locales', () => {
      const result = getUniqueLocales();
      expect(result).toContain('en');
      expect(result).toContain('zh');
      expect(result.length).toBe(2);
    });

    it('should return sorted array', () => {
      const result = getUniqueLocales();
      expect(result).toEqual([...result].sort());
    });
  });

  describe('getUniqueSources', () => {
    it('should return unique sources', () => {
      const result = getUniqueSources();
      expect(result).toContain('browser');
      expect(result).toContain('geo');
      expect(result.length).toBe(2);
    });
  });

  describe('getLocaleGroupStats', () => {
    it('should group by locale', () => {
      const result = getLocaleGroupStats();
      expect(result.length).toBe(2);
    });

    it('should calculate count and percentage', () => {
      const result = getLocaleGroupStats();
      const enStat = result.find((s) => s.locale === 'en');
      expect(enStat?.count).toBe(3);
      expect(enStat?.percentage).toBe(60);
    });

    it('should calculate average confidence', () => {
      const result = getLocaleGroupStats();
      const enStat = result.find((s) => s.locale === 'en');
      expect(enStat?.avgConfidence).toBeCloseTo((0.9 + 0.7 + 0.5) / 3);
    });

    it('should sort by count descending', () => {
      const result = getLocaleGroupStats();
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });
  });

  describe('getSourceGroupStats', () => {
    it('should group by source', () => {
      const result = getSourceGroupStats();
      expect(result.length).toBe(2);
    });

    it('should calculate count and percentage', () => {
      const result = getSourceGroupStats();
      const browserStat = result.find((s) => s.source === 'browser');
      expect(browserStat?.count).toBe(3);
      expect(browserStat?.percentage).toBe(60);
    });
  });

  describe('getTimeDistributionStats', () => {
    it('should group by time buckets', () => {
      const result = getTimeDistributionStats(86400000); // 1 day bucket
      expect(result.length).toBeGreaterThan(0);
    });

    it('should calculate count per bucket', () => {
      const result = getTimeDistributionStats(86400000);
      const totalCount = result.reduce((sum, bucket) => sum + bucket.count, 0);
      expect(totalCount).toBe(5);
    });

    it('should return empty for empty history', () => {
      vi.mocked(getDetectionHistory).mockReturnValue(createMockHistory([]));
      const result = getTimeDistributionStats();
      expect(result).toEqual([]);
    });
  });
});
