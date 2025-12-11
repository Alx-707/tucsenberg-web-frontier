import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import type { PerformanceConfig } from '@/lib/performance-monitoring-types';
import {
  BundleAnalyzerAnalyzer,
  BundleAnalyzerUtils,
  useBundleAnalyzerIntegration,
  validateBundleAnalyzerConfig,
} from '../performance-monitoring-integrations-bundle';

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
    reactScan: { enabled: false },
    bundleAnalyzer: { enabled: true },
    sizeLimit: { enabled: false, maxSize: 500 },
    global: {
      enabled: true,
      dataRetentionTime: 300000,
      maxMetrics: 100,
    },
    bundle: {
      enabled: true,
      thresholds: { size: 1048576 },
    },
    ...overrides,
  };
}

describe('performance-monitoring-integrations-bundle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useBundleAnalyzerIntegration', () => {
    it('should return integration with enabled status', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useBundleAnalyzerIntegration(config, recordMetric);

      expect(integration.enabled).toBe(true);
    });

    it('should return disabled when bundleAnalyzer is disabled', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: false } });
      const recordMetric = vi.fn();

      const integration = useBundleAnalyzerIntegration(config, recordMetric);

      expect(integration.enabled).toBe(false);
    });

    it('should record bundle size metric', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useBundleAnalyzerIntegration(config, recordMetric);
      integration.recordBundleSize('main', 500000, 200000);

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'bundle-analyzer',
          type: 'bundle',
          data: expect.objectContaining({
            bundleName: 'main',
            size: 500000,
            gzipSize: 200000,
          }),
        }),
      );
    });

    it('should not record when disabled', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: false } });
      const recordMetric = vi.fn();

      const integration = useBundleAnalyzerIntegration(config, recordMetric);
      integration.recordBundleSize('main', 500000);

      expect(recordMetric).not.toHaveBeenCalled();
    });

    it('should record chunk info', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useBundleAnalyzerIntegration(config, recordMetric);
      integration.recordChunkInfo('vendor', 300000, ['react', 'react-dom']);

      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'bundle-analyzer',
          type: 'bundle',
          data: expect.objectContaining({
            chunkName: 'vendor',
            size: 300000,
            moduleCount: 2,
          }),
        }),
      );
    });

    it('should generate size report', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
      const recordMetric = vi.fn();

      const integration = useBundleAnalyzerIntegration(config, recordMetric);
      integration.recordBundleSize('main', 500000, 200000);
      integration.recordBundleSize('vendor', 300000, 100000);

      const report = integration.generateSizeReport();

      expect(report).toHaveProperty('main');
      expect(report).toHaveProperty('vendor');
    });
  });

  describe('validateBundleAnalyzerConfig', () => {
    it('should return valid for proper config', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });

      const result = validateBundleAnalyzerConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error when bundleAnalyzer is missing', () => {
      const config = createBaseConfig();
      delete (config as { bundleAnalyzer?: unknown }).bundleAnalyzer;

      const result = validateBundleAnalyzerConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('missing'))).toBe(true);
    });

    it('should error on non-boolean enabled', () => {
      const config = createBaseConfig({
        bundleAnalyzer: { enabled: 'yes' as unknown as boolean },
      });

      const result = validateBundleAnalyzerConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('boolean'))).toBe(true);
    });

    it('should warn on invalid port', () => {
      const config = createBaseConfig({
        bundleAnalyzer: { enabled: true, port: -1 },
      });

      const result = validateBundleAnalyzerConfig(config);

      expect(result.warnings.some((w) => w.includes('port'))).toBe(true);
    });

    it('should warn on invalid reportDir', () => {
      const config = createBaseConfig({
        bundleAnalyzer: { enabled: true, reportDir: 123 as unknown as string },
      });

      const result = validateBundleAnalyzerConfig(config);

      expect(result.warnings.some((w) => w.includes('reportDir'))).toBe(true);
    });
  });

  describe('BundleAnalyzerAnalyzer', () => {
    describe('constructor', () => {
      it('should create instance', () => {
        const config = createBaseConfig();
        const analyzer = new BundleAnalyzerAnalyzer(config);

        expect(analyzer).toBeInstanceOf(BundleAnalyzerAnalyzer);
      });
    });

    describe('recordBundleSize', () => {
      it('should record bundle size when enabled', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('main', 500000, 200000);

        const report = analyzer.generateBundleReport();
        expect(report.totalBundles).toBe(1);
      });

      it('should not record when disabled', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: false } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('main', 500000);

        const report = analyzer.generateBundleReport();
        expect(report.totalBundles).toBe(0);
      });

      it('should log warning when size exceeds threshold', () => {
        const config = createBaseConfig({
          bundleAnalyzer: { enabled: true },
          bundle: { enabled: true, thresholds: { size: 500000 } },
        });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('main', 1000000);

        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('exceeds size limit'),
          expect.any(Object),
        );
      });
    });

    describe('recordChunkInfo', () => {
      it('should record chunk info when enabled', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordChunkInfo('vendor', 300000, ['react', 'react-dom']);

        const report = analyzer.generateChunkReport();
        expect(report.totalChunks).toBe(1);
      });

      it('should log warning when chunk exceeds threshold', () => {
        const config = createBaseConfig({
          bundleAnalyzer: { enabled: true },
          bundle: { enabled: true, thresholds: { size: 100000 } },
        });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordChunkInfo('vendor', 600000, ['react']);

        expect(logger.warn).toHaveBeenCalled();
      });
    });

    describe('generateBundleReport', () => {
      it('should return report structure', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        const report = analyzer.generateBundleReport();

        expect(report).toHaveProperty('totalBundles');
        expect(report).toHaveProperty('totalSize');
        expect(report).toHaveProperty('totalGzipSize');
        expect(report).toHaveProperty('largestBundles');
        expect(report).toHaveProperty('recommendations');
      });

      it('should calculate totals correctly', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('main', 500000, 200000);
        analyzer.recordBundleSize('vendor', 300000, 100000);

        const report = analyzer.generateBundleReport();

        expect(report.totalSize).toBe(800000);
        expect(report.totalGzipSize).toBe(300000);
      });

      it('should sort largest bundles by size', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('small', 100000);
        analyzer.recordBundleSize('large', 500000);
        analyzer.recordBundleSize('medium', 300000);

        const report = analyzer.generateBundleReport();

        expect(report.largestBundles[0].name).toBe('large');
        expect(report.largestBundles[1].name).toBe('medium');
        expect(report.largestBundles[2].name).toBe('small');
      });

      it('should calculate compression ratio', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('main', 1000000, 300000);

        const report = analyzer.generateBundleReport();

        expect(report.largestBundles[0].compressionRatio).toBe(0.3);
      });

      it('should generate recommendations for large total size', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        // Add 6MB total
        analyzer.recordBundleSize('main', 3000000);
        analyzer.recordBundleSize('vendor', 3000000);

        const report = analyzer.generateBundleReport();

        expect(
          report.recommendations.some((r) => r.includes('code splitting')),
        ).toBe(true);
      });
    });

    describe('generateChunkReport', () => {
      it('should return report structure', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        const report = analyzer.generateChunkReport();

        expect(report).toHaveProperty('totalChunks');
        expect(report).toHaveProperty('totalSize');
        expect(report).toHaveProperty('largestChunks');
        expect(report).toHaveProperty('duplicateModules');
      });

      it('should detect duplicate modules', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordChunkInfo('chunk1', 100000, ['lodash', 'react']);
        analyzer.recordChunkInfo('chunk2', 100000, ['lodash', 'axios']);

        const report = analyzer.generateChunkReport();

        expect(report.duplicateModules.some((d) => d.module === 'lodash')).toBe(
          true,
        );
      });
    });

    describe('getOptimizationSuggestions', () => {
      it('should return suggestions array', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        const suggestions = analyzer.getOptimizationSuggestions();

        expect(Array.isArray(suggestions)).toBe(true);
      });

      it('should suggest code splitting for large bundles', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('main', 6000000);

        const suggestions = analyzer.getOptimizationSuggestions();

        expect(suggestions.some((s) => s.includes('code splitting'))).toBe(
          true,
        );
      });

      it('should suggest shared chunks for duplicates', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordChunkInfo('chunk1', 100000, ['lodash']);
        analyzer.recordChunkInfo('chunk2', 100000, ['lodash']);

        const suggestions = analyzer.getOptimizationSuggestions();

        expect(
          suggestions.some(
            (s) => s.includes('duplicate') || s.includes('shared'),
          ),
        ).toBe(true);
      });
    });

    describe('reset', () => {
      it('should clear all data', () => {
        const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });
        const analyzer = new BundleAnalyzerAnalyzer(config);

        analyzer.recordBundleSize('main', 500000);
        analyzer.recordChunkInfo('vendor', 300000, ['react']);

        analyzer.reset();

        const bundleReport = analyzer.generateBundleReport();
        const chunkReport = analyzer.generateChunkReport();

        expect(bundleReport.totalBundles).toBe(0);
        expect(chunkReport.totalChunks).toBe(0);
      });
    });
  });

  describe('BundleAnalyzerUtils', () => {
    describe('calculateCompressionRatio', () => {
      it('should calculate correct ratio', () => {
        const ratio = BundleAnalyzerUtils.calculateCompressionRatio(1000, 300);

        expect(ratio).toBe(0.3);
      });
    });

    describe('getSizeRating', () => {
      it('should return small for < 100KB', () => {
        expect(BundleAnalyzerUtils.getSizeRating(50000)).toBe('small');
      });

      it('should return medium for 100KB - 500KB', () => {
        expect(BundleAnalyzerUtils.getSizeRating(300000)).toBe('medium');
      });

      it('should return large for 500KB - 1MB', () => {
        expect(BundleAnalyzerUtils.getSizeRating(800000)).toBe('large');
      });

      it('should return huge for >= 1MB', () => {
        expect(BundleAnalyzerUtils.getSizeRating(1500000)).toBe('huge');
      });
    });

    describe('estimateLoadingTime', () => {
      it('should estimate loading time for slow connection', () => {
        const time = BundleAnalyzerUtils.estimateLoadingTime(1000000, 'slow');

        expect(time).toBeGreaterThan(0);
      });

      it('should estimate loading time for average connection', () => {
        const time = BundleAnalyzerUtils.estimateLoadingTime(
          1000000,
          'average',
        );

        expect(time).toBeGreaterThan(0);
      });

      it('should estimate loading time for fast connection', () => {
        const time = BundleAnalyzerUtils.estimateLoadingTime(1000000, 'fast');

        expect(time).toBeGreaterThan(0);
      });

      it('should be faster for fast connections', () => {
        const slowTime = BundleAnalyzerUtils.estimateLoadingTime(
          1000000,
          'slow',
        );
        const fastTime = BundleAnalyzerUtils.estimateLoadingTime(
          1000000,
          'fast',
        );

        expect(fastTime).toBeLessThan(slowTime);
      });
    });
  });
});
