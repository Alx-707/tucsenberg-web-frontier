/**
 * @vitest-environment jsdom
 * Tests for web-vitals-diagnostics-analyzer module
 */
import { describe, expect, it } from 'vitest';
import type { DetailedWebVitals } from '@/lib/enhanced-web-vitals';
import type { DiagnosticReport } from '@/hooks/web-vitals-diagnostics-constants';
import {
  analyzeOverallTrend,
  calculatePageComparison,
  comparePagePerformance,
  exportReportData,
  generateCSVData,
  generateRecommendations,
  identifyPerformanceIssues,
} from '../web-vitals-diagnostics-analyzer';

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

describe('generateRecommendations', () => {
  it('returns empty array for good metrics', () => {
    const vitals = createMockVitals({
      lcp: 2000,
      fid: 80,
      cls: 0.05,
      fcp: 1500,
      ttfb: 600,
    });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations).toEqual([]);
  });

  it('recommends LCP optimization when above threshold', () => {
    const vitals = createMockVitals({ lcp: 3000 });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations).toContain(
      '优化最大内容绘制(LCP): 考虑优化图片加载、减少服务器响应时间',
    );
  });

  it('recommends FID optimization when above threshold', () => {
    const vitals = createMockVitals({ fid: 150 });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations).toContain(
      '改善首次输入延迟(FID): 减少JavaScript执行时间、优化第三方脚本',
    );
  });

  it('recommends CLS optimization when above threshold', () => {
    const vitals = createMockVitals({ cls: 0.15 });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations).toContain(
      '减少累积布局偏移(CLS): 为图片和广告设置尺寸、避免动态内容插入',
    );
  });

  it('recommends FCP optimization when above threshold', () => {
    const vitals = createMockVitals({ fcp: 2000 });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations).toContain(
      '优化首次内容绘制(FCP): 减少阻塞渲染的资源、优化关键CSS',
    );
  });

  it('recommends TTFB optimization when above threshold', () => {
    const vitals = createMockVitals({ ttfb: 1000 });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations).toContain(
      '改善首字节时间(TTFB): 优化服务器配置、使用CDN、减少重定向',
    );
  });

  it('returns multiple recommendations for multiple issues', () => {
    const vitals = createMockVitals({
      lcp: 5000,
      fid: 400,
      cls: 0.3,
    });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations.length).toBe(3);
  });

  it('handles undefined metrics', () => {
    const vitals = createMockVitals({
      lcp: undefined,
      fid: undefined,
      cls: undefined,
      fcp: undefined,
      ttfb: undefined,
    });

    const recommendations = generateRecommendations(vitals);

    expect(recommendations).toEqual([]);
  });
});

describe('identifyPerformanceIssues', () => {
  it('returns empty array for good metrics', () => {
    const vitals = createMockVitals();

    const issues = identifyPerformanceIssues(vitals);

    expect(issues).toEqual([]);
  });

  it('identifies severe LCP issue', () => {
    const vitals = createMockVitals({ lcp: 5000 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('LCP 严重问题');
    expect(issues[0]).toContain('5000ms');
  });

  it('identifies moderate LCP issue', () => {
    const vitals = createMockVitals({ lcp: 3000 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('LCP 中等问题');
  });

  it('identifies severe FID issue', () => {
    const vitals = createMockVitals({ fid: 400 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('FID 严重问题');
  });

  it('identifies moderate FID issue', () => {
    const vitals = createMockVitals({ fid: 150 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('FID 中等问题');
  });

  it('identifies severe CLS issue', () => {
    const vitals = createMockVitals({ cls: 0.3 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('CLS 严重问题');
  });

  it('identifies moderate CLS issue', () => {
    const vitals = createMockVitals({ cls: 0.15 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('CLS 中等问题');
  });

  it('identifies FCP issue', () => {
    const vitals = createMockVitals({ fcp: 2000 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('FCP 问题');
  });

  it('identifies TTFB issue', () => {
    const vitals = createMockVitals({ ttfb: 1000 });

    const issues = identifyPerformanceIssues(vitals);

    expect(issues[0]).toContain('TTFB 问题');
  });
});

describe('comparePagePerformance', () => {
  it('compares two reports', () => {
    const current = createMockReport({
      pageUrl: '/page-a',
      score: 90,
      vitals: createMockVitals({ lcp: 2000, fid: 80, cls: 0.05 }),
    });
    const compared = createMockReport({
      pageUrl: '/page-b',
      score: 80,
      vitals: createMockVitals({ lcp: 3000, fid: 100, cls: 0.1 }),
    });

    const comparison = comparePagePerformance(current, compared);

    expect(comparison.currentPage).toBe('/page-a');
    expect(comparison.comparedPage).toBe('/page-b');
    expect(comparison.scoreDifference).toBe(10);
  });

  it('identifies better metrics', () => {
    const current = createMockReport({
      vitals: createMockVitals({ lcp: 2000, fid: 80 }),
    });
    const compared = createMockReport({
      vitals: createMockVitals({ lcp: 3000, fid: 100 }),
    });

    const comparison = comparePagePerformance(current, compared);

    expect(comparison.betterMetrics).toContain('lcp');
    expect(comparison.betterMetrics).toContain('fid');
  });

  it('identifies worse metrics', () => {
    const current = createMockReport({
      vitals: createMockVitals({ lcp: 3000, cls: 0.2 }),
    });
    const compared = createMockReport({
      vitals: createMockVitals({ lcp: 2000, cls: 0.1 }),
    });

    const comparison = comparePagePerformance(current, compared);

    expect(comparison.worseMetrics).toContain('lcp');
    expect(comparison.worseMetrics).toContain('cls');
  });

  it('calculates metric differences', () => {
    const current = createMockReport({
      vitals: createMockVitals({ lcp: 2000 }),
    });
    const compared = createMockReport({
      vitals: createMockVitals({ lcp: 3000 }),
    });

    const comparison = comparePagePerformance(current, compared);

    expect(comparison.metrics.lcp.current).toBe(2000);
    expect(comparison.metrics.lcp.compared).toBe(3000);
    expect(comparison.metrics.lcp.difference).toBe(-1000);
  });

  it('handles same metric values', () => {
    const current = createMockReport({
      vitals: createMockVitals({ lcp: 2000 }),
    });
    const compared = createMockReport({
      vitals: createMockVitals({ lcp: 2000 }),
    });

    const comparison = comparePagePerformance(current, compared);

    expect(comparison.betterMetrics).not.toContain('lcp');
    expect(comparison.worseMetrics).not.toContain('lcp');
  });

  it('handles undefined metrics', () => {
    const current = createMockReport({
      vitals: createMockVitals({ lcp: undefined }),
    });
    const compared = createMockReport({
      vitals: createMockVitals({ lcp: undefined }),
    });

    const comparison = comparePagePerformance(current, compared);

    expect(comparison.metrics.lcp.current).toBeUndefined();
    expect(comparison.metrics.lcp.compared).toBeUndefined();
  });
});

describe('calculatePageComparison', () => {
  it('groups reports by page URL', () => {
    const reports = [
      createMockReport({ pageUrl: '/page-a', score: 80 }),
      createMockReport({ pageUrl: '/page-a', score: 90 }),
      createMockReport({ pageUrl: '/page-b', score: 70 }),
    ];

    const groups = calculatePageComparison(reports);

    expect(groups.length).toBe(2);
  });

  it('calculates average score per page', () => {
    const reports = [
      createMockReport({ pageUrl: '/page-a', score: 80 }),
      createMockReport({ pageUrl: '/page-a', score: 90 }),
    ];

    const groups = calculatePageComparison(reports);

    expect(groups[0]?.averageScore).toBe(85);
  });

  it('sorts by average score descending', () => {
    const reports = [
      createMockReport({ pageUrl: '/page-a', score: 70 }),
      createMockReport({ pageUrl: '/page-b', score: 90 }),
      createMockReport({ pageUrl: '/page-c', score: 80 }),
    ];

    const groups = calculatePageComparison(reports);

    expect(groups[0]?.url).toBe('/page-b');
    expect(groups[1]?.url).toBe('/page-c');
    expect(groups[2]?.url).toBe('/page-a');
  });

  it('includes latest report for each page', () => {
    const reports = [
      createMockReport({ pageUrl: '/page-a', timestamp: 1000 }),
      createMockReport({ pageUrl: '/page-a', timestamp: 2000 }),
    ];

    const groups = calculatePageComparison(reports);

    expect(groups[0]?.latestReport.timestamp).toBe(2000);
  });

  it('truncates long URLs', () => {
    const longUrl = `/${'a'.repeat(1100)}`;
    const reports = [createMockReport({ pageUrl: longUrl })];

    const groups = calculatePageComparison(reports);

    expect(groups[0]?.url).toContain('...');
    expect(groups[0]?.url.length).toBeLessThan(longUrl.length);
  });

  it('handles empty reports array', () => {
    const groups = calculatePageComparison([]);

    expect(groups).toEqual([]);
  });
});

describe('exportReportData', () => {
  it('exports reports with correct structure', () => {
    const reports = [
      createMockReport({
        timestamp: 1000,
        pageUrl: '/test',
        score: 85,
        issues: ['issue1'],
        recommendations: ['rec1'],
      }),
    ];

    const exported = exportReportData(reports);

    expect(exported.exportDate).toBeDefined();
    expect(exported.totalReports).toBe(1);
    expect(exported.reports[0]?.pageUrl).toBe('/test');
    expect(exported.reports[0]?.score).toBe(85);
    expect(exported.reports[0]?.issues).toContain('issue1');
    expect(exported.reports[0]?.recommendations).toContain('rec1');
  });

  it('exports vitals correctly', () => {
    const reports = [
      createMockReport({
        vitals: createMockVitals({
          lcp: 2000,
          fid: 80,
          cls: 0.05,
          fcp: 1500,
          ttfb: 600,
        }),
      }),
    ];

    const exported = exportReportData(reports);

    expect(exported.reports[0]?.vitals.lcp).toBe(2000);
    expect(exported.reports[0]?.vitals.fid).toBe(80);
    expect(exported.reports[0]?.vitals.cls).toBe(0.05);
  });

  it('handles multiple reports', () => {
    const reports = [
      createMockReport({ pageUrl: '/page-1' }),
      createMockReport({ pageUrl: '/page-2' }),
      createMockReport({ pageUrl: '/page-3' }),
    ];

    const exported = exportReportData(reports);

    expect(exported.totalReports).toBe(3);
    expect(exported.reports.length).toBe(3);
  });

  it('handles empty reports', () => {
    const exported = exportReportData([]);

    expect(exported.totalReports).toBe(0);
    expect(exported.reports).toEqual([]);
  });
});

describe('generateCSVData', () => {
  it('generates CSV with headers', () => {
    const reports: DiagnosticReport[] = [];

    const csv = generateCSVData(reports);

    expect(csv).toContain('Timestamp');
    expect(csv).toContain('Page URL');
    expect(csv).toContain('Score');
    expect(csv).toContain('LCP');
    expect(csv).toContain('FID');
    expect(csv).toContain('CLS');
  });

  it('generates CSV rows for reports', () => {
    const reports = [
      createMockReport({
        timestamp: 1000,
        pageUrl: '/test',
        score: 85,
        issues: ['issue1', 'issue2'],
        recommendations: ['rec1'],
      }),
    ];

    const csv = generateCSVData(reports);
    const lines = csv.split('\n');

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('/test');
    expect(lines[1]).toContain('85');
    expect(lines[1]).toContain('2');
    expect(lines[1]).toContain('1');
  });

  it('escapes values with quotes', () => {
    const reports = [createMockReport({ pageUrl: '/test' })];

    const csv = generateCSVData(reports);

    expect(csv).toContain('"/test"');
  });

  it('handles empty metric values', () => {
    const reports = [
      createMockReport({
        vitals: createMockVitals({
          lcp: undefined,
          fid: undefined,
        }),
      }),
    ];

    const csv = generateCSVData(reports);

    expect(csv).toContain('""');
  });
});

describe('analyzeOverallTrend', () => {
  it('returns stable for less than 2 reports', () => {
    const reports = [createMockReport()];

    const trend = analyzeOverallTrend(reports);

    expect(trend).toBe('stable');
  });

  it('returns stable for small score changes', () => {
    const reports = [
      createMockReport({ score: 80 }),
      createMockReport({ score: 81 }),
      createMockReport({ score: 82 }),
      createMockReport({ score: 83 }),
      createMockReport({ score: 84 }),
      createMockReport({ score: 85 }),
    ];

    const trend = analyzeOverallTrend(reports);

    expect(trend).toBe('stable');
  });

  it('returns improving for significant score increase', () => {
    // Need 20+ reports: first 10 compared to last 10 (slice -20,-10 vs slice -10)
    const previousScores = Array.from({ length: 10 }, () =>
      createMockReport({ score: 70 }),
    );
    const recentScores = Array.from({ length: 10 }, () =>
      createMockReport({ score: 90 }),
    );
    const reports = [...previousScores, ...recentScores];

    const trend = analyzeOverallTrend(reports);

    expect(trend).toBe('improving');
  });

  it('returns declining for significant score decrease', () => {
    // Need 20+ reports: first 10 compared to last 10 (slice -20,-10 vs slice -10)
    const previousScores = Array.from({ length: 10 }, () =>
      createMockReport({ score: 90 }),
    );
    const recentScores = Array.from({ length: 10 }, () =>
      createMockReport({ score: 70 }),
    );
    const reports = [...previousScores, ...recentScores];

    const trend = analyzeOverallTrend(reports);

    expect(trend).toBe('declining');
  });

  it('returns stable when no previous scores to compare', () => {
    const reports = [
      createMockReport({ score: 80 }),
      createMockReport({ score: 85 }),
    ];

    const trend = analyzeOverallTrend(reports);

    expect(trend).toBe('stable');
  });
});
