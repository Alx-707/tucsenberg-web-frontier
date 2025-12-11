/**
 * @vitest-environment jsdom
 * Tests for WebVitalsIndicator component
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebVitalsIndicator } from '../web-vitals-indicator';

// Mock dependencies using vi.hoisted
const {
  mockRegisterTool,
  mockUnregisterTool,
  mockGetClasses,
  mockGetZIndex,
  mockGetPerformanceSummary,
  mockSendReport,
} = vi.hoisted(() => ({
  mockRegisterTool: vi.fn(),
  mockUnregisterTool: vi.fn(),
  mockGetClasses: vi.fn(() => 'fixed bottom-4 right-4'),
  mockGetZIndex: vi.fn(() => 9999),
  mockGetPerformanceSummary: vi.fn(),
  mockSendReport: vi.fn(),
}));

vi.mock('@/lib/dev-tools-positioning', () => ({
  useDevToolsLayout: vi.fn(() => ({
    registerTool: mockRegisterTool,
    unregisterTool: mockUnregisterTool,
    getClasses: mockGetClasses,
    getZIndex: mockGetZIndex,
  })),
}));

vi.mock('@/lib/web-vitals-monitor', () => ({
  webVitalsMonitor: {
    getPerformanceSummary: mockGetPerformanceSummary,
    sendReport: mockSendReport,
  },
}));

vi.mock('@/constants/performance-constants', () => ({
  MONITORING_INTERVALS: {
    METRICS_UPDATE: 3000,
    REPORT_SEND: 300000,
  },
  WEB_VITALS_THRESHOLDS: {
    CLS: { GOOD: 0.1, POOR: 0.25 },
    FID: { GOOD: 100, POOR: 300 },
    LCP: { GOOD: 2500, POOR: 4000 },
    FCP: { GOOD: 1800, POOR: 3000 },
    TTFB: { GOOD: 800, POOR: 1800 },
  },
}));

function createMockMetrics(
  overrides: Partial<{
    cls: number;
    fid: number;
    lcp: number;
    fcp: number;
    ttfb: number;
  }> = {},
) {
  return {
    cls: 0.05,
    fid: 80,
    lcp: 2000,
    fcp: 1500,
    ttfb: 600,
    ...overrides,
  };
}

describe('WebVitalsIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set development environment
    vi.stubEnv('NODE_ENV', 'development');

    // Default mock returns
    mockGetPerformanceSummary.mockReturnValue({
      metrics: createMockMetrics(),
      score: 85,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('visibility', () => {
    it('renders in development environment with metrics', async () => {
      render(<WebVitalsIndicator />);

      // Advance timer to trigger first interval
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText('🚀 Web Vitals')).toBeInTheDocument();
    });

    it('does not render in production environment', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByText('🚀 Web Vitals')).not.toBeInTheDocument();
    });

    it('does not render when no metrics available', () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: null,
        score: 0,
      });

      render(<WebVitalsIndicator />);

      expect(screen.queryByText('🚀 Web Vitals')).not.toBeInTheDocument();
    });
  });

  describe('metrics display', () => {
    it('displays CLS metric', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ cls: 0.05 }),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText('CLS:')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays FID metric with ms unit', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ fid: 80 }),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText('FID:')).toBeInTheDocument();
      expect(screen.getByText('80ms')).toBeInTheDocument();
    });

    it('displays LCP metric with ms unit', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ lcp: 2000 }),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText('LCP:')).toBeInTheDocument();
      expect(screen.getByText('2000ms')).toBeInTheDocument();
    });

    it('displays FCP metric', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ fcp: 1500 }),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText('FCP:')).toBeInTheDocument();
      expect(screen.getByText('1500ms')).toBeInTheDocument();
    });

    it('displays TTFB metric', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ ttfb: 600 }),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText('TTFB:')).toBeInTheDocument();
      expect(screen.getByText('600ms')).toBeInTheDocument();
    });

    it('displays performance score', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics(),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText('Score:')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    it('does not display undefined metrics', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: { ...createMockMetrics(), fid: undefined },
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // FID row should not be rendered when value is undefined
      const fidLabels = screen.queryAllByText('FID:');
      expect(fidLabels.length).toBe(0);
    });
  });

  describe('metric colors', () => {
    it('shows green for good metrics', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ lcp: 2000 }), // Good: <= 2500
        score: 90,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      const lcpValue = screen.getByText('2000ms');
      expect(lcpValue).toHaveClass('text-green-600');
    });

    it('shows yellow for moderate metrics', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ lcp: 3000 }), // Moderate: > 2500, <= 4000
        score: 70,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      const lcpValue = screen.getByText('3000ms');
      expect(lcpValue).toHaveClass('text-yellow-600');
    });

    it('shows red for poor metrics', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics({ lcp: 5000 }), // Poor: > 4000
        score: 50,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      const lcpValue = screen.getByText('5000ms');
      expect(lcpValue).toHaveClass('text-red-600');
    });
  });

  describe('tool registration', () => {
    it('registers tool on mount in development', () => {
      render(<WebVitalsIndicator />);

      expect(mockRegisterTool).toHaveBeenCalledWith('webVitalsIndicator');
    });

    it('unregisters tool on unmount', () => {
      const { unmount } = render(<WebVitalsIndicator />);

      unmount();

      expect(mockUnregisterTool).toHaveBeenCalledWith('webVitalsIndicator');
    });
  });

  describe('performance monitoring', () => {
    it('sends initial report on mount', () => {
      render(<WebVitalsIndicator />);

      expect(mockSendReport).toHaveBeenCalled();
    });

    it('updates metrics periodically', async () => {
      render(<WebVitalsIndicator />);

      // Clear initial calls
      mockGetPerformanceSummary.mockClear();

      // Advance by update interval (3000ms)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockGetPerformanceSummary).toHaveBeenCalled();
    });

    it('sends report periodically', async () => {
      render(<WebVitalsIndicator />);

      mockSendReport.mockClear();

      // Advance by report interval (300000ms = 5 minutes)
      await act(async () => {
        vi.advanceTimersByTime(300000);
      });

      expect(mockSendReport).toHaveBeenCalled();
    });

    it('sends report on visibility change to hidden', async () => {
      render(<WebVitalsIndicator />);

      mockSendReport.mockClear();

      // Simulate visibility change
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockSendReport).toHaveBeenCalled();
    });

    it('sends report on unmount', () => {
      const { unmount } = render(<WebVitalsIndicator />);

      mockSendReport.mockClear();
      unmount();

      expect(mockSendReport).toHaveBeenCalled();
    });
  });

  describe('dragging functionality', () => {
    it('applies transform style based on position', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics(),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      const indicator = screen
        .getByText('🚀 Web Vitals')
        .closest('div')?.parentElement;
      expect(indicator).toHaveStyle({ transform: 'translate(0px, 0px)' });
    });

    it('has drag-handle class on title', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics(),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      const dragHandle = screen.getByText('🚀 Web Vitals');
      expect(dragHandle).toHaveClass('drag-handle');
    });
  });

  describe('info text', () => {
    it('displays development-only notice', async () => {
      mockGetPerformanceSummary.mockReturnValue({
        metrics: createMockMetrics(),
        score: 85,
      });

      render(<WebVitalsIndicator />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Dev only/)).toBeInTheDocument();
      expect(screen.getByText(/Updates every 3s/)).toBeInTheDocument();
    });
  });
});
