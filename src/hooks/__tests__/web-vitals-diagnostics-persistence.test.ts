/**
 * @vitest-environment jsdom
 * Tests for web-vitals-diagnostics-persistence module
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticReport } from '@/hooks/web-vitals-diagnostics-types';
import {
  cleanupExpiredData,
  compressHistoricalData,
  exportDataToFile,
  getStorageUsage,
  importDataFromFile,
  mergeHistoricalData,
  useWebVitalsDataPersistence,
  useWebVitalsInitialization,
  validateDiagnosticReport,
} from '../web-vitals-diagnostics-persistence';

// Mock logger
const { mockLogger, mockUseCurrentTime } = vi.hoisted(() => ({
  mockLogger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockUseCurrentTime: vi.fn(() => Date.now()),
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Mock useCurrentTime hook
vi.mock('@/hooks/use-current-time', () => ({
  useCurrentTime: mockUseCurrentTime,
}));

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

describe('useWebVitalsDataPersistence', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('loadHistoricalData', () => {
    it('returns empty array when no data stored', () => {
      const { result } = renderHook(() => useWebVitalsDataPersistence());

      const data = result.current.loadHistoricalData();

      expect(data).toEqual([]);
    });

    it('returns parsed data from localStorage', () => {
      const reports = [createMockReport()];
      mockLocalStorage.webVitalsDiagnostics = JSON.stringify(reports);

      const { result } = renderHook(() => useWebVitalsDataPersistence());

      const data = result.current.loadHistoricalData();

      expect(data.length).toBe(1);
    });

    it('clears storage and returns empty for invalid data format', () => {
      mockLocalStorage.webVitalsDiagnostics = JSON.stringify({ invalid: true });

      const { result } = renderHook(() => useWebVitalsDataPersistence());

      const data = result.current.loadHistoricalData();

      expect(data).toEqual([]);
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'webVitalsDiagnostics',
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('trims data exceeding max history size', () => {
      const reports = Array.from({ length: 150 }, () => createMockReport());
      mockLocalStorage.webVitalsDiagnostics = JSON.stringify(reports);

      const { result } = renderHook(() => useWebVitalsDataPersistence());

      const data = result.current.loadHistoricalData();

      expect(data.length).toBe(100);
    });

    it('handles JSON parse error', () => {
      mockLocalStorage.webVitalsDiagnostics = 'invalid-json';

      const { result } = renderHook(() => useWebVitalsDataPersistence());

      const data = result.current.loadHistoricalData();

      expect(data).toEqual([]);
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'webVitalsDiagnostics',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('saveToStorage', () => {
    it('saves reports to localStorage', () => {
      const reports = [createMockReport()];

      const { result } = renderHook(() => useWebVitalsDataPersistence());

      result.current.saveToStorage(reports);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'webVitalsDiagnostics',
        expect.any(String),
      );
    });

    it('trims reports exceeding max size before saving', () => {
      const reports = Array.from({ length: 150 }, () => createMockReport());

      const { result } = renderHook(() => useWebVitalsDataPersistence());

      result.current.saveToStorage(reports);

      const savedData = JSON.parse(
        (localStorage.setItem as ReturnType<typeof vi.fn>).mock
          .calls[0][1] as string,
      );
      expect(savedData.length).toBe(100);
    });

    it('handles storage error gracefully', () => {
      (localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw new Error('Storage quota exceeded');
        },
      );

      const { result } = renderHook(() => useWebVitalsDataPersistence());

      expect(() =>
        result.current.saveToStorage([createMockReport()]),
      ).not.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

describe('useWebVitalsInitialization', () => {
  it('returns initial data with historical reports', () => {
    const mockLoadHistoricalData = vi
      .fn()
      .mockReturnValue([createMockReport()]);
    const mockRefreshDiagnostics = vi.fn();

    const { result } = renderHook(() =>
      useWebVitalsInitialization(
        mockLoadHistoricalData,
        mockRefreshDiagnostics,
      ),
    );

    expect(result.current.initialData.historicalReports.length).toBe(1);
  });

  it('sets shouldRefresh to true when no historical data', () => {
    const mockLoadHistoricalData = vi.fn().mockReturnValue([]);
    const mockRefreshDiagnostics = vi.fn();

    const { result } = renderHook(() =>
      useWebVitalsInitialization(
        mockLoadHistoricalData,
        mockRefreshDiagnostics,
      ),
    );

    expect(result.current.initialData.shouldRefresh).toBe(true);
  });

  it('sets shouldRefresh to true when data is stale', () => {
    // Set up fixed time for deterministic testing
    const now = 1700000000000;
    const staleTimestamp = now - 400000; // 400s ago (> 300s threshold)
    mockUseCurrentTime.mockReturnValue(now);

    const staleReport = createMockReport({
      timestamp: staleTimestamp,
    });
    const mockLoadHistoricalData = vi.fn().mockReturnValue([staleReport]);
    const mockRefreshDiagnostics = vi.fn();

    const { result } = renderHook(() =>
      useWebVitalsInitialization(
        mockLoadHistoricalData,
        mockRefreshDiagnostics,
      ),
    );

    expect(result.current.initialData.shouldRefresh).toBe(true);
  });

  it('sets shouldRefresh to false when data is fresh', () => {
    // Set up fixed time for deterministic testing
    const now = 1700000000000;
    const freshTimestamp = now - 60000; // 60s ago (< 300s threshold)
    mockUseCurrentTime.mockReturnValue(now);

    const freshReport = createMockReport({
      timestamp: freshTimestamp,
    });
    const mockLoadHistoricalData = vi.fn().mockReturnValue([freshReport]);
    const mockRefreshDiagnostics = vi.fn();

    const { result } = renderHook(() =>
      useWebVitalsInitialization(
        mockLoadHistoricalData,
        mockRefreshDiagnostics,
      ),
    );

    expect(result.current.initialData.shouldRefresh).toBe(false);
  });
});

describe('validateDiagnosticReport', () => {
  it('returns true for valid report', () => {
    const report = {
      timestamp: Date.now(),
      url: '/test',
      cls: 0.1,
      lcp: 2000,
      fid: 100,
      fcp: 1500,
      ttfb: 600,
    };

    expect(validateDiagnosticReport(report)).toBe(true);
  });

  it('returns false for null', () => {
    expect(validateDiagnosticReport(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(validateDiagnosticReport(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(validateDiagnosticReport('string')).toBe(false);
    expect(validateDiagnosticReport(123)).toBe(false);
  });

  it('returns false when timestamp is missing', () => {
    const report = {
      url: '/test',
      cls: 0.1,
      lcp: 2000,
      fid: 100,
      fcp: 1500,
      ttfb: 600,
    };

    expect(validateDiagnosticReport(report)).toBe(false);
  });

  it('returns false when url is missing', () => {
    const report = {
      timestamp: Date.now(),
      cls: 0.1,
      lcp: 2000,
      fid: 100,
      fcp: 1500,
      ttfb: 600,
    };

    expect(validateDiagnosticReport(report)).toBe(false);
  });

  it('returns false when vitals are missing', () => {
    const report = {
      timestamp: Date.now(),
      url: '/test',
    };

    expect(validateDiagnosticReport(report)).toBe(false);
  });
});

describe('cleanupExpiredData', () => {
  it('removes reports older than max age', () => {
    const now = Date.now();
    const reports = [
      createMockReport({ timestamp: now - 1000 }),
      createMockReport({ timestamp: now - 10000000 }),
    ];

    const cleaned = cleanupExpiredData(reports, 5000000);

    expect(cleaned.length).toBe(1);
    expect(cleaned[0]?.timestamp).toBe(now - 1000);
  });

  it('keeps all reports when none expired', () => {
    const now = Date.now();
    const reports = [
      createMockReport({ timestamp: now - 1000 }),
      createMockReport({ timestamp: now - 2000 }),
    ];

    const cleaned = cleanupExpiredData(reports, 10000);

    expect(cleaned.length).toBe(2);
  });

  it('removes all reports when all expired', () => {
    const reports = [
      createMockReport({ timestamp: Date.now() - 100000 }),
      createMockReport({ timestamp: Date.now() - 200000 }),
    ];

    const cleaned = cleanupExpiredData(reports, 1000);

    expect(cleaned.length).toBe(0);
  });

  it('uses default max age', () => {
    const reports = [createMockReport({ timestamp: Date.now() - 1000 })];

    const cleaned = cleanupExpiredData(reports);

    expect(cleaned.length).toBe(1);
  });
});

describe('mergeHistoricalData', () => {
  it('combines existing and new reports', () => {
    const existing = [createMockReport({ pageUrl: '/page1' })];
    const newReports = [createMockReport({ pageUrl: '/page2' })];

    const merged = mergeHistoricalData(existing, newReports);

    expect(merged.length).toBe(2);
  });

  it('removes duplicates based on timestamp and URL', () => {
    const timestamp = Date.now();
    const existing = [createMockReport({ timestamp, pageUrl: '/page1' })];
    const newReports = [createMockReport({ timestamp, pageUrl: '/page1' })];

    const merged = mergeHistoricalData(existing, newReports);

    expect(merged.length).toBe(1);
  });

  it('sorts by timestamp ascending', () => {
    const existing = [createMockReport({ timestamp: 3000 })];
    const newReports = [createMockReport({ timestamp: 1000 })];

    const merged = mergeHistoricalData(existing, newReports);

    expect(merged[0]?.timestamp).toBe(1000);
    expect(merged[1]?.timestamp).toBe(3000);
  });

  it('limits to max history size', () => {
    const existing = Array.from({ length: 80 }, (_, i) =>
      createMockReport({ timestamp: i, pageUrl: `/page${i}` }),
    );
    const newReports = Array.from({ length: 80 }, (_, i) =>
      createMockReport({ timestamp: 100 + i, pageUrl: `/new-page${i}` }),
    );

    const merged = mergeHistoricalData(existing, newReports);

    expect(merged.length).toBe(100);
  });
});

describe('exportDataToFile', () => {
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

  it('creates blob and triggers download', () => {
    exportDataToFile({ test: 'data' }, 'test.json', 'application/json');

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('sets correct filename', () => {
    exportDataToFile({ test: 'data' }, 'my-export.json', 'application/json');

    expect(createdLink.download).toBe('my-export.json');
  });

  it('revokes blob URL after download', () => {
    exportDataToFile({ test: 'data' }, 'test.json', 'application/json');

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('handles error gracefully', () => {
    mockCreateObjectURL.mockImplementation(() => {
      throw new Error('Blob error');
    });

    expect(() =>
      exportDataToFile({ test: 'data' }, 'test.json', 'application/json'),
    ).not.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe('importDataFromFile', () => {
  let mockFileReaderInstance: {
    readAsText: ReturnType<typeof vi.fn>;
    onload: ((event: ProgressEvent<FileReader>) => void) | null;
    onerror: (() => void) | null;
    result: string | null;
  };

  class MockFileReader {
    readAsText = vi.fn();
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onerror: (() => void) | null = null;
    result: string | null = null;

    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- Required for mock setup
      mockFileReaderInstance = this;
    }
  }

  beforeEach(() => {
    vi.stubGlobal('FileReader', MockFileReader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onSuccess with parsed data for valid file', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const validData = [
      {
        timestamp: Date.now(),
        url: '/test',
        cls: 0.1,
        lcp: 2000,
        fid: 100,
        fcp: 1500,
        ttfb: 600,
      },
    ];

    const file = new File([''], 'test.json');
    importDataFromFile(file, onSuccess, onError);

    mockFileReaderInstance.result = JSON.stringify(validData);
    mockFileReaderInstance.onload?.({
      target: mockFileReaderInstance,
    } as unknown as ProgressEvent<FileReader>);

    expect(onSuccess).toHaveBeenCalledWith(validData);
  });

  it('calls onError for invalid JSON', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const file = new File([''], 'test.json');
    importDataFromFile(file, onSuccess, onError);

    mockFileReaderInstance.result = 'invalid-json';
    mockFileReaderInstance.onload?.({
      target: mockFileReaderInstance,
    } as unknown as ProgressEvent<FileReader>);

    expect(onError).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls onError for invalid data format', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const file = new File([''], 'test.json');
    importDataFromFile(file, onSuccess, onError);

    mockFileReaderInstance.result = JSON.stringify({ invalid: true });
    mockFileReaderInstance.onload?.({
      target: mockFileReaderInstance,
    } as unknown as ProgressEvent<FileReader>);

    expect(onError).toHaveBeenCalledWith(new Error('Invalid file format'));
  });

  it('calls onError on file read error', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const file = new File([''], 'test.json');
    importDataFromFile(file, onSuccess, onError);

    mockFileReaderInstance.onerror?.();

    expect(onError).toHaveBeenCalledWith(new Error('Failed to read file'));
  });
});

describe('getStorageUsage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns zero usage when no data stored', () => {
    const usage = getStorageUsage();

    expect(usage.used).toBe(0);
    expect(usage.percentage).toBe(0);
  });

  it('calculates used space from stored data', () => {
    const data = JSON.stringify([createMockReport()]);
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(data);

    const usage = getStorageUsage();

    expect(usage.used).toBeGreaterThan(0);
  });

  it('calculates available space', () => {
    const usage = getStorageUsage();

    expect(usage.available).toBeGreaterThan(0);
  });

  it('handles storage error', () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error('Storage error');
      },
    );

    const usage = getStorageUsage();

    expect(usage.used).toBe(0);
    expect(usage.available).toBe(0);
    expect(usage.percentage).toBe(0);
  });
});

describe('compressHistoricalData', () => {
  it('returns all reports when count is 10 or less', () => {
    const reports = Array.from({ length: 10 }, () => createMockReport());

    const compressed = compressHistoricalData(reports);

    expect(compressed.length).toBe(10);
  });

  it('compresses reports by default ratio', () => {
    const reports = Array.from({ length: 100 }, () => createMockReport());

    const compressed = compressHistoricalData(reports);

    expect(compressed.length).toBeLessThan(100);
    expect(compressed.length).toBeCloseTo(50, -1);
  });

  it('uses custom compression ratio', () => {
    const reports = Array.from({ length: 100 }, () => createMockReport());

    const compressed = compressHistoricalData(reports, 0.25);

    expect(compressed.length).toBeCloseTo(25, -1);
  });

  it('handles empty array', () => {
    const compressed = compressHistoricalData([]);

    expect(compressed).toEqual([]);
  });

  it('preserves report integrity', () => {
    const reports = Array.from({ length: 20 }, (_, i) =>
      createMockReport({ pageUrl: `/page${i}` }),
    );

    const compressed = compressHistoricalData(reports);

    for (const report of compressed) {
      expect(report.pageUrl).toMatch(/^\/page\d+$/);
    }
  });
});
