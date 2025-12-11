import { describe, expect, it } from 'vitest';
import type { PerformanceConfig } from '@/lib/performance-monitoring-types';
import {
  compareBundleConfig,
  compareComponentConfig,
  compareGlobalConfig,
  compareNetworkConfig,
} from '../performance-monitoring-config-compare';

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

describe('performance-monitoring-config-compare', () => {
  describe('compareGlobalConfig', () => {
    it('should detect no differences when configs are identical', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig();
      const differences: string[] = [];

      compareGlobalConfig(config1, config2, differences);

      expect(differences).toHaveLength(0);
    });

    it('should detect global.enabled difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        global: { enabled: false, dataRetentionTime: 300000, maxMetrics: 100 },
      });
      const differences: string[] = [];

      compareGlobalConfig(config1, config2, differences);

      expect(differences).toContain('global.enabled');
    });

    it('should detect global.dataRetentionTime difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        global: { enabled: true, dataRetentionTime: 600000, maxMetrics: 100 },
      });
      const differences: string[] = [];

      compareGlobalConfig(config1, config2, differences);

      expect(differences).toContain('global.dataRetentionTime');
    });

    it('should detect global.maxMetrics difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        global: { enabled: true, dataRetentionTime: 300000, maxMetrics: 200 },
      });
      const differences: string[] = [];

      compareGlobalConfig(config1, config2, differences);

      expect(differences).toContain('global.maxMetrics');
    });

    it('should detect multiple global differences', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        global: { enabled: false, dataRetentionTime: 600000, maxMetrics: 200 },
      });
      const differences: string[] = [];

      compareGlobalConfig(config1, config2, differences);

      expect(differences).toContain('global.enabled');
      expect(differences).toContain('global.dataRetentionTime');
      expect(differences).toContain('global.maxMetrics');
    });

    it('should handle undefined global configs', () => {
      const config1 = createBaseConfig();
      const config2 = {
        ...createBaseConfig(),
        global: undefined,
      } as PerformanceConfig;
      const differences: string[] = [];

      compareGlobalConfig(config1, config2, differences);

      expect(differences).toContain('global.enabled');
    });
  });

  describe('compareComponentConfig', () => {
    it('should detect no differences when configs are identical', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig();
      const differences: string[] = [];

      compareComponentConfig(config1, config2, differences);

      expect(differences).toHaveLength(0);
    });

    it('should detect component.enabled difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        component: { enabled: false, thresholds: { renderTime: 100 } },
      });
      const differences: string[] = [];

      compareComponentConfig(config1, config2, differences);

      expect(differences).toContain('component.enabled');
    });

    it('should detect component.thresholds.renderTime difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        component: { enabled: true, thresholds: { renderTime: 200 } },
      });
      const differences: string[] = [];

      compareComponentConfig(config1, config2, differences);

      expect(differences).toContain('component.thresholds.renderTime');
    });

    it('should handle undefined component configs', () => {
      const config1 = createBaseConfig();
      const config2 = {
        ...createBaseConfig(),
        component: undefined,
      } as PerformanceConfig;
      const differences: string[] = [];

      compareComponentConfig(config1, config2, differences);

      expect(differences).toContain('component.enabled');
    });
  });

  describe('compareNetworkConfig', () => {
    it('should detect no differences when configs are identical', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig();
      const differences: string[] = [];

      compareNetworkConfig(config1, config2, differences);

      expect(differences).toHaveLength(0);
    });

    it('should detect network.enabled difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        network: { enabled: false, thresholds: { responseTime: 200 } },
      });
      const differences: string[] = [];

      compareNetworkConfig(config1, config2, differences);

      expect(differences).toContain('network.enabled');
    });

    it('should detect network.thresholds.responseTime difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        network: { enabled: true, thresholds: { responseTime: 400 } },
      });
      const differences: string[] = [];

      compareNetworkConfig(config1, config2, differences);

      expect(differences).toContain('network.thresholds.responseTime');
    });

    it('should handle undefined network configs', () => {
      const config1 = createBaseConfig();
      const config2 = {
        ...createBaseConfig(),
        network: undefined,
      } as PerformanceConfig;
      const differences: string[] = [];

      compareNetworkConfig(config1, config2, differences);

      expect(differences).toContain('network.enabled');
    });
  });

  describe('compareBundleConfig', () => {
    it('should detect no differences when configs are identical', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig();
      const differences: string[] = [];

      compareBundleConfig(config1, config2, differences);

      expect(differences).toHaveLength(0);
    });

    it('should detect bundle.enabled difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        bundle: { enabled: false, thresholds: { size: 1048576 } },
      });
      const differences: string[] = [];

      compareBundleConfig(config1, config2, differences);

      expect(differences).toContain('bundle.enabled');
    });

    it('should detect bundle.thresholds.size difference', () => {
      const config1 = createBaseConfig();
      const config2 = createBaseConfig({
        bundle: { enabled: true, thresholds: { size: 2097152 } },
      });
      const differences: string[] = [];

      compareBundleConfig(config1, config2, differences);

      expect(differences).toContain('bundle.thresholds.size');
    });

    it('should handle undefined bundle configs', () => {
      const config1 = createBaseConfig();
      const config2 = {
        ...createBaseConfig(),
        bundle: undefined,
      } as PerformanceConfig;
      const differences: string[] = [];

      compareBundleConfig(config1, config2, differences);

      expect(differences).toContain('bundle.enabled');
    });
  });
});
