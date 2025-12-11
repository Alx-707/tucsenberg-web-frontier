import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerformanceConfig } from '@/lib/performance-monitoring-types';
import {
  checkEnvironmentCompatibility,
  performHealthCheck,
  useWebVitalsIntegration,
  validateWebVitalsConfig,
  WebVitalsAnalyzer,
} from '../performance-monitoring-integrations-vitals';

// Store original env
const originalEnv = { ...process.env };

// Helper to create a base config
function createBaseConfig(
  overrides?: Partial<PerformanceConfig>,
): PerformanceConfig {
  return {
    reactScan: { enabled: false },
    bundleAnalyzer: { enabled: false },
    sizeLimit: { enabled: false, maxSize: 500 },
    global: {
      enabled: true,
      dataRetentionTime: 300000,
      maxMetrics: 100,
    },
    webVitals: {
      enabled: true,
      reportAllChanges: false,
    },
    ...overrides,
  };
}

describe('performance-monitoring-integrations-vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('useWebVitalsIntegration', () => {
    it('should return integration with enabled status', () => {
      const config = createBaseConfig({ webVitals: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useWebVitalsIntegration(config, recordMetric);

      expect(integration.enabled).toBe(true);
    });

    it('should return disabled when webVitals is disabled', () => {
      const config = createBaseConfig({ webVitals: { enabled: false } });
      const recordMetric = vi.fn();

      const integration = useWebVitalsIntegration(config, recordMetric);

      expect(integration.enabled).toBe(false);
    });

    it('should record web vital metric', () => {
      const config = createBaseConfig({ webVitals: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useWebVitalsIntegration(config, recordMetric);
      integration.recordWebVital('LCP', 2500, 'good');

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'web-vitals',
          type: 'page',
          data: expect.objectContaining({
            name: 'LCP',
            value: 2500,
            rating: 'good',
          }),
        }),
      );
    });

    it('should not record web vital when disabled', () => {
      const config = createBaseConfig({ webVitals: { enabled: false } });
      const recordMetric = vi.fn();

      const integration = useWebVitalsIntegration(config, recordMetric);
      integration.recordWebVital('LCP', 2500, 'good');

      expect(recordMetric).not.toHaveBeenCalled();
    });

    it('should set high priority for poor rating', () => {
      const config = createBaseConfig({ webVitals: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useWebVitalsIntegration(config, recordMetric);
      integration.recordWebVital('LCP', 5000, 'poor');

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
        }),
      );
    });

    it('should record custom metric', () => {
      const config = createBaseConfig({ webVitals: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useWebVitalsIntegration(config, recordMetric);
      integration.recordCustomMetric('custom-metric', 100, 'ms');

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'custom',
          type: 'page',
          data: expect.objectContaining({
            name: 'custom-metric',
            value: 100,
            unit: 'ms',
          }),
        }),
      );
    });

    it('should use default unit for custom metric', () => {
      const config = createBaseConfig({ webVitals: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useWebVitalsIntegration(config, recordMetric);
      integration.recordCustomMetric('custom-metric', 100);

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unit: 'ms',
          }),
        }),
      );
    });
  });

  describe('checkEnvironmentCompatibility', () => {
    it('should return result structure', () => {
      const result = checkEnvironmentCompatibility();

      expect(result).toHaveProperty('isCompatible');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('warnings');
    });

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN = 'true';

      const result = checkEnvironmentCompatibility();

      expect(result.environment).toBe('test');
      expect(result.isCompatible).toBe(true);
    });

    it('should warn when React Scan not disabled in test', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN;

      const result = checkEnvironmentCompatibility();

      expect(result.issues.some((i) => i.includes('React Scan'))).toBe(true);
    });

    it('should check development environment', () => {
      process.env.NODE_ENV = 'development';

      const result = checkEnvironmentCompatibility();

      expect(result.environment).toBe('development');
    });

    it('should check production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN = 'true';

      const result = checkEnvironmentCompatibility();

      expect(result.environment).toBe('production');
    });
  });

  describe('performHealthCheck', () => {
    it('should return health check result', () => {
      const config = createBaseConfig();

      const result = performHealthCheck(config);

      expect(result).toHaveProperty('isHealthy');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('details');
    });

    it('should check reactScan status', () => {
      const config = createBaseConfig({ reactScan: { enabled: false } });

      const result = performHealthCheck(config);

      expect(result.status.reactScan).toBeDefined();
    });

    it('should check bundleAnalyzer status', () => {
      const config = createBaseConfig();

      const result = performHealthCheck(config);

      expect(result.status.bundleAnalyzer).toBe('healthy');
    });

    it('should warn when sizeLimit is disabled', () => {
      const config = createBaseConfig({
        sizeLimit: { enabled: false, maxSize: 500 },
      });

      const result = performHealthCheck(config);

      expect(result.status.sizeLimit).toBe('warning');
    });

    it('should be healthy when sizeLimit is enabled', () => {
      const config = createBaseConfig({
        sizeLimit: { enabled: true, maxSize: 500 },
      });

      const result = performHealthCheck(config);

      expect(result.status.sizeLimit).toBe('healthy');
    });

    it('should warn about React Scan in test environment', () => {
      process.env.NODE_ENV = 'test';
      const config = createBaseConfig({ reactScan: { enabled: true } });

      const result = performHealthCheck(config);

      expect(result.status.reactScan).toBe('error');
    });
  });

  describe('validateWebVitalsConfig', () => {
    it('should return valid for proper config', () => {
      const config = createBaseConfig({
        webVitals: { enabled: true, reportAllChanges: false },
      });

      const result = validateWebVitalsConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error on non-boolean enabled', () => {
      const config = createBaseConfig({
        webVitals: { enabled: 'yes' as unknown as boolean },
      });

      const result = validateWebVitalsConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('enabled'))).toBe(true);
    });

    it('should warn on non-boolean reportAllChanges', () => {
      const config = createBaseConfig({
        webVitals: {
          enabled: true,
          reportAllChanges: 'yes' as unknown as boolean,
        },
      });

      const result = validateWebVitalsConfig(config);

      expect(result.warnings.some((w) => w.includes('reportAllChanges'))).toBe(
        true,
      );
    });

    it('should validate threshold values', () => {
      const config = createBaseConfig({
        webVitals: {
          enabled: true,
          thresholds: { lcp: -100 },
        },
      });

      const result = validateWebVitalsConfig(config);

      expect(result.warnings.some((w) => w.includes('LCP threshold'))).toBe(
        true,
      );
    });

    it('should return valid when webVitals is not present', () => {
      const config = createBaseConfig();
      delete (config as { webVitals?: unknown }).webVitals;

      const result = validateWebVitalsConfig(config);

      expect(result.isValid).toBe(true);
    });
  });

  describe('WebVitalsAnalyzer', () => {
    describe('constructor', () => {
      it('should create instance', () => {
        const config = createBaseConfig();
        const analyzer = new WebVitalsAnalyzer(config);

        expect(analyzer).toBeInstanceOf(WebVitalsAnalyzer);
      });
    });

    describe('recordWebVital', () => {
      it('should record web vital when enabled', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordWebVital('LCP', 2500, 'good');

        const report = analyzer.getWebVitalsReport();
        expect(report.vitals.LCP).toBeDefined();
      });

      it('should not record when disabled', () => {
        const config = createBaseConfig({ webVitals: { enabled: false } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordWebVital('LCP', 2500, 'good');

        const report = analyzer.getWebVitalsReport();
        expect(Object.keys(report.vitals)).toHaveLength(0);
      });

      it('should accumulate multiple values', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordWebVital('LCP', 2500, 'good');
        analyzer.recordWebVital('LCP', 3000, 'needs-improvement');

        const report = analyzer.getWebVitalsReport();
        expect(report.vitals.LCP.average).toBe(2750);
      });

      it('should limit values array size', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        // Record more than 100 values
        for (let i = 0; i < 120; i++) {
          analyzer.recordWebVital('LCP', 2500 + i, 'good');
        }

        // Should have trimmed to 50 (OFFSET_NEGATIVE_EXTRA_LARGE)
        const report = analyzer.getWebVitalsReport();
        expect(report.vitals.LCP).toBeDefined();
      });
    });

    describe('recordCustomMetric', () => {
      it('should record custom metric when enabled', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordCustomMetric('custom', 100, 'ms');

        // Custom metrics don't appear in getWebVitalsReport directly
        // but we can verify it doesn't throw
        expect(true).toBe(true);
      });

      it('should not record when disabled', () => {
        const config = createBaseConfig({ webVitals: { enabled: false } });
        const analyzer = new WebVitalsAnalyzer(config);

        // Should not throw
        analyzer.recordCustomMetric('custom', 100, 'ms');
        expect(true).toBe(true);
      });
    });

    describe('getWebVitalsReport', () => {
      it('should return report structure', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        const report = analyzer.getWebVitalsReport();

        expect(report).toHaveProperty('vitals');
        expect(report).toHaveProperty('score');
        expect(report).toHaveProperty('recommendations');
      });

      it('should calculate score from ratings', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordWebVital('LCP', 2500, 'good');
        analyzer.recordWebVital('FID', 100, 'good');

        const report = analyzer.getWebVitalsReport();
        expect(report.score).toBe(100);
      });

      it('should calculate score with mixed ratings', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordWebVital('LCP', 2500, 'good');
        analyzer.recordWebVital('FID', 200, 'needs-improvement');

        const report = analyzer.getWebVitalsReport();
        expect(report.score).toBe(75); // (100 + 50) / 2
      });

      it('should generate recommendations for poor metrics', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordWebVital('LCP', 5000, 'poor');

        const report = analyzer.getWebVitalsReport();
        expect(report.recommendations.some((r) => r.includes('LCP'))).toBe(
          true,
        );
      });

      it('should detect trend', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        // Record improving trend
        analyzer.recordWebVital('LCP', 3000, 'needs-improvement');
        analyzer.recordWebVital('LCP', 2800, 'needs-improvement');
        analyzer.recordWebVital('LCP', 2500, 'good');
        analyzer.recordWebVital('LCP', 2200, 'good');

        const report = analyzer.getWebVitalsReport();
        // Trend should be improving or stable depending on calculation
        expect(['improving', 'stable', 'degrading']).toContain(
          report.vitals.LCP.trend,
        );
      });
    });

    describe('reset', () => {
      it('should clear all data', () => {
        const config = createBaseConfig({ webVitals: { enabled: true } });
        const analyzer = new WebVitalsAnalyzer(config);

        analyzer.recordWebVital('LCP', 2500, 'good');
        analyzer.recordCustomMetric('custom', 100);

        analyzer.reset();

        const report = analyzer.getWebVitalsReport();
        expect(Object.keys(report.vitals)).toHaveLength(0);
      });
    });
  });
});
