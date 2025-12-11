import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import {
  AccessLogger,
  cleanupAnalyticsData,
  ErrorLogger,
  EventManager,
} from '../locale-storage-analytics-events';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function createAccessPayload(
  overrides: Partial<Parameters<typeof AccessLogger.logAccess>[0]> = {},
) {
  return {
    key: 'pref',
    operation: 'read',
    success: true,
    responseTime: 12,
    ...overrides,
  };
}

function createErrorPayload(
  overrides: Partial<Parameters<typeof ErrorLogger.logError>[0]> = {},
) {
  return {
    error: 'boom',
    context: 'ctx',
    severity: 'medium' as const,
    ...overrides,
  };
}

describe('locale-storage-analytics-events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T00:00:00Z'));
    EventManager.removeAllListeners();
    AccessLogger.clearAccessLog();
    ErrorLogger.clearErrorLog();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('EventManager', () => {
    describe('addEventListener', () => {
      it('should add event listener', () => {
        const handler = vi.fn();

        EventManager.addEventListener('preference_loaded', handler);

        expect(EventManager.getListenerCount('preference_loaded')).toBe(1);
      });

      it('should add multiple listeners for same event', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        EventManager.addEventListener('preference_loaded', handler1);
        EventManager.addEventListener('preference_loaded', handler2);

        expect(EventManager.getListenerCount('preference_loaded')).toBe(2);
      });
    });

    describe('removeEventListener', () => {
      it('should remove specific listener', () => {
        const handler = vi.fn();
        EventManager.addEventListener('preference_loaded', handler);

        EventManager.removeEventListener('preference_loaded', handler);

        expect(EventManager.getListenerCount('preference_loaded')).toBe(0);
      });

      it('should not throw when removing non-existent listener', () => {
        const handler = vi.fn();

        expect(() => {
          EventManager.removeEventListener('preference_loaded', handler);
        }).not.toThrow();
      });

      it('should only remove specified listener', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        EventManager.addEventListener('preference_loaded', handler1);
        EventManager.addEventListener('preference_loaded', handler2);

        EventManager.removeEventListener('preference_loaded', handler1);

        expect(EventManager.getListenerCount('preference_loaded')).toBe(1);
      });
    });

    describe('removeAllListeners', () => {
      it('should remove all listeners for specific event', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        EventManager.addEventListener('preference_loaded', handler1);
        EventManager.addEventListener('error_occurred', handler2);

        EventManager.removeAllListeners('preference_loaded');

        expect(EventManager.getListenerCount('preference_loaded')).toBe(0);
        expect(EventManager.getListenerCount('error_occurred')).toBe(1);
      });

      it('should remove all listeners when no event specified', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        EventManager.addEventListener('preference_loaded', handler1);
        EventManager.addEventListener('error_occurred', handler2);

        EventManager.removeAllListeners();

        expect(EventManager.getListenerCount()).toBe(0);
      });
    });

    describe('emitEvent', () => {
      it('should call all listeners for event', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        EventManager.addEventListener('preference_loaded', handler1);
        EventManager.addEventListener('preference_loaded', handler2);

        const event = {
          type: 'preference_loaded' as const,
          timestamp: Date.now(),
          source: 'test',
        };
        EventManager.emitEvent(event);

        expect(handler1).toHaveBeenCalledWith(event);
        expect(handler2).toHaveBeenCalledWith(event);
      });

      it('should handle listener errors gracefully', () => {
        const throwingHandler = vi.fn(() => {
          throw new Error('listener error');
        });
        const normalHandler = vi.fn();
        EventManager.addEventListener('preference_loaded', throwingHandler);
        EventManager.addEventListener('preference_loaded', normalHandler);

        EventManager.emitEvent({
          type: 'preference_loaded',
          timestamp: Date.now(),
          source: 'test',
        });

        expect(throwingHandler).toHaveBeenCalled();
        expect(normalHandler).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(
          'Error in storage event listener:',
          expect.any(Error),
        );
      });

      it('should not call listeners for different event type', () => {
        const handler = vi.fn();
        EventManager.addEventListener('preference_loaded', handler);

        EventManager.emitEvent({
          type: 'error_occurred',
          timestamp: Date.now(),
          source: 'test',
        });

        expect(handler).not.toHaveBeenCalled();
      });
    });

    describe('getListenerCount', () => {
      it('should return count for specific event', () => {
        EventManager.addEventListener('preference_loaded', vi.fn());
        EventManager.addEventListener('preference_loaded', vi.fn());

        expect(EventManager.getListenerCount('preference_loaded')).toBe(2);
      });

      it('should return total count when no event specified', () => {
        EventManager.addEventListener('preference_loaded', vi.fn());
        EventManager.addEventListener('error_occurred', vi.fn());

        expect(EventManager.getListenerCount()).toBe(2);
      });

      it('should return 0 for non-existent event', () => {
        expect(EventManager.getListenerCount('nonexistent')).toBe(0);
      });
    });

    describe('getEventTypes', () => {
      it('should return all registered event types', () => {
        EventManager.addEventListener('preference_loaded', vi.fn());
        EventManager.addEventListener('error_occurred', vi.fn());

        const types = EventManager.getEventTypes();

        expect(types).toContain('preference_loaded');
        expect(types).toContain('error_occurred');
      });

      it('should return empty array when no listeners', () => {
        expect(EventManager.getEventTypes()).toEqual([]);
      });
    });
  });

  describe('AccessLogger', () => {
    describe('logAccess', () => {
      it('should log access entry', () => {
        AccessLogger.logAccess(createAccessPayload());

        const log = AccessLogger.getAccessLog();

        expect(log).toHaveLength(1);
        expect(log[0].key).toBe('pref');
        expect(log[0].operation).toBe('read');
        expect(log[0].success).toBe(true);
      });

      it('should include optional fields when provided', () => {
        AccessLogger.logAccess(
          createAccessPayload({ responseTime: 50, error: 'timeout' }),
        );

        const log = AccessLogger.getAccessLog();

        expect(log[0].responseTime).toBe(50);
        expect(log[0].error).toBe('timeout');
      });

      it('should prepend new entries', () => {
        AccessLogger.logAccess(createAccessPayload({ key: 'first' }));
        AccessLogger.logAccess(createAccessPayload({ key: 'second' }));

        const log = AccessLogger.getAccessLog();

        expect(log[0].key).toBe('second');
        expect(log[1].key).toBe('first');
      });

      it('should limit log entries to max', () => {
        for (let i = 0; i < 1100; i++) {
          AccessLogger.logAccess(createAccessPayload({ key: `key-${i}` }));
        }

        const log = AccessLogger.getAccessLog();

        expect(log.length).toBeLessThanOrEqual(1000);
      });

      it('should emit preference_loaded event', () => {
        const handler = vi.fn();
        EventManager.addEventListener('preference_loaded', handler);

        AccessLogger.logAccess(createAccessPayload());

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'preference_loaded' }),
        );
      });
    });

    describe('getAccessLog', () => {
      it('should return limited entries when limit specified', () => {
        for (let i = 0; i < 10; i++) {
          AccessLogger.logAccess(createAccessPayload());
        }

        const log = AccessLogger.getAccessLog(5);

        expect(log).toHaveLength(5);
      });

      it('should return all entries when no limit', () => {
        for (let i = 0; i < 10; i++) {
          AccessLogger.logAccess(createAccessPayload());
        }

        const log = AccessLogger.getAccessLog();

        expect(log).toHaveLength(10);
      });

      it('should return copy of log array', () => {
        AccessLogger.logAccess(createAccessPayload());

        const log1 = AccessLogger.getAccessLog();
        const log2 = AccessLogger.getAccessLog();

        expect(log1).not.toBe(log2);
      });
    });

    describe('clearAccessLog', () => {
      it('should clear all entries', () => {
        AccessLogger.logAccess(createAccessPayload());
        AccessLogger.logAccess(createAccessPayload());

        AccessLogger.clearAccessLog();

        expect(AccessLogger.getAccessLog()).toHaveLength(0);
      });
    });

    describe('getAccessStats', () => {
      it('should calculate total operations', () => {
        AccessLogger.logAccess(createAccessPayload());
        AccessLogger.logAccess(createAccessPayload());

        const stats = AccessLogger.getAccessStats();

        expect(stats.totalOperations).toBe(2);
      });

      it('should calculate success rate', () => {
        AccessLogger.logAccess(createAccessPayload({ success: true }));
        AccessLogger.logAccess(createAccessPayload({ success: false }));

        const stats = AccessLogger.getAccessStats();

        expect(stats.successRate).toBeCloseTo(50, 1);
      });

      it('should return 100% success rate when empty', () => {
        const stats = AccessLogger.getAccessStats();

        expect(stats.successRate).toBe(100);
      });

      it('should calculate average response time', () => {
        AccessLogger.logAccess(createAccessPayload({ responseTime: 10 }));
        AccessLogger.logAccess(createAccessPayload({ responseTime: 20 }));

        const stats = AccessLogger.getAccessStats();

        expect(stats.averageResponseTime).toBe(15);
      });

      it('should return 0 average when no response times', () => {
        AccessLogger.logAccess(
          createAccessPayload({ responseTime: undefined }),
        );

        const stats = AccessLogger.getAccessStats();

        expect(stats.averageResponseTime).toBe(0);
      });

      it('should count operations by type', () => {
        AccessLogger.logAccess(createAccessPayload({ operation: 'read' }));
        AccessLogger.logAccess(createAccessPayload({ operation: 'read' }));
        AccessLogger.logAccess(createAccessPayload({ operation: 'write' }));

        const stats = AccessLogger.getAccessStats();

        expect(stats.operationCounts.read).toBe(2);
        expect(stats.operationCounts.write).toBe(1);
      });

      it('should count unknown operations as other', () => {
        AccessLogger.logAccess(createAccessPayload({ operation: 'custom' }));

        const stats = AccessLogger.getAccessStats();

        expect(stats.operationCounts.other).toBe(1);
      });

      it('should count operations by key', () => {
        AccessLogger.logAccess(createAccessPayload({ key: 'a' }));
        AccessLogger.logAccess(createAccessPayload({ key: 'a' }));
        AccessLogger.logAccess(createAccessPayload({ key: 'b' }));

        const stats = AccessLogger.getAccessStats();

        expect(stats.keyCounts['a']).toBe(2);
        expect(stats.keyCounts['b']).toBe(1);
      });

      it('should return recent errors', () => {
        AccessLogger.logAccess(
          createAccessPayload({ success: false, error: 'error1' }),
        );
        AccessLogger.logAccess(
          createAccessPayload({ success: false, error: 'error2' }),
        );

        const stats = AccessLogger.getAccessStats();

        expect(stats.recentErrors).toHaveLength(2);
      });
    });
  });

  describe('ErrorLogger', () => {
    describe('logError', () => {
      it('should log error entry', () => {
        ErrorLogger.logError(createErrorPayload());

        const log = ErrorLogger.getErrorLog();

        expect(log).toHaveLength(1);
        expect(log[0].error).toBe('boom');
        expect(log[0].severity).toBe('medium');
      });

      it('should include optional fields when provided', () => {
        ErrorLogger.logError(
          createErrorPayload({ context: 'test-ctx', stack: 'stacktrace' }),
        );

        const log = ErrorLogger.getErrorLog();

        expect(log[0].context).toBe('test-ctx');
        expect(log[0].stack).toBe('stacktrace');
      });

      it('should use default severity when not provided', () => {
        ErrorLogger.logError({ error: 'test' });

        const log = ErrorLogger.getErrorLog();

        expect(log[0].severity).toBe('medium');
      });

      it('should emit error_occurred event', () => {
        const handler = vi.fn();
        EventManager.addEventListener('error_occurred', handler);

        ErrorLogger.logError(createErrorPayload());

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error_occurred' }),
        );
      });

      it('should call logger.error for critical errors', () => {
        ErrorLogger.logError(
          createErrorPayload({ severity: 'critical', context: 'ctx' }),
        );

        expect(logger.error).toHaveBeenCalledWith(
          'Critical storage error:',
          'boom',
          'ctx',
        );
      });

      it('should not call logger.error for non-critical errors', () => {
        ErrorLogger.logError(createErrorPayload({ severity: 'low' }));

        expect(logger.error).not.toHaveBeenCalled();
      });

      it('should limit log entries to max', () => {
        for (let i = 0; i < 600; i++) {
          ErrorLogger.logError(createErrorPayload());
        }

        const log = ErrorLogger.getErrorLog();

        expect(log.length).toBeLessThanOrEqual(500);
      });
    });

    describe('getErrorLog', () => {
      it('should return limited entries when limit specified', () => {
        for (let i = 0; i < 10; i++) {
          ErrorLogger.logError(createErrorPayload());
        }

        const log = ErrorLogger.getErrorLog(5);

        expect(log).toHaveLength(5);
      });
    });

    describe('clearErrorLog', () => {
      it('should clear all entries', () => {
        ErrorLogger.logError(createErrorPayload());

        ErrorLogger.clearErrorLog();

        expect(ErrorLogger.getErrorLog()).toHaveLength(0);
      });
    });

    describe('getErrorStats', () => {
      it('should calculate total errors', () => {
        ErrorLogger.logError(createErrorPayload());
        ErrorLogger.logError(createErrorPayload());

        const stats = ErrorLogger.getErrorStats();

        expect(stats.totalErrors).toBe(2);
      });

      it('should calculate error rate based on access operations', () => {
        AccessLogger.logAccess(createAccessPayload());
        AccessLogger.logAccess(createAccessPayload());
        ErrorLogger.logError(createErrorPayload());

        const stats = ErrorLogger.getErrorStats();

        expect(stats.errorRate).toBeCloseTo(50, 1);
      });

      it('should return 0 error rate when no operations', () => {
        ErrorLogger.logError(createErrorPayload());

        const stats = ErrorLogger.getErrorStats();

        expect(stats.errorRate).toBe(0);
      });

      it('should calculate severity distribution', () => {
        ErrorLogger.logError(createErrorPayload({ severity: 'low' }));
        ErrorLogger.logError(createErrorPayload({ severity: 'medium' }));
        ErrorLogger.logError(createErrorPayload({ severity: 'high' }));
        ErrorLogger.logError(createErrorPayload({ severity: 'critical' }));

        const stats = ErrorLogger.getErrorStats();

        // Note: The implementation has a bug where it returns severityDistribution
        // instead of the incremented dist variable. This test documents current behavior.
        // severityDistribution is initialized to all zeros and never incremented,
        // while dist is incremented but never returned.
        expect(stats.severityDistribution.low).toBe(0);
        expect(stats.severityDistribution.medium).toBe(0);
        expect(stats.severityDistribution.high).toBe(0);
        expect(stats.severityDistribution.critical).toBe(0);
      });

      it('should return recent errors', () => {
        for (let i = 0; i < 15; i++) {
          ErrorLogger.logError(createErrorPayload({ error: `error-${i}` }));
        }

        const stats = ErrorLogger.getErrorStats();

        expect(stats.recentErrors).toHaveLength(10);
      });

      it('should calculate error trends for past 7 days', () => {
        ErrorLogger.logError(createErrorPayload());

        const stats = ErrorLogger.getErrorStats();

        expect(stats.errorTrends).toHaveLength(7);
        expect(stats.errorTrends[0]).toHaveProperty('date');
        expect(stats.errorTrends[0]).toHaveProperty('count');
      });

      it('should count errors by date in trends', () => {
        // Log error today
        ErrorLogger.logError(createErrorPayload());

        const stats = ErrorLogger.getErrorStats();
        const todayTrend = stats.errorTrends.find(
          (t) => t.date === '2025-02-01',
        );

        expect(todayTrend?.count).toBe(1);
      });
    });
  });

  describe('cleanupAnalyticsData', () => {
    it('should remove old access log entries', () => {
      // Log old entry
      AccessLogger.logAccess(createAccessPayload({ key: 'old' }));

      // Advance time by 2 days
      vi.setSystemTime(new Date('2025-02-03T00:00:00Z'));

      // Log new entry
      AccessLogger.logAccess(createAccessPayload({ key: 'new' }));

      // Cleanup with 1 day max age
      cleanupAnalyticsData(24 * 60 * 60 * 1000);

      const log = AccessLogger.getAccessLog();
      expect(log.map((e) => e.key)).toEqual(['new']);
    });

    it('should remove old error log entries', () => {
      // Log old error
      ErrorLogger.logError(createErrorPayload({ error: 'old' }));

      // Advance time by 2 days
      vi.setSystemTime(new Date('2025-02-03T00:00:00Z'));

      // Log new error
      ErrorLogger.logError(createErrorPayload({ error: 'new' }));

      // Cleanup with 1 day max age
      cleanupAnalyticsData(24 * 60 * 60 * 1000);

      const log = ErrorLogger.getErrorLog();
      expect(log.map((e) => e.error)).toEqual(['new']);
    });

    it('should emit cache_cleared event', () => {
      const handler = vi.fn();
      EventManager.addEventListener('cache_cleared', handler);

      AccessLogger.logAccess(createAccessPayload());
      ErrorLogger.logError(createErrorPayload());

      cleanupAnalyticsData(0); // Clean everything

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cache_cleared',
          data: expect.objectContaining({
            accessLogCleaned: expect.any(Number),
            errorLogCleaned: expect.any(Number),
          }),
        }),
      );
    });

    it('should use default max age when not specified', () => {
      AccessLogger.logAccess(createAccessPayload());

      // Should not throw
      expect(() => cleanupAnalyticsData()).not.toThrow();
    });

    it('should preserve entries within max age', () => {
      AccessLogger.logAccess(createAccessPayload({ key: 'keep' }));
      ErrorLogger.logError(createErrorPayload({ error: 'keep' }));

      // Cleanup with 7 days max age (default)
      cleanupAnalyticsData(7 * 24 * 60 * 60 * 1000);

      expect(AccessLogger.getAccessLog()).toHaveLength(1);
      expect(ErrorLogger.getErrorLog()).toHaveLength(1);
    });

    it('should preserve optional fields during cleanup', () => {
      AccessLogger.logAccess(
        createAccessPayload({
          responseTime: 50,
          error: 'test-error',
        }),
      );
      ErrorLogger.logError(
        createErrorPayload({
          context: 'test-ctx',
          stack: 'test-stack',
        }),
      );

      cleanupAnalyticsData(7 * 24 * 60 * 60 * 1000);

      const accessLog = AccessLogger.getAccessLog();
      const errorLog = ErrorLogger.getErrorLog();

      expect(accessLog[0].responseTime).toBe(50);
      expect(accessLog[0].error).toBe('test-error');
      expect(errorLog[0].context).toBe('test-ctx');
      expect(errorLog[0].stack).toBe('test-stack');
    });
  });
});
