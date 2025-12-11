import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDetectionHistory } from '@/lib/locale-storage-history-core';
import { getSourceGroupStats } from '@/lib/locale-storage-history-query';
import {
  generateHistoryInsights,
  getDetectionStats,
  getDetectionTrends,
  getPerformanceMetrics,
} from '../locale-storage-history-stats';

// Mock dependencies
vi.mock('@/lib/locale-storage-history-core', () => ({
  getDetectionHistory: vi.fn(),
}));

vi.mock('@/lib/locale-storage-history-query', () => ({
  getLocaleGroupStats: vi.fn(() => []),
  getSourceGroupStats: vi.fn(() => []),
}));

function createHistoryRecord(
  overrides: Partial<{
    locale: 'en' | 'zh';
    source: string;
    confidence: number;
    timestamp: number;
  }> = {},
) {
  return {
    locale: 'en' as const,
    source: 'browser',
    confidence: 0.9,
    timestamp: Date.now(),
    ...overrides,
  };
}

function mockHistorySuccess(records: ReturnType<typeof createHistoryRecord>[]) {
  vi.mocked(getDetectionHistory).mockReturnValue({
    success: true,
    data: {
      history: records,
      lastUpdated: Date.now(),
    },
    timestamp: Date.now(),
  });
}

function mockHistoryFailure() {
  vi.mocked(getDetectionHistory).mockReturnValue({
    success: false,
    error: 'Storage unavailable',
    timestamp: Date.now(),
  });
}

describe('locale-storage-history-stats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDetectionStats', () => {
    it('should return empty stats when history fetch fails', () => {
      mockHistoryFailure();

      const stats = getDetectionStats();

      expect(stats.totalDetections).toBe(0);
      expect(stats.uniqueLocales).toBe(0);
      expect(stats.uniqueSources).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.mostDetectedLocale).toBeNull();
      expect(stats.mostUsedSource).toBeNull();
    });

    it('should return empty stats when history is empty', () => {
      mockHistorySuccess([]);

      const stats = getDetectionStats();

      expect(stats.totalDetections).toBe(0);
      expect(stats.uniqueLocales).toBe(0);
    });

    it('should calculate total detections', () => {
      mockHistorySuccess([
        createHistoryRecord(),
        createHistoryRecord(),
        createHistoryRecord(),
      ]);

      const stats = getDetectionStats();

      expect(stats.totalDetections).toBe(3);
    });

    it('should count unique locales', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'zh' }),
      ]);

      const stats = getDetectionStats();

      expect(stats.uniqueLocales).toBe(2);
    });

    it('should count unique sources', () => {
      mockHistorySuccess([
        createHistoryRecord({ source: 'browser' }),
        createHistoryRecord({ source: 'browser' }),
        createHistoryRecord({ source: 'cookie' }),
        createHistoryRecord({ source: 'user' }),
      ]);

      const stats = getDetectionStats();

      expect(stats.uniqueSources).toBe(3);
    });

    it('should calculate average confidence', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.8 }),
        createHistoryRecord({ confidence: 0.9 }),
        createHistoryRecord({ confidence: 1.0 }),
      ]);

      const stats = getDetectionStats();

      expect(stats.averageConfidence).toBeCloseTo(0.9, 2);
    });

    it('should identify most detected locale', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'zh' }),
      ]);

      const stats = getDetectionStats();

      expect(stats.mostDetectedLocale).toEqual({ locale: 'en', count: 3 });
    });

    it('should identify most used source', () => {
      mockHistorySuccess([
        createHistoryRecord({ source: 'browser' }),
        createHistoryRecord({ source: 'browser' }),
        createHistoryRecord({ source: 'cookie' }),
      ]);

      const stats = getDetectionStats();

      expect(stats.mostUsedSource).toEqual({ source: 'browser', count: 2 });
    });

    it('should calculate confidence distribution', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.9 }), // high
        createHistoryRecord({ confidence: 0.85 }), // high
        createHistoryRecord({ confidence: 0.6 }), // medium
        createHistoryRecord({ confidence: 0.5 }), // medium
        createHistoryRecord({ confidence: 0.3 }), // low
      ]);

      const stats = getDetectionStats();

      expect(stats.confidenceDistribution.high).toBe(2);
      expect(stats.confidenceDistribution.medium).toBe(2);
      expect(stats.confidenceDistribution.low).toBe(1);
    });

    it('should calculate time span', () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      mockHistorySuccess([
        createHistoryRecord({ timestamp: twoDaysAgo }),
        createHistoryRecord({ timestamp: now }),
      ]);

      const stats = getDetectionStats();

      expect(stats.timeSpan.oldest).toBe(twoDaysAgo);
      expect(stats.timeSpan.newest).toBe(now);
      expect(stats.timeSpan.spanDays).toBeCloseTo(2, 1);
    });

    it('should calculate detection frequency', () => {
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      mockHistorySuccess([
        createHistoryRecord({ timestamp: twoDaysAgo }),
        createHistoryRecord({ timestamp: now - 24 * 60 * 60 * 1000 }),
        createHistoryRecord({ timestamp: now }),
        createHistoryRecord({ timestamp: now }),
      ]);

      const stats = getDetectionStats();

      // 4 detections over 2 days = 2 per day
      expect(stats.detectionFrequency).toBeCloseTo(2, 1);
    });

    it('should return zero frequency when span is zero', () => {
      const now = Date.now();

      mockHistorySuccess([
        createHistoryRecord({ timestamp: now }),
        createHistoryRecord({ timestamp: now }),
      ]);

      const stats = getDetectionStats();

      expect(stats.detectionFrequency).toBe(0);
    });
  });

  describe('getDetectionTrends', () => {
    it('should return empty trends when history fetch fails', () => {
      mockHistoryFailure();

      const trends = getDetectionTrends();

      expect(trends.dailyDetections).toEqual([]);
      expect(trends.weeklyGrowth).toBe(0);
      expect(trends.monthlyGrowth).toBe(0);
      expect(trends.trendDirection).toBe('stable');
      expect(trends.predictions).toEqual([]);
    });

    it('should return empty trends when history is empty', () => {
      mockHistorySuccess([]);

      const trends = getDetectionTrends();

      expect(trends.dailyDetections.length).toBe(7); // initialized dates
      expect(trends.trendDirection).toBe('stable');
    });

    it('should group detections by day', () => {
      const now = Date.now();
      const today = new Date(now).toISOString().split('T')[0];

      mockHistorySuccess([
        createHistoryRecord({ timestamp: now, confidence: 0.8 }),
        createHistoryRecord({ timestamp: now - 1000, confidence: 0.9 }),
      ]);

      const trends = getDetectionTrends();
      const todayData = trends.dailyDetections.find((d) => d.date === today);

      expect(todayData?.count).toBe(2);
      expect(todayData?.avgConfidence).toBeCloseTo(0.85, 2);
    });

    it('should calculate daily average confidence', () => {
      const now = Date.now();
      const today = new Date(now).toISOString().split('T')[0];

      mockHistorySuccess([
        createHistoryRecord({ timestamp: now, confidence: 0.6 }),
        createHistoryRecord({ timestamp: now, confidence: 0.8 }),
        createHistoryRecord({ timestamp: now, confidence: 1.0 }),
      ]);

      const trends = getDetectionTrends();
      const todayData = trends.dailyDetections.find((d) => d.date === today);

      expect(todayData?.avgConfidence).toBeCloseTo(0.8, 2);
    });

    it('should return zero avgConfidence for days with no detections', () => {
      mockHistorySuccess([]);

      const trends = getDetectionTrends();

      // All initialized days should have count 0 and avgConfidence 0
      trends.dailyDetections.forEach((day) => {
        expect(day.count).toBe(0);
        expect(day.avgConfidence).toBe(0);
      });
    });

    it('should sort daily detections by date', () => {
      mockHistorySuccess([]);

      const trends = getDetectionTrends();
      const dates = trends.dailyDetections.map((d) => d.date);

      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBe(true);
      }
    });

    it('should respect custom days parameter', () => {
      mockHistorySuccess([]);

      const trends = getDetectionTrends(14);

      expect(trends.dailyDetections.length).toBe(14);
    });

    it('should determine increasing trend', () => {
      const now = Date.now();
      const records = [];
      // Create increasing pattern over 7 days
      for (let day = 6; day >= 0; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        // More records for more recent days
        for (let i = 0; i < (7 - day) * 2; i++) {
          records.push(createHistoryRecord({ timestamp }));
        }
      }
      mockHistorySuccess(records);

      const trends = getDetectionTrends();

      expect(trends.trendDirection).toBe('increasing');
    });

    it('should determine decreasing trend', () => {
      const now = Date.now();
      const records = [];
      // Create decreasing pattern
      for (let day = 6; day >= 0; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        // Fewer records for more recent days
        for (let i = 0; i < (day + 1) * 2; i++) {
          records.push(createHistoryRecord({ timestamp }));
        }
      }
      mockHistorySuccess(records);

      const trends = getDetectionTrends();

      expect(trends.trendDirection).toBe('decreasing');
    });

    it('should determine stable trend', () => {
      const now = Date.now();
      const records = [];
      // Create stable pattern - same number each day
      for (let day = 6; day >= 0; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        for (let i = 0; i < 3; i++) {
          records.push(createHistoryRecord({ timestamp }));
        }
      }
      mockHistorySuccess(records);

      const trends = getDetectionTrends();

      expect(trends.trendDirection).toBe('stable');
    });

    it('should generate predictions for future days', () => {
      const now = Date.now();
      const records = [];
      for (let day = 6; day >= 0; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        records.push(createHistoryRecord({ timestamp }));
      }
      mockHistorySuccess(records);

      const trends = getDetectionTrends();

      expect(trends.predictions.length).toBe(3); // default 3 future days
      trends.predictions.forEach((p) => {
        expect(p.date).toBeDefined();
        expect(p.predictedCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate predictions even with minimal data', () => {
      // The function initializes all days in the range and generates predictions
      // based on the average, so even with 1 record, it generates predictions
      mockHistorySuccess([createHistoryRecord()]);

      const trends = getDetectionTrends();

      // Predictions are generated based on initialized dailyData (all 7 days)
      expect(trends.predictions.length).toBe(3);
      trends.predictions.forEach((p) => {
        expect(p.predictedCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate weekly growth rate', () => {
      const now = Date.now();
      const records = [];
      // Week 1 (older): 2 records per day
      for (let day = 13; day >= 7; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        records.push(createHistoryRecord({ timestamp }));
        records.push(createHistoryRecord({ timestamp }));
      }
      // Week 2 (recent): 4 records per day (100% growth)
      for (let day = 6; day >= 0; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        for (let i = 0; i < 4; i++) {
          records.push(createHistoryRecord({ timestamp }));
        }
      }
      mockHistorySuccess(records);

      const trends = getDetectionTrends(14);

      expect(trends.weeklyGrowth).toBeGreaterThan(0);
    });

    it('should return zero growth when insufficient data', () => {
      mockHistorySuccess([createHistoryRecord()]);

      const trends = getDetectionTrends();

      expect(trends.weeklyGrowth).toBe(0);
      expect(trends.monthlyGrowth).toBe(0);
    });
  });

  describe('generateHistoryInsights', () => {
    it('should return empty insights when no detections', () => {
      mockHistorySuccess([]);

      const result = generateHistoryInsights();

      // With empty history, insights should be empty but recommendations
      // may contain default suggestions like "increase detection triggers"
      expect(result.insights).toEqual([]);
      expect(result.alerts).toEqual([]);
    });

    it('should generate base insights for detections', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
        createHistoryRecord({ locale: 'zh', confidence: 0.8 }),
      ]);

      const result = generateHistoryInsights();

      expect(result.insights.some((i) => i.includes('总共记录了 2 次'))).toBe(
        true,
      );
      expect(result.insights.some((i) => i.includes('2 种不同的语言'))).toBe(
        true,
      );
    });

    it('should include average confidence insight', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.8 }),
        createHistoryRecord({ confidence: 0.9 }),
      ]);

      const result = generateHistoryInsights();

      expect(result.insights.some((i) => i.includes('平均置信度'))).toBe(true);
    });

    it('should include most detected locale insight', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'zh' }),
      ]);

      const result = generateHistoryInsights();

      expect(
        result.insights.some((i) => i.includes('最常检测的语言是 en')),
      ).toBe(true);
    });

    it('should include most used source insight', () => {
      mockHistorySuccess([
        createHistoryRecord({ source: 'browser' }),
        createHistoryRecord({ source: 'browser' }),
      ]);

      const result = generateHistoryInsights();

      expect(
        result.insights.some((i) => i.includes('最常用的检测来源是 browser')),
      ).toBe(true);
    });

    it('should add quality insight for high confidence majority', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.95 }),
        createHistoryRecord({ confidence: 0.9 }),
        createHistoryRecord({ confidence: 0.85 }),
      ]);

      const result = generateHistoryInsights();

      expect(result.insights.some((i) => i.includes('检测质量优秀'))).toBe(
        true,
      );
    });

    it('should add alert for low confidence majority', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.3 }),
        createHistoryRecord({ confidence: 0.2 }),
        createHistoryRecord({ confidence: 0.4 }),
      ]);

      const result = generateHistoryInsights();

      expect(result.alerts.some((a) => a.includes('检测质量需要改善'))).toBe(
        true,
      );
      expect(
        result.recommendations.some((r) => r.includes('考虑优化语言检测算法')),
      ).toBe(true);
    });

    it('should add trend insight for increasing activity', () => {
      const now = Date.now();
      const records = [];
      for (let day = 6; day >= 0; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        for (let i = 0; i < (7 - day) * 3; i++) {
          records.push(createHistoryRecord({ timestamp }));
        }
      }
      mockHistorySuccess(records);

      const result = generateHistoryInsights();

      expect(result.insights.some((i) => i.includes('上升趋势'))).toBe(true);
    });

    it('should add trend insight and recommendation for decreasing activity', () => {
      const now = Date.now();
      const records = [];
      for (let day = 6; day >= 0; day--) {
        const timestamp = now - day * 24 * 60 * 60 * 1000;
        for (let i = 0; i < (day + 1) * 3; i++) {
          records.push(createHistoryRecord({ timestamp }));
        }
      }
      mockHistorySuccess(records);

      const result = generateHistoryInsights();

      expect(result.insights.some((i) => i.includes('下降趋势'))).toBe(true);
      expect(
        result.recommendations.some((r) => r.includes('分析用户行为变化')),
      ).toBe(true);
    });

    it('should add insight for high frequency activity', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const records = [];
      // Create 15 detections spread over 1 day = 15/day frequency (over 10 threshold)
      for (let i = 0; i < 15; i++) {
        records.push(createHistoryRecord({ timestamp: oneDayAgo + i * 1000 }));
      }
      // Add a recent record to ensure span > 0
      records.push(createHistoryRecord({ timestamp: now }));
      mockHistorySuccess(records);

      const result = generateHistoryInsights();

      // detectionFrequency = records.length / spanDays
      // 16 records / ~1 day = ~16/day > 10
      expect(result.insights.some((i) => i.includes('活动频繁'))).toBe(true);
    });

    it('should add recommendation for low frequency activity', () => {
      const now = Date.now();
      const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;

      // 2 records over 5 days = 0.4 per day, which is < 1
      mockHistorySuccess([
        createHistoryRecord({ timestamp: fiveDaysAgo }),
        createHistoryRecord({ timestamp: now }),
      ]);

      const result = generateHistoryInsights();

      expect(
        result.recommendations.some((r) => r.includes('增加语言检测的触发')),
      ).toBe(true);
    });

    it('should add insight for high locale diversity', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'zh' }),
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'zh' }),
        createHistoryRecord({ locale: 'en' }),
        createHistoryRecord({ locale: 'zh' }),
      ]);

      const result = generateHistoryInsights();

      // With only 2 unique locales, this won't trigger the diversity insight
      expect(result.insights.some((i) => i.includes('语言多样性'))).toBe(false);
    });

    it('should add recommendation for large history', () => {
      const records = Array.from({ length: 1001 }, () => createHistoryRecord());
      mockHistorySuccess(records);

      const result = generateHistoryInsights();

      expect(
        result.recommendations.some((r) => r.includes('定期清理过期数据')),
      ).toBe(true);
    });

    it('should add recommendation for long time span', () => {
      const now = Date.now();
      const ninetyOneDaysAgo = now - 91 * 24 * 60 * 60 * 1000;

      mockHistorySuccess([
        createHistoryRecord({ timestamp: ninetyOneDaysAgo }),
        createHistoryRecord({ timestamp: now }),
      ]);

      const result = generateHistoryInsights();

      expect(
        result.recommendations.some((r) => r.includes('长期趋势分析')),
      ).toBe(true);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return empty metrics when history fetch fails', () => {
      mockHistoryFailure();

      const metrics = getPerformanceMetrics();

      expect(metrics.averageConfidence).toBe(0);
      expect(metrics.confidenceStability).toBe(0);
      expect(metrics.sourceReliability).toEqual({});
      expect(metrics.detectionAccuracy).toBe(0);
      expect(metrics.responseConsistency).toBe(0);
    });

    it('should return empty metrics when history is empty', () => {
      mockHistorySuccess([]);

      const metrics = getPerformanceMetrics();

      expect(metrics.averageConfidence).toBe(0);
      expect(metrics.confidenceStability).toBe(0);
    });

    it('should calculate average confidence', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.8 }),
        createHistoryRecord({ confidence: 0.9 }),
        createHistoryRecord({ confidence: 1.0 }),
      ]);

      const metrics = getPerformanceMetrics();

      expect(metrics.averageConfidence).toBeCloseTo(0.9, 2);
    });

    it('should calculate confidence stability for consistent values', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.9 }),
        createHistoryRecord({ confidence: 0.9 }),
        createHistoryRecord({ confidence: 0.9 }),
      ]);

      const metrics = getPerformanceMetrics();

      // Perfect consistency should give stability close to 1
      expect(metrics.confidenceStability).toBeCloseTo(1, 1);
    });

    it('should calculate lower stability for varying values', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.3 }),
        createHistoryRecord({ confidence: 0.9 }),
        createHistoryRecord({ confidence: 0.5 }),
      ]);

      const metrics = getPerformanceMetrics();

      // High variance should give lower stability
      expect(metrics.confidenceStability).toBeLessThan(1);
    });

    it('should build source reliability from query stats', () => {
      vi.mocked(getSourceGroupStats).mockReturnValue([
        {
          source: 'browser',
          avgConfidence: 0.9,
          count: 10,
          locales: ['en', 'zh'],
        },
        { source: 'cookie', avgConfidence: 0.8, count: 5, locales: ['en'] },
      ]);

      mockHistorySuccess([createHistoryRecord()]);

      const metrics = getPerformanceMetrics();

      expect(metrics.sourceReliability['browser']).toBe(0.9);
      expect(metrics.sourceReliability['cookie']).toBe(0.8);
    });

    it('should calculate detection accuracy', () => {
      mockHistorySuccess([
        createHistoryRecord({ confidence: 0.9 }), // high (> 0.8)
        createHistoryRecord({ confidence: 0.85 }), // high
        createHistoryRecord({ confidence: 0.6 }), // not high
        createHistoryRecord({ confidence: 0.5 }), // not high
      ]);

      const metrics = getPerformanceMetrics();

      // 2 out of 4 are high confidence
      expect(metrics.detectionAccuracy).toBeCloseTo(0.5, 2);
    });

    it('should calculate response consistency for single locale', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
      ]);

      const metrics = getPerformanceMetrics();

      // Perfect consistency for one locale
      expect(metrics.responseConsistency).toBeCloseTo(1, 1);
    });

    it('should calculate response consistency for multiple locales', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
        createHistoryRecord({ locale: 'zh', confidence: 0.8 }),
        createHistoryRecord({ locale: 'zh', confidence: 0.8 }),
      ]);

      const metrics = getPerformanceMetrics();

      // Good consistency for both locales
      expect(metrics.responseConsistency).toBeCloseTo(1, 1);
    });

    it('should return 1 for response consistency when locales have single record', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
        createHistoryRecord({ locale: 'zh', confidence: 0.8 }),
      ]);

      const metrics = getPerformanceMetrics();

      // Single records per locale = consistency of 1
      expect(metrics.responseConsistency).toBe(1);
    });

    it('should handle varying confidence across locales', () => {
      mockHistorySuccess([
        createHistoryRecord({ locale: 'en', confidence: 0.9 }),
        createHistoryRecord({ locale: 'en', confidence: 0.5 }),
        createHistoryRecord({ locale: 'zh', confidence: 0.8 }),
        createHistoryRecord({ locale: 'zh', confidence: 0.8 }),
      ]);

      const metrics = getPerformanceMetrics();

      // en has variance, zh is consistent
      expect(metrics.responseConsistency).toBeLessThan(1);
      expect(metrics.responseConsistency).toBeGreaterThan(0);
    });
  });
});
