import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TEST_APP_CONSTANTS,
  TEST_COUNT_CONSTANTS,
  TEST_WEB_VITALS_DIAGNOSTICS,
} from '@/constants/test-constants';
import { useWebVitalsDiagnostics } from '../use-web-vitals-diagnostics';

// Mock enhanced-web-vitals
vi.mock('@/lib/enhanced-web-vitals', () => ({
  enhancedWebVitalsCollector: {
    generateDiagnosticReport: vi.fn(),
    getMetrics: vi.fn(),
    reset: vi.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock console.warn
const mockConsoleWarn = vi.fn();
Object.defineProperty(global, 'console', {
  value: {
    ...console,
    warn: mockConsoleWarn,
  },
  writable: true,
});

describe('useWebVitalsDiagnostics', () => {
  const mockDiagnosticReport = {
    metrics: {
      cls: TEST_WEB_VITALS_DIAGNOSTICS.CLS_BASELINE,
      lcp: TEST_WEB_VITALS_DIAGNOSTICS.LCP_BASELINE,
      fid: TEST_WEB_VITALS_DIAGNOSTICS.FID_BASELINE,
      inp: TEST_WEB_VITALS_DIAGNOSTICS.INP_BASELINE,
      ttfb: TEST_WEB_VITALS_DIAGNOSTICS.TTFB_BASELINE,
      fcp: TEST_WEB_VITALS_DIAGNOSTICS.FCP_BASELINE,
      connection: {
        effectiveType: '4g',
        downlink: TEST_WEB_VITALS_DIAGNOSTICS.NETWORK_DOWNLINK,
        rtt: TEST_WEB_VITALS_DIAGNOSTICS.NETWORK_RTT,
        saveData: false,
      },
      deviceInfo: {
        memory: TEST_WEB_VITALS_DIAGNOSTICS.DEVICE_MEMORY,
        cores: 4,
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
      },
      slowResources: [],
    },
    analysis: {
      issues: ['LCP could be improved'],
      recommendations: ['Optimize images', 'Use CDN'],
      score: TEST_WEB_VITALS_DIAGNOSTICS.PERFORMANCE_SCORE,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup mock for enhanced-web-vitals
    const { enhancedWebVitalsCollector } = (await vi.importMock(
      '@/lib/enhanced-web-vitals',
    )) as any;
    vi.mocked(
      enhancedWebVitalsCollector.generateDiagnosticReport,
    ).mockReturnValue(mockDiagnosticReport);

    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.currentReport).toBe(null);
      expect(result.current.historicalReports).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      expect(typeof result.current.refreshDiagnostics).toBe('function');
      expect(typeof result.current.getPerformanceTrends).toBe('function');
      expect(typeof result.current.exportReport).toBe('function');
      expect(typeof result.current.getPageComparison).toBe('function');
      expect(typeof result.current.clearHistory).toBe('function');
    });

    it('should load historical data from localStorage on mount', async () => {
      const historicalData = [
        { ...mockDiagnosticReport, timestamp: Date.now() - 1000 },
        {
          ...mockDiagnosticReport,
          timestamp:
            Date.now() - TEST_WEB_VITALS_DIAGNOSTICS.HISTORICAL_TIME_OFFSET,
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(historicalData));

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        await result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.historicalReports.length).toBeGreaterThan(0);
    });
  });

  describe('refreshDiagnostics', () => {
    it('should generate new diagnostic report', async () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      // Verify the mock was called (we can't directly access it here, so just check the result)
      expect(result.current.currentReport).toBeTruthy();
      expect(result.current.currentReport).toBeTruthy();
      expect(result.current.currentReport?.metrics.cls).toBe(
        TEST_WEB_VITALS_DIAGNOSTICS.CLS_BASELINE,
      );
      expect(result.current.isLoading).toBe(false);
    });

    it('should save report to localStorage', async () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'webVitalsDiagnostics',
        expect.stringContaining('"metrics"'),
      );
    });

    it('should handle errors during report generation', async () => {
      const { enhancedWebVitalsCollector } = (await vi.importMock(
        '@/lib/enhanced-web-vitals',
      )) as any;
      vi.mocked(
        enhancedWebVitalsCollector.generateDiagnosticReport,
      ).mockImplementation(() => {
        throw new Error('Report generation failed');
      });

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      expect(result.current.error).toBe('Report generation failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle unknown errors', async () => {
      const { enhancedWebVitalsCollector } = (await vi.importMock(
        '@/lib/enhanced-web-vitals',
      )) as any;
      vi.mocked(
        enhancedWebVitalsCollector.generateDiagnosticReport,
      ).mockImplementation(() => {
        throw new Error('String error');
      });

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      expect(result.current.error).toBe('Unknown error');
    });
  });

  describe('localStorage operations', () => {
    it('should handle localStorage read errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      // Should not throw and should warn
      expect(() => result.current).not.toThrow();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to load historical diagnostics data:',
        expect.any(Error),
      );
    });

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      expect(() => result.current).not.toThrow();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to load historical diagnostics data:',
        expect.any(Error),
      );
    });

    it('should handle non-array data in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('{"not": "array"}');

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      // Should still work with empty array as fallback
      expect(result.current.historicalReports.length).toBe(1);
    });

    it('should handle localStorage write errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to save diagnostics data:',
        expect.any(Error),
      );
      // Should still update state even if save fails
      expect(result.current.currentReport).toBeTruthy();
    });

    it('should limit stored reports to 50', async () => {
      // Create 60 historical reports
      const manyReports = Array.from({ length: 60 }, (_, i) => ({
        ...mockDiagnosticReport,
        timestamp: Date.now() - i * 1000,
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(manyReports));

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      // Check that setItem was called with limited data
      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      expect(setItemCalls.length).toBeGreaterThan(0);
      const savedData = JSON.parse(setItemCalls[0]![1] as string);
      expect(savedData.length).toBeLessThanOrEqual(
        TEST_APP_CONSTANTS.PERCENTAGE_HALF,
      );
    });
  });

  describe('performance trends analysis', () => {
    it('should return null when insufficient data', () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      const trends = result.current.getPerformanceTrends();
      expect(trends).toBe(null);
    });

    it('should calculate performance trends with sufficient data', async () => {
      // Create historical data with varying metrics
      const historicalData = Array.from({ length: 25 }, (_, i) => ({
        ...mockDiagnosticReport,
        metrics: {
          ...mockDiagnosticReport.metrics,
          cls:
            TEST_WEB_VITALS_DIAGNOSTICS.CLS_BASELINE +
            i * TEST_WEB_VITALS_DIAGNOSTICS.CLS_INCREMENT,
          lcp:
            TEST_WEB_VITALS_DIAGNOSTICS.LCP_BASELINE +
            i * TEST_WEB_VITALS_DIAGNOSTICS.LCP_INCREMENT,
          fid:
            TEST_WEB_VITALS_DIAGNOSTICS.FID_BASELINE +
            i * TEST_WEB_VITALS_DIAGNOSTICS.FID_INCREMENT,
        },
        analysis: {
          ...mockDiagnosticReport.analysis,
          score: TEST_WEB_VITALS_DIAGNOSTICS.PERFORMANCE_SCORE - i,
        },
        timestamp: Date.now() - i * 1000,
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(historicalData));

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      const trends = result.current.getPerformanceTrends();

      expect(trends).toBeTruthy();
      expect(trends?.cls).toBeDefined();
      expect(trends?.lcp).toBeDefined();
      expect(trends?.fid).toBeDefined();
      expect(trends?.score).toBeDefined();
    });

    it('should handle empty metrics in trend calculation', async () => {
      const historicalData = Array.from({ length: 25 }, (_, i) => ({
        ...mockDiagnosticReport,
        metrics: {
          ...mockDiagnosticReport.metrics,
          cls: 0, // Zero values should be filtered out
          lcp:
            i % TEST_COUNT_CONSTANTS.SMALL === 0
              ? TEST_WEB_VITALS_DIAGNOSTICS.LCP_BASELINE
              : 0,
          fid: 0,
        },
        timestamp: Date.now() - i * 1000,
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(historicalData));

      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      const trends = result.current.getPerformanceTrends();
      expect(trends).toBeTruthy();
      // Should handle zero values gracefully
      expect(trends?.cls.current).toBe(0);
      expect(trends?.fid.current).toBe(0);
    });
  });

  describe('data export', () => {
    it('should call exportReport function', async () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      expect(() => {
        result.current.exportReport('json');
      }).not.toThrow();
    });

    it('should handle export with empty state', () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      expect(() => {
        result.current.exportReport('json');
      }).not.toThrow();
    });
  });

  describe('clear history', () => {
    it('should clear historical data', async () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      // First add some data
      await act(async () => {
        const promise = result.current.refreshDiagnostics();
        vi.advanceTimersByTime(1000);
        await promise;
      });

      expect(result.current.historicalReports.length).toBeGreaterThan(0);

      // Then clear it
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.historicalReports).toEqual([]);
      expect(result.current.currentReport).toBe(null);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'webVitalsDiagnostics',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid refresh calls', async () => {
      const { result } = renderHook(() => useWebVitalsDiagnostics());

      await act(async () => {
        const promises = [
          result.current.refreshDiagnostics(),
          result.current.refreshDiagnostics(),
          result.current.refreshDiagnostics(),
        ];

        vi.advanceTimersByTime(1000);
        await Promise.all(promises);
      });

      // Should handle concurrent calls gracefully
      expect(result.current.currentReport).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle component unmounting during async operation', () => {
      const { result, unmount } = renderHook(() => useWebVitalsDiagnostics());

      act(() => {
        result.current.refreshDiagnostics();
      });

      // Unmount before async operation completes
      unmount();

      // Should not cause errors
      vi.advanceTimersByTime(1000);

      // No assertions needed - just ensuring no errors are thrown
    });
  });
});
