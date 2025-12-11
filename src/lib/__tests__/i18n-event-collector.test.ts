import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MonitoringConfig } from '@/lib/i18n-monitoring-types';
import { ErrorLevel, MonitoringEventType } from '@/lib/i18n-monitoring-types'; // eslint-disable-line no-duplicate-imports -- Type import needed separately
import { logger } from '@/lib/logger';
import { EventCollector } from '../i18n-event-collector';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createDefaultConfig(
  overrides?: Partial<MonitoringConfig>,
): MonitoringConfig {
  return {
    enabled: true,
    enableConsoleLogging: false,
    enableRemoteLogging: false,
    enablePerformanceTracking: true,
    enableQualityTracking: true,
    performanceThresholds: {
      translationLoadTime: 100,
      cacheHitRate: 80,
      errorRate: 5,
      memoryUsage: 50,
    },
    qualityThresholds: {
      completeness: 90,
      consistency: 85,
      accuracy: 95,
      freshness: 30,
    },
    maxEvents: 100,
    flushInterval: 0, // Disable auto-flush in tests
    ...overrides,
  };
}

describe('EventCollector', () => {
  let collector: EventCollector;
  let config: MonitoringConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    config = createDefaultConfig();
    collector = new EventCollector(config);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create collector with config', () => {
      expect(collector).toBeDefined();
      expect(collector.getConfig()).toEqual(config);
    });

    it('should set up auto-flush when interval > 0', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      const configWithFlush = createDefaultConfig({ flushInterval: 5000 });
      new EventCollector(configWithFlush);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should not set up auto-flush when interval is 0', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      setIntervalSpy.mockClear();

      new EventCollector(createDefaultConfig({ flushInterval: 0 }));

      expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it('should not set up auto-flush when disabled', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      setIntervalSpy.mockClear();

      new EventCollector(createDefaultConfig({ enabled: false }));

      expect(setIntervalSpy).not.toHaveBeenCalled();
    });
  });

  describe('addEvent', () => {
    it('should add event with generated id and timestamp', () => {
      collector.addEvent({
        type: MonitoringEventType.TRANSLATION_MISSING,
        level: ErrorLevel.WARNING,
        locale: 'en',
        message: 'Missing translation for key',
      });

      const events = collector.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].id).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
      expect(events[0].type).toBe(MonitoringEventType.TRANSLATION_MISSING);
    });

    it('should not add event when collector is disabled', () => {
      const disabledCollector = new EventCollector(
        createDefaultConfig({ enabled: false }),
      );

      disabledCollector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'zh',
        message: 'Cache miss',
      });

      expect(disabledCollector.getEvents()).toHaveLength(0);
    });

    it('should include userAgent when navigator is available', () => {
      const mockUserAgent = 'Mozilla/5.0 Test Agent';
      vi.stubGlobal('navigator', { userAgent: mockUserAgent });

      collector.addEvent({
        type: MonitoringEventType.LOCALE_SWITCH,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Locale switched',
      });

      const events = collector.getEvents();
      expect(events[0].userAgent).toBe(mockUserAgent);

      vi.unstubAllGlobals();
    });

    it('should include url when window is available', () => {
      const mockUrl = 'http://localhost:3000/test-page';
      vi.stubGlobal('window', { location: { href: mockUrl } });

      collector.addEvent({
        type: MonitoringEventType.TRANSLATION_ERROR,
        level: ErrorLevel.ERROR,
        locale: 'zh',
        message: 'Translation error',
      });

      const events = collector.getEvents();
      expect(events[0].url).toBe(mockUrl);

      vi.unstubAllGlobals();
    });

    it('should log to console when enabled', () => {
      const consoleCollector = new EventCollector(
        createDefaultConfig({ enableConsoleLogging: true }),
      );

      consoleCollector.addEvent({
        type: MonitoringEventType.QUALITY_ISSUE,
        level: ErrorLevel.WARNING,
        locale: 'en',
        message: 'Quality issue detected',
      });

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should log errors with logger.error', () => {
      const consoleCollector = new EventCollector(
        createDefaultConfig({ enableConsoleLogging: true }),
      );

      consoleCollector.addEvent({
        type: MonitoringEventType.TRANSLATION_ERROR,
        level: ErrorLevel.ERROR,
        locale: 'en',
        message: 'Error occurred',
      });

      expect(logger.error).toHaveBeenCalled();
    });

    it('should log critical with logger.error', () => {
      const consoleCollector = new EventCollector(
        createDefaultConfig({ enableConsoleLogging: true }),
      );

      consoleCollector.addEvent({
        type: MonitoringEventType.TRANSLATION_ERROR,
        level: ErrorLevel.CRITICAL,
        locale: 'en',
        message: 'Critical error',
      });

      expect(logger.error).toHaveBeenCalled();
    });

    it('should log info with logger.info', () => {
      const consoleCollector = new EventCollector(
        createDefaultConfig({ enableConsoleLogging: true }),
      );

      consoleCollector.addEvent({
        type: MonitoringEventType.LOCALE_SWITCH,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Info event',
      });

      expect(logger.info).toHaveBeenCalled();
    });

    it('should trim events when exceeding maxEvents', () => {
      const smallCollector = new EventCollector(
        createDefaultConfig({ maxEvents: 3 }),
      );

      for (let i = 0; i < 5; i++) {
        smallCollector.addEvent({
          type: MonitoringEventType.CACHE_MISS,
          level: ErrorLevel.INFO,
          locale: 'en',
          message: `Event ${i}`,
        });
      }

      const events = smallCollector.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0].message).toBe('Event 2');
      expect(events[2].message).toBe('Event 4');
    });

    it('should send critical events immediately', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      const remoteCollector = new EventCollector(
        createDefaultConfig({
          enableRemoteLogging: true,
          remoteEndpoint: 'https://api.example.com/events',
        }),
      );

      remoteCollector.addEvent({
        type: MonitoringEventType.TRANSLATION_ERROR,
        level: ErrorLevel.CRITICAL,
        locale: 'en',
        message: 'Critical failure',
      });

      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/events',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      vi.unstubAllGlobals();
    });

    it('should not send critical events when remote logging disabled', () => {
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      collector.addEvent({
        type: MonitoringEventType.TRANSLATION_ERROR,
        level: ErrorLevel.CRITICAL,
        locale: 'en',
        message: 'Critical failure',
      });

      expect(mockFetch).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('should handle fetch errors when sending critical events', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const remoteCollector = new EventCollector(
        createDefaultConfig({
          enableRemoteLogging: true,
          remoteEndpoint: 'https://api.example.com/events',
        }),
      );

      remoteCollector.addEvent({
        type: MonitoringEventType.TRANSLATION_ERROR,
        level: ErrorLevel.CRITICAL,
        locale: 'en',
        message: 'Critical failure',
      });

      await vi.runAllTimersAsync();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send monitoring event',
        expect.any(Object),
      );

      vi.unstubAllGlobals();
    });
  });

  describe('getEvents', () => {
    it('should return copy of events array', () => {
      collector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Test event',
      });

      const events1 = collector.getEvents();
      const events2 = collector.getEvents();

      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });
  });

  describe('clearEvents', () => {
    it('should clear all events', () => {
      collector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Event 1',
      });
      collector.addEvent({
        type: MonitoringEventType.LOCALE_SWITCH,
        level: ErrorLevel.INFO,
        locale: 'zh',
        message: 'Event 2',
      });

      expect(collector.getEvents()).toHaveLength(2);

      collector.clearEvents();

      expect(collector.getEvents()).toHaveLength(0);
    });
  });

  describe('flush', () => {
    it('should do nothing when no events', async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const remoteCollector = new EventCollector(
        createDefaultConfig({
          enableRemoteLogging: true,
          remoteEndpoint: 'https://api.example.com/events',
        }),
      );

      await remoteCollector.flush();

      expect(mockFetch).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('should send events and clear queue', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      const remoteCollector = new EventCollector(
        createDefaultConfig({
          enableRemoteLogging: true,
          remoteEndpoint: 'https://api.example.com/events',
        }),
      );

      remoteCollector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Event 1',
      });
      remoteCollector.addEvent({
        type: MonitoringEventType.LOCALE_SWITCH,
        level: ErrorLevel.INFO,
        locale: 'zh',
        message: 'Event 2',
      });

      await remoteCollector.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('events'),
        }),
      );
      expect(remoteCollector.getEvents()).toHaveLength(0);

      vi.unstubAllGlobals();
    });

    it('should not send when remote logging disabled', async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      collector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Event 1',
      });

      await collector.flush();

      expect(mockFetch).not.toHaveBeenCalled();
      // Events should still be cleared
      expect(collector.getEvents()).toHaveLength(0);

      vi.unstubAllGlobals();
    });

    it('should re-add events on fetch failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const remoteCollector = new EventCollector(
        createDefaultConfig({
          enableRemoteLogging: true,
          remoteEndpoint: 'https://api.example.com/events',
        }),
      );

      remoteCollector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Important event',
      });

      await remoteCollector.flush();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to flush monitoring events',
        expect.any(Object),
      );
      // Events should be re-added
      expect(remoteCollector.getEvents()).toHaveLength(1);

      vi.unstubAllGlobals();
    });
  });

  describe('updateConfig', () => {
    it('should merge new config with existing', () => {
      const originalConfig = collector.getConfig();
      expect(originalConfig.enabled).toBe(true);
      expect(originalConfig.enableConsoleLogging).toBe(false);

      collector.updateConfig({
        enableConsoleLogging: true,
        maxEvents: 200,
      });

      const updatedConfig = collector.getConfig();
      expect(updatedConfig.enabled).toBe(true); // unchanged
      expect(updatedConfig.enableConsoleLogging).toBe(true); // updated
      expect(updatedConfig.maxEvents).toBe(200); // updated
    });
  });

  describe('getConfig', () => {
    it('should return copy of config', () => {
      const config1 = collector.getConfig();
      const config2 = collector.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('auto-flush', () => {
    it('should set up interval that calls flush', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      const autoFlushCollector = new EventCollector(
        createDefaultConfig({
          flushInterval: 5000,
          enableRemoteLogging: true,
          remoteEndpoint: 'https://api.example.com/events',
        }),
      );

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

      // Verify the collector was created
      expect(autoFlushCollector.getConfig().flushInterval).toBe(5000);
    });
  });

  describe('generateEventId', () => {
    it('should generate unique event ids', () => {
      collector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Event 1',
      });
      collector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Event 2',
      });

      const events = collector.getEvents();
      expect(events[0].id).not.toBe(events[1].id);
    });

    it('should generate ids with timestamp prefix', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      collector.addEvent({
        type: MonitoringEventType.CACHE_MISS,
        level: ErrorLevel.INFO,
        locale: 'en',
        message: 'Test event',
      });

      const events = collector.getEvents();
      expect(events[0].id).toMatch(/^\d+-/);
    });
  });
});
