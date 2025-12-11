/**
 * @vitest-environment jsdom
 * Tests for ThemePerformanceMonitor and ThemePerformanceDashboard components
 */
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ThemePerformanceDashboard,
  ThemePerformanceMonitor,
} from '../theme-performance-monitor';

// Mock dependencies
const mockSendThemeReport = vi.hoisted(() => vi.fn());
const mockGetPerformanceSummary = vi.hoisted(() =>
  vi.fn(() => ({
    totalSwitches: 5,
    averageTime: 100,
    p95Time: 150,
  })),
);
const mockGetUsageStatistics = vi.hoisted(() =>
  vi.fn(() => ({
    lightUsage: 60,
    darkUsage: 40,
  })),
);
const mockLoggerInfo = vi.hoisted(() => vi.fn());

vi.mock('@/lib/theme-analytics', () => ({
  sendThemeReport: mockSendThemeReport,
  themeAnalytics: {
    getPerformanceSummary: mockGetPerformanceSummary,
    getUsageStatistics: mockGetUsageStatistics,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mockLoggerInfo,
  },
}));

vi.mock('@/constants', () => ({
  ANIMATION_DURATION_VERY_SLOW: 1000,
  COUNT_FIVE: 5,
  SECONDS_PER_MINUTE: 60,
  TEN_SECONDS_MS: 10000,
  ZERO: 0,
}));

describe('ThemePerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders null', () => {
      const { container } = render(<ThemePerformanceMonitor />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('initial report', () => {
    it('sends report on mount', () => {
      render(<ThemePerformanceMonitor />);
      expect(mockSendThemeReport).toHaveBeenCalled();
    });
  });

  describe('periodic reports', () => {
    it('sends report every 5 minutes', async () => {
      render(<ThemePerformanceMonitor />);

      // Clear initial call
      mockSendThemeReport.mockClear();

      // Advance by 5 minutes (5 * 60 * 1000 = 300000ms)
      await act(async () => {
        vi.advanceTimersByTime(300000);
      });

      expect(mockSendThemeReport).toHaveBeenCalledTimes(1);

      // Advance another 5 minutes
      await act(async () => {
        vi.advanceTimersByTime(300000);
      });

      expect(mockSendThemeReport).toHaveBeenCalledTimes(2);
    });

    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = render(<ThemePerformanceMonitor />);
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('visibility change', () => {
    it('sends report when page becomes hidden', async () => {
      render(<ThemePerformanceMonitor />);

      // Clear initial call
      mockSendThemeReport.mockClear();

      // Simulate visibility change to hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockSendThemeReport).toHaveBeenCalled();
    });

    it('does not send report when page becomes visible', async () => {
      render(<ThemePerformanceMonitor />);

      // Clear initial call
      mockSendThemeReport.mockClear();

      // Simulate visibility change to visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockSendThemeReport).not.toHaveBeenCalled();
    });

    it('removes visibility listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<ThemePerformanceMonitor />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function),
      );
    });
  });

  describe('beforeunload', () => {
    it('sends report on beforeunload', async () => {
      render(<ThemePerformanceMonitor />);

      // Clear initial call
      mockSendThemeReport.mockClear();

      await act(async () => {
        window.dispatchEvent(new Event('beforeunload'));
      });

      expect(mockSendThemeReport).toHaveBeenCalled();
    });

    it('removes beforeunload listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<ThemePerformanceMonitor />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
      );
    });
  });

  describe('unmount behavior', () => {
    it('sends final report on unmount', () => {
      const { unmount } = render(<ThemePerformanceMonitor />);

      // Clear initial call
      mockSendThemeReport.mockClear();

      unmount();

      expect(mockSendThemeReport).toHaveBeenCalled();
    });
  });
});

describe('ThemePerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('rendering', () => {
    it('renders null', () => {
      const { container } = render(<ThemePerformanceDashboard />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('development mode', () => {
    it('logs performance summary every 10 seconds when there are switches', async () => {
      render(<ThemePerformanceDashboard />);

      // Advance by 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockGetPerformanceSummary).toHaveBeenCalled();
      expect(mockGetUsageStatistics).toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Theme Performance Summary',
        expect.objectContaining({ summary: expect.any(Object) }),
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Theme Usage Statistics',
        expect.objectContaining({ usage: expect.any(Object) }),
      );
    });

    it('does not log when totalSwitches is 0', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        totalSwitches: 0,
        averageTime: 0,
        p95Time: 0,
      });

      render(<ThemePerformanceDashboard />);

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockGetPerformanceSummary).toHaveBeenCalled();
      expect(mockLoggerInfo).not.toHaveBeenCalled();
    });

    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = render(<ThemePerformanceDashboard />);
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('production mode', () => {
    it('does not set up interval in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      render(<ThemePerformanceDashboard />);

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockGetPerformanceSummary).not.toHaveBeenCalled();
      expect(mockLoggerInfo).not.toHaveBeenCalled();
    });
  });
});
