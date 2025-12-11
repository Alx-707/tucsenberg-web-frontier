import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import {
  addMultipleListeners,
  cleanupEventSystem,
  consoleLogListener,
  createCleanupEvent,
  createDebugListener,
  createErrorEvent,
  createErrorListener,
  createExportEvent,
  createImportEvent,
  createRecordAddedEvent,
  createStatsListener,
  getEventSystemStatus,
  HistoryEventManager,
  performanceListener,
  setupDefaultListeners,
} from '../locale-storage-history-events';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('locale-storage-history-events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HistoryEventManager.removeAllListeners();
    HistoryEventManager.clearEventHistory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HistoryEventManager', () => {
    describe('addEventListener', () => {
      it('should add event listener', () => {
        const handler = vi.fn();
        HistoryEventManager.addEventListener('preference_saved', handler);

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.totalListeners).toBe(1);
        expect(stats.eventTypes).toContain('preference_saved');
      });

      it('should add multiple listeners for same event type', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        HistoryEventManager.addEventListener('preference_saved', handler1);
        HistoryEventManager.addEventListener('preference_saved', handler2);

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.totalListeners).toBe(2);
        expect(stats.listenersByType['preference_saved']).toBe(2);
      });
    });

    describe('removeEventListener', () => {
      it('should remove specific listener', () => {
        const handler = vi.fn();
        HistoryEventManager.addEventListener('preference_saved', handler);
        HistoryEventManager.removeEventListener('preference_saved', handler);

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.totalListeners).toBe(0);
      });

      it('should not throw when removing non-existent listener', () => {
        const handler = vi.fn();
        expect(() => {
          HistoryEventManager.removeEventListener('preference_saved', handler);
        }).not.toThrow();
      });

      it('should only remove specified listener', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        HistoryEventManager.addEventListener('preference_saved', handler1);
        HistoryEventManager.addEventListener('preference_saved', handler2);

        HistoryEventManager.removeEventListener('preference_saved', handler1);

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.listenersByType['preference_saved']).toBe(1);
      });
    });

    describe('removeAllListeners', () => {
      it('should remove all listeners for specific event type', () => {
        HistoryEventManager.addEventListener('preference_saved', vi.fn());
        HistoryEventManager.addEventListener('cache_cleared', vi.fn());

        HistoryEventManager.removeAllListeners('preference_saved');

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.listenersByType['preference_saved']).toBeUndefined();
        expect(stats.listenersByType['cache_cleared']).toBe(1);
      });

      it('should remove all listeners when no event type specified', () => {
        HistoryEventManager.addEventListener('preference_saved', vi.fn());
        HistoryEventManager.addEventListener('cache_cleared', vi.fn());

        HistoryEventManager.removeAllListeners();

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.totalListeners).toBe(0);
      });
    });

    describe('emitEvent', () => {
      it('should call listeners for specific event type', () => {
        const handler = vi.fn();
        HistoryEventManager.addEventListener('preference_saved', handler);

        const event = {
          type: 'preference_saved' as const,
          timestamp: Date.now(),
          source: 'test',
        };
        HistoryEventManager.emitEvent(event);

        expect(handler).toHaveBeenCalledWith(event);
      });

      it('should call universal listeners (*)', () => {
        const handler = vi.fn();
        HistoryEventManager.addEventListener('*', handler);

        const event = {
          type: 'cache_cleared' as const,
          timestamp: Date.now(),
          source: 'test',
        };
        HistoryEventManager.emitEvent(event);

        expect(handler).toHaveBeenCalledWith(event);
      });

      it('should record event in history', () => {
        const event = {
          type: 'preference_saved' as const,
          timestamp: Date.now(),
          source: 'test',
        };
        HistoryEventManager.emitEvent(event);

        const history = HistoryEventManager.getEventHistory();
        expect(history).toHaveLength(1);
        expect(history[0]).toEqual(event);
      });

      it('should handle listener errors gracefully', () => {
        const throwingHandler = vi.fn(() => {
          throw new Error('listener error');
        });
        const normalHandler = vi.fn();

        HistoryEventManager.addEventListener(
          'preference_saved',
          throwingHandler,
        );
        HistoryEventManager.addEventListener('preference_saved', normalHandler);

        const event = {
          type: 'preference_saved' as const,
          timestamp: Date.now(),
          source: 'test',
        };
        HistoryEventManager.emitEvent(event);

        expect(throwingHandler).toHaveBeenCalled();
        expect(normalHandler).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
      });

      it('should handle universal listener errors gracefully', () => {
        const throwingHandler = vi.fn(() => {
          throw new Error('universal error');
        });

        HistoryEventManager.addEventListener('*', throwingHandler);

        const event = {
          type: 'preference_saved' as const,
          timestamp: Date.now(),
          source: 'test',
        };
        HistoryEventManager.emitEvent(event);

        expect(logger.error).toHaveBeenCalledWith(
          'Error in universal history event listener',
          expect.anything(),
        );
      });
    });

    describe('getEventHistory', () => {
      it('should return all events when no limit specified', () => {
        for (let i = 0; i < 5; i++) {
          HistoryEventManager.emitEvent({
            type: 'preference_saved',
            timestamp: Date.now(),
            source: 'test',
          });
        }

        const history = HistoryEventManager.getEventHistory();
        expect(history).toHaveLength(5);
      });

      it('should return limited events', () => {
        for (let i = 0; i < 10; i++) {
          HistoryEventManager.emitEvent({
            type: 'preference_saved',
            timestamp: Date.now(),
            source: 'test',
          });
        }

        const history = HistoryEventManager.getEventHistory(3);
        expect(history).toHaveLength(3);
      });

      it('should prepend new events (most recent first)', () => {
        HistoryEventManager.emitEvent({
          type: 'preference_saved',
          timestamp: 1000,
          source: 'first',
        });
        HistoryEventManager.emitEvent({
          type: 'cache_cleared',
          timestamp: 2000,
          source: 'second',
        });

        const history = HistoryEventManager.getEventHistory();
        expect(history[0].source).toBe('second');
        expect(history[1].source).toBe('first');
      });

      it('should limit history to MAX_EVENT_HISTORY (100)', () => {
        for (let i = 0; i < 150; i++) {
          HistoryEventManager.emitEvent({
            type: 'preference_saved',
            timestamp: Date.now(),
            source: `test-${i}`,
          });
        }

        const history = HistoryEventManager.getEventHistory();
        expect(history.length).toBeLessThanOrEqual(100);
      });
    });

    describe('clearEventHistory', () => {
      it('should clear all event history', () => {
        HistoryEventManager.emitEvent({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
        });
        HistoryEventManager.emitEvent({
          type: 'cache_cleared',
          timestamp: Date.now(),
          source: 'test',
        });

        HistoryEventManager.clearEventHistory();

        const history = HistoryEventManager.getEventHistory();
        expect(history).toHaveLength(0);
      });
    });

    describe('getListenerStats', () => {
      it('should return correct stats', () => {
        HistoryEventManager.addEventListener('preference_saved', vi.fn());
        HistoryEventManager.addEventListener('preference_saved', vi.fn());
        HistoryEventManager.addEventListener('cache_cleared', vi.fn());

        const stats = HistoryEventManager.getListenerStats();

        expect(stats.totalListeners).toBe(3);
        expect(stats.eventTypes).toContain('preference_saved');
        expect(stats.eventTypes).toContain('cache_cleared');
        expect(stats.listenersByType['preference_saved']).toBe(2);
        expect(stats.listenersByType['cache_cleared']).toBe(1);
      });
    });
  });

  describe('Event creation functions', () => {
    describe('createRecordAddedEvent', () => {
      it('should create record added event with correct structure', () => {
        const event = createRecordAddedEvent('en', 'browser', 0.9);

        expect(event.type).toBe('preference_saved');
        expect(event.source).toBe('history_manager');
        expect(event.timestamp).toBeGreaterThan(0);
        expect(event.data).toEqual({
          locale: 'en',
          source: 'browser',
          confidence: 0.9,
          action: 'add_record',
        });
      });
    });

    describe('createCleanupEvent', () => {
      it('should create cleanup event for expired', () => {
        const event = createCleanupEvent('expired', 5);

        expect(event.type).toBe('cache_cleared');
        expect(event.data).toEqual({
          cleanupType: 'expired',
          removedCount: 5,
          action: 'cleanup',
        });
      });

      it('should create cleanup event for duplicates', () => {
        const event = createCleanupEvent('duplicates', 3);

        expect(event.data?.cleanupType).toBe('duplicates');
      });

      it('should create cleanup event for size_limit', () => {
        const event = createCleanupEvent('size_limit', 10);

        expect(event.data?.cleanupType).toBe('size_limit');
      });

      it('should create cleanup event for all', () => {
        const event = createCleanupEvent('all', 100);

        expect(event.data?.cleanupType).toBe('all');
        expect(event.data?.removedCount).toBe(100);
      });
    });

    describe('createExportEvent', () => {
      it('should create export event for json format', () => {
        const event = createExportEvent('json', 50);

        expect(event.type).toBe('backup_created');
        expect(event.data).toEqual({
          format: 'json',
          recordCount: 50,
          action: 'export',
        });
      });

      it('should create export event for backup format', () => {
        const event = createExportEvent('backup', 100);

        expect(event.data?.format).toBe('backup');
      });
    });

    describe('createImportEvent', () => {
      it('should create import event on success', () => {
        const event = createImportEvent('json', 25, true);

        expect(event.type).toBe('backup_restored');
        expect(event.data).toEqual({
          format: 'json',
          recordCount: 25,
          success: true,
          action: 'import',
        });
      });

      it('should create import event on failure', () => {
        const event = createImportEvent('backup', 0, false);

        expect(event.data?.success).toBe(false);
      });
    });

    describe('createErrorEvent', () => {
      it('should create error event', () => {
        const event = createErrorEvent('save', 'Storage full');

        expect(event.type).toBe('history_error');
        expect(event.data).toEqual({
          operation: 'save',
          error: 'Storage full',
          action: 'error',
        });
      });
    });
  });

  describe('Listener creation functions', () => {
    describe('createDebugListener', () => {
      it('should create listener with default prefix', () => {
        const listener = createDebugListener();
        const event = {
          type: 'preference_saved' as const,
          timestamp: Date.now(),
          source: 'test',
        };

        listener(event);

        expect(logger.info).toHaveBeenCalledWith(
          '[History] Event',
          expect.objectContaining({
            type: 'preference_saved',
          }),
        );
      });

      it('should create listener with custom prefix', () => {
        const listener = createDebugListener('[CustomPrefix]');
        const event = {
          type: 'preference_saved' as const,
          timestamp: Date.now(),
          source: 'test',
        };

        listener(event);

        expect(logger.info).toHaveBeenCalledWith(
          '[CustomPrefix] Event',
          expect.anything(),
        );
      });
    });

    describe('createStatsListener', () => {
      it('should track event counts by type', () => {
        const { listener, getStats } = createStatsListener();

        listener({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
        });
        listener({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
        });
        listener({
          type: 'cache_cleared',
          timestamp: Date.now(),
          source: 'test',
        });

        const stats = getStats();
        expect(stats.totalEvents).toBe(3);
        expect(stats.eventsByType.preference_saved).toBe(2);
        expect(stats.eventsByType.cache_cleared).toBe(1);
      });

      it('should track backup_created events', () => {
        const { listener, getStats } = createStatsListener();

        listener({
          type: 'backup_created',
          timestamp: Date.now(),
          source: 'test',
        });

        const stats = getStats();
        expect(stats.eventsByType.backup_created).toBe(1);
      });

      it('should track backup_restored events', () => {
        const { listener, getStats } = createStatsListener();

        listener({
          type: 'backup_restored',
          timestamp: Date.now(),
          source: 'test',
        });

        const stats = getStats();
        expect(stats.eventsByType.backup_restored).toBe(1);
      });

      it('should track history_error events', () => {
        const { listener, getStats } = createStatsListener();

        listener({
          type: 'history_error',
          timestamp: Date.now(),
          source: 'test',
        });

        const stats = getStats();
        expect(stats.eventsByType.history_error).toBe(1);
      });

      it('should limit recent events to 10', () => {
        const { listener, getStats } = createStatsListener();

        for (let i = 0; i < 15; i++) {
          listener({
            type: 'preference_saved',
            timestamp: Date.now(),
            source: `test-${i}`,
          });
        }

        const stats = getStats();
        expect(stats.recentEvents).toHaveLength(10);
      });

      it('should handle unknown event types', () => {
        const { listener, getStats } = createStatsListener();

        listener({
          type: 'unknown_event' as 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
        });

        const stats = getStats();
        expect(stats.totalEvents).toBe(1);
      });
    });

    describe('createErrorListener', () => {
      it('should call onError for history_error events', () => {
        const onError = vi.fn();
        const listener = createErrorListener(onError);

        const event = {
          type: 'history_error' as const,
          timestamp: Date.now(),
          source: 'test',
          data: {
            operation: 'save',
            error: 'Storage full',
          },
        };
        listener(event);

        expect(onError).toHaveBeenCalledWith('Storage full', 'save', event);
      });

      it('should not call onError for non-error events', () => {
        const onError = vi.fn();
        const listener = createErrorListener(onError);

        listener({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
        });

        expect(onError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Predefined listeners', () => {
    describe('consoleLogListener', () => {
      it('should log history_error events as error', () => {
        const event = {
          type: 'history_error' as const,
          timestamp: Date.now(),
          source: 'test',
          data: { error: 'test error' },
        };

        consoleLogListener(event);

        expect(logger.error).toHaveBeenCalled();
      });

      it('should log other events as info', () => {
        const event = {
          type: 'preference_saved' as const,
          timestamp: Date.now(),
          source: 'test',
        };

        consoleLogListener(event);

        expect(logger.info).toHaveBeenCalled();
      });
    });

    describe('performanceListener', () => {
      it('should log warning for large cleanup (>100 records)', () => {
        const event = {
          type: 'history_cleanup' as const,
          timestamp: Date.now(),
          source: 'test',
          data: {
            cleanupType: 'expired',
            removedCount: 150,
          },
        };

        performanceListener(event);

        expect(logger.warn).toHaveBeenCalledWith('大量历史记录清理', {
          cleanupType: 'expired',
          removedCount: 150,
        });
      });

      it('should not log warning for small cleanup', () => {
        const event = {
          type: 'history_cleanup' as const,
          timestamp: Date.now(),
          source: 'test',
          data: {
            cleanupType: 'expired',
            removedCount: 50,
          },
        };

        performanceListener(event);

        expect(logger.warn).not.toHaveBeenCalled();
      });

      it('should log error for history_error events', () => {
        const event = {
          type: 'history_error' as const,
          timestamp: Date.now(),
          source: 'test',
          data: { error: 'test error' },
        };

        performanceListener(event);

        expect(logger.error).toHaveBeenCalledWith('历史记录操作失败', {
          data: { error: 'test error' },
        });
      });
    });
  });

  describe('Utility functions', () => {
    describe('addMultipleListeners', () => {
      it('should add multiple listeners at once', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        addMultipleListeners([
          { eventType: 'preference_saved', listener: handler1 },
          { eventType: 'cache_cleared', listener: handler2 },
        ]);

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.totalListeners).toBe(2);
      });
    });

    describe('setupDefaultListeners', () => {
      it('should setup console log listener by default', () => {
        setupDefaultListeners();

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.listenersByType['*']).toBeGreaterThanOrEqual(2);
      });

      it('should setup performance listener by default', () => {
        setupDefaultListeners({ enableConsoleLog: false });

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.listenersByType['*']).toBeGreaterThanOrEqual(1);
      });

      it('should setup debug listener when enabled', () => {
        setupDefaultListeners({
          enableConsoleLog: false,
          enablePerformanceMonitoring: false,
          enableDebug: true,
        });

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.listenersByType['*']).toBeGreaterThanOrEqual(1);
      });

      it('should not setup listeners when all disabled', () => {
        setupDefaultListeners({
          enableConsoleLog: false,
          enablePerformanceMonitoring: false,
          enableDebug: false,
        });

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.totalListeners).toBe(0);
      });
    });

    describe('cleanupEventSystem', () => {
      it('should remove all listeners and clear history', () => {
        HistoryEventManager.addEventListener('preference_saved', vi.fn());
        HistoryEventManager.emitEvent({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
        });

        cleanupEventSystem();

        const stats = HistoryEventManager.getListenerStats();
        expect(stats.totalListeners).toBe(0);
        expect(HistoryEventManager.getEventHistory()).toHaveLength(0);
      });
    });

    describe('getEventSystemStatus', () => {
      it('should return inactive status when no listeners', () => {
        const status = getEventSystemStatus();

        expect(status.isActive).toBe(false);
        expect(status.listenerStats.totalListeners).toBe(0);
      });

      it('should return active status when listeners exist', () => {
        HistoryEventManager.addEventListener('preference_saved', vi.fn());

        const status = getEventSystemStatus();

        expect(status.isActive).toBe(true);
      });

      it('should return correct event history count', () => {
        HistoryEventManager.emitEvent({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
        });
        HistoryEventManager.emitEvent({
          type: 'cache_cleared',
          timestamp: Date.now(),
          source: 'test',
        });

        const status = getEventSystemStatus();

        expect(status.eventHistoryCount).toBe(2);
      });

      it('should return last event time', () => {
        const timestamp = Date.now();
        HistoryEventManager.emitEvent({
          type: 'preference_saved',
          timestamp,
          source: 'test',
        });

        const status = getEventSystemStatus();

        expect(status.lastEventTime).toBe(timestamp);
      });

      it('should return null for last event time when no events', () => {
        const status = getEventSystemStatus();

        expect(status.lastEventTime).toBeNull();
      });
    });
  });
});
