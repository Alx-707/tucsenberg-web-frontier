import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEnhancedTheme } from '../use-enhanced-theme';

// Use vi.hoisted to ensure proper mock setup
const {
  mockSetTheme,
  mockUseTheme,
  mockRecordThemeSwitch,
  mockRecordThemePreference,
} = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  mockUseTheme: vi.fn(),
  mockRecordThemeSwitch: vi.fn(),
  mockRecordThemePreference: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: mockUseTheme,
}));

// Mock theme analytics
vi.mock('@/lib/theme-analytics', () => ({
  recordThemeSwitch: mockRecordThemeSwitch,
  recordThemePreference: mockRecordThemePreference,
}));

// Mock document.startViewTransition
const mockTransition = {
  ready: Promise.resolve(),
  finished: Promise.resolve(),
};

// Try to mock startViewTransition safely
const mockStartViewTransition = vi.fn((callback: () => void) => {
  // Execute the callback immediately to simulate the transition
  callback();
  return mockTransition;
});

try {
  if ('startViewTransition' in document) {
    (document as any).startViewTransition = mockStartViewTransition;
  } else {
    Object.defineProperty(document, 'startViewTransition', {
      value: mockStartViewTransition,
      writable: true,
      configurable: true,
    });
  }
} catch {
  // If we can't define it, just set it directly
  (document as any).startViewTransition = mockStartViewTransition;
}

// Mock document.documentElement.animate
Object.defineProperty(document.documentElement, 'animate', {
  value: vi.fn(() => ({ finished: Promise.resolve() })),
  writable: true,
  configurable: true,
});

// Mock performance.now
Object.defineProperty(global, 'performance', {
  value: { now: vi.fn(() => Date.now()) },
  writable: true,
});

describe('useEnhancedTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock behaviors
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      forcedTheme: undefined,
      resolvedTheme: 'light',
      systemTheme: 'light',
    });

    mockSetTheme.mockClear();
    mockRecordThemeSwitch.mockClear();
    mockRecordThemePreference.mockClear();
  });

  it('should return theme data from useTheme', () => {
    const { result } = renderHook(() => useEnhancedTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.themes).toEqual(['light', 'dark', 'system']);
    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.systemTheme).toBe('light');
  });

  it('should provide setTheme function', () => {
    const { result } = renderHook(() => useEnhancedTheme());

    expect(typeof result.current.setTheme).toBe('function');

    act(() => {
      result.current.setTheme('dark');
    });

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should provide setThemeWithCircularTransition function', () => {
    const { result } = renderHook(() => useEnhancedTheme());

    expect(typeof result.current.setThemeWithCircularTransition).toBe(
      'function',
    );

    act(() => {
      result.current.setThemeWithCircularTransition('dark');
    });

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should detect View Transitions support', () => {
    const { result } = renderHook(() => useEnhancedTheme());

    // supportsViewTransitions should be a boolean
    expect(typeof result.current.supportsViewTransitions).toBe('boolean');
  });

  it('should handle theme switching without errors', () => {
    const { result } = renderHook(() => useEnhancedTheme());

    expect(() => {
      act(() => {
        result.current.setTheme('dark');
        result.current.setTheme('light');
        result.current.setTheme('system');
      });
    }).not.toThrow();

    const EXPECTED_THEME_CALLS = 3;
    expect(mockSetTheme).toHaveBeenCalledTimes(EXPECTED_THEME_CALLS);
  });

  it('should handle circular transition without errors', () => {
    const { result } = renderHook(() => useEnhancedTheme());

    expect(() => {
      act(() => {
        result.current.setThemeWithCircularTransition('dark');
      });
    }).not.toThrow();

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});
