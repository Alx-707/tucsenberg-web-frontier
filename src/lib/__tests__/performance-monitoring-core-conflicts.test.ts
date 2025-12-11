import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createConflictChecker,
  PerformanceToolConflictChecker,
  quickConflictCheck,
} from '../performance-monitoring-core-conflicts';

// Store original window for restoration
const originalWindow = global.window;

// Mock window with proper typing
function createMockWindow(
  overrides: Record<string, unknown> = {},
): typeof window {
  return {
    performance: {
      getEntriesByType: vi.fn().mockReturnValue([]),
    },
    PerformanceObserver: vi.fn(),
    ...overrides,
  } as unknown as typeof window;
}

describe('performance-monitoring-core-conflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
  });

  describe('PerformanceToolConflictChecker', () => {
    describe('constructor', () => {
      it('should create instance', () => {
        const checker = new PerformanceToolConflictChecker();
        expect(checker).toBeInstanceOf(PerformanceToolConflictChecker);
      });
    });

    describe('checkToolConflicts', () => {
      it('should return result structure', () => {
        global.window = createMockWindow();
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result).toHaveProperty('hasConflicts');
        expect(result).toHaveProperty('conflicts');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('recommendations');
        expect(result).toHaveProperty('detectedTools');
      });

      it('should detect React DevTools', () => {
        global.window = createMockWindow({
          __REACT_DEVTOOLS_GLOBAL_HOOK__: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('React DevTools');
      });

      it('should detect Redux DevTools', () => {
        global.window = createMockWindow({
          __REDUX_DEVTOOLS_EXTENSION__: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Redux DevTools');
      });

      it('should detect Vue DevTools', () => {
        global.window = createMockWindow({
          __VUE_DEVTOOLS_GLOBAL_HOOK__: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Vue DevTools');
      });

      it('should detect Sentry', () => {
        global.window = createMockWindow({
          Sentry: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Sentry');
      });

      it('should detect Google Analytics via gtag', () => {
        global.window = createMockWindow({
          gtag: vi.fn(),
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Google Analytics');
      });

      it('should detect Google Analytics via ga', () => {
        global.window = createMockWindow({
          ga: vi.fn(),
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Google Analytics');
      });

      it('should detect Google Analytics via dataLayer', () => {
        global.window = createMockWindow({
          dataLayer: [],
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Google Analytics');
      });

      it('should detect LogRocket', () => {
        global.window = createMockWindow({
          LogRocket: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('LogRocket');
      });

      it('should detect FullStory', () => {
        global.window = createMockWindow({
          FS: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('FullStory');
      });

      it('should detect Hotjar', () => {
        global.window = createMockWindow({
          hj: vi.fn(),
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Hotjar');
      });

      it('should detect Mixpanel', () => {
        global.window = createMockWindow({
          mixpanel: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Mixpanel');
      });

      it('should detect Amplitude', () => {
        global.window = createMockWindow({
          amplitude: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.detectedTools).toContain('Amplitude');
      });

      it('should warn about many performance marks', () => {
        // PERCENTAGE_FULL = 100, need > 100 marks to trigger warning
        // The source uses global `performance` object directly
        const mockPerformance = {
          getEntriesByType: vi.fn().mockImplementation((type: string) => {
            if (type === 'mark') return Array(150).fill({});
            return [];
          }),
        };
        global.window = createMockWindow();
        // Override the performance property on the mock window
        Object.defineProperty(global.window, 'performance', {
          value: mockPerformance,
          writable: true,
          configurable: true,
        });
        // Also override global performance since the code uses it directly
        const origPerf = global.performance;
        Object.defineProperty(global, 'performance', {
          value: mockPerformance,
          writable: true,
          configurable: true,
        });

        const checker = new PerformanceToolConflictChecker();
        const result = checker.checkToolConflicts();

        // Restore
        Object.defineProperty(global, 'performance', {
          value: origPerf,
          writable: true,
          configurable: true,
        });

        expect(result.warnings.some((w) => w.includes('性能标记'))).toBe(true);
      });

      it('should warn about many performance measures', () => {
        // PERCENTAGE_HALF = 50, need > 50 measures to trigger warning
        const mockPerformance = {
          getEntriesByType: vi.fn().mockImplementation((type: string) => {
            if (type === 'measure') return Array(60).fill({});
            return [];
          }),
        };
        global.window = createMockWindow();
        Object.defineProperty(global.window, 'performance', {
          value: mockPerformance,
          writable: true,
          configurable: true,
        });
        const origPerf = global.performance;
        Object.defineProperty(global, 'performance', {
          value: mockPerformance,
          writable: true,
          configurable: true,
        });

        const checker = new PerformanceToolConflictChecker();
        const result = checker.checkToolConflicts();

        // Restore
        Object.defineProperty(global, 'performance', {
          value: origPerf,
          writable: true,
          configurable: true,
        });

        expect(result.warnings.some((w) => w.includes('性能测量'))).toBe(true);
      });

      it('should detect LogRocket and FullStory conflict', () => {
        global.window = createMockWindow({
          LogRocket: {},
          FS: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.hasConflicts).toBe(true);
        expect(
          result.conflicts.some(
            (c) => c.includes('LogRocket') && c.includes('FullStory'),
          ),
        ).toBe(true);
      });

      it('should warn about multiple monitoring tools', () => {
        global.window = createMockWindow({
          Sentry: {},
          LogRocket: {},
          FS: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.warnings.some((w) => w.includes('多个监控工具'))).toBe(
          true,
        );
      });

      it('should warn about multiple analytics tools', () => {
        global.window = createMockWindow({
          gtag: vi.fn(),
          mixpanel: {},
          amplitude: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.warnings.some((w) => w.includes('多个分析工具'))).toBe(
          true,
        );
      });

      it('should provide recommendations when no tools detected', () => {
        global.window = createMockWindow();
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(
          result.recommendations.some((r) => r.includes('当前配置良好')),
        ).toBe(true);
      });

      it('should provide recommendations when conflicts exist', () => {
        global.window = createMockWindow({
          LogRocket: {},
          FS: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(
          result.recommendations.some((r) => r.includes('整合监控工具')),
        ).toBe(true);
      });

      it('should recommend reducing tools when many detected', () => {
        global.window = createMockWindow({
          __REACT_DEVTOOLS_GLOBAL_HOOK__: {},
          Sentry: {},
          gtag: vi.fn(),
          LogRocket: {},
          hj: vi.fn(),
          mixpanel: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(
          result.recommendations.some((r) =>
            r.includes('评估每个工具的必要性'),
          ),
        ).toBe(true);
      });

      it('should handle undefined window gracefully', () => {
        // @ts-expect-error - intentionally setting window to undefined
        global.window = undefined;
        const checker = new PerformanceToolConflictChecker();

        const result = checker.checkToolConflicts();

        expect(result.hasConflicts).toBe(false);
        expect(result.detectedTools).toEqual([]);
      });
    });

    describe('getToolDetails', () => {
      it('should return details for React DevTools', () => {
        global.window = createMockWindow({
          __REACT_DEVTOOLS_GLOBAL_HOOK__: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const details = checker.getToolDetails('React DevTools');

        expect(details).not.toBeNull();
        expect(details?.name).toBe('React DevTools');
        expect(details?.detected).toBe(true);
        expect(details?.impact).toBe('low');
      });

      it('should return details for Redux DevTools', () => {
        global.window = createMockWindow({
          __REDUX_DEVTOOLS_EXTENSION__: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const details = checker.getToolDetails('Redux DevTools');

        expect(details).not.toBeNull();
        expect(details?.name).toBe('Redux DevTools');
        expect(details?.detected).toBe(true);
      });

      it('should return details for Sentry', () => {
        global.window = createMockWindow({
          Sentry: {},
        });
        const checker = new PerformanceToolConflictChecker();

        const details = checker.getToolDetails('Sentry');

        expect(details).not.toBeNull();
        expect(details?.impact).toBe('medium');
      });

      it('should return details for Google Analytics', () => {
        global.window = createMockWindow({
          gtag: vi.fn(),
        });
        const checker = new PerformanceToolConflictChecker();

        const details = checker.getToolDetails('Google Analytics');

        expect(details).not.toBeNull();
        expect(details?.detected).toBe(true);
      });

      it('should return null for unknown tool', () => {
        global.window = createMockWindow();
        const checker = new PerformanceToolConflictChecker();

        const details = checker.getToolDetails('Unknown Tool');

        expect(details).toBeNull();
      });

      it('should return null when window is undefined', () => {
        // @ts-expect-error - intentionally setting window to undefined
        global.window = undefined;
        const checker = new PerformanceToolConflictChecker();

        const details = checker.getToolDetails('React DevTools');

        expect(details).toBeNull();
      });
    });

    describe('generateResolutionPlan', () => {
      it('should generate high priority plan for production conflicts', () => {
        const checker = new PerformanceToolConflictChecker();

        const plans = checker.generateResolutionPlan([
          '生产环境中检测到开发工具',
        ]);

        expect(plans).toHaveLength(1);
        expect(plans[0].priority).toBe('high');
        expect(plans[0].actions.length).toBeGreaterThan(0);
      });

      it('should generate high priority plan for APM tool conflicts', () => {
        const checker = new PerformanceToolConflictChecker();

        const plans = checker.generateResolutionPlan(['多个APM工具可能冲突']);

        expect(plans[0].priority).toBe('high');
      });

      it('should generate medium priority plan for multiple tools', () => {
        const checker = new PerformanceToolConflictChecker();

        const plans = checker.generateResolutionPlan(['检测到多个工具在监听']);

        expect(plans[0].priority).toBe('medium');
      });

      it('should generate low priority plan for other conflicts', () => {
        const checker = new PerformanceToolConflictChecker();

        const plans = checker.generateResolutionPlan(['一般性冲突']);

        expect(plans[0].priority).toBe('low');
      });

      it('should return empty array for no conflicts', () => {
        const checker = new PerformanceToolConflictChecker();

        const plans = checker.generateResolutionPlan([]);

        expect(plans).toEqual([]);
      });
    });
  });

  describe('createConflictChecker', () => {
    it('should create a PerformanceToolConflictChecker instance', () => {
      const checker = createConflictChecker();

      expect(checker).toBeInstanceOf(PerformanceToolConflictChecker);
    });
  });

  describe('quickConflictCheck', () => {
    it('should return conflict check result', () => {
      global.window = createMockWindow();

      const result = quickConflictCheck();

      expect(result).toHaveProperty('hasConflicts');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('detectedTools');
    });
  });
});
