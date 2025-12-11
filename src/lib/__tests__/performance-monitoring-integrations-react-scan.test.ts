import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerformanceConfig } from '@/lib/performance-monitoring-types';
import {
  ReactScanAnalyzer,
  ReactScanUtils,
  useReactScanIntegration,
  validateReactScanConfig,
} from '../performance-monitoring-integrations-react-scan';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Helper to create a base config
function createBaseConfig(
  overrides?: Partial<PerformanceConfig>,
): PerformanceConfig {
  return {
    reactScan: { enabled: true, trackUnnecessaryRenders: true },
    bundleAnalyzer: { enabled: false },
    sizeLimit: { enabled: false, maxSize: 500 },
    global: {
      enabled: true,
      dataRetentionTime: 300000,
      maxMetrics: 100,
    },
    ...overrides,
  };
}

describe('performance-monitoring-integrations-react-scan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('useReactScanIntegration', () => {
    it('should return integration with enabled status', () => {
      const config = createBaseConfig({ reactScan: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);

      expect(integration.enabled).toBe(true);
    });

    it('should return disabled when reactScan is disabled', () => {
      const config = createBaseConfig({ reactScan: { enabled: false } });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);

      expect(integration.enabled).toBe(false);
    });

    it('should record render metric', () => {
      const config = createBaseConfig({ reactScan: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);
      integration.recordRender('TestComponent', 1, 10);

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'react-scan',
          type: 'component',
          data: expect.objectContaining({
            componentName: 'TestComponent',
            renderCount: 1,
            renderTime: 10,
          }),
        }),
      );
    });

    it('should not record render when disabled', () => {
      const config = createBaseConfig({ reactScan: { enabled: false } });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);
      integration.recordRender('TestComponent', 1, 10);

      expect(recordMetric).not.toHaveBeenCalled();
    });

    it('should set high priority for frequent renders', () => {
      const config = createBaseConfig({ reactScan: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);
      integration.recordRender('TestComponent', 10, 50); // > COUNT_FIVE renders

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
        }),
      );
    });

    it('should record unnecessary render', () => {
      const config = createBaseConfig({
        reactScan: { enabled: true, trackUnnecessaryRenders: true },
      });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);
      integration.recordUnnecessaryRender(
        'TestComponent',
        'Props did not change',
      );

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'react-scan',
          type: 'component',
          data: expect.objectContaining({
            componentName: 'TestComponent',
            reason: 'Props did not change',
            type: 'unnecessary-render',
          }),
        }),
      );
    });

    it('should not record unnecessary render when tracking disabled', () => {
      const config = createBaseConfig({
        reactScan: { enabled: true, trackUnnecessaryRenders: false },
      });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);
      integration.recordUnnecessaryRender(
        'TestComponent',
        'Props did not change',
      );

      expect(recordMetric).not.toHaveBeenCalled();
    });

    it('should track component stats', () => {
      const config = createBaseConfig({ reactScan: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useReactScanIntegration(config, recordMetric);
      integration.recordRender('TestComponent', 1, 10);
      integration.recordRender('TestComponent', 1, 15);

      const stats = integration.getComponentStats();

      expect(stats.TestComponent).toEqual({
        renders: 2,
        totalTime: 25,
      });
    });
  });

  describe('validateReactScanConfig', () => {
    it('should return valid for proper config', () => {
      const config = createBaseConfig({ reactScan: { enabled: true } });

      const result = validateReactScanConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error when reactScan is missing', () => {
      const config = createBaseConfig();
      delete (config as { reactScan?: unknown }).reactScan;

      const result = validateReactScanConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('missing'))).toBe(true);
    });

    it('should error on non-boolean enabled', () => {
      const config = createBaseConfig({
        reactScan: { enabled: 'yes' as unknown as boolean },
      });

      const result = validateReactScanConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('boolean'))).toBe(true);
    });

    it('should warn on non-boolean trackUnnecessaryRenders', () => {
      const config = createBaseConfig({
        reactScan: {
          enabled: true,
          trackUnnecessaryRenders: 'yes' as unknown as boolean,
        },
      });

      const result = validateReactScanConfig(config);

      expect(
        result.warnings.some((w) => w.includes('trackUnnecessaryRenders')),
      ).toBe(true);
    });

    it('should warn on invalid maxTrackedComponents', () => {
      const config = createBaseConfig({
        reactScan: { enabled: true, maxTrackedComponents: -1 },
      });

      const result = validateReactScanConfig(config);

      expect(
        result.warnings.some((w) => w.includes('maxTrackedComponents')),
      ).toBe(true);
    });

    it('should warn on non-boolean showRenderTime', () => {
      const config = createBaseConfig({
        reactScan: {
          enabled: true,
          showRenderTime: 'yes' as unknown as boolean,
        },
      });

      const result = validateReactScanConfig(config);

      expect(result.warnings.some((w) => w.includes('showRenderTime'))).toBe(
        true,
      );
    });
  });

  describe('ReactScanAnalyzer', () => {
    describe('constructor', () => {
      it('should create instance', () => {
        const config = createBaseConfig();
        const analyzer = new ReactScanAnalyzer(config);

        expect(analyzer).toBeInstanceOf(ReactScanAnalyzer);
      });
    });

    describe('recordRender', () => {
      it('should record render when enabled', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);

        const stats = analyzer.getComponentStats('TestComponent');
        expect(stats).not.toBeNull();
        expect(stats?.renders).toBe(1);
      });

      it('should not record when disabled', () => {
        const config = createBaseConfig({ reactScan: { enabled: false } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);

        const stats = analyzer.getComponentStats('TestComponent');
        expect(stats).toBeNull();
      });

      it('should accumulate render stats', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);
        vi.advanceTimersByTime(200); // Advance past threshold
        analyzer.recordRender('TestComponent', 15);

        const stats = analyzer.getComponentStats('TestComponent');
        expect(stats?.renders).toBe(2);
        expect(stats?.totalTime).toBe(25);
      });

      it('should detect unnecessary renders', () => {
        const config = createBaseConfig({
          reactScan: {
            enabled: true,
            trackUnnecessaryRenders: true,
            renderThreshold: 100,
          },
        });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);
        // Render again quickly (under threshold)
        analyzer.recordRender('TestComponent', 10);

        const stats = analyzer.getComponentStats('TestComponent');
        expect(stats?.unnecessaryRenders).toBeGreaterThan(0);
      });
    });

    describe('recordUnnecessaryRender', () => {
      it('should record when tracking enabled', () => {
        const config = createBaseConfig({
          reactScan: { enabled: true, trackUnnecessaryRenders: true },
        });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);
        analyzer.recordUnnecessaryRender('TestComponent', 'Test reason');

        const stats = analyzer.getComponentStats('TestComponent');
        expect(stats?.unnecessaryRenders).toBeGreaterThan(0);
      });

      it('should not record when tracking disabled', () => {
        const config = createBaseConfig({
          reactScan: { enabled: true, trackUnnecessaryRenders: false },
        });
        const analyzer = new ReactScanAnalyzer(config);

        // First render - note: implementation may detect unnecessary render internally
        // because lastRender is set before isUnnecessaryRender check
        analyzer.recordRender('TestComponent', 10);
        const statsAfterRender = analyzer.getComponentStats('TestComponent');
        const countAfterRender = statsAfterRender?.unnecessaryRenders ?? 0;

        // This explicit call should be ignored due to trackUnnecessaryRenders: false
        analyzer.recordUnnecessaryRender('TestComponent', 'Test reason');

        const statsAfterExplicit = analyzer.getComponentStats('TestComponent');
        // The explicit recordUnnecessaryRender call should NOT have increased the count
        // because trackUnnecessaryRenders is false
        expect(statsAfterExplicit?.unnecessaryRenders).toBe(countAfterRender);
      });
    });

    describe('getPerformanceReport', () => {
      it('should return report structure', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        const report = analyzer.getPerformanceReport();

        expect(report).toHaveProperty('totalComponents');
        expect(report).toHaveProperty('totalRenders');
        expect(report).toHaveProperty('averageRenderTime');
        expect(report).toHaveProperty('topSlowComponents');
        expect(report).toHaveProperty('recommendations');
      });

      it('should calculate totals correctly', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('Component1', 10);
        vi.advanceTimersByTime(200);
        analyzer.recordRender('Component2', 20);

        const report = analyzer.getPerformanceReport();

        expect(report.totalComponents).toBe(2);
        expect(report.totalRenders).toBe(2);
        expect(report.averageRenderTime).toBe(15);
      });

      it('should sort slow components by average time', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('FastComponent', 5);
        vi.advanceTimersByTime(200);
        analyzer.recordRender('SlowComponent', 50);

        const report = analyzer.getPerformanceReport();

        expect(report.topSlowComponents[0].name).toBe('SlowComponent');
      });

      it('should generate recommendations for slow components', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('SlowComponent', 50); // > 16ms (one frame)

        const report = analyzer.getPerformanceReport();

        expect(
          report.recommendations.some((r) => r.includes('SlowComponent')),
        ).toBe(true);
      });

      it('should generate recommendations for unnecessary renders', () => {
        const config = createBaseConfig({
          reactScan: {
            enabled: true,
            trackUnnecessaryRenders: true,
            renderThreshold: 100,
          },
        });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);
        analyzer.recordRender('TestComponent', 10);

        const report = analyzer.getPerformanceReport();

        expect(
          report.recommendations.some(
            (r) => r.includes('unnecessary') || r.includes('React.memo'),
          ),
        ).toBe(true);
      });
    });

    describe('getComponentStats', () => {
      it('should return null for unknown component', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        const stats = analyzer.getComponentStats('UnknownComponent');

        expect(stats).toBeNull();
      });

      it('should return stats for known component', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);

        const stats = analyzer.getComponentStats('TestComponent');

        expect(stats).not.toBeNull();
        expect(stats?.renders).toBe(1);
        expect(stats?.totalTime).toBe(10);
        expect(stats?.averageTime).toBe(10);
      });
    });

    describe('reset', () => {
      it('should clear all data', () => {
        const config = createBaseConfig({ reactScan: { enabled: true } });
        const analyzer = new ReactScanAnalyzer(config);

        analyzer.recordRender('TestComponent', 10);

        analyzer.reset();

        const stats = analyzer.getComponentStats('TestComponent');
        expect(stats).toBeNull();
      });
    });
  });

  describe('ReactScanUtils', () => {
    describe('formatRenderTime', () => {
      it('should format microseconds', () => {
        const result = ReactScanUtils.formatRenderTime(0.5);

        expect(result).toContain('μs');
      });

      it('should format milliseconds', () => {
        const result = ReactScanUtils.formatRenderTime(10);

        expect(result).toContain('ms');
      });

      it('should format seconds', () => {
        const result = ReactScanUtils.formatRenderTime(1500);

        expect(result).toContain('s');
      });
    });

    describe('getRenderPerformanceRating', () => {
      it('should return excellent for < 8ms', () => {
        expect(ReactScanUtils.getRenderPerformanceRating(5)).toBe('excellent');
      });

      it('should return good for 8-16ms', () => {
        expect(ReactScanUtils.getRenderPerformanceRating(12)).toBe('good');
      });

      it('should return fair for 16-32ms', () => {
        expect(ReactScanUtils.getRenderPerformanceRating(24)).toBe('fair');
      });

      it('should return poor for >= 32ms', () => {
        expect(ReactScanUtils.getRenderPerformanceRating(50)).toBe('poor');
      });
    });

    describe('calculateEfficiencyScore', () => {
      it('should return 100 for no renders', () => {
        expect(ReactScanUtils.calculateEfficiencyScore(0, 0)).toBe(100);
      });

      it('should return 100 for no unnecessary renders', () => {
        expect(ReactScanUtils.calculateEfficiencyScore(10, 0)).toBe(100);
      });

      it('should return 50 for half unnecessary renders', () => {
        expect(ReactScanUtils.calculateEfficiencyScore(10, 5)).toBe(50);
      });

      it('should return 0 for all unnecessary renders', () => {
        expect(ReactScanUtils.calculateEfficiencyScore(10, 10)).toBe(0);
      });
    });

    describe('generateOptimizationSuggestions', () => {
      it('should suggest optimization for slow components', () => {
        const suggestions = ReactScanUtils.generateOptimizationSuggestions({
          renders: 10,
          averageTime: 50,
          unnecessaryRenders: 0,
        });

        expect(
          suggestions.some(
            (s) => s.includes('React.memo') || s.includes('smaller'),
          ),
        ).toBe(true);
      });

      it('should suggest optimization for high unnecessary render rate', () => {
        const suggestions = ReactScanUtils.generateOptimizationSuggestions({
          renders: 10,
          averageTime: 5,
          unnecessaryRenders: 5, // 50% unnecessary
        });

        expect(
          suggestions.some((s) => s.includes('prop') || s.includes('useMemo')),
        ).toBe(true);
      });

      it('should suggest virtualization for high render frequency', () => {
        const suggestions = ReactScanUtils.generateOptimizationSuggestions({
          renders: 150,
          averageTime: 5,
          unnecessaryRenders: 0,
        });

        expect(suggestions.some((s) => s.includes('virtualization'))).toBe(
          true,
        );
      });

      it('should return empty array for well-performing components', () => {
        const suggestions = ReactScanUtils.generateOptimizationSuggestions({
          renders: 10,
          averageTime: 5,
          unnecessaryRenders: 0,
        });

        expect(suggestions).toHaveLength(0);
      });
    });
  });
});
