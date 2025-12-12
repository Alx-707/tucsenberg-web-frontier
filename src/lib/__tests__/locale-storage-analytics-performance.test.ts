import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as analyticsCore from '../locale-storage-analytics-core';
import { AccessLogger, ErrorLogger } from '../locale-storage-analytics-events';
import {
  getPerformanceMetrics,
  getUsagePatterns,
  getUsageTrends,
  type PerformanceMetrics,
  type UsagePatterns,
  type UsageTrends,
} from '../locale-storage-analytics-performance';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../locale-storage-analytics-core', () => ({
  calculateStorageStats: vi.fn(() => ({
    totalEntries: 10,
    totalSize: 1024,
    lastAccessed: Date.now(),
    lastModified: Date.now(),
    accessCount: 50,
    errorCount: 2,
    freshness: 0.8,
    hasOverride: false,
    historyStats: {
      totalEntries: 5,
      uniqueLocales: 2,
      oldestEntry: Date.now() - 86400000,
      newestEntry: Date.now(),
    },
  })),
}));

// Helper to create access log entries
function createAccessEntry(overrides?: {
  key?: string;
  operation?: string;
  timestamp?: number;
  success?: boolean;
  responseTime?: number;
}) {
  return {
    key: overrides?.key ?? 'testKey',
    operation: overrides?.operation ?? 'read',
    success: overrides?.success ?? true,
    responseTime: overrides?.responseTime ?? 10,
  };
}

// Helper to populate access log with entries at specific times
function populateAccessLog(
  entries: Array<{
    key?: string;
    operation?: string;
    hour?: number;
    dayOffset?: number;
    success?: boolean;
    responseTime?: number;
  }>,
) {
  const baseDate = new Date('2025-02-01T00:00:00Z');

  for (const entry of entries) {
    const entryDate = new Date(baseDate);
    if (entry.dayOffset !== undefined) {
      entryDate.setDate(entryDate.getDate() - entry.dayOffset);
    }
    if (entry.hour !== undefined) {
      entryDate.setHours(entry.hour);
    }

    vi.setSystemTime(entryDate);
    AccessLogger.logAccess(
      createAccessEntry({
        ...(entry.key !== undefined && { key: entry.key }),
        ...(entry.operation !== undefined && { operation: entry.operation }),
        ...(entry.success !== undefined && { success: entry.success }),
        ...(entry.responseTime !== undefined && {
          responseTime: entry.responseTime,
        }),
      }),
    );
  }

  // Reset to base time
  vi.setSystemTime(baseDate);
}

describe('locale-storage-analytics-performance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
    AccessLogger.clearAccessLog();
    ErrorLogger.clearErrorLog();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getUsagePatterns', () => {
    it('should return empty patterns when no access log exists', () => {
      const patterns: UsagePatterns = getUsagePatterns();

      expect(patterns.mostAccessedKeys).toEqual([]);
      expect(patterns.leastAccessedKeys).toEqual([]);
      expect(patterns.peakUsageHours).toEqual([]);
      expect(patterns.averageSessionDuration).toBe(0);
      // With 100% success rate (no data = default 100%), it generates "excellent" insight
      expect(patterns.userBehaviorInsights).toContain(
        '存储操作成功率优秀，系统运行稳定',
      );
    });

    it('should identify most and least accessed keys', () => {
      // Create entries with different access frequencies
      populateAccessLog([
        { key: 'frequent', operation: 'read' },
        { key: 'frequent', operation: 'read' },
        { key: 'frequent', operation: 'read' },
        { key: 'moderate', operation: 'read' },
        { key: 'moderate', operation: 'read' },
        { key: 'rare', operation: 'read' },
      ]);

      const patterns = getUsagePatterns();

      expect(patterns.mostAccessedKeys[0]?.key).toBe('frequent');
      expect(patterns.mostAccessedKeys[0]?.count).toBe(3);
      expect(patterns.leastAccessedKeys).toContainEqual({
        key: 'rare',
        count: 1,
      });
    });

    it('should analyze peak usage hours', () => {
      // Create entries at different hours
      populateAccessLog([
        { hour: 10 },
        { hour: 10 },
        { hour: 10 },
        { hour: 14 },
        { hour: 14 },
        { hour: 20 },
      ]);

      const patterns = getUsagePatterns();

      expect(patterns.peakUsageHours.length).toBeGreaterThan(0);
      expect(patterns.peakUsageHours[0]?.hour).toBe(10);
      expect(patterns.peakUsageHours[0]?.count).toBe(3);
    });

    it('should calculate operation distribution', () => {
      populateAccessLog([
        { operation: 'read' },
        { operation: 'read' },
        { operation: 'write' },
        { operation: 'update' },
        { operation: 'delete' },
      ]);

      const patterns = getUsagePatterns();

      expect(patterns.operationDistribution.read).toBe(2);
      expect(patterns.operationDistribution.write).toBe(1);
      expect(patterns.operationDistribution.update).toBe(1);
      expect(patterns.operationDistribution.delete).toBe(1);
    });

    it('should calculate average session duration with session gaps', () => {
      const baseDate = new Date('2025-02-01T10:00:00Z');

      // First session: entries 5 minutes apart
      vi.setSystemTime(new Date(baseDate.getTime()));
      AccessLogger.logAccess(createAccessEntry());

      vi.setSystemTime(new Date(baseDate.getTime() + 5 * 60 * 1000)); // +5 min
      AccessLogger.logAccess(createAccessEntry());

      vi.setSystemTime(new Date(baseDate.getTime() + 10 * 60 * 1000)); // +10 min
      AccessLogger.logAccess(createAccessEntry());

      // Gap of 45 minutes (new session)
      vi.setSystemTime(new Date(baseDate.getTime() + 55 * 60 * 1000)); // +55 min
      AccessLogger.logAccess(createAccessEntry());

      vi.setSystemTime(new Date(baseDate.getTime() + 60 * 60 * 1000)); // +60 min
      AccessLogger.logAccess(createAccessEntry());

      const patterns = getUsagePatterns();

      // Should have calculated session durations
      expect(patterns.averageSessionDuration).toBeGreaterThan(0);
    });

    it('should return 0 average session duration with less than 2 entries', () => {
      AccessLogger.logAccess(createAccessEntry());

      const patterns = getUsagePatterns();

      expect(patterns.averageSessionDuration).toBe(0);
    });

    describe('behavior insights', () => {
      it('should generate insight for low success rate', () => {
        populateAccessLog([
          { success: true },
          { success: false },
          { success: false },
          { success: false },
        ]);

        const patterns = getUsagePatterns();

        const hasLowSuccessInsight = patterns.userBehaviorInsights.some(
          (insight) => insight.includes('成功率较低'),
        );
        expect(hasLowSuccessInsight).toBe(true);
      });

      it('should generate insight for excellent success rate', () => {
        // All successful operations
        for (let i = 0; i < 100; i++) {
          AccessLogger.logAccess(createAccessEntry({ success: true }));
        }

        const patterns = getUsagePatterns();

        const hasExcellentInsight = patterns.userBehaviorInsights.some(
          (insight) => insight.includes('成功率优秀'),
        );
        expect(hasExcellentInsight).toBe(true);
      });

      it('should generate insight for slow response time', () => {
        populateAccessLog([
          { responseTime: 150 },
          { responseTime: 200 },
          { responseTime: 180 },
        ]);

        const patterns = getUsagePatterns();

        const hasSlowResponseInsight = patterns.userBehaviorInsights.some(
          (insight) => insight.includes('响应时间较慢'),
        );
        expect(hasSlowResponseInsight).toBe(true);
      });

      it('should generate insight for excellent response time', () => {
        populateAccessLog([
          { responseTime: 5 },
          { responseTime: 3 },
          { responseTime: 8 },
        ]);

        const patterns = getUsagePatterns();

        const hasFastResponseInsight = patterns.userBehaviorInsights.some(
          (insight) => insight.includes('响应时间优秀'),
        );
        expect(hasFastResponseInsight).toBe(true);
      });

      it('should generate insight for work hours usage', () => {
        populateAccessLog([
          { hour: 10 },
          { hour: 11 },
          { hour: 14 },
          { hour: 15 },
        ]);

        const patterns = getUsagePatterns();

        const hasWorkHoursInsight = patterns.userBehaviorInsights.some(
          (insight) => insight.includes('工作时间'),
        );
        expect(hasWorkHoursInsight).toBe(true);
      });

      it('should generate insight for evening usage', () => {
        populateAccessLog([{ hour: 20 }, { hour: 21 }, { hour: 22 }]);

        const patterns = getUsagePatterns();

        const hasEveningInsight = patterns.userBehaviorInsights.some(
          (insight) => insight.includes('晚间使用'),
        );
        expect(hasEveningInsight).toBe(true);
      });

      it('should generate insight for dominant operation type', () => {
        // 80% read operations
        for (let i = 0; i < 8; i++) {
          AccessLogger.logAccess(createAccessEntry({ operation: 'read' }));
        }
        AccessLogger.logAccess(createAccessEntry({ operation: 'write' }));
        AccessLogger.logAccess(createAccessEntry({ operation: 'update' }));

        const patterns = getUsagePatterns();

        const hasDominantOpInsight = patterns.userBehaviorInsights.some(
          (insight) => insight.includes('占主导地位'),
        );
        expect(hasDominantOpInsight).toBe(true);
      });
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return default metrics when no data exists', () => {
      const metrics: PerformanceMetrics = getPerformanceMetrics();

      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.successRate).toBe(100);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.throughput).toBe(0);
      expect(metrics.efficiency).toBeGreaterThan(0);
      expect(metrics.recommendations).toContain('性能表现良好，建议继续监控');
    });

    it('should calculate throughput from recent operations', () => {
      // Log operations within the last hour
      const now = new Date('2025-02-01T12:00:00Z');
      vi.setSystemTime(now);

      for (let i = 0; i < 10; i++) {
        AccessLogger.logAccess(createAccessEntry());
      }

      const metrics = getPerformanceMetrics();

      expect(metrics.throughput).toBe(10);
    });

    it('should calculate efficiency score based on multiple factors', () => {
      // Good performance data
      for (let i = 0; i < 20; i++) {
        AccessLogger.logAccess(
          createAccessEntry({
            success: true,
            responseTime: 5,
          }),
        );
      }

      const metrics = getPerformanceMetrics();

      // Efficiency should be high with good data
      expect(metrics.efficiency).toBeGreaterThan(0.7);
      expect(metrics.efficiency).toBeLessThanOrEqual(1);
    });

    it('should reduce efficiency score for high error rate', () => {
      // Log errors
      for (let i = 0; i < 10; i++) {
        ErrorLogger.logError({
          error: 'Test error',
          context: 'test',
          severity: 'medium',
        });
        AccessLogger.logAccess(createAccessEntry({ success: false }));
      }

      const metrics = getPerformanceMetrics();

      // Efficiency should be lower due to errors
      expect(metrics.efficiency).toBeLessThan(1);
    });

    describe('performance recommendations', () => {
      it('should recommend checking error logic when error rate is high', () => {
        for (let i = 0; i < 10; i++) {
          ErrorLogger.logError({ error: 'Error', severity: 'medium' });
          AccessLogger.logAccess(createAccessEntry({ success: false }));
        }

        const metrics = getPerformanceMetrics();

        expect(metrics.recommendations).toContain(
          '错误率过高，建议检查存储操作逻辑',
        );
      });

      it('should recommend optimization when response time is slow', () => {
        for (let i = 0; i < 5; i++) {
          AccessLogger.logAccess(createAccessEntry({ responseTime: 200 }));
        }

        const metrics = getPerformanceMetrics();

        expect(metrics.recommendations).toContain(
          '响应时间较慢，考虑优化存储访问方式',
        );
      });

      it('should recommend error handling when success rate is low', () => {
        for (let i = 0; i < 20; i++) {
          AccessLogger.logAccess(createAccessEntry({ success: i < 18 }));
        }

        const metrics = getPerformanceMetrics();

        expect(metrics.recommendations).toContain(
          '成功率偏低，建议增加错误处理和重试机制',
        );
      });

      it('should recommend optimization when efficiency is low', () => {
        // Create conditions for low efficiency
        for (let i = 0; i < 10; i++) {
          AccessLogger.logAccess(
            createAccessEntry({
              success: false,
              responseTime: 500,
            }),
          );
          ErrorLogger.logError({ error: 'Error', severity: 'high' });
        }

        // Mock low freshness
        vi.mocked(analyticsCore.calculateStorageStats).mockReturnValueOnce({
          totalEntries: 10,
          totalSize: 1024,
          lastAccessed: Date.now(),
          lastModified: Date.now(),
          accessCount: 50,
          errorCount: 2,
          freshness: 0.1,
          hasOverride: false,
          historyStats: {
            totalEntries: 5,
            uniqueLocales: 2,
            oldestEntry: Date.now() - 86400000,
            newestEntry: Date.now(),
          },
        });

        const metrics = getPerformanceMetrics();

        expect(metrics.recommendations).toContain(
          '整体效率偏低，建议全面优化存储策略',
        );
      });
    });
  });

  describe('getUsageTrends', () => {
    it('should return empty trends when no data exists', () => {
      const trends: UsageTrends = getUsageTrends();

      expect(trends.dailyOperations.length).toBe(7); // Default 7 days
      expect(trends.weeklyGrowth).toBe(0);
      expect(trends.monthlyGrowth).toBe(0);
      // With 7 days of empty data, predictions still generate (avg=0, trend=0)
      expect(trends.predictions.length).toBe(3);
      expect(trends.predictions[0]?.predictedOperations).toBe(0);
    });

    it('should calculate daily operations for specified period', () => {
      const baseDate = new Date('2025-02-01T12:00:00Z');

      // Add operations on different days
      vi.setSystemTime(baseDate);
      AccessLogger.logAccess(createAccessEntry());
      AccessLogger.logAccess(createAccessEntry());

      const yesterday = new Date(baseDate);
      yesterday.setDate(yesterday.getDate() - 1);
      vi.setSystemTime(yesterday);
      AccessLogger.logAccess(createAccessEntry());

      vi.setSystemTime(baseDate);
      const trends = getUsageTrends(7);

      expect(trends.dailyOperations.length).toBe(7);

      // Find today's operations
      const todayStr = baseDate.toISOString().split('T')[0];
      const todayOps = trends.dailyOperations.find((d) => d.date === todayStr);
      expect(todayOps?.operations).toBe(2);
    });

    it('should calculate weekly growth rate', () => {
      const baseDate = new Date('2025-02-01T12:00:00Z');

      // Week 1: 5 operations per day
      for (let day = 7; day < 14; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - day);
        vi.setSystemTime(date);
        for (let i = 0; i < 5; i++) {
          AccessLogger.logAccess(createAccessEntry());
        }
      }

      // Week 2 (more recent): 10 operations per day
      for (let day = 0; day < 7; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - day);
        vi.setSystemTime(date);
        for (let i = 0; i < 10; i++) {
          AccessLogger.logAccess(createAccessEntry());
        }
      }

      vi.setSystemTime(baseDate);
      const trends = getUsageTrends(14);

      // Growth should be positive (doubled)
      expect(trends.weeklyGrowth).toBeGreaterThan(0);
    });

    it('should analyze seasonal patterns', () => {
      const baseDate = new Date('2025-02-03T12:00:00Z'); // Monday

      // Weekday operations
      vi.setSystemTime(baseDate);
      for (let i = 0; i < 5; i++) {
        AccessLogger.logAccess(createAccessEntry());
      }

      // Weekend operations
      const saturday = new Date(baseDate);
      saturday.setDate(saturday.getDate() + 5); // Saturday
      vi.setSystemTime(saturday);
      for (let i = 0; i < 2; i++) {
        AccessLogger.logAccess(createAccessEntry());
      }

      vi.setSystemTime(baseDate);
      const trends = getUsageTrends(7);

      const weekdayPattern = trends.seasonalPatterns.find(
        (p) => p.period === '工作日',
      );
      const weekendPattern = trends.seasonalPatterns.find(
        (p) => p.period === '周末',
      );

      expect(weekdayPattern).toBeDefined();
      expect(weekendPattern).toBeDefined();
    });

    it('should analyze time-of-day patterns', () => {
      const baseDate = new Date('2025-02-01T00:00:00Z');

      // Morning operations (6-12)
      vi.setSystemTime(new Date(baseDate.setHours(9)));
      for (let i = 0; i < 3; i++) {
        AccessLogger.logAccess(createAccessEntry());
      }

      // Afternoon operations (12-18)
      vi.setSystemTime(new Date(baseDate.setHours(14)));
      for (let i = 0; i < 4; i++) {
        AccessLogger.logAccess(createAccessEntry());
      }

      // Evening operations (18+)
      vi.setSystemTime(new Date(baseDate.setHours(20)));
      for (let i = 0; i < 2; i++) {
        AccessLogger.logAccess(createAccessEntry());
      }

      vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
      const trends = getUsageTrends(7);

      const morningPattern = trends.seasonalPatterns.find(
        (p) => p.period === '上午',
      );
      const afternoonPattern = trends.seasonalPatterns.find(
        (p) => p.period === '下午',
      );
      const eveningPattern = trends.seasonalPatterns.find(
        (p) => p.period === '晚上',
      );

      expect(morningPattern?.avgOperations).toBe(3);
      expect(afternoonPattern?.avgOperations).toBe(4);
      expect(eveningPattern?.avgOperations).toBe(2);
    });

    it('should generate predictions based on recent trends', () => {
      const baseDate = new Date('2025-02-01T12:00:00Z');

      // Create consistent daily operations for past week
      for (let day = 0; day < 7; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - day);
        vi.setSystemTime(date);
        for (let i = 0; i < 10; i++) {
          AccessLogger.logAccess(createAccessEntry());
        }
      }

      vi.setSystemTime(baseDate);
      const trends = getUsageTrends(7);

      // Should have 3 days of predictions (default)
      expect(trends.predictions.length).toBe(3);

      // Predictions should have reasonable values
      for (const prediction of trends.predictions) {
        expect(prediction.date).toBeDefined();
        expect(prediction.predictedOperations).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate predictions even with minimal data', () => {
      // With 7 days initialized (even empty), dailyOperations.length >= 3, so predictions are generated
      AccessLogger.logAccess(createAccessEntry());
      AccessLogger.logAccess(createAccessEntry());

      const trends = getUsageTrends(7);

      // Predictions are generated because dailyOperations has 7 entries
      expect(trends.predictions.length).toBe(3);
    });

    it('should handle custom days parameter', () => {
      const trends = getUsageTrends(14);

      expect(trends.dailyOperations.length).toBe(14);
    });

    it('should calculate monthly growth rate', () => {
      const baseDate = new Date('2025-02-01T12:00:00Z');

      // Create 60 days of data
      for (let day = 0; day < 60; day++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - day);
        vi.setSystemTime(date);

        // Increase operations over time
        const opsCount = day < 30 ? 10 : 5;
        for (let i = 0; i < opsCount; i++) {
          AccessLogger.logAccess(createAccessEntry());
        }
      }

      vi.setSystemTime(baseDate);
      const trends = getUsageTrends(60);

      // Monthly growth should be calculated
      expect(typeof trends.monthlyGrowth).toBe('number');
    });
  });
});
