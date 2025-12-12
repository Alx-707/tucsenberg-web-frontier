/**
 * Unit tests for event-listeners module
 * Tests predefined event listener functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StorageEvent } from '@/lib/locale-storage-types';
import { logger } from '@/lib/logger';
import {
  consoleLogListener,
  historyRecordingListener,
} from '../event-listeners';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../history-manager', () => ({
  recordPreferenceHistory: vi.fn(),
}));

describe('event-listeners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('consoleLogListener', () => {
    it('should log preference_saved events with info level', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: { locale: 'en', source: 'user' },
      };

      consoleLogListener(event);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('偏好已保存'),
        expect.objectContaining({
          timestamp: expect.any(String),
          data: { locale: 'en', source: 'user' },
        }),
      );
    });

    it('should log preference_loaded events with info level', () => {
      const event: StorageEvent = {
        type: 'preference_loaded',
        timestamp: Date.now(),
        source: 'test',
        data: { locale: 'zh', storageSource: 'localStorage' },
      };

      consoleLogListener(event);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('偏好已加载'),
        expect.objectContaining({
          data: { locale: 'zh', storageSource: 'localStorage' },
        }),
      );
    });

    it('should log override_set events with info level', () => {
      const event: StorageEvent = {
        type: 'override_set',
        timestamp: Date.now(),
        source: 'test',
        data: { locale: 'en', action: 'set_override' },
      };

      consoleLogListener(event);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('覆盖已设置'),
        expect.objectContaining({
          data: { locale: 'en', action: 'set_override' },
        }),
      );
    });

    it('should log override_cleared events with info level', () => {
      const event: StorageEvent = {
        type: 'override_cleared',
        timestamp: Date.now(),
        source: 'test',
        data: { action: 'clear_override' },
      };

      consoleLogListener(event);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('覆盖已清除'),
        expect.objectContaining({
          data: { action: 'clear_override' },
        }),
      );
    });

    it('should log preference_sync events with info level', () => {
      const event: StorageEvent = {
        type: 'preference_sync',
        timestamp: Date.now(),
        source: 'test',
        data: { synced: true, action: 'sync' },
      };

      consoleLogListener(event);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('偏好已同步'),
        expect.objectContaining({
          data: { synced: true, action: 'sync' },
        }),
      );
    });

    it('should log preference_error events with error level', () => {
      const event: StorageEvent = {
        type: 'preference_error',
        timestamp: Date.now(),
        source: 'test',
        data: { operation: 'save', error: 'Storage full' },
      };

      consoleLogListener(event);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('偏好错误'),
        expect.objectContaining({
          data: { operation: 'save', error: 'Storage full' },
        }),
      );
    });

    it('should handle unknown event types with info level', () => {
      const event: StorageEvent = {
        type: 'unknown_type' as StorageEvent['type'],
        timestamp: Date.now(),
        source: 'test',
        data: { custom: 'data' },
      };

      consoleLogListener(event);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('偏好事件'),
        expect.objectContaining({
          data: { custom: 'data' },
        }),
      );
    });

    it('should format timestamp correctly', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: new Date('2024-01-15T10:30:00Z').getTime(),
        source: 'test',
        data: {},
      };

      consoleLogListener(event);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle events without data', () => {
      const event: StorageEvent = {
        type: 'override_cleared',
        timestamp: Date.now(),
        source: 'test',
      };

      expect(() => consoleLogListener(event)).not.toThrow();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle events with undefined data', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: undefined,
      };

      expect(() => consoleLogListener(event)).not.toThrow();
    });
  });

  describe('historyRecordingListener', () => {
    it('should record history for preference_saved events', async () => {
      const { recordPreferenceHistory } = await import('../history-manager');

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: {
          locale: 'en',
          source: 'user',
          confidence: 0.95,
        },
      };

      historyRecordingListener(event);

      expect(recordPreferenceHistory).toHaveBeenCalledWith({
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
        metadata: { recordedBy: 'event_listener' },
      });
    });

    it('should not record history for non-preference_saved events', async () => {
      const { recordPreferenceHistory } = await import('../history-manager');

      const nonSavedEvents: StorageEvent[] = [
        { type: 'preference_loaded', timestamp: Date.now(), source: 'test' },
        { type: 'override_set', timestamp: Date.now(), source: 'test' },
        { type: 'override_cleared', timestamp: Date.now(), source: 'test' },
        { type: 'preference_sync', timestamp: Date.now(), source: 'test' },
        { type: 'preference_error', timestamp: Date.now(), source: 'test' },
      ];

      for (const event of nonSavedEvents) {
        historyRecordingListener(event);
      }

      expect(recordPreferenceHistory).not.toHaveBeenCalled();
    });

    it('should not record history when event data is missing', async () => {
      const { recordPreferenceHistory } = await import('../history-manager');

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: undefined,
      };

      historyRecordingListener(event);

      expect(recordPreferenceHistory).not.toHaveBeenCalled();
    });

    it('should use event timestamp for recorded preference', async () => {
      const { recordPreferenceHistory } = await import('../history-manager');

      const eventTimestamp = Date.now() - 5000;
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: eventTimestamp,
        source: 'test',
        data: {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
        },
      };

      historyRecordingListener(event);

      expect(recordPreferenceHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: eventTimestamp,
        }),
      );
    });

    it('should include recordedBy metadata', async () => {
      const { recordPreferenceHistory } = await import('../history-manager');

      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: {
          locale: 'en',
          source: 'geo',
          confidence: 0.7,
        },
      };

      historyRecordingListener(event);

      expect(recordPreferenceHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { recordedBy: 'event_listener' },
        }),
      );
    });

    it('should handle different confidence values', async () => {
      const { recordPreferenceHistory } = await import('../history-manager');

      const confidenceValues = [0, 0.5, 1.0];

      for (const confidence of confidenceValues) {
        vi.clearAllMocks();

        const event: StorageEvent = {
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
          data: {
            locale: 'en',
            source: 'user',
            confidence,
          },
        };

        historyRecordingListener(event);

        expect(recordPreferenceHistory).toHaveBeenCalledWith(
          expect.objectContaining({ confidence }),
        );
      }
    });

    it('should handle different locale sources', async () => {
      const { recordPreferenceHistory } = await import('../history-manager');

      const sources = ['user', 'browser', 'geo', 'url', 'default'];

      for (const source of sources) {
        vi.clearAllMocks();

        const event: StorageEvent = {
          type: 'preference_saved',
          timestamp: Date.now(),
          source: 'test',
          data: {
            locale: 'en',
            source,
            confidence: 0.9,
          },
        };

        historyRecordingListener(event);

        expect(recordPreferenceHistory).toHaveBeenCalledWith(
          expect.objectContaining({ source }),
        );
      }
    });
  });

  describe('listener type safety', () => {
    it('consoleLogListener should be a valid StorageEventListener', () => {
      expect(typeof consoleLogListener).toBe('function');
      expect(consoleLogListener.length).toBe(1);
    });

    it('historyRecordingListener should be a valid StorageEventListener', () => {
      expect(typeof historyRecordingListener).toBe('function');
      expect(historyRecordingListener.length).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle events with empty data object', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: {},
      };

      expect(() => consoleLogListener(event)).not.toThrow();
    });

    it('should handle events with complex nested data', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now(),
        source: 'test',
        data: {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          nested: {
            deep: {
              value: 'test',
            },
          },
        },
      };

      expect(() => consoleLogListener(event)).not.toThrow();
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle very old timestamps', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: 0,
        source: 'test',
        data: { locale: 'en' },
      };

      expect(() => consoleLogListener(event)).not.toThrow();
    });

    it('should handle future timestamps', () => {
      const event: StorageEvent = {
        type: 'preference_saved',
        timestamp: Date.now() + 86400000,
        source: 'test',
        data: { locale: 'en' },
      };

      expect(() => consoleLogListener(event)).not.toThrow();
    });
  });
});
