import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  PerformanceConfig,
  PerformanceMetrics,
} from '@/lib/performance-monitoring-types';
import {
  createReportGenerator,
  PerformanceReportGenerator,
} from '../performance-monitoring-core-reports';

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
      thresholds: { size: 1048576 }, // 1MB
    },
    ...overrides,
  };
}

// Helper to create test metrics
function createComponentMetric(
  renderTime: number,
  timestamp?: number,
  id?: string,
): PerformanceMetrics {
  return {
    id: id || `component-${Math.random()}`,
    type: 'component',
    source: 'custom',
    data: { renderTime },
    timestamp: timestamp || Date.now(),
  };
}

function createNetworkMetric(
  responseTime: number,
  timestamp?: number,
  id?: string,
): PerformanceMetrics {
  return {
    id: id || `network-${Math.random()}`,
    type: 'network',
    source: 'custom',
    data: { responseTime },
    timestamp: timestamp || Date.now(),
  };
}

function createBundleMetric(
  size: number,
  timestamp?: number,
  id?: string,
): PerformanceMetrics {
  return {
    id: id || `bundle-${Math.random()}`,
    type: 'bundle',
    source: 'bundle-analyzer',
    data: { size },
    timestamp: timestamp || Date.now(),
  };
}

describe('performance-monitoring-core-reports', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('PerformanceReportGenerator', () => {
    describe('constructor', () => {
      it('should create instance with config', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);

        expect(generator).toBeInstanceOf(PerformanceReportGenerator);
      });
    });

    describe('generateReport', () => {
      it('should generate report with empty metrics', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);

        const report = generator.generateReport([]);

        expect(report.summary.totalMetrics).toBe(0);
        expect(report.details).toEqual([]);
        expect(report.recommendations).toContain(
          '当前性能表现良好，继续保持！',
        );
      });

      it('should filter metrics within time window', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(50, now - 30000), // 30 seconds ago
          createComponentMetric(60, now - 120000), // 2 minutes ago
        ];

        // Use 1 minute time window
        const report = generator.generateReport(metrics, 60000);

        expect(report.summary.totalMetrics).toBe(1);
      });

      it('should generate summary with sources and types', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(50, now),
          createNetworkMetric(100, now),
          createBundleMetric(500000, now),
        ];

        const report = generator.generateReport(metrics);

        expect(report.summary.sources).toContain('custom');
        expect(report.summary.sources).toContain('bundle-analyzer');
        expect(report.summary.types).toContain('component');
        expect(report.summary.types).toContain('network');
        expect(report.summary.types).toContain('bundle');
      });

      it('should calculate average metrics per minute', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(50, now),
          createComponentMetric(60, now),
          createComponentMetric(70, now),
        ];

        const report = generator.generateReport(metrics, 60000);

        expect(report.summary.averageMetricsPerMinute).toBeGreaterThan(0);
      });

      it('should include performance score', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(50, now),
          createNetworkMetric(100, now),
        ];

        const report = generator.generateReport(metrics);

        expect(report.score).toBeDefined();
        expect(report.score?.overall).toBeGreaterThan(0);
        expect(report.score?.component).toBeGreaterThan(0);
        expect(report.score?.network).toBeGreaterThan(0);
      });
    });

    describe('recommendations', () => {
      it('should recommend optimization for slow components', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(150, now), // Exceeds 100ms threshold
          createComponentMetric(200, now),
        ];

        const report = generator.generateReport(metrics);

        expect(
          report.recommendations.some((r) =>
            r.includes('组件渲染时间超过阈值'),
          ),
        ).toBe(true);
      });

      it('should recommend optimization for slow network requests', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createNetworkMetric(300, now), // Exceeds 200ms threshold
          createNetworkMetric(400, now),
        ];

        const report = generator.generateReport(metrics);

        expect(
          report.recommendations.some((r) =>
            r.includes('网络请求响应时间超过阈值'),
          ),
        ).toBe(true);
      });

      it('should recommend code splitting for large bundles', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createBundleMetric(2000000, now), // Exceeds 1MB threshold
          createBundleMetric(1500000, now),
        ];

        const report = generator.generateReport(metrics);

        expect(
          report.recommendations.some((r) =>
            r.includes('打包文件大小超过阈值'),
          ),
        ).toBe(true);
      });

      it('should recommend React.memo for high average render time', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Create metrics with average render time > 50ms
        const metrics = [
          createComponentMetric(60, now),
          createComponentMetric(70, now),
          createComponentMetric(80, now),
        ];

        const report = generator.generateReport(metrics);

        expect(
          report.recommendations.some((r) => r.includes('React.memo')),
        ).toBe(true);
      });

      it('should recommend caching for high average response time', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // ANIMATION_DURATION_SLOW is 500, so we need avg > 500
        // Create metrics with average response time > 500ms
        const metrics = [
          createNetworkMetric(600, now),
          createNetworkMetric(550, now),
          createNetworkMetric(500, now),
        ];

        const report = generator.generateReport(metrics);

        // The recommendation is triggered when avgResponseTime > ANIMATION_DURATION_SLOW (500)
        // (600 + 550 + 500) / 3 = 550 > 500
        expect(
          report.recommendations.some((r) => r.includes('缓存或CDN')),
        ).toBe(true);
      });

      it('should recommend lazy loading for large total bundle size', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Create metrics with total size > 5MB
        const metrics = [
          createBundleMetric(2000000, now),
          createBundleMetric(2000000, now),
          createBundleMetric(2000000, now),
        ];

        const report = generator.generateReport(metrics);

        expect(
          report.recommendations.some((r) => r.includes('动态导入和懒加载')),
        ).toBe(true);
      });

      it('should warn about high metric count', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Create more than 100 metrics
        const metrics = Array.from({ length: 105 }, (_, i) =>
          createComponentMetric(50, now, `metric-${i}`),
        );

        const report = generator.generateReport(metrics);

        expect(
          report.recommendations.some((r) => r.includes('性能指标数量较多')),
        ).toBe(true);
      });
    });

    describe('performance scoring', () => {
      it('should give high score for fast components', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Render time <= threshold * 0.5 (50ms) = 100 score
        const metrics = [
          createComponentMetric(40, now),
          createComponentMetric(45, now),
        ];

        const report = generator.generateReport(metrics);

        expect(report.score?.component).toBe(100);
      });

      it('should give 80 score for components at threshold', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Render time <= threshold (100ms) = 80 score
        const metrics = [
          createComponentMetric(90, now),
          createComponentMetric(95, now),
        ];

        const report = generator.generateReport(metrics);

        expect(report.score?.component).toBe(80);
      });

      it('should give lower scores for slow components', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Render time > threshold * 2 (200ms) = 20 score
        const metrics = [
          createComponentMetric(250, now),
          createComponentMetric(300, now),
        ];

        const report = generator.generateReport(metrics);

        expect(report.score?.component).toBe(20);
      });

      it('should calculate weighted overall score', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(40, now), // 100 score
          createNetworkMetric(50, now), // 100 score (fast)
          createBundleMetric(500000, now), // 100 score (small)
        ];

        const report = generator.generateReport(metrics);

        // All components score 100, so overall should be 100
        expect(report.score?.overall).toBe(100);
      });
    });

    describe('generateDetailedReport', () => {
      it('should generate detailed report structure', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(50, now),
          createNetworkMetric(100, now),
          createBundleMetric(500000, now),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(report).toHaveProperty('overview');
        expect(report).toHaveProperty('analysis');
        expect(report).toHaveProperty('trends');
        expect(report.analysis).toHaveProperty('componentAnalysis');
        expect(report.analysis).toHaveProperty('networkAnalysis');
        expect(report.analysis).toHaveProperty('bundleAnalysis');
      });

      it('should identify slowest components', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(150, now, 'slow-1'),
          createComponentMetric(200, now, 'slow-2'),
          createComponentMetric(50, now, 'fast-1'),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(
          report.analysis.componentAnalysis.slowestComponents,
        ).toHaveLength(2);
        expect(
          report.analysis.componentAnalysis.slowestComponents[0].name,
        ).toBe('slow-2');
      });

      it('should calculate average render time', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createComponentMetric(50, now),
          createComponentMetric(100, now),
          createComponentMetric(150, now),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(report.analysis.componentAnalysis.averageRenderTime).toBe(100);
      });

      it('should identify slowest network requests', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createNetworkMetric(300, now, 'slow-api'),
          createNetworkMetric(250, now, 'slower-api'),
          createNetworkMetric(100, now, 'fast-api'),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(report.analysis.networkAnalysis.slowestRequests).toHaveLength(2);
      });

      it('should identify largest bundles', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [
          createBundleMetric(2000000, now, 'large-bundle'),
          createBundleMetric(1500000, now, 'medium-bundle'),
          createBundleMetric(500000, now, 'small-bundle'),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(report.analysis.bundleAnalysis.largestBundles).toHaveLength(2);
        expect(report.analysis.bundleAnalysis.totalSize).toBe(4000000);
      });
    });

    describe('trends', () => {
      it('should detect improving trend', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // First half: slow, second half: fast (improving)
        const metrics = [
          createComponentMetric(200, now - 5000),
          createComponentMetric(180, now - 4000),
          createComponentMetric(100, now - 2000),
          createComponentMetric(80, now - 1000),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(report.trends.componentTrend).toBe('improving');
      });

      it('should detect degrading trend', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // First half: fast, second half: slow (degrading)
        const metrics = [
          createComponentMetric(80, now - 5000),
          createComponentMetric(100, now - 4000),
          createComponentMetric(180, now - 2000),
          createComponentMetric(200, now - 1000),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(report.trends.componentTrend).toBe('degrading');
      });

      it('should detect stable trend', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Consistent values
        const metrics = [
          createComponentMetric(100, now - 5000),
          createComponentMetric(102, now - 4000),
          createComponentMetric(98, now - 2000),
          createComponentMetric(100, now - 1000),
        ];

        const report = generator.generateDetailedReport(metrics);

        expect(report.trends.componentTrend).toBe('stable');
      });

      it('should return stable for insufficient data', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        const metrics = [createComponentMetric(100, now)];

        const report = generator.generateDetailedReport(metrics);

        expect(report.trends.componentTrend).toBe('stable');
      });
    });

    describe('updateConfig', () => {
      it('should update configuration', () => {
        const config = createTestConfig();
        const generator = new PerformanceReportGenerator(config);
        const now = Date.now();

        // Update to higher threshold
        const newConfig = createTestConfig({
          component: { enabled: true, thresholds: { renderTime: 200 } },
        });
        generator.updateConfig(newConfig);

        // 150ms is now within threshold (200ms)
        const metrics = [createComponentMetric(150, now)];
        const report = generator.generateReport(metrics);

        // Should not recommend optimization since within new threshold
        expect(
          report.recommendations.some((r) =>
            r.includes('组件渲染时间超过阈值'),
          ),
        ).toBe(false);
      });
    });
  });

  describe('createReportGenerator', () => {
    it('should create a PerformanceReportGenerator instance', () => {
      const config = createTestConfig();
      const generator = createReportGenerator(config);

      expect(generator).toBeInstanceOf(PerformanceReportGenerator);
    });
  });
});
