import * as Sentry from '@sentry/nextjs';
import { vi } from 'vitest';
import type {
  MockSwitchPattern,
  ThemeAnalyticsPrivate,
} from '@/types/test-types';
import {
  TEST_CONSTANTS,
  THEME_ANALYTICS_CONSTANTS,
} from '@/constants/test-constants';
import {
  DEBUG_CONSTANTS,
  DELAY_CONSTANTS,
  OPACITY_CONSTANTS,
  PERCENTAGE_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  TIME_CONSTANTS,
} from '../../../constants/app-constants';
import { ThemeAnalytics } from '../../theme-analytics';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  setTag: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  setMeasurement: vi.fn(),
  setContext: vi.fn(),
  captureMessage: vi.fn(),
}));

// Mock crypto for secure random
export const mockGetRandomValues = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
  },
  writable: true,
});

// Mock performance.now
export const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock sessionStorage
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock navigator
export const mockNavigator = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  language: 'en-US',
  languages: ['en-US', 'en'],
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock document.startViewTransition
export const mockStartViewTransition = vi.fn();
Object.defineProperty(document, 'startViewTransition', {
  value: mockStartViewTransition,
  configurable: true,
  writable: true,
});

// Setup function for theme analytics tests
export function setupThemeAnalyticsTest() {
  vi.clearAllMocks();

  // Reset mockGetRandomValues to default behavior
  mockGetRandomValues.mockReset();
  mockGetRandomValues.mockImplementation((array) => {
    array[0] = DEBUG_CONSTANTS.HEX_LARGE_NUMBER / DEBUG_CONSTANTS.SMALL_COUNT; // 5% value for consistent testing
    return array;
  });

  // Reset performance.now mock
  mockPerformanceNow.mockReset();
  mockPerformanceNow.mockReturnValue(1000); // Default timestamp

  // Reset localStorage mock
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockImplementation(() => {});
  mockLocalStorage.removeItem.mockImplementation(() => {});
  mockLocalStorage.clear.mockImplementation(() => {});

  // Reset sessionStorage mock
  mockSessionStorage.getItem.mockReturnValue(null);
  mockSessionStorage.setItem.mockImplementation(() => {});
  mockSessionStorage.removeItem.mockImplementation(() => {});
  mockSessionStorage.clear.mockImplementation(() => {});

  // Reset navigator mock
  Object.assign(mockNavigator, {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    },
  });

  // Reset startViewTransition mock
  mockStartViewTransition.mockReset();
  mockStartViewTransition.mockImplementation((callback) => {
    callback?.();
    return Promise.resolve();
  });

  // Reset Sentry mocks
  vi.mocked(Sentry.setTag).mockClear();
  vi.mocked(Sentry.setUser).mockClear();
  vi.mocked(Sentry.addBreadcrumb).mockClear();
  vi.mocked(Sentry.setMeasurement).mockClear();
  vi.mocked(Sentry.setContext).mockClear();
  vi.mocked(Sentry.captureMessage).mockClear();
}

// Helper function to create analytics instance with default config
export function createAnalyticsInstance(config?: any): ThemeAnalytics {
  return new ThemeAnalytics({
    enableSentry: true,
    enableLocalStorage: true,
    enablePerformanceTracking: true,
    samplingRate: THEME_ANALYTICS_CONSTANTS.SAMPLING_RATE_FULL,
    maxDataPoints: THEME_ANALYTICS_CONSTANTS.MAX_DATA_POINTS_DEFAULT,
    performanceThreshold:
      THEME_ANALYTICS_CONSTANTS.PERFORMANCE_THRESHOLD_DEFAULT,
    ...config,
  });
}

// Helper function to create mock switch pattern
export function createMockSwitchPattern(
  overrides?: Partial<MockSwitchPattern>,
): MockSwitchPattern {
  return {
    from: 'light',
    to: 'dark',
    timestamp: Date.now(),
    duration: 150,
    userAgent: mockNavigator.userAgent,
    viewportSize: { width: 1920, height: 1080 },
    ...overrides,
  };
}

// Helper function to access private methods for testing
export function getPrivateAnalytics(
  analytics: ThemeAnalytics,
): ThemeAnalyticsPrivate {
  return analytics as any;
}

// Helper function to simulate time passage
export function simulateTimePassage(milliseconds: number) {
  const currentTime = mockPerformanceNow.mockReturnValue();
  mockPerformanceNow.mockReturnValue(currentTime + milliseconds);
}

// Helper function to simulate multiple theme switches
export function simulateThemeSwitches(
  analytics: ThemeAnalytics,
  count: number,
) {
  const patterns = ['light', 'dark', 'system'];
  for (let i = 0; i < count; i++) {
    const from = patterns[i % patterns.length];
    const to = patterns[(i + 1) % patterns.length];
    analytics.recordThemeSwitch(from as any, to as any, {
      duration: 100 + i * 10,
      timestamp: Date.now() + i * 1000,
    });
  }
}

// Cleanup function for tests
export function cleanupThemeAnalyticsTest() {
  vi.restoreAllMocks();
}

// Export constants for use in tests
export {
  TEST_CONSTANTS,
  THEME_ANALYTICS_CONSTANTS,
  DEBUG_CONSTANTS,
  DELAY_CONSTANTS,
  OPACITY_CONSTANTS,
  PERCENTAGE_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  TIME_CONSTANTS,
};
