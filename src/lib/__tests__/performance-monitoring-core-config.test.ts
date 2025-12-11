import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import {
  compareBundleConfig,
  compareComponentConfig,
  compareGlobalConfig,
  compareNetworkConfig,
} from '@/lib/performance-monitoring-config-compare';
import {
  generateEnvironmentConfig,
  validateConfig,
} from '@/lib/performance-monitoring-types';
import { PerformanceConfigManager } from '../performance-monitoring-core-config';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/performance-monitoring-config-compare', () => ({
  compareBundleConfig: vi.fn(),
  compareComponentConfig: vi.fn(),
  compareGlobalConfig: vi.fn(),
  compareNetworkConfig: vi.fn(),
}));

vi.mock('@/lib/performance-monitoring-config-history', () => {
  return {
    ConfigHistoryManager: class MockConfigHistoryManager {
      private history: unknown[] = [];
      getHistory = vi.fn(() => this.history);
      recordChange = vi.fn();
      rollback = vi.fn(() => null);
    },
  };
});

vi.mock('@/lib/performance-monitoring-config-modules', () => ({
  getOptionalModuleConfig: vi.fn((config, module) => config[module]),
  getPrimaryModuleConfig: vi.fn((config, module) => config[module]),
  isOptionalModule: vi.fn((module) =>
    ['webVitals', 'component', 'network', 'bundle', 'global'].includes(module),
  ),
  isRequiredModule: vi.fn((module) =>
    ['reactScan', 'bundleAnalyzer', 'sizeLimit'].includes(module),
  ),
  mergeConfigValue: vi.fn((current, update) => ({ ...current, ...update })),
}));

const mockDefaultConfig = {
  reactScan: { enabled: false },
  bundleAnalyzer: { enabled: false },
  sizeLimit: { enabled: false, maxSize: 500 },
  global: {
    enabled: true,
    dataRetentionTime: 86400000,
    maxMetrics: 1000,
  },
  component: {
    enabled: false,
    thresholds: { renderTime: 100 },
  },
  network: {
    enabled: false,
    thresholds: { responseTime: 200 },
  },
  bundle: {
    enabled: false,
    thresholds: { size: 1048576 },
  },
};

vi.mock('@/lib/performance-monitoring-types', () => ({
  generateEnvironmentConfig: vi.fn(() => ({ ...mockDefaultConfig })),
  validateConfig: vi.fn(() => ({ isValid: true, errors: [] })),
}));

describe('performance-monitoring-core-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    vi.mocked(generateEnvironmentConfig).mockReturnValue({
      ...mockDefaultConfig,
    });
    vi.mocked(validateConfig).mockReturnValue({ isValid: true, errors: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PerformanceConfigManager', () => {
    describe('constructor', () => {
      it('should create instance with default config', () => {
        const manager = new PerformanceConfigManager();

        expect(manager).toBeInstanceOf(PerformanceConfigManager);
        expect(generateEnvironmentConfig).toHaveBeenCalled();
      });

      it('should create instance with custom config', () => {
        const customConfig = { reactScan: { enabled: true } };
        const manager = new PerformanceConfigManager(customConfig);

        expect(manager).toBeInstanceOf(PerformanceConfigManager);
        expect(manager.getConfig().reactScan.enabled).toBe(true);
      });

      it('should fallback to default config on validation failure', () => {
        vi.mocked(validateConfig).mockReturnValueOnce({
          isValid: false,
          errors: ['Invalid config'],
        });

        const manager = new PerformanceConfigManager({
          reactScan: { enabled: true },
        });

        expect(logger.warn).toHaveBeenCalledWith(
          'Performance monitoring config validation failed',
          expect.any(Object),
        );
        expect(manager.getConfig()).toBeDefined();
      });
    });

    describe('getConfig', () => {
      it('should return a copy of the config', () => {
        const manager = new PerformanceConfigManager();
        const config1 = manager.getConfig();
        const config2 = manager.getConfig();

        expect(config1).toEqual(config2);
        expect(config1).not.toBe(config2); // Should be a copy
      });
    });

    describe('updateConfig', () => {
      it('should update configuration', () => {
        const manager = new PerformanceConfigManager();

        manager.updateConfig({ reactScan: { enabled: true } });

        expect(manager.getConfig().reactScan.enabled).toBe(true);
      });

      it('should log warning on validation failure', () => {
        const manager = new PerformanceConfigManager();
        vi.mocked(validateConfig).mockReturnValueOnce({
          isValid: false,
          errors: ['Invalid'],
        });

        manager.updateConfig({ reactScan: { enabled: true } });

        expect(logger.warn).toHaveBeenCalledWith(
          'Updated performance config validation failed',
          expect.any(Object),
        );
      });
    });

    describe('resetConfig', () => {
      it('should reset to default configuration', () => {
        const manager = new PerformanceConfigManager();
        manager.updateConfig({ reactScan: { enabled: true } });

        manager.resetConfig();

        expect(generateEnvironmentConfig).toHaveBeenCalledTimes(2);
      });
    });

    describe('isConfigValid', () => {
      it('should return true for valid config', () => {
        const manager = new PerformanceConfigManager();

        expect(manager.isConfigValid()).toBe(true);
      });

      it('should return false for invalid config', () => {
        const manager = new PerformanceConfigManager();
        vi.mocked(validateConfig).mockReturnValueOnce({
          isValid: false,
          errors: ['Invalid'],
        });

        expect(manager.isConfigValid()).toBe(false);
      });
    });

    describe('validateCurrentConfig', () => {
      it('should return validation result', () => {
        const manager = new PerformanceConfigManager();

        const result = manager.validateCurrentConfig();

        expect(result).toHaveProperty('isValid');
        expect(validateConfig).toHaveBeenCalled();
      });
    });

    describe('isConfigInitialized', () => {
      it('should return true after initialization', () => {
        const manager = new PerformanceConfigManager();

        expect(manager.isConfigInitialized()).toBe(true);
      });
    });

    describe('getModuleConfig', () => {
      it('should return module configuration', () => {
        const manager = new PerformanceConfigManager();

        const reactScanConfig = manager.getModuleConfig('reactScan');

        expect(reactScanConfig).toBeDefined();
      });

      it('should return undefined for missing optional module', () => {
        vi.mocked(generateEnvironmentConfig).mockReturnValue({
          reactScan: { enabled: false },
          bundleAnalyzer: { enabled: false },
          sizeLimit: { enabled: false, maxSize: 500 },
        });

        const manager = new PerformanceConfigManager();
        const webVitalsConfig = manager.getModuleConfig('webVitals');

        // Returns undefined when module doesn't exist
        expect(webVitalsConfig).toBeUndefined();
      });
    });

    describe('updateModuleConfig', () => {
      it('should update specific module configuration', () => {
        const manager = new PerformanceConfigManager();

        manager.updateModuleConfig('reactScan', { enabled: true });

        expect(validateConfig).toHaveBeenCalled();
      });

      it('should handle updating optional modules', () => {
        const manager = new PerformanceConfigManager();

        manager.updateModuleConfig('component', { enabled: true });

        expect(validateConfig).toHaveBeenCalled();
      });

      it('should handle debug module separately', () => {
        const manager = new PerformanceConfigManager();

        manager.updateModuleConfig(
          'debug' as keyof typeof mockDefaultConfig,
          true as never,
        );

        // Should not throw
        expect(true).toBe(true);
      });
    });

    describe('exportConfig', () => {
      it('should export configuration as JSON string', () => {
        const manager = new PerformanceConfigManager();

        const exported = manager.exportConfig();

        expect(typeof exported).toBe('string');
        expect(() => JSON.parse(exported)).not.toThrow();
      });
    });

    describe('importConfig', () => {
      it('should import valid configuration', () => {
        const manager = new PerformanceConfigManager();
        const configJson = JSON.stringify(mockDefaultConfig);

        const result = manager.importConfig(configJson);

        expect(result).toBe(true);
      });

      it('should reject invalid configuration', () => {
        const manager = new PerformanceConfigManager();

        // Mock validateConfig to return invalid for the import call
        vi.mocked(validateConfig).mockReturnValueOnce({
          isValid: false,
          errors: ['Invalid'],
        });

        const configJson = JSON.stringify({ invalid: true });
        const result = manager.importConfig(configJson);

        expect(result).toBe(false);
        expect(logger.error).toHaveBeenCalledWith(
          'Imported config validation failed',
          expect.any(Object),
        );
      });

      it('should handle JSON parse errors', () => {
        const manager = new PerformanceConfigManager();

        const result = manager.importConfig('invalid json');

        expect(result).toBe(false);
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to import config',
          expect.any(Object),
        );
      });
    });

    describe('getConfigSummary', () => {
      it('should return configuration summary', () => {
        const manager = new PerformanceConfigManager();

        const summary = manager.getConfigSummary();

        expect(summary).toHaveProperty('isEnabled');
        expect(summary).toHaveProperty('enabledModules');
        expect(summary).toHaveProperty('dataRetentionTime');
        expect(summary).toHaveProperty('maxMetrics');
        expect(summary).toHaveProperty('thresholds');
      });

      it('should list enabled modules', () => {
        vi.mocked(generateEnvironmentConfig).mockReturnValue({
          ...mockDefaultConfig,
          component: { enabled: true, thresholds: { renderTime: 100 } },
          network: { enabled: true, thresholds: { responseTime: 200 } },
        });

        const manager = new PerformanceConfigManager();
        const summary = manager.getConfigSummary();

        expect(summary.enabledModules).toContain('component');
        expect(summary.enabledModules).toContain('network');
      });

      it('should use defaults when global config missing', () => {
        vi.mocked(generateEnvironmentConfig).mockReturnValue({
          reactScan: { enabled: false },
          bundleAnalyzer: { enabled: false },
          sizeLimit: { enabled: false, maxSize: 500 },
        });

        const manager = new PerformanceConfigManager();
        const summary = manager.getConfigSummary();

        expect(summary.isEnabled).toBe(false);
        expect(summary.dataRetentionTime).toBeDefined();
        expect(summary.maxMetrics).toBeDefined();
      });
    });

    describe('compareConfigs', () => {
      it('should compare configurations', () => {
        const manager = new PerformanceConfigManager();
        const otherConfig = { ...mockDefaultConfig };

        const result = manager.compareConfigs(otherConfig);

        expect(result).toHaveProperty('isDifferent');
        expect(result).toHaveProperty('differences');
        expect(compareGlobalConfig).toHaveBeenCalled();
        expect(compareComponentConfig).toHaveBeenCalled();
        expect(compareNetworkConfig).toHaveBeenCalled();
        expect(compareBundleConfig).toHaveBeenCalled();
      });

      it('should detect differences', () => {
        vi.mocked(compareGlobalConfig).mockImplementation((_a, _b, diffs) => {
          diffs.push('global.enabled changed');
        });

        const manager = new PerformanceConfigManager();
        const otherConfig = { ...mockDefaultConfig };

        const result = manager.compareConfigs(otherConfig);

        expect(result.isDifferent).toBe(true);
        expect(result.differences).toContain('global.enabled changed');
      });
    });

    describe('getConfigHistory', () => {
      it('should return configuration history', () => {
        const manager = new PerformanceConfigManager();

        const history = manager.getConfigHistory();

        expect(Array.isArray(history)).toBe(true);
      });
    });

    describe('rollbackConfig', () => {
      it('should return false when rollback returns null', () => {
        const manager = new PerformanceConfigManager();

        // Access internal historyManager and mock rollback to return null
        const historyManager = (
          manager as unknown as { historyManager: { rollback: () => unknown } }
        ).historyManager;
        historyManager.rollback = vi.fn(() => null);

        const result = manager.rollbackConfig();

        expect(result).toBe(false);
      });

      it('should rollback to previous config when history exists', () => {
        const manager = new PerformanceConfigManager();

        // Directly access the internal historyManager and mock rollback
        const historyManager = (
          manager as unknown as {
            historyManager: {
              rollback: () => unknown;
              recordChange: () => void;
            };
          }
        ).historyManager;
        historyManager.rollback = vi.fn(() => ({ ...mockDefaultConfig }));
        historyManager.recordChange = vi.fn();

        const result = manager.rollbackConfig(1);

        expect(result).toBe(true);
        expect(historyManager.recordChange).toHaveBeenCalled();
      });
    });

    describe('mergeConfig', () => {
      it('should merge configurations correctly', () => {
        const manager = new PerformanceConfigManager();

        const merged = manager.mergeConfig(mockDefaultConfig, {
          reactScan: { enabled: true },
        });

        expect(merged.reactScan.enabled).toBe(true);
        expect(merged.bundleAnalyzer).toEqual(mockDefaultConfig.bundleAnalyzer);
      });

      it('should handle optional modules in merge', () => {
        const manager = new PerformanceConfigManager();
        const configWithWebVitals = {
          ...mockDefaultConfig,
          webVitals: { enabled: false },
        };

        const merged = manager.mergeConfig(configWithWebVitals, {
          webVitals: { enabled: true },
        });

        // The mergeConfig method merges webVitals when the default has it
        expect(merged.webVitals?.enabled).toBe(true);
      });

      it('should preserve existing optional modules when not overridden', () => {
        const manager = new PerformanceConfigManager();
        const configWithWebVitals = {
          ...mockDefaultConfig,
          webVitals: { enabled: true, thresholds: {} },
        };

        const merged = manager.mergeConfig(configWithWebVitals, {
          reactScan: { enabled: true },
        });

        expect(merged.webVitals).toEqual(configWithWebVitals.webVitals);
      });
    });
  });
});
