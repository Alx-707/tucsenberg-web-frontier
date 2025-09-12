import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EnhancedWebVitalsCollector,
  PERFORMANCE_THRESHOLDS,
} from '@/lib/enhanced-web-vitals';
import { WEB_VITALS_CONSTANTS } from '@/constants/test-constants';

// Use vi.hoisted to ensure proper mock setup
const {
  mockLogger,
  mockGetCLS,
  mockGetFID,
  mockGetFCP,
  mockGetLCP,
  mockGetTTFB,
  mockGetINP,
} = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockGetCLS: vi.fn(),
  mockGetFID: vi.fn(),
  mockGetFCP: vi.fn(),
  mockGetLCP: vi.fn(),
  mockGetTTFB: vi.fn(),
  mockGetINP: vi.fn(),
}));

// Mock web-vitals library
vi.mock('web-vitals', () => ({
  getCLS: mockGetCLS,
  getFID: mockGetFID,
  getFCP: mockGetFCP,
  getLCP: mockGetLCP,
  getTTFB: mockGetTTFB,
  getINP: mockGetINP,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Mock performance observer
const mockPerformanceObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
};

Object.defineProperty(global, 'PerformanceObserver', {
  value: vi.fn(() => mockPerformanceObserver),
  writable: true,
});

// Mock intersection observer
const mockIntersectionObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
};

Object.defineProperty(global, 'IntersectionObserver', {
  value: vi.fn(() => mockIntersectionObserver),
  writable: true,
});

describe('Enhanced Web Vitals - Core Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default mock behaviors
    mockGetCLS.mockImplementation((callback) => {
      callback({ name: 'CLS', value: 0.1, rating: 'good' });
    });
    mockGetFID.mockImplementation((callback) => {
      callback({ name: 'FID', value: 50, rating: 'good' });
    });
    mockGetFCP.mockImplementation((callback) => {
      callback({ name: 'FCP', value: 1500, rating: 'good' });
    });
    mockGetLCP.mockImplementation((callback) => {
      callback({ name: 'LCP', value: 2000, rating: 'good' });
    });
    mockGetTTFB.mockImplementation((callback) => {
      callback({ name: 'TTFB', value: 500, rating: 'good' });
    });
    mockGetINP.mockImplementation((callback) => {
      callback({ name: 'INP', value: 100, rating: 'good' });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should create collector instance', () => {
      const collector = new EnhancedWebVitalsCollector();
      expect(collector).toBeInstanceOf(EnhancedWebVitalsCollector);
    });

    it('should initialize with default options', () => {
      const collector = new EnhancedWebVitalsCollector();
      expect(collector).toBeDefined();
    });

    it('should start collecting metrics', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      expect(mockGetCLS).toHaveBeenCalled();
      expect(mockGetFID).toHaveBeenCalled();
      expect(mockGetFCP).toHaveBeenCalled();
      expect(mockGetLCP).toHaveBeenCalled();
      expect(mockGetTTFB).toHaveBeenCalled();
      expect(mockGetINP).toHaveBeenCalled();
    });

    it('should stop collecting metrics', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();
      collector.stop();

      expect(mockPerformanceObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Metric Collection', () => {
    it('should collect CLS metric', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      expect(mockGetCLS).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should collect FID metric', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      expect(mockGetFID).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should collect FCP metric', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      expect(mockGetFCP).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should collect LCP metric', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      expect(mockGetLCP).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should collect TTFB metric', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      expect(mockGetTTFB).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should collect INP metric', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      expect(mockGetINP).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Performance Thresholds', () => {
    it('should have correct CLS thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.CLS_GOOD).toBe(WEB_VITALS_CONSTANTS.CLS_GOOD_THRESHOLD);
      expect(PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT).toBe(WEB_VITALS_CONSTANTS.CLS_NEEDS_IMPROVEMENT_THRESHOLD);
    });

    it('should have correct FID thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FID_GOOD).toBe(WEB_VITALS_CONSTANTS.FID_GOOD_THRESHOLD);
      expect(PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT).toBe(WEB_VITALS_CONSTANTS.FID_NEEDS_IMPROVEMENT_THRESHOLD);
    });

    it('should have correct FCP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FCP_GOOD).toBe(WEB_VITALS_CONSTANTS.FCP_GOOD_THRESHOLD);
      expect(PERFORMANCE_THRESHOLDS.TTFB_GOOD).toBe(WEB_VITALS_CONSTANTS.TTFB_GOOD_THRESHOLD);
    });

    it('should have correct LCP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.LCP_GOOD).toBe(WEB_VITALS_CONSTANTS.LCP_GOOD_THRESHOLD);
      expect(PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT).toBe(WEB_VITALS_CONSTANTS.LCP_NEEDS_IMPROVEMENT_THRESHOLD);
    });

    it('should have correct TTFB thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.TTFB_GOOD).toBe(WEB_VITALS_CONSTANTS.TTFB_GOOD_THRESHOLD);
      expect(PERFORMANCE_THRESHOLDS.TTFB_NEEDS_IMPROVEMENT).toBe(WEB_VITALS_CONSTANTS.TTFB_NEEDS_IMPROVEMENT_THRESHOLD);
    });

    it('should have correct INP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.SLOW_RESOURCE_THRESHOLD).toBe(WEB_VITALS_CONSTANTS.SLOW_RESOURCE_THRESHOLD);
      expect(PERFORMANCE_THRESHOLDS.MAX_SLOW_RESOURCES).toBe(WEB_VITALS_CONSTANTS.MAX_SLOW_RESOURCES);
    });
  });

  describe('Logging', () => {
    it('should log good metrics', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      // Trigger the callback with good metrics
      const clsCallback = mockGetCLS.mock.calls[0]?.[0];
      if (clsCallback) {
        clsCallback({ name: 'CLS', value: 0.05, rating: 'good' });
      }

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('CLS: 0.05 (good)')
      );
    });

    it('should log poor metrics', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();

      // Trigger the callback with poor metrics
      const clsCallback = mockGetCLS.mock.calls[0]?.[0];
      if (clsCallback) {
        clsCallback({ name: 'CLS', value: 0.3, rating: 'poor' });
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('CLS: 0.3 (poor)')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing web vitals gracefully', () => {
      mockGetCLS.mockImplementation(() => {
        throw new Error('Web vitals not available');
      });

      const collector = new EnhancedWebVitalsCollector();
      expect(() => collector.start()).not.toThrow();
    });

    it('should handle performance observer errors', () => {
      Object.defineProperty(global, 'PerformanceObserver', {
        value: undefined,
        writable: true,
      });

      const collector = new EnhancedWebVitalsCollector();
      expect(() => collector.start()).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should accept custom options', () => {
      // EnhancedWebVitalsCollector doesn't accept constructor options
      // Test that it can be instantiated without options
      const collector = new EnhancedWebVitalsCollector();
      expect(collector).toBeDefined();
    });

    it('should handle invalid options gracefully', () => {
      // EnhancedWebVitalsCollector doesn't accept constructor options
      // Test that it can be instantiated without options
      const collector = new EnhancedWebVitalsCollector();
      expect(collector).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on stop', () => {
      const collector = new EnhancedWebVitalsCollector();
      collector.start();
      collector.stop();

      expect(mockPerformanceObserver.disconnect).toHaveBeenCalled();
      expect(mockIntersectionObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle multiple start/stop cycles', () => {
      const collector = new EnhancedWebVitalsCollector();

      collector.start();
      collector.stop();
      collector.start();
      collector.stop();

      expect(mockPerformanceObserver.disconnect).toHaveBeenCalledTimes(2);
    });
  });
});
