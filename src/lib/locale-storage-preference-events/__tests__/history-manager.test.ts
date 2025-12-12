/**
 * Unit tests for history-manager module
 * Tests preference history management functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserLocalePreference } from '@/lib/locale-storage-types';
import { logger } from '@/lib/logger';
import {
  clearPreferenceHistory,
  getPreferenceHistory,
  recordPreferenceHistory,
} from '../history-manager';

const mockLocalStorageManager = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@/lib/locale-storage-local', () => ({
  LocalStorageManager: {
    get: (...args: unknown[]) => mockLocalStorageManager.get(...args),
    set: (...args: unknown[]) => mockLocalStorageManager.set(...args),
    remove: (...args: unknown[]) => mockLocalStorageManager.remove(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('history-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getPreferenceHistory', () => {
    it('should return empty array when no history exists', () => {
      mockLocalStorageManager.get.mockReturnValue(null);

      const history = getPreferenceHistory();

      expect(history).toEqual([]);
    });

    it('should return current preference if exists', () => {
      const currentPreference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
      };

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'locale_preference') return currentPreference;
        return null;
      });

      const history = getPreferenceHistory();

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(currentPreference);
    });

    it('should combine current preference with stored history', () => {
      const currentPreference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
      };

      const storedHistory: UserLocalePreference[] = [
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: Date.now() - 10000,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 0.7,
          timestamp: Date.now() - 20000,
        },
      ];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'locale_preference') return currentPreference;
        if (key === 'preference_history') return storedHistory;
        return null;
      });

      const history = getPreferenceHistory();

      expect(history).toHaveLength(3);
    });

    it('should deduplicate entries by timestamp', () => {
      const timestamp = Date.now();
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp,
      };

      const storedHistory: UserLocalePreference[] = [
        { ...preference }, // Duplicate
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: timestamp - 10000,
        },
      ];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'locale_preference') return preference;
        if (key === 'preference_history') return storedHistory;
        return null;
      });

      const history = getPreferenceHistory();

      expect(history).toHaveLength(2);
    });

    it('should sort history by timestamp descending (most recent first)', () => {
      const now = Date.now();
      const storedHistory: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: now - 10000,
        },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: now - 30000,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 0.7,
          timestamp: now - 20000,
        },
      ];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return storedHistory;
        return null;
      });

      const history = getPreferenceHistory();

      expect(history[0]!.timestamp).toBe(now - 10000);
      expect(history[1]!.timestamp).toBe(now - 20000);
      expect(history[2]!.timestamp).toBe(now - 30000);
    });

    it('should handle non-array stored history gracefully', () => {
      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return { invalid: 'data' };
        return null;
      });

      const history = getPreferenceHistory();

      expect(history).toEqual([]);
    });

    it('should log error and return empty array on exception', () => {
      mockLocalStorageManager.get.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const history = getPreferenceHistory();

      expect(history).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting preference history',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  describe('recordPreferenceHistory', () => {
    it('should add new preference to history', () => {
      mockLocalStorageManager.get.mockReturnValue(null);

      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
      };

      recordPreferenceHistory(preference);

      expect(mockLocalStorageManager.set).toHaveBeenCalledWith(
        'preference_history',
        expect.arrayContaining([preference]),
      );
    });

    it('should prepend new preference to existing history', () => {
      const existingHistory: UserLocalePreference[] = [
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: Date.now() - 10000,
        },
      ];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return existingHistory;
        return null;
      });

      const newPreference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
      };

      recordPreferenceHistory(newPreference);

      expect(mockLocalStorageManager.set).toHaveBeenCalledWith(
        'preference_history',
        expect.any(Array),
      );

      const savedHistory = mockLocalStorageManager.set.mock
        .calls[0]![1] as UserLocalePreference[];
      expect(savedHistory[0]).toEqual(newPreference);
    });

    it('should not record duplicate preference within time threshold', () => {
      const timestamp = Date.now();
      const existingHistory: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.95,
          timestamp,
        },
      ];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return existingHistory;
        return null;
      });

      const duplicatePreference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: timestamp + 100, // Within threshold
      };

      recordPreferenceHistory(duplicatePreference);

      expect(mockLocalStorageManager.set).not.toHaveBeenCalled();
    });

    it('should record preference with different locale as non-duplicate', () => {
      const timestamp = Date.now();
      const existingHistory: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.95,
          timestamp,
        },
      ];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return existingHistory;
        return null;
      });

      const newPreference: UserLocalePreference = {
        locale: 'zh', // Different locale
        source: 'user',
        confidence: 0.95,
        timestamp: timestamp + 100,
      };

      recordPreferenceHistory(newPreference);

      expect(mockLocalStorageManager.set).toHaveBeenCalled();
    });

    it('should record preference with different source as non-duplicate', () => {
      const timestamp = Date.now();
      const existingHistory: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.95,
          timestamp,
        },
      ];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return existingHistory;
        return null;
      });

      const newPreference: UserLocalePreference = {
        locale: 'en',
        source: 'browser', // Different source
        confidence: 0.95,
        timestamp: timestamp + 100,
      };

      recordPreferenceHistory(newPreference);

      expect(mockLocalStorageManager.set).toHaveBeenCalled();
    });

    it('should limit history to 20 entries', () => {
      const existingHistory: UserLocalePreference[] = Array.from(
        { length: 25 },
        (_, i) => ({
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now() - (i + 1) * 10000,
        }),
      );

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return existingHistory;
        return null;
      });

      const newPreference: UserLocalePreference = {
        locale: 'zh',
        source: 'browser',
        confidence: 0.8,
        timestamp: Date.now(),
      };

      recordPreferenceHistory(newPreference);

      const savedHistory = mockLocalStorageManager.set.mock
        .calls[0]![1] as UserLocalePreference[];
      expect(savedHistory.length).toBeLessThanOrEqual(20);
    });

    it('should log error on exception', () => {
      // First call to get returns empty to pass getPreferenceHistory
      // Then set throws to trigger error in recordPreferenceHistory
      mockLocalStorageManager.get.mockReturnValue(null);
      mockLocalStorageManager.set.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
      };

      recordPreferenceHistory(preference);

      expect(logger.error).toHaveBeenCalledWith(
        'Error recording preference history',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('should handle preference with metadata', () => {
      mockLocalStorageManager.get.mockReturnValue(null);

      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
        metadata: {
          userAgent: 'Mozilla/5.0',
          ipCountry: 'US',
        },
      };

      recordPreferenceHistory(preference);

      expect(mockLocalStorageManager.set).toHaveBeenCalledWith(
        'preference_history',
        expect.arrayContaining([
          expect.objectContaining({
            metadata: { userAgent: 'Mozilla/5.0', ipCountry: 'US' },
          }),
        ]),
      );
    });
  });

  describe('clearPreferenceHistory', () => {
    it('should remove preference_history from storage', () => {
      clearPreferenceHistory();

      expect(mockLocalStorageManager.remove).toHaveBeenCalledWith(
        'preference_history',
      );
    });

    it('should log error on exception', () => {
      mockLocalStorageManager.remove.mockImplementation(() => {
        throw new Error('Storage error');
      });

      clearPreferenceHistory();

      expect(logger.error).toHaveBeenCalledWith(
        'Error clearing preference history',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('should not throw even if storage is unavailable', () => {
      mockLocalStorageManager.remove.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => clearPreferenceHistory()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty history array from storage', () => {
      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return [];
        return null;
      });

      const history = getPreferenceHistory();

      expect(history).toEqual([]);
    });

    it('should handle preference with zero confidence', () => {
      mockLocalStorageManager.get.mockReturnValue(null);

      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'default',
        confidence: 0,
        timestamp: Date.now(),
      };

      recordPreferenceHistory(preference);

      expect(mockLocalStorageManager.set).toHaveBeenCalledWith(
        'preference_history',
        expect.arrayContaining([preference]),
      );
    });

    it('should handle preference with max confidence', () => {
      mockLocalStorageManager.get.mockReturnValue(null);

      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 1.0,
        timestamp: Date.now(),
      };

      recordPreferenceHistory(preference);

      expect(mockLocalStorageManager.set).toHaveBeenCalledWith(
        'preference_history',
        expect.arrayContaining([preference]),
      );
    });

    it('should handle very old timestamps', () => {
      const oldPreference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.9,
        timestamp: 0,
      };

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return [oldPreference];
        return null;
      });

      const history = getPreferenceHistory();

      expect(history).toHaveLength(1);
      expect(history[0]!.timestamp).toBe(0);
    });

    it('should handle concurrent read and write operations', () => {
      const preference1: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.9,
        timestamp: Date.now(),
      };

      const preference2: UserLocalePreference = {
        locale: 'zh',
        source: 'browser',
        confidence: 0.8,
        timestamp: Date.now() + 1000,
      };

      mockLocalStorageManager.get.mockReturnValue(null);

      recordPreferenceHistory(preference1);
      recordPreferenceHistory(preference2);

      expect(mockLocalStorageManager.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full lifecycle: record, get, clear', () => {
      let storedHistory: UserLocalePreference[] = [];

      mockLocalStorageManager.get.mockImplementation((key: string) => {
        if (key === 'preference_history') return storedHistory;
        return null;
      });

      mockLocalStorageManager.set.mockImplementation(
        (_key: string, value: UserLocalePreference[]) => {
          storedHistory = value;
        },
      );

      mockLocalStorageManager.remove.mockImplementation(() => {
        storedHistory = [];
      });

      // Record
      const preference: UserLocalePreference = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
        timestamp: Date.now(),
      };
      recordPreferenceHistory(preference);

      // Get
      const history = getPreferenceHistory();
      expect(history).toHaveLength(1);

      // Clear
      clearPreferenceHistory();
      const emptyHistory = getPreferenceHistory();
      expect(emptyHistory).toHaveLength(0);
    });
  });
});
