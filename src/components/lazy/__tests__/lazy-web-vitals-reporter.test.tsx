/**
 * @vitest-environment jsdom
 * Tests for LazyWebVitalsReporter component
 */
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LazyWebVitalsReporter } from '../lazy-web-vitals-reporter';

// Mock logger
const mockLoggerError = vi.hoisted(() => vi.fn());
vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

// Mock the web-vitals-reporter module
const mockWebVitalsReporter = vi.hoisted(() =>
  vi.fn(({ enabled, debug, sampleRate }) => (
    <div
      data-testid='web-vitals-reporter'
      data-enabled={enabled}
      data-debug={debug}
      data-sample-rate={sampleRate}
    >
      Web Vitals Reporter
    </div>
  )),
);

vi.mock('@/components/performance/web-vitals-reporter', () => ({
  WebVitalsReporter: mockWebVitalsReporter,
}));

describe('LazyWebVitalsReporter', () => {
  let mockRequestIdleCallback: ReturnType<typeof vi.fn>;
  let mockCancelIdleCallback: ReturnType<typeof vi.fn>;
  let idleCallbacks: (() => void)[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    idleCallbacks = [];

    // Mock requestIdleCallback to capture callbacks
    mockRequestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
      const wrappedCb = () =>
        cb({ didTimeout: false, timeRemaining: () => 50 });
      idleCallbacks.push(wrappedCb);
      return idleCallbacks.length;
    });
    mockCancelIdleCallback = vi.fn();

    // Set on window
    Object.defineProperty(window, 'requestIdleCallback', {
      value: mockRequestIdleCallback,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'cancelIdleCallback', {
      value: mockCancelIdleCallback,
      writable: true,
      configurable: true,
    });

    // Set on global for direct usage
    vi.stubGlobal('requestIdleCallback', mockRequestIdleCallback);
    vi.stubGlobal('cancelIdleCallback', mockCancelIdleCallback);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Helper to trigger idle callback and wait for async import (kept for potential future use)
  async function _triggerIdleAndWait() {
    // Execute any pending idle callbacks
    await act(async () => {
      for (const cb of idleCallbacks) {
        cb();
      }
    });

    // Allow async import to resolve - need multiple cycles
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  describe('rendering', () => {
    it('renders null initially before dynamic import completes', () => {
      const { container } = render(<LazyWebVitalsReporter />);
      // Before idle callback triggers, nothing is rendered
      expect(container.firstChild).toBeNull();
    });
  });

  describe('props interface', () => {
    it('accepts enabled prop', () => {
      expect(() => render(<LazyWebVitalsReporter enabled />)).not.toThrow();
    });

    it('accepts debug prop', () => {
      expect(() => render(<LazyWebVitalsReporter debug />)).not.toThrow();
    });

    it('accepts sampleRate prop', () => {
      expect(() =>
        render(<LazyWebVitalsReporter sampleRate={0.5} />),
      ).not.toThrow();
    });

    it('uses default props when none provided', () => {
      expect(() => render(<LazyWebVitalsReporter />)).not.toThrow();
    });
  });

  describe('requestIdleCallback behavior', () => {
    it('registers requestIdleCallback with 2000ms timeout', () => {
      render(<LazyWebVitalsReporter />);

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 2000 },
      );
    });

    it('cleans up on unmount', () => {
      const { unmount } = render(<LazyWebVitalsReporter />);
      unmount();
      expect(mockCancelIdleCallback).toHaveBeenCalled();
    });
  });

  describe('fallback behavior', () => {
    it('uses setTimeout fallback when requestIdleCallback unavailable', async () => {
      // Remove requestIdleCallback from window completely
      vi.unstubAllGlobals();
      // @ts-expect-error - intentionally deleting for test
      delete (window as Record<string, unknown>).requestIdleCallback;

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      render(<LazyWebVitalsReporter enabled />);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('cleans up setTimeout on unmount', () => {
      // Remove requestIdleCallback from window completely
      vi.unstubAllGlobals();
      // @ts-expect-error - intentionally deleting for test
      delete (window as Record<string, unknown>).requestIdleCallback;

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(<LazyWebVitalsReporter />);
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('debug dependency', () => {
    it('recreates effect when debug changes', () => {
      const { rerender } = render(<LazyWebVitalsReporter debug={false} />);

      // First render registers callback
      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);

      // Rerender with same debug - no additional callback
      rerender(<LazyWebVitalsReporter debug={false} />);
      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);

      // Rerender with different debug - new callback
      rerender(<LazyWebVitalsReporter debug={true} />);
      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(2);
    });
  });
});
