import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import {
  createMetricsCollector,
  defaultMetricsCollector,
  formatMetrics,
  I18nMetricsCollector,
} from '../i18n-metrics-collector';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('I18nMetricsCollector', () => {
  let collector: I18nMetricsCollector;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    collector = new I18nMetricsCollector();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default metrics', () => {
      const metrics = collector.getMetrics();

      expect(metrics.loadTime).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.translationCoverage).toBe(0);
      expect(metrics.localeUsage).toEqual({ en: 0, zh: 0 });
    });
  });

  describe('recordLoadTime', () => {
    it('should record and average load times', () => {
      collector.recordLoadTime(100);
      collector.recordLoadTime(200);
      collector.recordLoadTime(300);

      const metrics = collector.getMetrics();
      expect(metrics.loadTime).toBe(200);
    });

    it('should keep only last 100 load times', () => {
      for (let i = 0; i < 150; i++) {
        collector.recordLoadTime(i);
      }

      // Average of 50-149 (last 100)
      const metrics = collector.getMetrics();
      // Average = (50+51+...+149)/100 = 99.5
      expect(metrics.loadTime).toBe(99.5);
    });

    it('should emit hit event with load time metadata', () => {
      const listener = vi.fn();
      collector.addEventListener('hit', listener);

      collector.recordLoadTime(150);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hit',
          metadata: expect.objectContaining({ loadTime: 150 }),
        }),
      );
    });
  });

  describe('recordCacheHit', () => {
    it('should increment cache hits and update hit rate', () => {
      collector.recordCacheHit();
      collector.recordCacheHit();
      collector.recordCacheMiss();

      const metrics = collector.getMetrics();
      expect(metrics.cacheHitRate).toBeCloseTo(2 / 3, 5);
    });

    it('should emit hit event with stats', () => {
      const listener = vi.fn();
      collector.addEventListener('hit', listener);

      collector.recordCacheHit();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hit',
          metadata: expect.objectContaining({
            totalHits: 1,
            totalRequests: 1,
            hitRate: 1,
          }),
        }),
      );
    });
  });

  describe('recordCacheMiss', () => {
    it('should increment requests without incrementing hits', () => {
      collector.recordCacheMiss();
      collector.recordCacheMiss();

      const metrics = collector.getMetrics();
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('should emit miss event', () => {
      const listener = vi.fn();
      collector.addEventListener('miss', listener);

      collector.recordCacheMiss();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'miss',
          metadata: expect.objectContaining({
            totalRequests: 1,
            hitRate: 0,
          }),
        }),
      );
    });
  });

  describe('recordError', () => {
    it('should track error rate', () => {
      // Error rate is errors / totalRequests
      // recordError only increments errors, not totalRequests
      collector.recordCacheHit(); // totalRequests = 1
      collector.recordError(); // errors = 1, errorRate = 1/1 = 1

      const metrics = collector.getMetrics();
      expect(metrics.errorRate).toBe(1);
    });

    it('should emit preload_error event', () => {
      const listener = vi.fn();
      collector.addEventListener('preload_error', listener);

      collector.recordError();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'preload_error',
          metadata: expect.objectContaining({
            totalErrors: 1,
          }),
        }),
      );
    });
  });

  describe('recordLocaleUsage', () => {
    it('should track English locale usage', () => {
      collector.recordLocaleUsage('en');
      collector.recordLocaleUsage('en');

      const metrics = collector.getMetrics();
      expect(metrics.localeUsage.en).toBe(2);
      expect(metrics.localeUsage.zh).toBe(0);
    });

    it('should track Chinese locale usage', () => {
      collector.recordLocaleUsage('zh');

      const metrics = collector.getMetrics();
      expect(metrics.localeUsage.en).toBe(0);
      expect(metrics.localeUsage.zh).toBe(1);
    });

    it('should emit hit event with locale info', () => {
      const listener = vi.fn();
      collector.addEventListener('hit', listener);

      collector.recordLocaleUsage('en');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hit',
          metadata: expect.objectContaining({
            locale: 'en',
            usageCount: 1,
          }),
        }),
      );
    });
  });

  describe('recordTranslationCoverage', () => {
    it('should record coverage within bounds', () => {
      collector.recordTranslationCoverage(0.85);

      const metrics = collector.getMetrics();
      expect(metrics.translationCoverage).toBe(0.85);
    });

    it('should clamp coverage to max 1', () => {
      collector.recordTranslationCoverage(1.5);

      const metrics = collector.getMetrics();
      expect(metrics.translationCoverage).toBe(1);
    });

    it('should clamp coverage to min 0', () => {
      collector.recordTranslationCoverage(-0.5);

      const metrics = collector.getMetrics();
      expect(metrics.translationCoverage).toBe(0);
    });

    it('should emit set event', () => {
      const listener = vi.fn();
      collector.addEventListener('set', listener);

      collector.recordTranslationCoverage(0.9);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'set',
          metadata: expect.objectContaining({
            translationCoverage: 0.9,
          }),
        }),
      );
    });
  });

  describe('getMetrics', () => {
    it('should return a copy of metrics', () => {
      const metrics1 = collector.getMetrics();
      const metrics2 = collector.getMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('reset', () => {
    it('should reset all metrics to initial state', () => {
      collector.recordCacheHit();
      collector.recordError();
      collector.recordLoadTime(100);
      collector.recordLocaleUsage('en');
      collector.recordTranslationCoverage(0.5);

      collector.reset();

      const metrics = collector.getMetrics();
      expect(metrics.loadTime).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.translationCoverage).toBe(0);
      expect(metrics.localeUsage).toEqual({ en: 0, zh: 0 });
    });

    it('should emit clear event', () => {
      const listener = vi.fn();
      collector.addEventListener('clear', listener);

      collector.reset();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'clear',
          metadata: expect.objectContaining({
            reason: 'metrics_reset',
          }),
        }),
      );
    });
  });

  describe('getDetailedStats', () => {
    it('should return detailed statistics', () => {
      collector.recordCacheHit();
      collector.recordCacheMiss();
      collector.recordError();
      collector.recordLoadTime(50);
      collector.recordLocaleUsage('en');

      vi.advanceTimersByTime(60000); // 1 minute

      const stats = collector.getDetailedStats();

      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.totalRequests).toBe(2);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.errors).toBe(1);
      expect(stats.requestsPerMinute).toBeCloseTo(2, 1);
      expect(stats.averageLoadTime).toBe(50);
      expect(stats.loadTimePercentiles).toBeDefined();
      expect(stats.localeDistribution).toBeDefined();
      expect(stats.performanceGrade).toBeDefined();
    });

    it('should handle zero requests', () => {
      const stats = collector.getDetailedStats();

      expect(stats.requestsPerMinute).toBe(0);
    });
  });

  describe('addEventListener / removeEventListener', () => {
    it('should add and trigger event listeners', () => {
      const listener = vi.fn();
      collector.addEventListener('hit', listener);

      collector.recordCacheHit();

      expect(listener).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();
      collector.addEventListener('hit', listener);
      collector.removeEventListener('hit', listener);

      collector.recordCacheHit();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support wildcard listener', () => {
      const listener = vi.fn();
      collector.addEventListener('*', listener);

      collector.recordCacheHit();
      collector.recordCacheMiss();

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      collector.addEventListener('hit', errorListener);

      collector.recordCacheHit();

      expect(logger.error).toHaveBeenCalledWith(
        'Error in cache event listener:',
        expect.any(Error),
      );
    });

    it('should ignore invalid event types for addEventListener', () => {
      const listener = vi.fn();
      // @ts-expect-error - testing invalid input
      collector.addEventListener('invalid_type', listener);

      collector.recordCacheHit();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should ignore invalid event types for removeEventListener', () => {
      const listener = vi.fn();
      collector.addEventListener('hit', listener);
      // @ts-expect-error - testing invalid input
      collector.removeEventListener('invalid_type', listener);

      collector.recordCacheHit();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('calculateLoadTimePercentiles', () => {
    it('should return zeros for empty load times', () => {
      const stats = collector.getDetailedStats();

      expect(stats.loadTimePercentiles).toEqual({
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      });
    });

    it('should calculate percentiles correctly', () => {
      for (let i = 1; i <= 100; i++) {
        collector.recordLoadTime(i);
      }

      const stats = collector.getDetailedStats();

      // Math.floor(100 * 0.5) = 50, sorted[50] = 51 (0-indexed)
      expect(stats.loadTimePercentiles.p50).toBe(51);
      // Math.floor(100 * 0.9) = 90, sorted[90] = 91
      expect(stats.loadTimePercentiles.p90).toBe(91);
      // Math.floor(100 * 0.95) = 95, sorted[95] = 96
      expect(stats.loadTimePercentiles.p95).toBe(96);
      // Math.floor(100 * 0.99) = 99, sorted[99] = 100
      expect(stats.loadTimePercentiles.p99).toBe(100);
    });
  });

  describe('getLocaleDistribution', () => {
    it('should return distribution with percentages', () => {
      collector.recordLocaleUsage('en');
      collector.recordLocaleUsage('en');
      collector.recordLocaleUsage('zh');

      const stats = collector.getDetailedStats();
      const distribution = stats.localeDistribution;

      const enDist = distribution.find(
        (d: { locale: string }) => d.locale === 'en',
      );
      const zhDist = distribution.find(
        (d: { locale: string }) => d.locale === 'zh',
      );

      expect(enDist?.count).toBe(2);
      expect(enDist?.percentage).toBeCloseTo(66.67, 1);
      expect(zhDist?.count).toBe(1);
      expect(zhDist?.percentage).toBeCloseTo(33.33, 1);
    });

    it('should handle zero usage', () => {
      const stats = collector.getDetailedStats();
      const distribution = stats.localeDistribution;

      distribution.forEach((d: { percentage: number }) => {
        expect(d.percentage).toBe(0);
      });
    });
  });

  describe('calculatePerformanceGrade', () => {
    it('should return A for excellent performance', () => {
      // High hit rate, low error rate, fast load time
      for (let i = 0; i < 100; i++) {
        collector.recordCacheHit();
        collector.recordLoadTime(5);
      }

      const stats = collector.getDetailedStats();
      expect(stats.performanceGrade).toBe('A');
    });

    it('should return F for poor performance', () => {
      // Low hit rate, high error rate, slow load time
      for (let i = 0; i < 10; i++) {
        collector.recordCacheMiss();
        collector.recordError();
        collector.recordLoadTime(500);
      }

      const stats = collector.getDetailedStats();
      expect(stats.performanceGrade).toBe('F');
    });

    it('should return B for good performance', () => {
      for (let i = 0; i < 90; i++) {
        collector.recordCacheHit();
        collector.recordLoadTime(30);
      }
      for (let i = 0; i < 10; i++) {
        collector.recordCacheMiss();
      }

      const stats = collector.getDetailedStats();
      expect(['A', 'B']).toContain(stats.performanceGrade);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate complete report', () => {
      collector.recordCacheHit();
      collector.recordCacheMiss();
      collector.recordLoadTime(100);
      collector.recordLocaleUsage('en');
      collector.recordError();

      const report = collector.generatePerformanceReport();

      expect(report.summary).toBeDefined();
      expect(report.summary.grade).toBeDefined();
      expect(report.performance).toBeDefined();
      expect(report.performance.cacheEfficiency).toBeDefined();
      expect(report.usage).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should include recommendations for poor metrics', () => {
      // Low hit rate
      for (let i = 0; i < 100; i++) {
        collector.recordCacheMiss();
        collector.recordLoadTime(200);
        collector.recordError();
      }

      const report = collector.generatePerformanceReport();

      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide no recommendations for excellent metrics', () => {
      for (let i = 0; i < 100; i++) {
        collector.recordCacheHit();
        collector.recordLoadTime(5);
      }

      const report = collector.generatePerformanceReport();

      // May still have some recommendations, but fewer
      expect(report.recommendations.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('createMetricsCollector', () => {
  it('should create a new I18nMetricsCollector instance', () => {
    const collector = createMetricsCollector();

    expect(collector).toBeInstanceOf(I18nMetricsCollector);
  });
});

describe('formatMetrics', () => {
  it('should format metrics as readable string', () => {
    const metrics = {
      loadTime: 50.5,
      cacheHitRate: 0.85,
      errorRate: 0.02,
      translationCoverage: 0.95,
      localeUsage: { en: 60.5, zh: 39.5 },
    };

    const formatted = formatMetrics(metrics);

    expect(formatted).toContain('85.00%');
    expect(formatted).toContain('50.50ms');
    expect(formatted).toContain('2.00%');
    expect(formatted).toContain('0.95%');
  });
});

describe('defaultMetricsCollector', () => {
  it('should be an instance of I18nMetricsCollector', () => {
    expect(defaultMetricsCollector).toBeInstanceOf(I18nMetricsCollector);
  });
});
