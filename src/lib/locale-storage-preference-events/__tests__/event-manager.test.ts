/**
 * Unit tests for event-manager module
 * Tests central event management class PreferenceEventManager
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  StorageEvent,
  StorageEventListener,
} from '@/lib/locale-storage-types';
import { logger } from '@/lib/logger';
import { PreferenceEventManager } from '../event-manager';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('PreferenceEventManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PreferenceEventManager.removeAllListeners();
    PreferenceEventManager.clearEventHistory();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addEventListener', () => {
    it('should add event listener for specific event type', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(1);
      expect(stats.eventTypes).toContain('preference_saved');
    });

    it('should add multiple listeners for same event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      PreferenceEventManager.addEventListener('preference_saved', handler1);
      PreferenceEventManager.addEventListener('preference_saved', handler2);
      PreferenceEventManager.addEventListener('preference_saved', handler3);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(3);
      expect(stats.listenersByType['preference_saved']).toBe(3);
    });

    it('should add listeners for different event types', () => {
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_loaded', vi.fn());
      PreferenceEventManager.addEventListener('override_set', vi.fn());

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(3);
      expect(stats.eventTypes).toHaveLength(3);
      expect(stats.eventTypes).toContain('preference_saved');
      expect(stats.eventTypes).toContain('preference_loaded');
      expect(stats.eventTypes).toContain('override_set');
    });

    it('should support universal listener with "*"', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('*', handler);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.eventTypes).toContain('*');
      expect(stats.listenersByType['*']).toBe(1);
    });

    it('should allow same handler to be added multiple times', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);
      PreferenceEventManager.addEventListener('preference_saved', handler);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.listenersByType['preference_saved']).toBe(2);
    });
  });

  describe('removeEventListener', () => {
    it('should remove specific listener', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);
      PreferenceEventManager.removeEventListener('preference_saved', handler);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(0);
    });

    it('should only remove specified listener', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler1);
      PreferenceEventManager.addEventListener('preference_saved', handler2);

      PreferenceEventManager.removeEventListener('preference_saved', handler1);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.listenersByType['preference_saved']).toBe(1);
    });

    it('should not throw when removing non-existent listener', () => {
      const handler = vi.fn();
      expect(() => {
        PreferenceEventManager.removeEventListener('preference_saved', handler);
      }).not.toThrow();
    });

    it('should not throw when removing from non-existent event type', () => {
      const handler = vi.fn();
      expect(() => {
        PreferenceEventManager.removeEventListener('unknown_event', handler);
      }).not.toThrow();
    });

    it('should only remove first occurrence if handler added multiple times', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);
      PreferenceEventManager.addEventListener('preference_saved', handler);
      PreferenceEventManager.addEventListener('preference_saved', handler);

      PreferenceEventManager.removeEventListener('preference_saved', handler);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.listenersByType['preference_saved']).toBe(2);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event type', () => {
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_loaded', vi.fn());

      PreferenceEventManager.removeAllListeners('preference_saved');

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.listenersByType['preference_saved']).toBeUndefined();
      expect(stats.listenersByType['preference_loaded']).toBe(1);
    });

    it('should remove all listeners when no event type specified', () => {
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_loaded', vi.fn());
      PreferenceEventManager.addEventListener('override_set', vi.fn());

      PreferenceEventManager.removeAllListeners();

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(0);
    });

    it('should not throw when removing listeners from empty manager', () => {
      expect(() => {
        PreferenceEventManager.removeAllListeners();
      }).not.toThrow();
    });

    it('should not throw when removing non-existent event type', () => {
      expect(() => {
        PreferenceEventManager.removeAllListeners('unknown_event');
      }).not.toThrow();
    });
  });

  describe('emitEvent', () => {
    it('should call listeners for specific event type', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: { locale: 'en' },
      };
      PreferenceEventManager.emitEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should call all listeners for event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      PreferenceEventManager.addEventListener('preference_saved', handler1);
      PreferenceEventManager.addEventListener('preference_saved', handler2);
      PreferenceEventManager.addEventListener('preference_saved', handler3);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
      expect(handler3).toHaveBeenCalledWith(event);
    });

    it('should call universal listeners (*) for any event', () => {
      const universalHandler = vi.fn();
      PreferenceEventManager.addEventListener('*', universalHandler);

      const events: StorageEvent[] = [
        { type: 'preference_saved', timestamp: Date.now(), source: 'test' },
        { type: 'preference_loaded', timestamp: Date.now(), source: 'test' },
        { type: 'override_set', timestamp: Date.now(), source: 'test' },
      ];

      events.forEach((event) => PreferenceEventManager.emitEvent(event));

      expect(universalHandler).toHaveBeenCalledTimes(3);
    });

    it('should call both specific and universal listeners', () => {
      const specificHandler = vi.fn();
      const universalHandler = vi.fn();

      PreferenceEventManager.addEventListener(
        'preference_saved',
        specificHandler,
      );
      PreferenceEventManager.addEventListener('*', universalHandler);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(specificHandler).toHaveBeenCalledWith(event);
      expect(universalHandler).toHaveBeenCalledWith(event);
    });

    it('should not call listeners for different event types', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);

      const event: StorageEvent = {
        type: 'preference_loaded',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should record event in history', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      const history = PreferenceEventManager.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(event);
    });

    it('should handle listener errors gracefully', () => {
      const throwingHandler = vi.fn(() => {
        throw new Error('listener error');
      });
      const normalHandler = vi.fn();

      PreferenceEventManager.addEventListener(
        'preference_saved',
        throwingHandler,
      );
      PreferenceEventManager.addEventListener(
        'preference_saved',
        normalHandler,
      );

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(throwingHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error in preference event listener for preference_saved',
        ),
        expect.any(Object),
      );
    });

    it('should handle universal listener errors gracefully', () => {
      const throwingHandler = vi.fn(() => {
        throw new Error('universal error');
      });

      PreferenceEventManager.addEventListener('*', throwingHandler);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in universal preference event listener',
        expect.any(Object),
      );
    });

    it('should continue calling remaining listeners after error', () => {
      const handler1 = vi.fn();
      const throwingHandler = vi.fn(() => {
        throw new Error('error');
      });
      const handler2 = vi.fn();

      PreferenceEventManager.addEventListener('preference_saved', handler1);
      PreferenceEventManager.addEventListener(
        'preference_saved',
        throwingHandler,
      );
      PreferenceEventManager.addEventListener('preference_saved', handler2);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('getEventHistory', () => {
    it('should return all events when no limit specified', () => {
      for (let i = 0; i < 5; i++) {
        PreferenceEventManager.emitEvent({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: `test-${i}`,
        });
      }

      const history = PreferenceEventManager.getEventHistory();
      expect(history).toHaveLength(5);
    });

    it('should return limited events when limit specified', () => {
      for (let i = 0; i < 10; i++) {
        PreferenceEventManager.emitEvent({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: `test-${i}`,
        });
      }

      const history = PreferenceEventManager.getEventHistory(3);
      expect(history).toHaveLength(3);
    });

    it('should return most recent events first', () => {
      PreferenceEventManager.emitEvent({
        type: 'preference_saved',
        timestamp: 1000,
        source: 'first',
      });
      PreferenceEventManager.emitEvent({
        type: 'preference_loaded',
        timestamp: 2000,
        source: 'second',
      });

      const history = PreferenceEventManager.getEventHistory();
      expect(history[0]!.source).toBe('second');
      expect(history[1]!.source).toBe('first');
    });

    it('should limit history to MAX_EVENT_HISTORY (100)', () => {
      for (let i = 0; i < 150; i++) {
        PreferenceEventManager.emitEvent({
          type: 'preference_saved',
          timestamp: Date.now(),
          source: `test-${i}`,
        });
      }

      const history = PreferenceEventManager.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should return a copy of the history array', () => {
      PreferenceEventManager.emitEvent({
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      });

      const history1 = PreferenceEventManager.getEventHistory();
      const history2 = PreferenceEventManager.getEventHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    it('should return empty array when no events', () => {
      const history = PreferenceEventManager.getEventHistory();
      expect(history).toEqual([]);
    });
  });

  describe('clearEventHistory', () => {
    it('should clear all event history', () => {
      PreferenceEventManager.emitEvent({
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      });
      PreferenceEventManager.emitEvent({
        type: 'preference_loaded',
        timestamp: Date.now(),
        source: 'test',
      });

      PreferenceEventManager.clearEventHistory();

      const history = PreferenceEventManager.getEventHistory();
      expect(history).toHaveLength(0);
    });

    it('should not affect listeners when clearing history', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);

      PreferenceEventManager.clearEventHistory();

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(1);
    });
  });

  describe('getListenerStats', () => {
    it('should return correct total listener count', () => {
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_loaded', vi.fn());

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(3);
    });

    it('should return all event types', () => {
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_loaded', vi.fn());
      PreferenceEventManager.addEventListener('override_set', vi.fn());

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.eventTypes).toContain('preference_saved');
      expect(stats.eventTypes).toContain('preference_loaded');
      expect(stats.eventTypes).toContain('override_set');
    });

    it('should return correct listeners by type', () => {
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_saved', vi.fn());
      PreferenceEventManager.addEventListener('preference_loaded', vi.fn());

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.listenersByType['preference_saved']).toBe(2);
      expect(stats.listenersByType['preference_loaded']).toBe(1);
    });

    it('should return zero counts when no listeners', () => {
      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(0);
      expect(stats.eventTypes).toHaveLength(0);
      expect(Object.keys(stats.listenersByType)).toHaveLength(0);
    });
  });

  describe('multiple listeners edge cases', () => {
    it('should handle listener removal during dispatch', () => {
      const handler1 = vi.fn();
      const handler2: StorageEventListener = vi.fn(() => {
        PreferenceEventManager.removeEventListener(
          'preference_saved',
          handler3,
        );
      });
      const handler3 = vi.fn();

      PreferenceEventManager.addEventListener('preference_saved', handler1);
      PreferenceEventManager.addEventListener('preference_saved', handler2);
      PreferenceEventManager.addEventListener('preference_saved', handler3);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      // handler3 may or may not be called depending on implementation
    });

    it('should handle listener addition during dispatch', () => {
      const newHandler = vi.fn();
      const handler1: StorageEventListener = vi.fn(() => {
        PreferenceEventManager.addEventListener('preference_saved', newHandler);
      });

      PreferenceEventManager.addEventListener('preference_saved', handler1);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
      };
      PreferenceEventManager.emitEvent(event);

      expect(handler1).toHaveBeenCalled();
      // newHandler should not be called during current dispatch
    });

    it('should correctly track stats after complex operations', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      PreferenceEventManager.addEventListener('preference_saved', handler1);
      PreferenceEventManager.addEventListener('preference_saved', handler2);
      PreferenceEventManager.addEventListener('preference_loaded', handler1);
      PreferenceEventManager.removeEventListener('preference_saved', handler1);

      const stats = PreferenceEventManager.getListenerStats();
      expect(stats.totalListeners).toBe(2);
      expect(stats.listenersByType['preference_saved']).toBe(1);
      expect(stats.listenersByType['preference_loaded']).toBe(1);
    });
  });

  describe('event data integrity', () => {
    it('should pass event object without modification', () => {
      const handler = vi.fn();
      PreferenceEventManager.addEventListener('preference_saved', handler);

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: { locale: 'en', confidence: 0.95 },
        metadata: { version: '1.0' },
      };
      PreferenceEventManager.emitEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
      const passedEvent = handler.mock.calls[0]![0];
      expect(passedEvent.data).toEqual({ locale: 'en', confidence: 0.95 });
      expect(passedEvent.metadata).toEqual({ version: '1.0' });
    });

    it('should store complete event in history', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: { locale: 'en' },
        target: 'localStorage',
        metadata: { key: 'value' },
      };
      PreferenceEventManager.emitEvent(event);

      const history = PreferenceEventManager.getEventHistory();
      expect(history[0]).toEqual(event);
    });
  });
});
