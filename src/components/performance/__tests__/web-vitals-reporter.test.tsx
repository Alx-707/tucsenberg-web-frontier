/**
 * @vitest-environment jsdom
 * Tests for WebVitalsReporter component
 */
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebVitalsReporter } from '../web-vitals-reporter';

// Mock web-vitals module
const { mockOnCLS, mockOnFCP, mockOnLCP, mockOnTTFB, mockOnINP } = vi.hoisted(
  () => ({
    mockOnCLS: vi.fn(),
    mockOnFCP: vi.fn(),
    mockOnLCP: vi.fn(),
    mockOnTTFB: vi.fn(),
    mockOnINP: vi.fn(),
  }),
);

vi.mock('web-vitals', () => ({
  onCLS: mockOnCLS,
  onFCP: mockOnFCP,
  onLCP: mockOnLCP,
  onTTFB: mockOnTTFB,
  onINP: mockOnINP,
}));

// Mock logger
const mockLoggerWarn = vi.hoisted(() => vi.fn());
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
  },
}));

interface MockMetric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
}

function createMockMetric(overrides: Partial<MockMetric> = {}): MockMetric {
  return {
    name: 'LCP',
    value: 2000,
    rating: 'good',
    delta: 100,
    id: 'v1-1234567890',
    ...overrides,
  };
}

describe('WebVitalsReporter', () => {
  let mockVa: ReturnType<typeof vi.fn>;
  let mockSendBeacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.va (Vercel Analytics)
    mockVa = vi.fn();
    Object.defineProperty(window, 'va', {
      value: mockVa,
      writable: true,
      configurable: true,
    });

    // Mock navigator.sendBeacon
    mockSendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: mockSendBeacon,
      writable: true,
      configurable: true,
    });

    // Mock crypto
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (arr: Uint32Array) => {
          arr[0] = 0; // Always return 0 for deterministic testing
          return arr;
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('rendering', () => {
    it('renders null (no UI)', () => {
      const { container } = render(
        <WebVitalsReporter
          enabled
          debug
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('metric listeners', () => {
    it('registers all web vitals listeners when enabled', () => {
      render(
        <WebVitalsReporter
          enabled
          debug
        />,
      );

      expect(mockOnCLS).toHaveBeenCalled();
      expect(mockOnFCP).toHaveBeenCalled();
      expect(mockOnLCP).toHaveBeenCalled();
      expect(mockOnTTFB).toHaveBeenCalled();
      expect(mockOnINP).toHaveBeenCalled();
    });

    it('does not register listeners when disabled and not debug', () => {
      render(
        <WebVitalsReporter
          enabled={false}
          debug={false}
        />,
      );

      expect(mockOnCLS).not.toHaveBeenCalled();
      expect(mockOnFCP).not.toHaveBeenCalled();
      expect(mockOnLCP).not.toHaveBeenCalled();
      expect(mockOnTTFB).not.toHaveBeenCalled();
      expect(mockOnINP).not.toHaveBeenCalled();
    });

    it('registers listeners when only debug is true', () => {
      render(
        <WebVitalsReporter
          enabled={false}
          debug
        />,
      );

      expect(mockOnCLS).toHaveBeenCalled();
      expect(mockOnFCP).toHaveBeenCalled();
    });

    it('registers listeners when only enabled is true', () => {
      render(
        <WebVitalsReporter
          enabled
          debug={false}
        />,
      );

      expect(mockOnCLS).toHaveBeenCalled();
      expect(mockOnFCP).toHaveBeenCalled();
    });
  });

  describe('debug mode', () => {
    it('logs metrics to console in debug mode', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(
          createMockMetric({ name: 'LCP', value: 2000, rating: 'good' }),
        );
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        '[Web Vitals] metric reported',
        expect.objectContaining({
          name: 'LCP',
          rating: 'good',
        }),
      );
    });

    it('includes emoji based on rating', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ rating: 'good' }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ emoji: '✅' }),
      );
    });

    it('shows warning emoji for needs-improvement rating', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ rating: 'needs-improvement' }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ emoji: '⚠️' }),
      );
    });

    it('shows error emoji for poor rating', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ rating: 'poor' }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ emoji: '❌' }),
      );
    });

    it('shows default emoji for unknown rating', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ rating: 'unknown' }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ emoji: '📊' }),
      );
    });
  });

  describe('metric formatting', () => {
    it('formats CLS as decimal without unit', () => {
      mockOnCLS.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ name: 'CLS', value: 0.123 }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ value: '0.123' }),
      );
    });

    it('formats small time values in milliseconds', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ name: 'LCP', value: 500 }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ value: '500ms' }),
      );
    });

    it('formats large time values in seconds', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ name: 'LCP', value: 2500 }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ value: '2.50s' }),
      );
    });
  });

  describe('production mode', () => {
    it('sends metrics to Vercel Analytics when enabled', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      render(
        <WebVitalsReporter
          enabled
          debug={false}
        />,
      );

      expect(mockVa).toHaveBeenCalledWith('event', {
        name: 'web-vitals',
        data: expect.objectContaining({
          metric: 'LCP',
          value: 2000,
          rating: 'good',
        }),
      });
    });

    it('includes page path in analytics data', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      render(
        <WebVitalsReporter
          enabled
          debug={false}
        />,
      );

      expect(mockVa).toHaveBeenCalledWith(
        'event',
        expect.objectContaining({
          data: expect.objectContaining({
            path: '/',
          }),
        }),
      );
    });

    it('sends metrics to custom endpoint via sendBeacon', () => {
      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      render(
        <WebVitalsReporter
          enabled
          debug={false}
        />,
      );

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/analytics/web-vitals',
        expect.any(Blob),
      );
    });

    it('falls back to fetch when sendBeacon is unavailable', () => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        configurable: true,
      });

      const mockFetch = vi.fn(() => Promise.resolve());
      vi.stubGlobal('fetch', mockFetch);

      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      render(
        <WebVitalsReporter
          enabled
          debug={false}
        />,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics/web-vitals',
        expect.objectContaining({
          method: 'POST',
          keepalive: true,
        }),
      );

      vi.unstubAllGlobals();
    });
  });

  describe('sampling', () => {
    it('always collects when sampleRate is 1', () => {
      render(
        <WebVitalsReporter
          enabled
          sampleRate={1}
        />,
      );

      expect(mockOnCLS).toHaveBeenCalled();
    });

    it('never collects when sampleRate is 0', () => {
      render(
        <WebVitalsReporter
          enabled
          sampleRate={0}
        />,
      );

      expect(mockOnCLS).not.toHaveBeenCalled();
    });

    it('respects sampleRate with crypto random', () => {
      // Our mock always returns 0, which is below any positive threshold
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          getRandomValues: (arr: Uint32Array) => {
            arr[0] = 0;
            return arr;
          },
        },
        configurable: true,
      });

      render(
        <WebVitalsReporter
          enabled
          sampleRate={0.5}
        />,
      );

      expect(mockOnCLS).toHaveBeenCalled();
    });

    it('falls back to full collection when crypto unavailable', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
      });

      render(
        <WebVitalsReporter
          enabled
          sampleRate={0.1}
        />,
      );

      expect(mockOnCLS).toHaveBeenCalled();
    });
  });

  describe('all metric types', () => {
    it('handles CLS metric', () => {
      mockOnCLS.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ name: 'CLS', value: 0.1 }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'CLS' }),
      );
    });

    it('handles FCP metric', () => {
      mockOnFCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ name: 'FCP', value: 1500 }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'FCP' }),
      );
    });

    it('handles TTFB metric', () => {
      mockOnTTFB.mockImplementation(
        (callback: (metric: MockMetric) => void) => {
          callback(createMockMetric({ name: 'TTFB', value: 800 }));
        },
      );

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'TTFB' }),
      );
    });

    it('handles INP metric', () => {
      mockOnINP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric({ name: 'INP', value: 200 }));
      });

      render(<WebVitalsReporter debug />);

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'INP' }),
      );
    });
  });

  describe('error handling', () => {
    it('does not throw when sendBeacon fails', () => {
      mockSendBeacon.mockReturnValue(false);

      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      expect(() => {
        render(
          <WebVitalsReporter
            enabled
            debug={false}
          />,
        );
      }).not.toThrow();
    });

    it('handles fetch error gracefully', async () => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        configurable: true,
      });

      const mockFetch = vi.fn(() => Promise.reject(new Error('Network error')));
      vi.stubGlobal('fetch', mockFetch);

      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      expect(() => {
        render(
          <WebVitalsReporter
            enabled
            debug={false}
          />,
        );
      }).not.toThrow();

      vi.unstubAllGlobals();
    });

    it('does not crash when window.va is undefined', () => {
      Object.defineProperty(window, 'va', {
        value: undefined,
        configurable: true,
      });

      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      expect(() => {
        render(
          <WebVitalsReporter
            enabled
            debug={false}
          />,
        );
      }).not.toThrow();
    });
  });

  describe('default props', () => {
    it('defaults enabled based on NODE_ENV production', () => {
      vi.stubEnv('NODE_ENV', 'production');

      render(<WebVitalsReporter />);

      expect(mockOnCLS).toHaveBeenCalled();
    });

    it('defaults debug based on NODE_ENV development', () => {
      vi.stubEnv('NODE_ENV', 'development');

      mockOnLCP.mockImplementation((callback: (metric: MockMetric) => void) => {
        callback(createMockMetric());
      });

      render(<WebVitalsReporter />);

      expect(mockLoggerWarn).toHaveBeenCalled();
    });

    it('defaults sampleRate to 1.0', () => {
      // With sampleRate 1.0, should always collect
      render(<WebVitalsReporter enabled />);

      expect(mockOnCLS).toHaveBeenCalled();
    });
  });
});
