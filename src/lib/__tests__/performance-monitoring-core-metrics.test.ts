import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import type {
  PerformanceConfig,
  PerformanceMetrics,
} from '@/lib/performance-monitoring-types';
import {
  createMetricsManager,
  PerformanceMetricsManager,
} from '../performance-monitoring-core-metrics';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Helper to create a valid config
function createTestConfig(
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
    component: {
      enabled: true,
      thresholds: { renderTime: 100 },
    },
    network: {
      enabled: true,
      thresholds: { responseTime: 200 },
    },
    bundle: {
      enabled: true,
      thresholds: { size: 1048576 },
    },
    ...overrides,
  };
}

// Helper to create a test metric
function createTestMetric(
  overrides?: Partial<Omit<PerformanceMetrics, 'timestamp'>>,
): Omit<PerformanceMetrics, 'timestamp'> {
  return {
    type: 'component',
    source: 'custom',
    data: { renderTime: 50 },
    ...overrides,
  };
}

describe('performance-monitoring-core-metrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('PerformanceMetricsManager', () => {
    describe('constructor', () => {
      it('should create instance with config', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        expect(manager).toBeInstanceOf(PerformanceMetricsManager);
        manager.destroy();
      });

      it('should setup periodic cleanup', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        // Should have set up an interval
        manager.destroy();
      });
    });

    describe('recordMetric', () => {
      it('should record a metric when global is enabled', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());

        const metrics = manager.getAllMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].type).toBe('component');
        manager.destroy();
      });

      it('should not record metric when global is disabled', () => {
        const config = createTestConfig({
          global: {
            enabled: false,
            dataRetentionTime: 300000,
            maxMetrics: 100,
          },
        });
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());

        expect(manager.getAllMetrics()).toHaveLength(0);
        manager.destroy();
      });

      it('should not record metric when module is disabled', () => {
        const config = createTestConfig({
          component: { enabled: false, thresholds: { renderTime: 100 } },
        });
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ type: 'component' }));

        expect(manager.getAllMetrics()).toHaveLength(0);
        manager.destroy();
      });

      it('should assign a generated ID when not provided', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());

        const metrics = manager.getAllMetrics();
        expect(metrics[0].id).toMatch(/^metric_/);
        manager.destroy();
      });

      it('should use provided ID when available', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ id: 'custom-id' }));

        const metrics = manager.getAllMetrics();
        expect(metrics[0].id).toBe('custom-id');
        manager.destroy();
      });

      it('should record tags when provided', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ tags: ['tag1', 'tag2'] }));

        const metrics = manager.getAllMetrics();
        expect(metrics[0].tags).toEqual(['tag1', 'tag2']);
        manager.destroy();
      });

      it('should record priority when provided', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ priority: 'high' }));

        const metrics = manager.getAllMetrics();
        expect(metrics[0].priority).toBe('high');
        manager.destroy();
      });

      it('should log warning when component metric exceeds threshold', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(
          createTestMetric({
            type: 'component',
            data: { renderTime: 150 }, // Exceeds 100ms threshold
          }),
        );

        expect(logger.warn).toHaveBeenCalledWith(
          'Performance warning: component metric exceeded threshold',
          expect.any(Object),
        );
        manager.destroy();
      });

      it('should log warning when network metric exceeds threshold', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(
          createTestMetric({
            type: 'network',
            source: 'custom',
            data: { responseTime: 300 }, // Exceeds 200ms threshold
          }),
        );

        expect(logger.warn).toHaveBeenCalledWith(
          'Performance warning: network metric exceeded threshold',
          expect.any(Object),
        );
        manager.destroy();
      });

      it('should log warning when bundle metric exceeds threshold', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(
          createTestMetric({
            type: 'bundle',
            source: 'bundle-analyzer',
            data: { size: 2000000 }, // Exceeds 1MB threshold
          }),
        );

        expect(logger.warn).toHaveBeenCalledWith(
          'Performance warning: bundle metric exceeded threshold',
          expect.any(Object),
        );
        manager.destroy();
      });

      it('should not log warning when metric is within threshold', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(
          createTestMetric({
            type: 'component',
            data: { renderTime: 50 }, // Within 100ms threshold
          }),
        );

        expect(logger.warn).not.toHaveBeenCalled();
        manager.destroy();
      });

      it('should trigger cleanup when exceeding max metrics buffer', () => {
        const config = createTestConfig({
          global: { enabled: true, dataRetentionTime: 300000, maxMetrics: 10 },
        });
        const manager = new PerformanceMetricsManager(config);

        // Record 12 metrics to trigger cleanup (10 + 10% buffer)
        for (let i = 0; i < 12; i++) {
          manager.recordMetric(createTestMetric({ id: `metric-${i}` }));
        }

        // After cleanup, should be trimmed
        expect(manager.getAllMetrics().length).toBeLessThanOrEqual(10);
        manager.destroy();
      });
    });

    describe('getAllMetrics', () => {
      it('should return all recorded metrics', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ id: '1' }));
        manager.recordMetric(createTestMetric({ id: '2' }));
        manager.recordMetric(createTestMetric({ id: '3' }));

        expect(manager.getAllMetrics()).toHaveLength(3);
        manager.destroy();
      });

      it('should return a copy of metrics array', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());

        const metrics1 = manager.getAllMetrics();
        const metrics2 = manager.getAllMetrics();

        expect(metrics1).not.toBe(metrics2);
        manager.destroy();
      });
    });

    describe('getMetricsInTimeWindow', () => {
      it('should return metrics within time window', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        // Record a metric
        manager.recordMetric(createTestMetric({ id: '1' }));

        // Advance time by 30 seconds
        vi.advanceTimersByTime(30000);

        // Record another metric
        manager.recordMetric(createTestMetric({ id: '2' }));

        // Get metrics in last 60 seconds
        const metrics = manager.getMetricsInTimeWindow(60000);
        expect(metrics.length).toBe(2);

        // Get metrics in last 15 seconds
        const recentMetrics = manager.getMetricsInTimeWindow(15000);
        expect(recentMetrics.length).toBe(1);
        expect(recentMetrics[0].id).toBe('2');

        manager.destroy();
      });
    });

    describe('getMetricsByType', () => {
      it('should filter metrics by type', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ type: 'component' }));
        manager.recordMetric(
          createTestMetric({ type: 'network', data: { responseTime: 50 } }),
        );
        manager.recordMetric(createTestMetric({ type: 'component' }));

        const componentMetrics = manager.getMetricsByType('component');
        expect(componentMetrics).toHaveLength(2);

        const networkMetrics = manager.getMetricsByType('network');
        expect(networkMetrics).toHaveLength(1);

        manager.destroy();
      });
    });

    describe('getMetricsBySource', () => {
      it('should filter metrics by source', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ source: 'custom' }));
        manager.recordMetric(createTestMetric({ source: 'react-scan' }));
        manager.recordMetric(createTestMetric({ source: 'custom' }));

        const customMetrics = manager.getMetricsBySource('custom');
        expect(customMetrics).toHaveLength(2);

        const reactScanMetrics = manager.getMetricsBySource('react-scan');
        expect(reactScanMetrics).toHaveLength(1);

        manager.destroy();
      });
    });

    describe('getMetricsStats', () => {
      it('should return empty stats when no metrics', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        const stats = manager.getMetricsStats();

        expect(stats.total).toBe(0);
        expect(stats.averageValue).toBe(0);
        manager.destroy();
      });

      it('should calculate statistics correctly', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(
          createTestMetric({
            type: 'component',
            source: 'custom',
            data: { renderTime: 50 },
          }),
        );
        manager.recordMetric(
          createTestMetric({
            type: 'component',
            source: 'react-scan',
            data: { renderTime: 100 },
          }),
        );
        manager.recordMetric(
          createTestMetric({
            type: 'network',
            source: 'custom',
            data: { responseTime: 150 },
          }),
        );

        const stats = manager.getMetricsStats();

        expect(stats.total).toBe(3);
        expect(stats.byType['component']).toBe(2);
        expect(stats.byType['network']).toBe(1);
        expect(stats.bySource['custom']).toBe(2);
        expect(stats.bySource['react-scan']).toBe(1);
        expect(stats.averageValue).toBe(100); // (50 + 100 + 150) / 3

        manager.destroy();
      });

      it('should calculate time range correctly', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());

        vi.advanceTimersByTime(10000);
        manager.recordMetric(createTestMetric());

        const stats = manager.getMetricsStats();

        expect(stats.timeRange.span).toBeGreaterThanOrEqual(10000);
        manager.destroy();
      });
    });

    describe('calculateAverageMetricsPerMinute', () => {
      it('should return 0 when no metrics', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        expect(manager.calculateAverageMetricsPerMinute()).toBe(0);
        manager.destroy();
      });

      it('should calculate average metrics per minute', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        // Record 6 metrics over 1 minute
        for (let i = 0; i < 6; i++) {
          manager.recordMetric(createTestMetric());
          vi.advanceTimersByTime(10000); // 10 seconds each
        }

        const avg = manager.calculateAverageMetricsPerMinute();
        expect(avg).toBeGreaterThan(0);

        manager.destroy();
      });
    });

    describe('getRecentMetrics', () => {
      it('should return most recent metrics', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        for (let i = 0; i < 15; i++) {
          manager.recordMetric(createTestMetric({ id: `metric-${i}` }));
          vi.advanceTimersByTime(1000);
        }

        const recent = manager.getRecentMetrics(5);
        expect(recent).toHaveLength(5);
        // Most recent should be first
        expect(recent[0].id).toBe('metric-14');

        manager.destroy();
      });

      it('should use default count of 10', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        for (let i = 0; i < 15; i++) {
          manager.recordMetric(createTestMetric());
        }

        const recent = manager.getRecentMetrics();
        expect(recent).toHaveLength(10);

        manager.destroy();
      });
    });

    describe('findMetric', () => {
      it('should find metric by id', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ id: 'target-metric' }));

        const found = manager.findMetric('target-metric');
        expect(found).toBeDefined();
        expect(found?.id).toBe('target-metric');

        manager.destroy();
      });

      it('should return undefined for non-existent id', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        const found = manager.findMetric('non-existent');
        expect(found).toBeUndefined();

        manager.destroy();
      });
    });

    describe('removeMetric', () => {
      it('should remove metric by id', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ id: 'to-remove' }));
        expect(manager.getAllMetrics()).toHaveLength(1);

        const result = manager.removeMetric('to-remove');

        expect(result).toBe(true);
        expect(manager.getAllMetrics()).toHaveLength(0);

        manager.destroy();
      });

      it('should return false for non-existent id', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        const result = manager.removeMetric('non-existent');
        expect(result).toBe(false);

        manager.destroy();
      });
    });

    describe('clearAllMetrics', () => {
      it('should clear all metrics', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());
        manager.recordMetric(createTestMetric());
        expect(manager.getAllMetrics()).toHaveLength(2);

        manager.clearAllMetrics();

        expect(manager.getAllMetrics()).toHaveLength(0);

        manager.destroy();
      });
    });

    describe('updateConfig', () => {
      it('should update configuration', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        const newConfig = createTestConfig({
          global: {
            enabled: false,
            dataRetentionTime: 600000,
            maxMetrics: 200,
          },
        });

        manager.updateConfig(newConfig);

        // Metrics should no longer be recorded with global disabled
        manager.recordMetric(createTestMetric());
        expect(manager.getAllMetrics()).toHaveLength(0);

        manager.destroy();
      });
    });

    describe('exportMetrics', () => {
      it('should export metrics with stats', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());

        const exported = manager.exportMetrics();

        expect(exported).toHaveProperty('metrics');
        expect(exported).toHaveProperty('exportTime');
        expect(exported).toHaveProperty('stats');
        expect(exported.metrics).toHaveLength(1);

        manager.destroy();
      });
    });

    describe('importMetrics', () => {
      it('should import valid metrics', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        const metricsToImport: PerformanceMetrics[] = [
          {
            id: 'imported-1',
            type: 'component',
            source: 'custom',
            data: { renderTime: 50 },
            timestamp: Date.now(),
          },
          {
            id: 'imported-2',
            type: 'network',
            source: 'custom',
            data: { responseTime: 100 },
            timestamp: Date.now(),
          },
        ];

        const count = manager.importMetrics(metricsToImport);

        expect(count).toBe(2);
        expect(manager.getAllMetrics()).toHaveLength(2);

        manager.destroy();
      });

      it('should replace existing metrics when replace=true', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric({ id: 'existing' }));

        const metricsToImport: PerformanceMetrics[] = [
          {
            id: 'imported',
            type: 'component',
            source: 'custom',
            data: { renderTime: 50 },
            timestamp: Date.now(),
          },
        ];

        manager.importMetrics(metricsToImport, true);

        expect(manager.getAllMetrics()).toHaveLength(1);
        expect(manager.getAllMetrics()[0].id).toBe('imported');

        manager.destroy();
      });

      it('should filter out invalid metrics', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        const metricsToImport = [
          {
            id: 'valid',
            type: 'component',
            source: 'custom',
            data: { renderTime: 50 },
            timestamp: Date.now(),
          },
          {
            // Missing required fields
            id: 'invalid',
          } as unknown as PerformanceMetrics,
        ];

        const count = manager.importMetrics(metricsToImport);

        expect(count).toBe(1);

        manager.destroy();
      });
    });

    describe('destroy', () => {
      it('should clean up resources', () => {
        const config = createTestConfig();
        const manager = new PerformanceMetricsManager(config);

        manager.recordMetric(createTestMetric());

        manager.destroy();

        expect(manager.getAllMetrics()).toHaveLength(0);
      });
    });
  });

  describe('createMetricsManager', () => {
    it('should create a PerformanceMetricsManager instance', () => {
      const config = createTestConfig();
      const manager = createMetricsManager(config);

      expect(manager).toBeInstanceOf(PerformanceMetricsManager);
      manager.destroy();
    });
  });
});
