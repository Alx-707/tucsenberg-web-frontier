/**
 * @vitest-environment jsdom
 * Tests for LazyToaster component
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LazyToaster } from '../lazy-toaster';

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: vi.fn((_fn: () => Promise<unknown>) => {
    const Component = () => <div data-testid='toaster'>Toaster Component</div>;
    Component.displayName = 'DynamicToaster';
    return Component;
  }),
}));

describe('LazyToaster', () => {
  let mockRequestIdleCallback: ReturnType<typeof vi.fn>;
  let mockCancelIdleCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock requestIdleCallback
    mockRequestIdleCallback = vi.fn(
      (cb: IdleRequestCallback, options?: IdleRequestOptions) => {
        const timeout = options?.timeout ?? 0;
        const id = setTimeout(
          () => cb({ didTimeout: false, timeRemaining: () => 50 }),
          timeout,
        );
        return id as unknown as number;
      },
    );
    mockCancelIdleCallback = vi.fn((id: number) => {
      clearTimeout(id);
    });

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
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders null initially', () => {
      const { container } = render(<LazyToaster />);

      expect(container.firstChild).toBeNull();
    });

    it('renders Toaster after requestIdleCallback fires', async () => {
      render(<LazyToaster />);

      // Initially not rendered
      expect(screen.queryByTestId('toaster')).not.toBeInTheDocument();

      // Fire idle callback (2000ms timeout)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });

  describe('requestIdleCallback behavior', () => {
    it('registers requestIdleCallback with 2000ms timeout', () => {
      render(<LazyToaster />);

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 2000 },
      );
    });

    it('cleans up on unmount', () => {
      const { unmount } = render(<LazyToaster />);

      unmount();

      expect(mockCancelIdleCallback).toHaveBeenCalled();
    });
  });

  describe('fallback behavior', () => {
    it('uses setTimeout fallback when requestIdleCallback unavailable', async () => {
      // Remove requestIdleCallback from window completely
      // @ts-expect-error - intentionally deleting for test
      delete (window as Record<string, unknown>).requestIdleCallback;

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      render(<LazyToaster />);

      // Should use setTimeout with 1000ms
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      // Advance timer
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('cleans up setTimeout on unmount', () => {
      // Remove requestIdleCallback from window completely
      // @ts-expect-error - intentionally deleting for test
      delete (window as Record<string, unknown>).requestIdleCallback;

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(<LazyToaster />);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
