/**
 * @vitest-environment jsdom
 * Tests for web-vitals-diagnostics-calculator module
 */
import { describe, expect, it } from 'vitest';
import type { DetailedWebVitals } from '@/lib/enhanced-web-vitals';
import type { DiagnosticReport } from '@/hooks/web-vitals-diagnostics-constants';
import {
  calculateAverage,
  calculateImprovementPotential,
  calculateMedian,
  calculateMetricStats,
  calculateP95,
  calculatePercentageChange,
  calculatePerformanceGrade,
  calculatePerformanceScore,
  calculatePerformanceTrends,
} from '../web-vitals-diagnostics-calculator';

function createMockVitals(
  overrides: Partial<DetailedWebVitals> = {},
): DetailedWebVitals {
  return {
    lcp: 2000,
    fid: 80,
    cls: 0.05,
    fcp: 1500,
    ttfb: 600,
    ...overrides,
  };
}

function createMockReport(
  overrides: Partial<DiagnosticReport> = {},
): DiagnosticReport {
  return {
    timestamp: Date.now(),
    vitals: createMockVitals(),
    score: 85,
    issues: [],
    recommendations: [],
    pageUrl: '/test-page',
    userAgent: 'TestAgent',
    ...overrides,
  };
}

describe('calculatePerformanceScore', () => {
  it('returns 100 for perfect metrics', () => {
    const vitals = createMockVitals({
      lcp: 1000,
      fid: 40,
      cls: 0.03,
    });

    const score = calculatePerformanceScore(vitals);

    expect(score).toBe(100);
  });

  it('deducts for LCP above good threshold', () => {
    const vitals = createMockVitals({
      lcp: 3000,
      fid: 50,
      cls: 0.05,
    });

    const score = calculatePerformanceScore(vitals);

    expect(score).toBeLessThan(100);
  });

  it('deducts more for LCP above poor threshold', () => {
    const goodVitals = createMockVitals({ lcp: 3000 });
    const poorVitals = createMockVitals({ lcp: 5000 });

    const goodScore = calculatePerformanceScore(goodVitals);
    const poorScore = calculatePerformanceScore(poorVitals);

    expect(poorScore).toBeLessThan(goodScore);
  });

  it('deducts for FID above good threshold', () => {
    const vitals = createMockVitals({
      lcp: 1000,
      fid: 150,
      cls: 0.05,
    });

    const score = calculatePerformanceScore(vitals);

    expect(score).toBeLessThan(100);
  });

  it('deducts more for FID above poor threshold', () => {
    const goodVitals = createMockVitals({ fid: 150 });
    const poorVitals = createMockVitals({ fid: 400 });

    const goodScore = calculatePerformanceScore(goodVitals);
    const poorScore = calculatePerformanceScore(poorVitals);

    expect(poorScore).toBeLessThan(goodScore);
  });

  it('deducts for CLS above good threshold', () => {
    const vitals = createMockVitals({
      lcp: 1000,
      fid: 50,
      cls: 0.15,
    });

    const score = calculatePerformanceScore(vitals);

    expect(score).toBeLessThan(100);
  });

  it('deducts more for CLS above poor threshold', () => {
    const goodVitals = createMockVitals({ cls: 0.15 });
    const poorVitals = createMockVitals({ cls: 0.3 });

    const goodScore = calculatePerformanceScore(goodVitals);
    const poorScore = calculatePerformanceScore(poorVitals);

    expect(poorScore).toBeLessThan(goodScore);
  });

  it('handles undefined metrics', () => {
    const vitals = createMockVitals({
      lcp: undefined,
      fid: undefined,
      cls: undefined,
    });

    const score = calculatePerformanceScore(vitals);

    expect(score).toBe(100);
  });

  it('never returns below 0', () => {
    const vitals = createMockVitals({
      lcp: 10000,
      fid: 1000,
      cls: 1,
    });

    const score = calculatePerformanceScore(vitals);

    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('calculatePercentageChange', () => {
  it('calculates positive change', () => {
    const change = calculatePercentageChange(120, 100);

    expect(change).toBe(20);
  });

  it('calculates negative change', () => {
    const change = calculatePercentageChange(80, 100);

    expect(change).toBe(-20);
  });

  it('returns 0 for no change', () => {
    const change = calculatePercentageChange(100, 100);

    expect(change).toBe(0);
  });

  it('handles previous value of 0', () => {
    const positiveChange = calculatePercentageChange(100, 0);
    const zeroChange = calculatePercentageChange(0, 0);

    expect(positiveChange).toBe(100);
    expect(zeroChange).toBe(0);
  });

  it('rounds to decimal places', () => {
    const change = calculatePercentageChange(133, 100);

    expect(change).toBe(33);
  });
});

describe('calculateAverage', () => {
  it('calculates average of values', () => {
    const values = [10, 20, 30];

    const avg = calculateAverage(values);

    expect(avg).toBe(20);
  });

  it('returns 0 for empty array', () => {
    const avg = calculateAverage([]);

    expect(avg).toBe(0);
  });

  it('handles single value', () => {
    const avg = calculateAverage([42]);

    expect(avg).toBe(42);
  });

  it('rounds to decimal places', () => {
    const values = [10, 20, 25];

    const avg = calculateAverage(values);

    expect(avg).toBeCloseTo(18.333, 2);
  });
});

describe('calculateMedian', () => {
  it('calculates median for odd-length array', () => {
    const values = [1, 3, 5, 7, 9];

    const median = calculateMedian(values);

    expect(median).toBe(5);
  });

  it('calculates median for even-length array', () => {
    const values = [1, 3, 5, 7];

    const median = calculateMedian(values);

    expect(median).toBe(4);
  });

  it('returns 0 for empty array', () => {
    const median = calculateMedian([]);

    expect(median).toBe(0);
  });

  it('handles single value', () => {
    const median = calculateMedian([42]);

    expect(median).toBe(42);
  });

  it('handles unsorted array', () => {
    const values = [9, 1, 7, 3, 5];

    const median = calculateMedian(values);

    expect(median).toBe(5);
  });
});

describe('calculateP95', () => {
  it('calculates 95th percentile', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);

    const p95 = calculateP95(values);

    expect(p95).toBe(95);
  });

  it('returns 0 for empty array', () => {
    const p95 = calculateP95([]);

    expect(p95).toBe(0);
  });

  it('handles small array', () => {
    const values = [10, 20, 30];

    const p95 = calculateP95(values);

    expect(p95).toBe(30);
  });

  it('handles unsorted array', () => {
    const values = [5, 1, 3, 2, 4];

    const p95 = calculateP95(values);

    expect(p95).toBe(5);
  });
});

describe('calculateMetricStats', () => {
  it('calculates all stats', () => {
    const values = [10, 20, 30, 40, 50];

    const stats = calculateMetricStats(values);

    expect(stats.average).toBe(30);
    expect(stats.median).toBe(30);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.count).toBe(5);
  });

  it('returns zeros for empty array', () => {
    const stats = calculateMetricStats([]);

    expect(stats.average).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.p95).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.count).toBe(0);
  });

  it('calculates p95 correctly', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);

    const stats = calculateMetricStats(values);

    expect(stats.p95).toBe(95);
  });
});

describe('calculatePerformanceGrade', () => {
  it('returns A for score >= 90', () => {
    expect(calculatePerformanceGrade(90)).toBe('A');
    expect(calculatePerformanceGrade(95)).toBe('A');
    expect(calculatePerformanceGrade(100)).toBe('A');
  });

  it('returns B for score >= 80', () => {
    expect(calculatePerformanceGrade(80)).toBe('B');
    expect(calculatePerformanceGrade(85)).toBe('B');
    expect(calculatePerformanceGrade(89)).toBe('B');
  });

  it('returns C for score >= 70', () => {
    expect(calculatePerformanceGrade(70)).toBe('C');
    expect(calculatePerformanceGrade(75)).toBe('C');
    expect(calculatePerformanceGrade(79)).toBe('C');
  });

  it('returns D for score >= 60', () => {
    expect(calculatePerformanceGrade(60)).toBe('D');
    expect(calculatePerformanceGrade(65)).toBe('D');
    expect(calculatePerformanceGrade(69)).toBe('D');
  });

  it('returns F for score < 60', () => {
    expect(calculatePerformanceGrade(59)).toBe('F');
    expect(calculatePerformanceGrade(30)).toBe('F');
    expect(calculatePerformanceGrade(0)).toBe('F');
  });
});

describe('calculateImprovementPotential', () => {
  it('returns 0 for all good metrics', () => {
    const vitals = createMockVitals({
      lcp: 2000,
      fid: 80,
      cls: 0.05,
    });

    const potential = calculateImprovementPotential(vitals);

    expect(potential).toBe(0);
  });

  it('adds LCP weight when above threshold', () => {
    const vitals = createMockVitals({ lcp: 3000 });

    const potential = calculateImprovementPotential(vitals);

    expect(potential).toBe(40);
  });

  it('adds FID weight when above threshold', () => {
    const vitals = createMockVitals({ fid: 150 });

    const potential = calculateImprovementPotential(vitals);

    expect(potential).toBe(30);
  });

  it('adds CLS weight when above threshold', () => {
    const vitals = createMockVitals({ cls: 0.15 });

    const potential = calculateImprovementPotential(vitals);

    expect(potential).toBe(30);
  });

  it('accumulates all weights', () => {
    const vitals = createMockVitals({
      lcp: 3000,
      fid: 150,
      cls: 0.15,
    });

    const potential = calculateImprovementPotential(vitals);

    expect(potential).toBe(100);
  });

  it('handles undefined metrics', () => {
    const vitals = createMockVitals({
      lcp: undefined,
      fid: undefined,
      cls: undefined,
    });

    const potential = calculateImprovementPotential(vitals);

    expect(potential).toBe(0);
  });
});

describe('calculatePerformanceTrends', () => {
  it('returns null for less than minimum reports', () => {
    const reports = [createMockReport()];

    const trends = calculatePerformanceTrends(reports);

    expect(trends).toBeNull();
  });

  it('returns null when no previous reports to compare', () => {
    const reports = Array.from({ length: 5 }, () => createMockReport());

    const trends = calculatePerformanceTrends(reports);

    expect(trends).toBeNull();
  });

  it('calculates trends for sufficient data', () => {
    const recentReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 2000 }),
      }),
    );
    const previousReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 3000 }),
      }),
    );
    const reports = [...previousReports, ...recentReports];

    const trends = calculatePerformanceTrends(reports);

    expect(trends).not.toBeNull();
    expect(trends?.length).toBe(5);
  });

  it('identifies improving trend when metric decreases', () => {
    const previousReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 5000 }),
      }),
    );
    const recentReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 2000 }),
      }),
    );
    const reports = [...previousReports, ...recentReports];

    const trends = calculatePerformanceTrends(reports);
    const lcpTrend = trends?.find((t) => t.metric === 'lcp');

    expect(lcpTrend?.trend).toBe('improving');
  });

  it('identifies declining trend when metric increases', () => {
    const previousReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 2000 }),
      }),
    );
    const recentReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 5000 }),
      }),
    );
    const reports = [...previousReports, ...recentReports];

    const trends = calculatePerformanceTrends(reports);
    const lcpTrend = trends?.find((t) => t.metric === 'lcp');

    expect(lcpTrend?.trend).toBe('declining');
  });

  it('identifies stable trend for small changes', () => {
    const previousReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 2000 }),
      }),
    );
    const recentReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: 2010 }),
      }),
    );
    const reports = [...previousReports, ...recentReports];

    const trends = calculatePerformanceTrends(reports);
    const lcpTrend = trends?.find((t) => t.metric === 'lcp');

    expect(lcpTrend?.trend).toBe('stable');
  });

  it('handles reports with missing metric values', () => {
    const previousReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: undefined }),
      }),
    );
    const recentReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ lcp: undefined }),
      }),
    );
    const reports = [...previousReports, ...recentReports];

    const trends = calculatePerformanceTrends(reports);
    const lcpTrend = trends?.find((t) => t.metric === 'lcp');

    expect(lcpTrend?.trend).toBe('stable');
    expect(lcpTrend?.recent).toBe(0);
    expect(lcpTrend?.previous).toBe(0);
  });

  it('includes all five metrics in trends', () => {
    const reports = Array.from({ length: 10 }, () => createMockReport());

    const trends = calculatePerformanceTrends(reports);

    expect(trends?.map((t) => t.metric)).toEqual(
      expect.arrayContaining(['lcp', 'fid', 'cls', 'fcp', 'ttfb']),
    );
  });

  it('calculates change value correctly', () => {
    const previousReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ fcp: 1500 }),
      }),
    );
    const recentReports = Array.from({ length: 5 }, () =>
      createMockReport({
        vitals: createMockVitals({ fcp: 1800 }),
      }),
    );
    const reports = [...previousReports, ...recentReports];

    const trends = calculatePerformanceTrends(reports);
    const fcpTrend = trends?.find((t) => t.metric === 'fcp');

    expect(fcpTrend?.change).toBe(300);
    expect(fcpTrend?.recent).toBe(1800);
    expect(fcpTrend?.previous).toBe(1500);
  });
});
