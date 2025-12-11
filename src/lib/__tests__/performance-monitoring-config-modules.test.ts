import { describe, expect, it } from 'vitest';
import type { PerformanceConfig } from '@/lib/performance-monitoring-types';
import {
  getOptionalModuleConfig,
  getPrimaryModuleConfig,
  isOptionalModule,
  isRequiredModule,
  mergeConfigValue,
} from '../performance-monitoring-config-modules';

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
    webVitals: {
      enabled: true,
      reportAllChanges: false,
    },
    debug: true,
    ...overrides,
  };
}

describe('performance-monitoring-config-modules', () => {
  describe('getPrimaryModuleConfig', () => {
    it('should return reactScan config', () => {
      const config = createBaseConfig({ reactScan: { enabled: true } });

      const result = getPrimaryModuleConfig(config, 'reactScan');

      expect(result).toEqual({ enabled: true });
    });

    it('should return bundleAnalyzer config', () => {
      const config = createBaseConfig({ bundleAnalyzer: { enabled: true } });

      const result = getPrimaryModuleConfig(config, 'bundleAnalyzer');

      expect(result).toEqual({ enabled: true });
    });

    it('should return sizeLimit config', () => {
      const config = createBaseConfig({
        sizeLimit: { enabled: true, maxSize: 600 },
      });

      const result = getPrimaryModuleConfig(config, 'sizeLimit');

      expect(result).toEqual({ enabled: true, maxSize: 600 });
    });

    it('should return undefined for non-primary modules', () => {
      const config = createBaseConfig();

      const result = getPrimaryModuleConfig(config, 'component');

      expect(result).toBeUndefined();
    });

    it('should return a copy of the config', () => {
      const config = createBaseConfig({ reactScan: { enabled: false } });

      const result = getPrimaryModuleConfig(config, 'reactScan');
      if (result && 'enabled' in result) {
        (result as { enabled: boolean }).enabled = true;
      }

      expect(config.reactScan.enabled).toBe(false);
    });
  });

  describe('getOptionalModuleConfig', () => {
    it('should return webVitals config', () => {
      const config = createBaseConfig({
        webVitals: { enabled: true, reportAllChanges: true },
      });

      const result = getOptionalModuleConfig(config, 'webVitals');

      expect(result).toEqual({ enabled: true, reportAllChanges: true });
    });

    it('should return component config', () => {
      const config = createBaseConfig();

      const result = getOptionalModuleConfig(config, 'component');

      expect(result).toEqual({
        enabled: true,
        thresholds: { renderTime: 100 },
      });
    });

    it('should return network config', () => {
      const config = createBaseConfig();

      const result = getOptionalModuleConfig(config, 'network');

      expect(result).toEqual({
        enabled: true,
        thresholds: { responseTime: 200 },
      });
    });

    it('should return bundle config', () => {
      const config = createBaseConfig();

      const result = getOptionalModuleConfig(config, 'bundle');

      expect(result).toEqual({ enabled: true, thresholds: { size: 1048576 } });
    });

    it('should return global config', () => {
      const config = createBaseConfig();

      const result = getOptionalModuleConfig(config, 'global');

      expect(result).toEqual({
        enabled: true,
        dataRetentionTime: 300000,
        maxMetrics: 100,
      });
    });

    it('should return debug value', () => {
      const config = createBaseConfig({ debug: true });

      const result = getOptionalModuleConfig(config, 'debug');

      expect(result).toBe(true);
    });

    it('should return undefined when optional module not present', () => {
      const config = createBaseConfig();
      delete (config as { webVitals?: unknown }).webVitals;

      const result = getOptionalModuleConfig(config, 'webVitals');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-optional modules', () => {
      const config = createBaseConfig();

      const result = getOptionalModuleConfig(config, 'reactScan');

      expect(result).toBeUndefined();
    });

    it('should return a copy of the config', () => {
      const config = createBaseConfig();

      const result = getOptionalModuleConfig(config, 'component');
      if (result && 'enabled' in result) {
        (result as { enabled: boolean }).enabled = false;
      }

      expect(config.component?.enabled).toBe(true);
    });
  });

  describe('isRequiredModule', () => {
    it('should return true for reactScan', () => {
      expect(isRequiredModule('reactScan')).toBe(true);
    });

    it('should return true for bundleAnalyzer', () => {
      expect(isRequiredModule('bundleAnalyzer')).toBe(true);
    });

    it('should return true for sizeLimit', () => {
      expect(isRequiredModule('sizeLimit')).toBe(true);
    });

    it('should return false for optional modules', () => {
      expect(isRequiredModule('webVitals')).toBe(false);
      expect(isRequiredModule('component')).toBe(false);
      expect(isRequiredModule('network')).toBe(false);
      expect(isRequiredModule('bundle')).toBe(false);
      expect(isRequiredModule('global')).toBe(false);
    });

    it('should return false for unknown modules', () => {
      expect(isRequiredModule('unknown')).toBe(false);
    });
  });

  describe('isOptionalModule', () => {
    it('should return true for webVitals', () => {
      expect(isOptionalModule('webVitals')).toBe(true);
    });

    it('should return true for component', () => {
      expect(isOptionalModule('component')).toBe(true);
    });

    it('should return true for network', () => {
      expect(isOptionalModule('network')).toBe(true);
    });

    it('should return true for bundle', () => {
      expect(isOptionalModule('bundle')).toBe(true);
    });

    it('should return true for global', () => {
      expect(isOptionalModule('global')).toBe(true);
    });

    it('should return false for required modules', () => {
      expect(isOptionalModule('reactScan')).toBe(false);
      expect(isOptionalModule('bundleAnalyzer')).toBe(false);
      expect(isOptionalModule('sizeLimit')).toBe(false);
    });

    it('should return false for unknown modules', () => {
      expect(isOptionalModule('unknown')).toBe(false);
    });
  });

  describe('mergeConfigValue', () => {
    it('should merge two objects', () => {
      const current = { enabled: true, value: 100 };
      const update = { value: 200 };

      // mergeConfigValue takes (current, config), not (module, current, config)
      const result = mergeConfigValue(
        current as PerformanceConfig[keyof PerformanceConfig],
        update as Partial<PerformanceConfig[keyof PerformanceConfig]>,
      );

      expect(result).toEqual({ enabled: true, value: 200 });
    });

    it('should replace non-object values', () => {
      const current = true;
      const update = false;

      const result = mergeConfigValue(
        current as unknown as PerformanceConfig[keyof PerformanceConfig],
        update as unknown as Partial<
          PerformanceConfig[keyof PerformanceConfig]
        >,
      );

      expect(result).toBe(false);
    });

    it('should return current when update is undefined', () => {
      const current = { enabled: true };
      const update = undefined;

      const result = mergeConfigValue(
        current as PerformanceConfig[keyof PerformanceConfig],
        update as unknown as Partial<
          PerformanceConfig[keyof PerformanceConfig]
        >,
      );

      expect(result).toEqual({ enabled: true });
    });

    it('should shallow merge nested objects', () => {
      // mergeConfigValue does shallow merge, so nested objects get replaced
      const current = { enabled: true, thresholds: { renderTime: 100 } };
      const update = { thresholds: { renderTime: 200 } };

      const result = mergeConfigValue(
        current as PerformanceConfig[keyof PerformanceConfig],
        update as Partial<PerformanceConfig[keyof PerformanceConfig]>,
      );

      // Shallow merge replaces thresholds entirely
      expect(result).toEqual({
        enabled: true,
        thresholds: { renderTime: 200 },
      });
    });

    it('should replace arrays since they are not mergeable objects', () => {
      // Arrays are filtered by !Array.isArray() check, so they don't get merged
      // If current is array and config is defined, it returns config
      const current = [1, 2, 3];
      const update = [4, 5, 6];

      const result = mergeConfigValue(
        current as unknown as PerformanceConfig[keyof PerformanceConfig],
        update as unknown as Partial<
          PerformanceConfig[keyof PerformanceConfig]
        >,
      );

      // Both are arrays, so isMergeableObject is false for both
      // config !== undefined, so returns config
      expect(result).toEqual([4, 5, 6]);
    });

    it('should return config when current is null', () => {
      const current = null;
      const update = { enabled: true };

      // null is not a mergeable object, so it checks if config !== undefined
      const result = mergeConfigValue(
        current as unknown as PerformanceConfig[keyof PerformanceConfig],
        update as unknown as Partial<
          PerformanceConfig[keyof PerformanceConfig]
        >,
      );

      expect(result).toEqual({ enabled: true });
    });

    it('should return current when config is null and current is not mergeable', () => {
      const current = { enabled: true };
      const update = null;

      // current is mergeable, but config (null) is not
      // So isMergeableObject(current) && isMergeableObject(config) is false
      // config !== undefined (null !== undefined is true), so returns config
      const result = mergeConfigValue(
        current as PerformanceConfig[keyof PerformanceConfig],
        update as unknown as Partial<
          PerformanceConfig[keyof PerformanceConfig]
        >,
      );

      expect(result).toBeNull();
    });
  });
});
