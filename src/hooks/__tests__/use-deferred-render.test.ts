/**
 * @vitest-environment jsdom
 * Tests for use-deferred-render hooks
 */
import { type RefObject } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useDeferredBackground,
  useDeferredContent,
} from '../use-deferred-render';

// Mock idle-callback
const { mockRequestIdleCallback } = vi.hoisted(() => ({
  mockRequestIdleCallback: vi.fn(),
}));

vi.mock('@/lib/idle-callback', () => ({
  requestIdleCallback: mockRequestIdleCallback,
}));

describe('useDeferredBackground', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestIdleCallback.mockImplementation((callback) => {
      const timeoutId = setTimeout(callback, 0);
      return () => clearTimeout(timeoutId);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic rendering', () => {
    it('returns false initially', () => {
      const { result } = renderHook(() => useDeferredBackground());

      expect(result.current).toBe(false);
    });

    it('returns true after idle callback executes', async () => {
      const { result } = renderHook(() => useDeferredBackground());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current).toBe(true);
    });

    it('calls requestIdleCallback with default timeout', () => {
      renderHook(() => useDeferredBackground());

      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);
      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        {
          timeout: 1200,
        },
      );
    });
  });

  describe('custom timeout', () => {
    it('uses custom timeout when provided', () => {
      renderHook(() => useDeferredBackground({ timeout: 2000 }));

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        {
          timeout: 2000,
        },
      );
    });

    it('uses default timeout when not provided', () => {
      renderHook(() => useDeferredBackground({}));

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        {
          timeout: 1200,
        },
      );
    });
  });

  describe('cleanup', () => {
    it('calls cleanup function on unmount', () => {
      const cleanupFn = vi.fn();
      mockRequestIdleCallback.mockReturnValue(cleanupFn);

      const { unmount } = renderHook(() => useDeferredBackground());

      unmount();

      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('re-render behavior', () => {
    it('re-registers callback when timeout changes', () => {
      const { rerender } = renderHook(
        ({ timeout }: { timeout: number }) =>
          useDeferredBackground({ timeout }),
        { initialProps: { timeout: 1000 } },
      );

      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);

      rerender({ timeout: 2000 });

      expect(mockRequestIdleCallback).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useDeferredContent', () => {
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  class MockIntersectionObserver {
    constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
      observerCallback = callback;
    }

    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
    root = null;
    rootMargin = '';
    thresholds = [];
  }

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    mockRequestIdleCallback.mockImplementation((callback) => {
      const timeoutId = setTimeout(callback, 100);
      return () => clearTimeout(timeoutId);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('basic rendering', () => {
    it('returns false initially', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      expect(result.current).toBe(false);
    });

    it('creates IntersectionObserver when element exists', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      renderHook(() => useDeferredContent(elementRef));

      expect(mockObserve).toHaveBeenCalledWith(elementRef.current);
    });

    it('does not create IntersectionObserver when element is null', () => {
      const elementRef = { current: null } as RefObject<HTMLElement | null>;
      renderHook(() => useDeferredContent(elementRef));

      expect(mockObserve).not.toHaveBeenCalled();
    });
  });

  describe('intersection behavior', () => {
    it('returns true when element intersects', async () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      act(() => {
        observerCallback([
          { isIntersecting: true } as IntersectionObserverEntry,
        ]);
      });

      expect(result.current).toBe(true);
    });

    it('disconnects observer after intersection', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      renderHook(() => useDeferredContent(elementRef));

      act(() => {
        observerCallback([
          { isIntersecting: true } as IntersectionObserverEntry,
        ]);
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('does not trigger when entry is not intersecting', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      act(() => {
        observerCallback([
          { isIntersecting: false } as IntersectionObserverEntry,
        ]);
      });

      expect(result.current).toBe(false);
    });

    it('only triggers once even with multiple intersection callbacks', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      act(() => {
        observerCallback([
          { isIntersecting: true } as IntersectionObserverEntry,
        ]);
      });

      expect(result.current).toBe(true);

      act(() => {
        observerCallback([
          { isIntersecting: true } as IntersectionObserverEntry,
        ]);
      });

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('idle callback fallback', () => {
    it('triggers content via idle callback if not intersected', async () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current).toBe(true);
    });

    it('does not re-trigger via idle callback if already intersected', async () => {
      const idleCallbacks: (() => void)[] = [];
      mockRequestIdleCallback.mockImplementation((callback) => {
        idleCallbacks.push(callback);
        return () => {
          // cleanup
        };
      });

      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      act(() => {
        observerCallback([
          { isIntersecting: true } as IntersectionObserverEntry,
        ]);
      });

      expect(result.current).toBe(true);

      act(() => {
        for (const cb of idleCallbacks) {
          cb();
        }
      });

      expect(result.current).toBe(true);
    });
  });

  describe('custom options', () => {
    it('accepts custom rootMargin option', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;

      expect(() =>
        renderHook(() =>
          useDeferredContent(elementRef, { rootMargin: '100px' }),
        ),
      ).not.toThrow();

      expect(mockObserve).toHaveBeenCalled();
    });

    it('accepts default rootMargin when not provided', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;

      expect(() =>
        renderHook(() => useDeferredContent(elementRef)),
      ).not.toThrow();

      expect(mockObserve).toHaveBeenCalled();
    });

    it('passes custom timeout to idle callback', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      renderHook(() => useDeferredContent(elementRef, { timeout: 500 }));

      expect(mockRequestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        {
          timeout: 500,
        },
      );
    });
  });

  describe('cleanup', () => {
    it('calls cleanup function on unmount', () => {
      const cleanupFn = vi.fn();
      mockRequestIdleCallback.mockReturnValue(cleanupFn);

      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { unmount } = renderHook(() => useDeferredContent(elementRef));

      unmount();

      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles IntersectionObserver not defined', () => {
      vi.stubGlobal('IntersectionObserver', undefined);

      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      expect(result.current).toBe(false);
    });

    it('handles multiple entries with first intersecting', () => {
      const elementRef = {
        current: document.createElement('div'),
      } as RefObject<HTMLElement>;
      const { result } = renderHook(() => useDeferredContent(elementRef));

      act(() => {
        observerCallback([
          { isIntersecting: false } as IntersectionObserverEntry,
          { isIntersecting: true } as IntersectionObserverEntry,
          { isIntersecting: false } as IntersectionObserverEntry,
        ]);
      });

      expect(result.current).toBe(true);
    });
  });
});
