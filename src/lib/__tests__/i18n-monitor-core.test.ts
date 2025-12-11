import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonitoringConfig } from '@/lib/i18n-monitoring-types';
import { I18nPerformanceMonitor } from '@/lib/i18n-performance';
import { I18nMonitor } from '../i18n-monitor-core';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockPerformanceMetrics = {
  averageLoadTime: 50,
  cacheHitRate: 0.8,
  totalRequests: 100,
  totalErrors: 5,
};

vi.mock('@/lib/i18n-performance', () => ({
  I18nPerformanceMonitor: {
    recordLoadTime: vi.fn(),
    recordCacheHit: vi.fn(),
    recordCacheMiss: vi.fn(),
    recordError: vi.fn(),
    getMetrics: vi.fn(() => ({ ...mockPerformanceMetrics })),
    reset: vi.fn(),
  },
}));

function createDefaultConfig(
  overrides?: Partial<MonitoringConfig>,
): Partial<MonitoringConfig> {
  return {
    enabled: true,
    enableConsoleLogging: false,
    enableRemoteLogging: false,
    enablePerformanceTracking: true,
    enableQualityTracking: true,
    maxEvents: 100,
    flushInterval: 0, // Disable auto-flush in tests
    ...overrides,
  };
}

describe('I18nMonitor', () => {
  let monitor: I18nMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    monitor = new I18nMonitor(createDefaultConfig());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create monitor with default config', () => {
      const defaultMonitor = new I18nMonitor();
      expect(defaultMonitor).toBeDefined();
      expect(defaultMonitor.getConfig()).toBeDefined();
    });

    it('should create monitor with custom config', () => {
      const config = createDefaultConfig({ maxEvents: 500 });
      const customMonitor = new I18nMonitor(config);
      expect(customMonitor.getConfig().maxEvents).toBe(500);
    });

    it('should use environment endpoint if available', () => {
      const originalEnv = process.env['NEXT_PUBLIC_I18N_MONITORING_ENDPOINT'];
      process.env['NEXT_PUBLIC_I18N_MONITORING_ENDPOINT'] =
        'https://test-endpoint.com';

      const envMonitor = new I18nMonitor();
      expect(envMonitor.getConfig().remoteEndpoint).toBe(
        'https://test-endpoint.com',
      );

      if (originalEnv !== undefined) {
        process.env['NEXT_PUBLIC_I18N_MONITORING_ENDPOINT'] = originalEnv;
      } else {
        delete process.env['NEXT_PUBLIC_I18N_MONITORING_ENDPOINT'];
      }
    });
  });

  describe('recordTranslationMissing', () => {
    it('should record translation missing event', () => {
      monitor.recordTranslationMissing('common.greeting', 'en');

      const events = monitor.getEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('translation_missing');
      expect(events[0].level).toBe('warning');
      expect(events[0].locale).toBe('en');
      expect(events[0].message).toContain('common.greeting');
    });

    it('should include key in metadata', () => {
      monitor.recordTranslationMissing('products.title', 'zh');

      const events = monitor.getEvents();
      expect(events[0].metadata).toEqual({ key: 'products.title' });
    });
  });

  describe('recordLocaleSwitch', () => {
    it('should record locale switch event', () => {
      monitor.recordLocaleSwitch('en', 'zh', 150);

      const events = monitor.getEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('locale_switch');
      expect(events[0].level).toBe('info');
      expect(events[0].locale).toBe('zh');
    });

    it('should include switch details in metadata', () => {
      monitor.recordLocaleSwitch('en', 'zh', 150);

      const events = monitor.getEvents();
      expect(events[0].metadata).toEqual({
        fromLocale: 'en',
        toLocale: 'zh',
        duration: 150,
      });
    });

    it('should include both locales in message', () => {
      monitor.recordLocaleSwitch('en', 'zh', 150);

      const events = monitor.getEvents();
      expect(events[0].message).toContain('en');
      expect(events[0].message).toContain('zh');
    });
  });

  describe('recordLoadTime', () => {
    it('should delegate to PerformanceMonitor', () => {
      monitor.recordLoadTime(100, 'en');
      expect(I18nPerformanceMonitor.recordLoadTime).toHaveBeenCalledWith(100);
    });
  });

  describe('recordCacheHit', () => {
    it('should delegate to PerformanceMonitor', () => {
      monitor.recordCacheHit('en');
      expect(I18nPerformanceMonitor.recordCacheHit).toHaveBeenCalled();
    });
  });

  describe('recordCacheMiss', () => {
    it('should delegate to PerformanceMonitor', () => {
      monitor.recordCacheMiss('zh');
      expect(I18nPerformanceMonitor.recordCacheMiss).toHaveBeenCalled();
    });
  });

  describe('recordError', () => {
    it('should delegate to PerformanceMonitor', () => {
      const error = { key: 'test.key', locale: 'en', message: 'Test error' };
      monitor.recordError(error, 'en');
      expect(I18nPerformanceMonitor.recordError).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return I18nMetrics format', () => {
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('loadTime');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('translationCoverage');
      expect(metrics).toHaveProperty('localeUsage');
    });

    it('should adapt PerformanceMonitor metrics', () => {
      const metrics = monitor.getMetrics();

      expect(metrics.loadTime).toBe(50);
      expect(metrics.cacheHitRate).toBe(0.8);
      expect(metrics.errorRate).toBe(0.05); // 5 / 100
      expect(metrics.translationCoverage).toBe(1.0);
      expect(metrics.localeUsage).toEqual({ en: 0.5, zh: 0.5 });
    });

    it('should handle zero total requests', () => {
      const mockFn = vi.mocked(I18nPerformanceMonitor.getMetrics);
      mockFn.mockReturnValueOnce({
        averageLoadTime: 0,
        cacheHitRate: 0,
        totalRequests: 0,
        totalErrors: 0,
      });

      const metrics = monitor.getMetrics();
      expect(metrics.errorRate).toBe(0);

      // Restore default mock
      mockFn.mockImplementation(() => ({ ...mockPerformanceMetrics }));
    });
  });

  describe('getEvents', () => {
    it('should return recorded events', () => {
      monitor.recordTranslationMissing('key1', 'en');
      monitor.recordLocaleSwitch('en', 'zh', 100);

      const events = monitor.getEvents();
      expect(events).toHaveLength(2);
    });

    it('should return empty array when no events', () => {
      expect(monitor.getEvents()).toHaveLength(0);
    });
  });

  describe('flush', () => {
    it('should call eventCollector flush', async () => {
      monitor.recordTranslationMissing('key1', 'en');
      await monitor.flush();

      // Events should be cleared after flush
      expect(monitor.getEvents()).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should clear events', () => {
      monitor.recordTranslationMissing('key1', 'en');
      monitor.reset();

      expect(monitor.getEvents()).toHaveLength(0);
    });

    it('should reset PerformanceMonitor', () => {
      monitor.reset();
      expect(I18nPerformanceMonitor.reset).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      monitor.updateConfig({ maxEvents: 200 });

      const config = monitor.getConfig();
      expect(config.maxEvents).toBe(200);
    });

    it('should preserve other config values', () => {
      const originalEnabled = monitor.getConfig().enabled;
      monitor.updateConfig({ maxEvents: 200 });

      expect(monitor.getConfig().enabled).toBe(originalEnabled);
    });
  });

  describe('getConfig', () => {
    it('should return copy of config', () => {
      const config1 = monitor.getConfig();
      const config2 = monitor.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      const enabledMonitor = new I18nMonitor(
        createDefaultConfig({ enabled: true }),
      );
      expect(enabledMonitor.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      const disabledMonitor = new I18nMonitor(
        createDefaultConfig({ enabled: false }),
      );
      expect(disabledMonitor.isEnabled()).toBe(false);
    });
  });

  describe('enable', () => {
    it('should enable the monitor', () => {
      const disabledMonitor = new I18nMonitor(
        createDefaultConfig({ enabled: false }),
      );
      expect(disabledMonitor.isEnabled()).toBe(false);

      disabledMonitor.enable();
      expect(disabledMonitor.isEnabled()).toBe(true);
    });
  });

  describe('disable', () => {
    it('should disable the monitor', () => {
      const enabledMonitor = new I18nMonitor(
        createDefaultConfig({ enabled: true }),
      );
      expect(enabledMonitor.isEnabled()).toBe(true);

      enabledMonitor.disable();
      expect(enabledMonitor.isEnabled()).toBe(false);
    });
  });

  describe('integration', () => {
    it('should track full workflow', () => {
      // Record various events
      monitor.recordTranslationMissing('key1', 'en');
      monitor.recordLocaleSwitch('en', 'zh', 100);
      monitor.recordCacheHit('zh');
      monitor.recordCacheMiss('en');
      monitor.recordLoadTime(50, 'en');

      // Verify events
      const events = monitor.getEvents();
      expect(events).toHaveLength(2); // Only recordTranslationMissing and recordLocaleSwitch add events

      // Verify metrics
      const metrics = monitor.getMetrics();
      expect(metrics).toBeDefined();

      // Reset
      monitor.reset();
      expect(monitor.getEvents()).toHaveLength(0);
    });
  });
});
