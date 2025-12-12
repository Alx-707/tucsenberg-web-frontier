/**
 * Unit tests for event-creators module
 * Tests event creation functions for preference storage events
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/types/i18n';
import type { UserLocalePreference } from '@/lib/locale-storage-types';
import {
  createOverrideClearedEvent,
  createOverrideSetEvent,
  createPreferenceErrorEvent,
  createPreferenceLoadedEvent,
  createPreferenceSavedEvent,
  createSyncEvent,
} from '../event-creators';

describe('event-creators', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createPreferenceSavedEvent', () => {
    it('should create preference saved event with correct structure', () => {
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
      };

      const event = createPreferenceSavedEvent(preference, 'localStorage');

      expect(event.type).toBe('preference_saved');
      expect(event.source).toBe('preference_manager');
      expect(event.timestamp).toBe(Date.now());
      expect(event.data).toEqual({
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        storageSource: 'localStorage',
        action: 'save',
      });
    });

    it('should handle different locale values', () => {
      const preference: UserLocalePreference = {
        locale: 'zh',
        source: 'browser',
        confidence: 0.8,
        timestamp: Date.now(),
      };

      const event = createPreferenceSavedEvent(preference, 'sessionStorage');

      expect(event.data).toEqual({
        locale: 'zh',
        source: 'browser',
        confidence: 0.8,
        storageSource: 'sessionStorage',
        action: 'save',
      });
    });

    it('should handle low confidence values', () => {
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'geo',
        confidence: 0.1,
        timestamp: Date.now(),
      };

      const event = createPreferenceSavedEvent(preference, 'cookie');

      expect(event.data).toBeDefined();
      const data = event.data as {
        confidence: number;
        storageSource: string;
      };
      expect(data.confidence).toBe(0.1);
      expect(data.storageSource).toBe('cookie');
    });
  });

  describe('createPreferenceLoadedEvent', () => {
    it('should create preference loaded event with correct structure', () => {
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 1.0,
        timestamp: Date.now(),
      };

      const event = createPreferenceLoadedEvent(preference, 'localStorage');

      expect(event.type).toBe('preference_loaded');
      expect(event.source).toBe('preference_manager');
      expect(event.timestamp).toBe(Date.now());
      expect(event.data).toEqual({
        locale: 'en',
        source: 'user',
        confidence: 1.0,
        storageSource: 'localStorage',
        action: 'load',
      });
    });

    it('should handle preference with metadata', () => {
      const preference: UserLocalePreference = {
        locale: 'zh',
        source: 'browser',
        confidence: 0.9,
        timestamp: Date.now(),
        metadata: {
          userAgent: 'Mozilla/5.0',
          browserLanguages: ['zh-CN', 'en'],
        },
      };

      const event = createPreferenceLoadedEvent(preference, 'indexedDB');

      expect(event.data).toEqual({
        locale: 'zh',
        source: 'browser',
        confidence: 0.9,
        storageSource: 'indexedDB',
        action: 'load',
      });
    });

    it('should correctly use different storage sources', () => {
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'auto',
        confidence: 0.85,
        timestamp: Date.now(),
      };

      const sources = ['localStorage', 'sessionStorage', 'cookie', 'memory'];

      sources.forEach((storageSource) => {
        const event = createPreferenceLoadedEvent(preference, storageSource);
        expect(event.data).toBeDefined();
        const data = event.data as { storageSource: string };
        expect(data.storageSource).toBe(storageSource);
      });
    });
  });

  describe('createOverrideSetEvent', () => {
    it('should create override set event with correct structure', () => {
      const locale: Locale = 'zh';

      const event = createOverrideSetEvent(locale);

      expect(event.type).toBe('override_set');
      expect(event.source).toBe('preference_manager');
      expect(event.timestamp).toBe(Date.now());
      expect(event.data).toEqual({
        locale: 'zh',
        metadata: undefined,
        action: 'set_override',
      });
    });

    it('should include metadata when provided', () => {
      const locale: Locale = 'en';
      const metadata = {
        reason: 'user_selection',
        previousLocale: 'zh',
      };

      const event = createOverrideSetEvent(locale, metadata);

      expect(event.data).toEqual({
        locale: 'en',
        metadata: {
          reason: 'user_selection',
          previousLocale: 'zh',
        },
        action: 'set_override',
      });
    });

    it('should handle empty metadata object', () => {
      const locale: Locale = 'zh';
      const metadata = {};

      const event = createOverrideSetEvent(locale, metadata);

      expect(event.data).toEqual({
        locale: 'zh',
        metadata: {},
        action: 'set_override',
      });
    });

    it('should handle complex metadata', () => {
      const locale: Locale = 'en';
      const metadata = {
        triggeredBy: 'language_selector',
        timestamp: Date.now(),
        sessionId: 'abc123',
        isFirstOverride: true,
      };

      const event = createOverrideSetEvent(locale, metadata);

      expect(event.data).toBeDefined();
      const data = event.data as { metadata: Record<string, unknown> };
      expect(data.metadata).toEqual(metadata);
    });
  });

  describe('createOverrideClearedEvent', () => {
    it('should create override cleared event with correct structure', () => {
      const event = createOverrideClearedEvent();

      expect(event.type).toBe('override_cleared');
      expect(event.source).toBe('preference_manager');
      expect(event.timestamp).toBe(Date.now());
      expect(event.data).toEqual({
        action: 'clear_override',
      });
    });

    it('should always return consistent structure', () => {
      const event1 = createOverrideClearedEvent();
      const event2 = createOverrideClearedEvent();

      expect(event1.type).toBe(event2.type);
      expect(event1.source).toBe(event2.source);
      expect(event1.data).toEqual(event2.data);
    });
  });

  describe('createSyncEvent', () => {
    it('should create sync event for successful sync', () => {
      const details = {
        syncedItems: 5,
        duration: 150,
      };

      const event = createSyncEvent(true, details);

      expect(event.type).toBe('preference_sync');
      expect(event.source).toBe('preference_manager');
      expect(event.timestamp).toBe(Date.now());
      expect(event.data).toEqual({
        synced: true,
        details: {
          syncedItems: 5,
          duration: 150,
        },
        action: 'sync',
      });
    });

    it('should create sync event for failed sync', () => {
      const details = {
        error: 'Network timeout',
        attemptNumber: 3,
      };

      const event = createSyncEvent(false, details);

      expect(event.data).toEqual({
        synced: false,
        details: {
          error: 'Network timeout',
          attemptNumber: 3,
        },
        action: 'sync',
      });
    });

    it('should handle empty details object', () => {
      const event = createSyncEvent(true, {});

      expect(event.data).toEqual({
        synced: true,
        details: {},
        action: 'sync',
      });
    });

    it('should handle complex sync details', () => {
      const details = {
        source: 'cloud',
        target: 'local',
        itemsSynced: 10,
        conflicts: ['item1', 'item2'],
        resolution: 'server_wins',
        timestamp: Date.now(),
      };

      const event = createSyncEvent(true, details);

      expect(event.data).toBeDefined();
      const data = event.data as { details: Record<string, unknown> };
      expect(data.details).toEqual(details);
    });
  });

  describe('createPreferenceErrorEvent', () => {
    it('should create error event with correct structure', () => {
      const event = createPreferenceErrorEvent(
        'save',
        'Storage quota exceeded',
      );

      expect(event.type).toBe('preference_error');
      expect(event.source).toBe('preference_manager');
      expect(event.timestamp).toBe(Date.now());
      expect(event.data).toEqual({
        operation: 'save',
        error: 'Storage quota exceeded',
        action: 'error',
      });
    });

    it('should handle different operations', () => {
      const operations = ['save', 'load', 'sync', 'clear', 'migrate'];

      operations.forEach((operation) => {
        const event = createPreferenceErrorEvent(operation, 'Test error');
        expect(event.data).toBeDefined();
        const data = event.data as { operation: string };
        expect(data.operation).toBe(operation);
      });
    });

    it('should handle various error messages', () => {
      const errors = [
        'Network error',
        'Invalid JSON',
        'Permission denied',
        '',
        'Error with special chars: <>&"\'',
      ];

      errors.forEach((error) => {
        const event = createPreferenceErrorEvent('test', error);
        expect(event.data).toBeDefined();
        const data = event.data as { error: string };
        expect(data.error).toBe(error);
      });
    });

    it('should create event with long error message', () => {
      const longError = 'A'.repeat(1000);
      const event = createPreferenceErrorEvent('save', longError);

      expect(event.data).toBeDefined();
      const data = event.data as { error: string };
      expect(data.error).toBe(longError);
      expect(data.error.length).toBe(1000);
    });
  });

  describe('timestamp consistency', () => {
    it('should use Date.now() for all event timestamps', () => {
      const now = Date.now();
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 1,
        timestamp: now,
      };

      const savedEvent = createPreferenceSavedEvent(preference, 'localStorage');
      const loadedEvent = createPreferenceLoadedEvent(
        preference,
        'localStorage',
      );
      const overrideEvent = createOverrideSetEvent('en');
      const clearedEvent = createOverrideClearedEvent();
      const syncEvent = createSyncEvent(true, {});
      const errorEvent = createPreferenceErrorEvent('test', 'error');

      expect(savedEvent.timestamp).toBe(now);
      expect(loadedEvent.timestamp).toBe(now);
      expect(overrideEvent.timestamp).toBe(now);
      expect(clearedEvent.timestamp).toBe(now);
      expect(syncEvent.timestamp).toBe(now);
      expect(errorEvent.timestamp).toBe(now);
    });

    it('should update timestamp when time advances', () => {
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 1,
        timestamp: Date.now(),
      };

      const event1 = createPreferenceSavedEvent(preference, 'localStorage');

      vi.advanceTimersByTime(1000);

      const event2 = createPreferenceSavedEvent(preference, 'localStorage');

      expect(event2.timestamp - event1.timestamp).toBe(1000);
    });
  });

  describe('source consistency', () => {
    it('should always use preference_manager as source', () => {
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 1,
        timestamp: Date.now(),
      };

      expect(createPreferenceSavedEvent(preference, 'test').source).toBe(
        'preference_manager',
      );
      expect(createPreferenceLoadedEvent(preference, 'test').source).toBe(
        'preference_manager',
      );
      expect(createOverrideSetEvent('en').source).toBe('preference_manager');
      expect(createOverrideClearedEvent().source).toBe('preference_manager');
      expect(createSyncEvent(true, {}).source).toBe('preference_manager');
      expect(createPreferenceErrorEvent('test', 'error').source).toBe(
        'preference_manager',
      );
    });
  });
});
