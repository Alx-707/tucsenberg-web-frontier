import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_BASE_NUMBERS } from '@/constants/test-constants';
import { useReducedMotion } from '../use-reduced-motion';

// Mock matchMedia
const mockMatchMedia = vi.fn();

// Mock window object
Object.defineProperty(global, 'window', {
  writable: true,
  value: {
    matchMedia: mockMatchMedia,
  },
});

describe('useReducedMotion', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Ensure window.matchMedia is available
    global.window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false by default when reduced motion is not preferred', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    );
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('should return true when reduced motion is preferred', () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('should update when media query changes', () => {
    let changeHandler: ((_event: MediaQueryListEvent) => void) | null = null;

    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((_event, handler) => {
        if (_event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useReducedMotion());

    // Initial state
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);

    // Simulate another change
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: false } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(false);
  });

  it('should clean up event listener on unmount', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { unmount } = renderHook(() => useReducedMotion());

    expect(mockMediaQuery.addEventListener).toHaveBeenCalled();

    unmount();

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('should handle server-side rendering gracefully', () => {
    // Mock matchMedia to return null (SSR behavior)
    const originalMatchMedia = global.window.matchMedia;
    global.window.matchMedia = vi.fn(() => null as any);

    const { result } = renderHook(() => useReducedMotion());

    // Should default to false in SSR
    expect(result.current).toBe(false);

    // Restore original matchMedia
    global.window.matchMedia = originalMatchMedia;
  });

  it('should handle missing matchMedia gracefully', () => {
    // Store original matchMedia
    const originalMatchMedia = global.window.matchMedia;

    // Mock window without matchMedia
    global.window.matchMedia = undefined as any;

    const { result } = renderHook(() => useReducedMotion());

    // Should default to false when matchMedia is not available
    expect(result.current).toBe(false);

    // Restore original matchMedia
    global.window.matchMedia = originalMatchMedia;
  });

  it('should handle multiple rapid changes correctly', () => {
    let changeHandler: ((_event: MediaQueryListEvent) => void) | null = null;

    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((_event, handler) => {
        if (_event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useReducedMotion());

    // Simulate rapid changes
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent);
        changeHandler({ matches: false } as MediaQueryListEvent);
        changeHandler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it('should maintain consistent state across re-renders', () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result, rerender } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);

    // Re-render the hook
    rerender();

    expect(result.current).toBe(true);
    // matchMedia is called in both useState initializer and useEffect
    expect(mockMatchMedia).toHaveBeenCalledTimes(TEST_BASE_NUMBERS.SMALL_COUNT);
  });

  it('should handle edge case where addEventListener is not available', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: undefined,
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    // Should not throw when addEventListener is not available
    expect(() => {
      renderHook(() => useReducedMotion());
    }).not.toThrow();
  });

  it('should handle edge case where removeEventListener is not available', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: undefined,
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { unmount } = renderHook(() => useReducedMotion());

    // Should not throw when unmounting
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
