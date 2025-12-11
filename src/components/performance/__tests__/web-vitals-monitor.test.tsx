/**
 * @vitest-environment jsdom
 * Tests for WebVitalsMonitor component
 */
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebVitalsMonitor } from '../web-vitals-monitor';

// Mock dependencies
const mockSendReport = vi.hoisted(() => vi.fn());

vi.mock('@/lib/web-vitals-monitor', () => ({
  webVitalsMonitor: {
    sendReport: mockSendReport,
  },
}));

vi.mock('@/constants/performance-constants', () => ({
  MONITORING_INTERVALS: {
    REPORT_SEND: 300000, // 5 minutes
  },
}));

describe('WebVitalsMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders null (no UI)', () => {
      const { container } = render(<WebVitalsMonitor />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('initial report', () => {
    it('sends report on mount', () => {
      render(<WebVitalsMonitor />);
      expect(mockSendReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('periodic reports', () => {
    it('sends report every 5 minutes', async () => {
      render(<WebVitalsMonitor />);

      // Clear initial call
      mockSendReport.mockClear();

      // Advance by 5 minutes (300000ms)
      await act(async () => {
        vi.advanceTimersByTime(300000);
      });

      expect(mockSendReport).toHaveBeenCalledTimes(1);

      // Advance another 5 minutes
      await act(async () => {
        vi.advanceTimersByTime(300000);
      });

      expect(mockSendReport).toHaveBeenCalledTimes(2);
    });

    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = render(<WebVitalsMonitor />);
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('visibility change', () => {
    it('sends report when page becomes hidden', async () => {
      render(<WebVitalsMonitor />);

      // Clear initial call
      mockSendReport.mockClear();

      // Simulate visibility change to hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockSendReport).toHaveBeenCalled();
    });

    it('does not send report when page becomes visible', async () => {
      render(<WebVitalsMonitor />);

      // Clear initial call
      mockSendReport.mockClear();

      // Simulate visibility change to visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockSendReport).not.toHaveBeenCalled();
    });

    it('removes visibility listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<WebVitalsMonitor />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function),
      );
    });
  });

  describe('beforeunload', () => {
    it('sends report on beforeunload', async () => {
      render(<WebVitalsMonitor />);

      // Clear initial call
      mockSendReport.mockClear();

      await act(async () => {
        window.dispatchEvent(new Event('beforeunload'));
      });

      expect(mockSendReport).toHaveBeenCalled();
    });

    it('removes beforeunload listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<WebVitalsMonitor />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
      );
    });
  });

  describe('unmount behavior', () => {
    it('sends final report on unmount', () => {
      const { unmount } = render(<WebVitalsMonitor />);

      // Clear initial call
      mockSendReport.mockClear();

      unmount();

      expect(mockSendReport).toHaveBeenCalled();
    });
  });
});
