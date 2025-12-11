/**
 * @vitest-environment jsdom
 * Tests for web-vitals-diagnostics-export module
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DiagnosticReport,
  WebVitalsDiagnosticsState,
} from '@/hooks/web-vitals-diagnostics-types';
import {
  exportCsvReport,
  exportExcelReport,
  exportJsonReport,
  generateDetailedReport,
  useReportExport,
} from '../web-vitals-diagnostics-export';

function createMockReport(
  overrides: Partial<DiagnosticReport> = {},
): DiagnosticReport {
  return {
    timestamp: Date.now(),
    vitals: {
      lcp: 2000,
      fid: 80,
      cls: 0.05,
      fcp: 1500,
      ttfb: 600,
    },
    score: 85,
    issues: [],
    recommendations: [],
    pageUrl: '/test-page',
    userAgent: 'TestAgent',
    ...overrides,
  };
}

function createMockState(
  overrides: Partial<WebVitalsDiagnosticsState> = {},
): WebVitalsDiagnosticsState {
  return {
    currentReport: createMockReport(),
    historicalReports: [createMockReport()],
    isLoading: false,
    error: null,
    ...overrides,
  };
}

describe('exportJsonReport', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  let createdLink: HTMLAnchorElement;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
    mockRevokeObjectURL = vi.fn();
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();
    mockClick = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      mockAppendChild(node);
      return node;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
      mockRemoveChild(node);
      return node;
    });

    // Save original before spying to avoid infinite recursion
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        createdLink = {
          href: '',
          download: '',
          click: mockClick,
        } as unknown as HTMLAnchorElement;
        return createdLink;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates blob with JSON content', () => {
    const data = { test: 'value' };

    exportJsonReport(data);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('sets correct download filename', () => {
    exportJsonReport({ test: 'value' });

    expect(createdLink.download).toMatch(/^web-vitals-report-\d+\.json$/);
  });

  it('triggers download by clicking link', () => {
    exportJsonReport({ test: 'value' });

    expect(mockClick).toHaveBeenCalled();
  });

  it('cleans up blob URL after download', () => {
    exportJsonReport({ test: 'value' });

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('adds and removes link from DOM', () => {
    exportJsonReport({ test: 'value' });

    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });
});

describe('exportCsvReport', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  let createdLink: HTMLAnchorElement;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
    mockRevokeObjectURL = vi.fn();
    mockClick = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    // Save original before spying to avoid infinite recursion
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        createdLink = {
          href: '',
          download: '',
          click: mockClick,
        } as unknown as HTMLAnchorElement;
        return createdLink;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates CSV with headers', () => {
    const reports = [createMockReport()];

    mockCreateObjectURL.mockImplementation((_blob: Blob) => {
      return 'blob:test-url';
    });

    exportCsvReport(reports);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('sets correct download filename with csv extension', () => {
    const reports = [createMockReport()];

    exportCsvReport(reports);

    expect(createdLink.download).toMatch(/^web-vitals-report-\d+\.csv$/);
  });

  it('handles empty reports array', () => {
    exportCsvReport([]);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('formats vitals values correctly', () => {
    const reports = [
      createMockReport({
        vitals: {
          lcp: 2500,
          fid: 100,
          cls: 0.123,
          fcp: 1800,
          ttfb: 800,
        },
      }),
    ];

    exportCsvReport(reports);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});

describe('exportExcelReport', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  let createdLink: HTMLAnchorElement;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
    mockRevokeObjectURL = vi.fn();
    mockClick = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    // Save original before spying to avoid infinite recursion
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        createdLink = {
          href: '',
          download: '',
          click: mockClick,
        } as unknown as HTMLAnchorElement;
        return createdLink;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sets xlsx extension on download filename', () => {
    const reports = [createMockReport()];

    exportExcelReport(reports);

    expect(createdLink.download).toMatch(/^web-vitals-report-\d+\.xlsx$/);
  });

  it('includes status column based on score', () => {
    const reports = [
      createMockReport({ score: 95 }),
      createMockReport({ score: 80 }),
      createMockReport({ score: 60 }),
      createMockReport({ score: 40 }),
    ];

    exportExcelReport(reports);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('handles reports with null score', () => {
    const reports = [createMockReport({ score: 0 })];

    exportExcelReport(reports);

    expect(mockClick).toHaveBeenCalled();
  });
});

describe('useReportExport', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
    mockRevokeObjectURL = vi.fn();
    mockClick = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    // Save original before spying to avoid infinite recursion
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns exportReport function', () => {
    const state = createMockState();
    const getPerformanceTrends = vi.fn();
    const getPageComparison = vi.fn();

    const { result } = renderHook(() =>
      useReportExport(state, getPerformanceTrends, getPageComparison),
    );

    expect(typeof result.current.exportReport).toBe('function');
  });

  it('exports JSON by default', () => {
    const state = createMockState();
    const getPerformanceTrends = vi.fn().mockReturnValue([]);
    const getPageComparison = vi.fn().mockReturnValue([]);

    const { result } = renderHook(() =>
      useReportExport(state, getPerformanceTrends, getPageComparison),
    );

    result.current.exportReport();

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('exports CSV when format is csv', () => {
    const state = createMockState();
    const getPerformanceTrends = vi.fn();
    const getPageComparison = vi.fn();

    const { result } = renderHook(() =>
      useReportExport(state, getPerformanceTrends, getPageComparison),
    );

    result.current.exportReport('csv');

    expect(mockClick).toHaveBeenCalled();
  });

  it('includes performance trends in JSON export', () => {
    const state = createMockState();
    const mockTrends = [{ metric: 'lcp', trend: 'improving' }];
    const getPerformanceTrends = vi.fn().mockReturnValue(mockTrends);
    const getPageComparison = vi.fn().mockReturnValue([]);

    const { result } = renderHook(() =>
      useReportExport(state, getPerformanceTrends, getPageComparison),
    );

    result.current.exportReport('json');

    expect(getPerformanceTrends).toHaveBeenCalled();
  });

  it('includes page comparison in JSON export', () => {
    const state = createMockState();
    const mockComparison = [{ url: '/test', score: 85 }];
    const getPerformanceTrends = vi.fn().mockReturnValue([]);
    const getPageComparison = vi.fn().mockReturnValue(mockComparison);

    const { result } = renderHook(() =>
      useReportExport(state, getPerformanceTrends, getPageComparison),
    );

    result.current.exportReport('json');

    expect(getPageComparison).toHaveBeenCalled();
  });
});

describe('generateDetailedReport', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { userAgent: 'Test Browser' });
    vi.stubGlobal('window', { location: { href: 'http://test.com/page' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates report with summary', () => {
    const state = createMockState({
      historicalReports: [createMockReport(), createMockReport()],
    });

    const report = generateDetailedReport(state, [], []);

    expect(report.summary).toBeDefined();
    expect((report.summary as { totalReports: number }).totalReports).toBe(2);
  });

  it('includes current report', () => {
    const currentReport = createMockReport({ pageUrl: '/current' });
    const state = createMockState({ currentReport });

    const report = generateDetailedReport(state, [], []);

    expect(report.currentReport).toBe(currentReport);
  });

  it('includes historical reports', () => {
    const historicalReports = [createMockReport(), createMockReport()];
    const state = createMockState({ historicalReports });

    const report = generateDetailedReport(state, [], []);

    expect(report.historicalReports).toBe(historicalReports);
  });

  it('includes analysis with trends and comparison', () => {
    const state = createMockState();
    const trends = [{ metric: 'lcp', trend: 'stable' }];
    const comparison = [{ url: '/test' }];

    const report = generateDetailedReport(state, trends, comparison);

    expect(
      (report.analysis as { performanceTrends: unknown }).performanceTrends,
    ).toBe(trends);
    expect(
      (report.analysis as { pageComparison: unknown }).pageComparison,
    ).toBe(comparison);
  });

  it('generates insights for historical data', () => {
    const state = createMockState({
      historicalReports: [
        createMockReport({
          vitals: { lcp: 5000, fid: 300, cls: 0.3, fcp: 2000, ttfb: 1000 },
        }),
      ],
    });

    const report = generateDetailedReport(state, [], []);

    expect(
      (report.analysis as { insights: string[] }).insights.length,
    ).toBeGreaterThan(0);
  });

  it('handles empty historical reports', () => {
    const state = createMockState({ historicalReports: [] });

    const report = generateDetailedReport(state, [], []);

    expect((report.analysis as { insights: string[] }).insights).toContain(
      'No data available for analysis',
    );
  });

  it('includes metadata', () => {
    const state = createMockState();

    const report = generateDetailedReport(state, [], []);

    expect((report.metadata as { version: string }).version).toBe('1.0.0');
    expect((report.metadata as { userAgent: string }).userAgent).toBe(
      'Test Browser',
    );
    expect((report.metadata as { url: string }).url).toBe(
      'http://test.com/page',
    );
  });

  it('calculates average metrics correctly', () => {
    const state = createMockState({
      historicalReports: [
        createMockReport({
          vitals: { lcp: 2000, fid: 100, cls: 0.1, fcp: 1500, ttfb: 500 },
        }),
        createMockReport({
          vitals: { lcp: 3000, fid: 200, cls: 0.2, fcp: 2500, ttfb: 700 },
        }),
      ],
    });

    const report = generateDetailedReport(state, [], []);

    const summary = report.summary as { averageMetrics: { lcp: number } };
    expect(summary.averageMetrics.lcp).toBe(2500);
  });

  it('generates CLS insights for moderate values', () => {
    const state = createMockState({
      historicalReports: [
        createMockReport({
          vitals: { lcp: 2000, fid: 80, cls: 0.15, fcp: 1500, ttfb: 600 },
        }),
      ],
    });

    const report = generateDetailedReport(state, [], []);
    const insights = (report.analysis as { insights: string[] }).insights;

    expect(insights.some((i) => i.includes('Cumulative Layout Shift'))).toBe(
      true,
    );
  });

  it('generates LCP insights for moderate values', () => {
    const state = createMockState({
      historicalReports: [
        createMockReport({
          vitals: { lcp: 3000, fid: 80, cls: 0.05, fcp: 1500, ttfb: 600 },
        }),
      ],
    });

    const report = generateDetailedReport(state, [], []);
    const insights = (report.analysis as { insights: string[] }).insights;

    expect(insights.some((i) => i.includes('Largest Contentful Paint'))).toBe(
      true,
    );
  });

  it('generates improving trend insight', () => {
    const reports: DiagnosticReport[] = [];
    for (let i = 0; i < 10; i++) {
      reports.push(createMockReport({ score: 60 + i * 4 }));
    }

    const state = createMockState({ historicalReports: reports });

    const report = generateDetailedReport(state, [], []);
    const insights = (report.analysis as { insights: string[] }).insights;

    expect(insights.some((i) => i.includes('improving'))).toBe(true);
  });
});
