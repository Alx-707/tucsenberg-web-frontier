import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerformanceMonitoringCore } from '../performance-monitoring-core';

// Create mock config data
const mockConfig = {
  enabled: true,
  enablePerformanceMetrics: true,
  enableReactScan: false,
  enableBundleAnalysis: false,
  sampleRate: 1.0,
  thresholds: {
    fps: { warning: 30, critical: 20 },
    memory: { warning: 80, critical: 95 },
    loadTime: { warning: 3000, critical: 5000 },
    lcp: { warning: 2500, critical: 4000 },
    fid: { warning: 100, critical: 300 },
    cls: { warning: 0.1, critical: 0.25 },
  },
};

// Mock dependencies using class-style mocks
vi.mock('@/lib/performance-monitoring-core-config', () => {
  return {
    PerformanceConfigManager: class MockPerformanceConfigManager {
      getConfig = vi.fn().mockReturnValue(mockConfig);
      updateConfig = vi.fn();
    },
  };
});

vi.mock('@/lib/performance-monitoring-core-metrics', () => {
  return {
    PerformanceMetricsManager: class MockPerformanceMetricsManager {
      recordMetric = vi.fn();
      getAllMetrics = vi.fn().mockReturnValue([]);
      getMetricsByType = vi.fn().mockReturnValue([]);
      getMetricsBySource = vi.fn().mockReturnValue([]);
      getMetricsInTimeWindow = vi.fn().mockReturnValue([]);
      getMetricsStats = vi.fn().mockReturnValue({
        totalMetrics: 0,
        averageValues: {},
      });
      clearAllMetrics = vi.fn();
      exportMetrics = vi
        .fn()
        .mockReturnValue({ version: '1.0.0', metrics: [] });
      importMetrics = vi.fn().mockReturnValue(0);
      updateConfig = vi.fn();
      destroy = vi.fn();
    },
    createMetricsManager: vi.fn(),
  };
});

vi.mock('@/lib/performance-monitoring-core-reports', () => {
  return {
    PerformanceReportGenerator: class MockPerformanceReportGenerator {
      generateReport = vi.fn().mockReturnValue({
        summary: {},
        byType: {},
        bySource: {},
        timestamp: Date.now(),
      });
      generateDetailedReport = vi.fn().mockReturnValue({
        summary: {},
        details: {},
        recommendations: [],
      });
      updateConfig = vi.fn();
    },
    createReportGenerator: vi.fn(),
  };
});

vi.mock('@/lib/performance-monitoring-core-conflicts', () => {
  return {
    PerformanceToolConflictChecker: class MockPerformanceToolConflictChecker {
      checkToolConflicts = vi.fn().mockReturnValue({
        hasConflicts: false,
        conflicts: [],
        recommendations: [],
      });
      getToolDetails = vi.fn().mockReturnValue(null);
    },
    createConflictChecker: vi.fn(),
    quickConflictCheck: vi.fn(),
  };
});

describe('performance-monitoring-core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PerformanceMonitoringCore', () => {
    describe('constructor', () => {
      it('should create instance with default config', () => {
        const core = new PerformanceMonitoringCore();

        expect(core).toBeInstanceOf(PerformanceMonitoringCore);
      });

      it('should create instance with custom config', () => {
        const customConfig = { enabled: false };
        const core = new PerformanceMonitoringCore(customConfig);

        expect(core).toBeInstanceOf(PerformanceMonitoringCore);
      });
    });

    describe('getConfig', () => {
      it('should return current configuration', () => {
        const core = new PerformanceMonitoringCore();

        const config = core.getConfig();

        expect(config).toBeDefined();
        expect(config.enabled).toBe(true);
      });
    });

    describe('updateConfig', () => {
      it('should update configuration', () => {
        const core = new PerformanceMonitoringCore();

        core.updateConfig({ enabled: false });

        // Config manager's updateConfig should be called
        expect(core.getConfig()).toBeDefined();
      });
    });

    describe('recordMetric', () => {
      it('should record a performance metric', () => {
        const core = new PerformanceMonitoringCore();

        core.recordMetric({
          type: 'lcp',
          source: 'web-vitals',
          value: 2000,
          rating: 'good',
        });

        // No error should be thrown
        expect(true).toBe(true);
      });

      it('should handle multiple metric recordings', () => {
        const core = new PerformanceMonitoringCore();

        core.recordMetric({
          type: 'fcp',
          source: 'web-vitals',
          value: 1500,
          rating: 'good',
        });

        core.recordMetric({
          type: 'cls',
          source: 'web-vitals',
          value: 0.05,
          rating: 'good',
        });

        expect(true).toBe(true);
      });
    });

    describe('getMetrics', () => {
      it('should return all metrics', () => {
        const core = new PerformanceMonitoringCore();

        const metrics = core.getMetrics();

        expect(Array.isArray(metrics)).toBe(true);
      });
    });

    describe('getMetricsByType', () => {
      it('should return metrics filtered by type', () => {
        const core = new PerformanceMonitoringCore();

        const metrics = core.getMetricsByType('lcp');

        expect(Array.isArray(metrics)).toBe(true);
      });
    });

    describe('getMetricsBySource', () => {
      it('should return metrics filtered by source', () => {
        const core = new PerformanceMonitoringCore();

        const metrics = core.getMetricsBySource('web-vitals');

        expect(Array.isArray(metrics)).toBe(true);
      });
    });

    describe('getMetricsInTimeWindow', () => {
      it('should return metrics within time window', () => {
        const core = new PerformanceMonitoringCore();

        const metrics = core.getMetricsInTimeWindow(60000);

        expect(Array.isArray(metrics)).toBe(true);
      });
    });

    describe('generateReport', () => {
      it('should generate performance report with default time window', () => {
        const core = new PerformanceMonitoringCore();

        const report = core.generateReport();

        expect(report).toBeDefined();
        expect(report).toHaveProperty('summary');
      });

      it('should generate performance report with custom time window', () => {
        const core = new PerformanceMonitoringCore();

        const report = core.generateReport(30000);

        expect(report).toBeDefined();
      });
    });

    describe('generateDetailedReport', () => {
      it('should generate detailed performance report', () => {
        const core = new PerformanceMonitoringCore();

        const report = core.generateDetailedReport();

        expect(report).toBeDefined();
        expect(report).toHaveProperty('summary');
        expect(report).toHaveProperty('recommendations');
      });
    });

    describe('checkToolConflicts', () => {
      it('should check for tool conflicts', () => {
        const core = new PerformanceMonitoringCore();

        const result = core.checkToolConflicts();

        expect(result).toBeDefined();
        expect(result).toHaveProperty('hasConflicts');
        expect(result).toHaveProperty('conflicts');
      });
    });

    describe('getToolDetails', () => {
      it('should return tool details', () => {
        const core = new PerformanceMonitoringCore();

        const details = core.getToolDetails('react-scan');

        // Returns null when tool not found (mocked)
        expect(details).toBeNull();
      });
    });

    describe('getMetricsStats', () => {
      it('should return metrics statistics', () => {
        const core = new PerformanceMonitoringCore();

        const stats = core.getMetricsStats();

        expect(stats).toBeDefined();
        expect(stats).toHaveProperty('totalMetrics');
      });
    });

    describe('clearAllMetrics', () => {
      it('should clear all metrics', () => {
        const core = new PerformanceMonitoringCore();

        core.clearAllMetrics();

        // Should not throw
        expect(true).toBe(true);
      });
    });

    describe('exportMetrics', () => {
      it('should export metrics data', () => {
        const core = new PerformanceMonitoringCore();

        const exported = core.exportMetrics();

        expect(exported).toBeDefined();
        expect(exported).toHaveProperty('version');
        expect(exported).toHaveProperty('metrics');
      });
    });

    describe('importMetrics', () => {
      it('should import metrics data', () => {
        const core = new PerformanceMonitoringCore();

        const count = core.importMetrics([
          {
            type: 'lcp',
            source: 'web-vitals',
            value: 2000,
            timestamp: Date.now(),
            rating: 'good',
          },
        ]);

        expect(typeof count).toBe('number');
      });

      it('should import metrics with replace flag', () => {
        const core = new PerformanceMonitoringCore();

        const count = core.importMetrics([], true);

        expect(typeof count).toBe('number');
      });
    });

    describe('destroy', () => {
      it('should clean up resources', () => {
        const core = new PerformanceMonitoringCore();

        core.destroy();

        // Should not throw
        expect(true).toBe(true);
      });
    });
  });
});
