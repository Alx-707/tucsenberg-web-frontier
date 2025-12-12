/**
 * Unit tests for system-manager module
 * Tests event system management utility functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PreferenceEventManager } from '../event-manager';
import {
  cleanupEventSystem,
  getEventSystemStatus,
  setupDefaultListeners,
} from '../system-manager';

vi.mock('../event-manager', () => ({
  PreferenceEventManager: {
    addEventListener: vi.fn(),
    removeAllListeners: vi.fn(),
    clearEventHistory: vi.fn(),
    getListenerStats: vi.fn(),
    getEventHistory: vi.fn(),
  },
}));

vi.mock('../event-listeners', () => ({
  consoleLogListener: vi.fn(),
  historyRecordingListener: vi.fn(),
}));

describe('system-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setupDefaultListeners', () => {
    it('should setup console log listener by default', async () => {
      const { consoleLogListener } = await import('../event-listeners');

      setupDefaultListeners();

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
        '*',
        consoleLogListener,
      );
    });

    it('should setup history recording listener by default', async () => {
      const { historyRecordingListener } = await import('../event-listeners');

      setupDefaultListeners();

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
        'preference_saved',
        historyRecordingListener,
      );
    });

    it('should setup both listeners with default options', () => {
      setupDefaultListeners();

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledTimes(2);
    });

    it('should not setup console log listener when disabled', async () => {
      const { consoleLogListener } = await import('../event-listeners');

      setupDefaultListeners({ enableConsoleLog: false });

      expect(PreferenceEventManager.addEventListener).not.toHaveBeenCalledWith(
        '*',
        consoleLogListener,
      );
    });

    it('should not setup history recording listener when disabled', async () => {
      const { historyRecordingListener } = await import('../event-listeners');

      setupDefaultListeners({ enableHistoryRecording: false });

      expect(PreferenceEventManager.addEventListener).not.toHaveBeenCalledWith(
        'preference_saved',
        historyRecordingListener,
      );
    });

    it('should setup no listeners when both disabled', () => {
      setupDefaultListeners({
        enableConsoleLog: false,
        enableHistoryRecording: false,
      });

      expect(PreferenceEventManager.addEventListener).not.toHaveBeenCalled();
    });

    it('should handle empty options object', () => {
      setupDefaultListeners({});

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledTimes(2);
    });

    it('should handle partial options', async () => {
      const { consoleLogListener } = await import('../event-listeners');
      const { historyRecordingListener } = await import('../event-listeners');

      setupDefaultListeners({ enableConsoleLog: true });

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
        '*',
        consoleLogListener,
      );
      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
        'preference_saved',
        historyRecordingListener,
      );
    });

    it('should setup only console log when history disabled', async () => {
      const { consoleLogListener } = await import('../event-listeners');

      setupDefaultListeners({
        enableConsoleLog: true,
        enableHistoryRecording: false,
      });

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledTimes(1);
      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
        '*',
        consoleLogListener,
      );
    });

    it('should setup only history recording when console disabled', async () => {
      const { historyRecordingListener } = await import('../event-listeners');

      setupDefaultListeners({
        enableConsoleLog: false,
        enableHistoryRecording: true,
      });

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledTimes(1);
      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
        'preference_saved',
        historyRecordingListener,
      );
    });
  });

  describe('cleanupEventSystem', () => {
    it('should remove all listeners', () => {
      cleanupEventSystem();

      expect(PreferenceEventManager.removeAllListeners).toHaveBeenCalled();
    });

    it('should clear event history', () => {
      cleanupEventSystem();

      expect(PreferenceEventManager.clearEventHistory).toHaveBeenCalled();
    });

    it('should call cleanup methods in correct order', () => {
      const callOrder: string[] = [];

      vi.mocked(PreferenceEventManager.removeAllListeners).mockImplementation(
        () => {
          callOrder.push('removeAllListeners');
        },
      );

      vi.mocked(PreferenceEventManager.clearEventHistory).mockImplementation(
        () => {
          callOrder.push('clearEventHistory');
        },
      );

      cleanupEventSystem();

      expect(callOrder).toEqual(['removeAllListeners', 'clearEventHistory']);
    });

    it('should be idempotent', () => {
      cleanupEventSystem();
      cleanupEventSystem();
      cleanupEventSystem();

      expect(PreferenceEventManager.removeAllListeners).toHaveBeenCalledTimes(
        3,
      );
      expect(PreferenceEventManager.clearEventHistory).toHaveBeenCalledTimes(3);
    });
  });

  describe('getEventSystemStatus', () => {
    it('should return inactive status when no listeners', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 0,
        eventTypes: [],
        listenersByType: {},
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();

      expect(status.isActive).toBe(false);
    });

    it('should return active status when listeners exist', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 2,
        eventTypes: ['preference_saved', '*'],
        listenersByType: { 'preference_saved': 1, '*': 1 },
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();

      expect(status.isActive).toBe(true);
    });

    it('should return listener stats', () => {
      const mockStats = {
        totalListeners: 3,
        eventTypes: ['preference_saved', 'preference_loaded', '*'],
        listenersByType: {
          'preference_saved': 1,
          'preference_loaded': 1,
          '*': 1,
        },
      };

      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue(
        mockStats,
      );
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();

      expect(status.listenerStats).toEqual(mockStats);
    });

    it('should return correct event history count', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 0,
        eventTypes: [],
        listenersByType: {},
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockImplementation(
        (limit?: number) => {
          if (limit === 1) {
            return [
              {
                type: 'preference_saved',
                timestamp: Date.now(),
                source: 'test',
              },
            ];
          }
          return [
            { type: 'preference_saved', timestamp: Date.now(), source: 'test' },
            {
              type: 'preference_loaded',
              timestamp: Date.now() - 1000,
              source: 'test',
            },
            {
              type: 'override_set',
              timestamp: Date.now() - 2000,
              source: 'test',
            },
          ];
        },
      );

      const status = getEventSystemStatus();

      expect(status.eventHistoryCount).toBe(3);
    });

    it('should return last event time', () => {
      const timestamp = Date.now();

      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 0,
        eventTypes: [],
        listenersByType: {},
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockImplementation(
        (limit?: number) => {
          if (limit === 1) {
            return [{ type: 'preference_saved', timestamp, source: 'test' }];
          }
          return [{ type: 'preference_saved', timestamp, source: 'test' }];
        },
      );

      const status = getEventSystemStatus();

      expect(status.lastEventTime).toBe(timestamp);
    });

    it('should return null for last event time when no events', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 0,
        eventTypes: [],
        listenersByType: {},
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();

      expect(status.lastEventTime).toBeNull();
    });

    it('should handle event with undefined timestamp', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 0,
        eventTypes: [],
        listenersByType: {},
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockImplementation(
        (limit?: number) => {
          if (limit === 1) {
            return [
              {
                type: 'preference_saved',
                timestamp: undefined as unknown as number,
                source: 'test',
              },
            ];
          }
          return [];
        },
      );

      const status = getEventSystemStatus();

      expect(status.lastEventTime).toBeNull();
    });

    it('should return correct type structure', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 1,
        eventTypes: ['*'],
        listenersByType: { '*': 1 },
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([
        { type: 'preference_saved', timestamp: Date.now(), source: 'test' },
      ]);

      const status = getEventSystemStatus();

      expect(typeof status.isActive).toBe('boolean');
      expect(typeof status.listenerStats).toBe('object');
      expect(typeof status.eventHistoryCount).toBe('number');
      expect(
        status.lastEventTime === null ||
          typeof status.lastEventTime === 'number',
      ).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should setup, get status, and cleanup correctly', () => {
      // Setup
      setupDefaultListeners();
      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledTimes(2);

      // Get status
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 2,
        eventTypes: ['preference_saved', '*'],
        listenersByType: { 'preference_saved': 1, '*': 1 },
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();
      expect(status.isActive).toBe(true);

      // Cleanup
      cleanupEventSystem();
      expect(PreferenceEventManager.removeAllListeners).toHaveBeenCalled();
      expect(PreferenceEventManager.clearEventHistory).toHaveBeenCalled();
    });

    it('should handle multiple setup calls', () => {
      setupDefaultListeners();
      setupDefaultListeners();

      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledTimes(4);
    });

    it('should handle cleanup after multiple setups', () => {
      setupDefaultListeners();
      setupDefaultListeners();
      cleanupEventSystem();

      expect(PreferenceEventManager.removeAllListeners).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle getEventHistory returning empty array with limit', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 0,
        eventTypes: [],
        listenersByType: {},
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();

      expect(status.eventHistoryCount).toBe(0);
      expect(status.lastEventTime).toBeNull();
    });

    it('should handle single listener correctly', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 1,
        eventTypes: ['preference_saved'],
        listenersByType: { preference_saved: 1 },
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();

      expect(status.isActive).toBe(true);
      expect(status.listenerStats.totalListeners).toBe(1);
    });

    it('should handle large number of listeners', () => {
      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 1000,
        eventTypes: ['preference_saved', '*'],
        listenersByType: { 'preference_saved': 500, '*': 500 },
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockReturnValue([]);

      const status = getEventSystemStatus();

      expect(status.isActive).toBe(true);
      expect(status.listenerStats.totalListeners).toBe(1000);
    });

    it('should handle large event history', () => {
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        type: 'preference_saved' as const,
        timestamp: Date.now() - i * 1000,
        source: `test-${i}`,
      }));

      vi.mocked(PreferenceEventManager.getListenerStats).mockReturnValue({
        totalListeners: 0,
        eventTypes: [],
        listenersByType: {},
      });
      vi.mocked(PreferenceEventManager.getEventHistory).mockImplementation(
        (limit?: number) => {
          if (limit === 1) {
            return [largeHistory[0]!];
          }
          return largeHistory;
        },
      );

      const status = getEventSystemStatus();

      expect(status.eventHistoryCount).toBe(100);
      expect(status.lastEventTime).toBe(largeHistory[0]!.timestamp);
    });
  });
});
