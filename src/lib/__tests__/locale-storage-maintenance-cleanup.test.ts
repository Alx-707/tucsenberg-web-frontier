import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieManager } from '@/lib/locale-storage-cookie';
import { LocalStorageManager } from '@/lib/locale-storage-local';
import { STORAGE_KEYS } from '@/lib/locale-storage-types';
import { logger } from '@/lib/logger';
import { MINUTE_MS } from '@/constants/time';
import { LocaleCleanupManager } from '../locale-storage-maintenance-cleanup';

// Mock dependencies
vi.mock('@/lib/locale-storage-local', () => ({
  LocalStorageManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/lib/locale-storage-cookie', () => ({
  CookieManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
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

function createValidPreference(
  overrides: Partial<{
    locale: string;
    source: string;
    timestamp: number;
    confidence: number;
  }> = {},
) {
  return {
    locale: 'en',
    source: 'user',
    timestamp: Date.now() - 1000,
    confidence: 0.9,
    ...overrides,
  };
}

function createDetection(
  overrides: Partial<{
    locale: string;
    source: string;
    timestamp: number;
  }> = {},
) {
  return {
    locale: 'en',
    source: 'browser',
    timestamp: Date.now(),
    ...overrides,
  };
}

function createHistoryData(
  detections: Array<{ locale: string; source: string; timestamp: number }>,
) {
  return {
    detections,
    history: detections,
    lastUpdated: Date.now(),
    totalDetections: detections.length,
  };
}

describe('locale-storage-maintenance-cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('LocaleCleanupManager', () => {
    describe('clearAll', () => {
      it('should remove all storage keys from both Cookie and LocalStorage', () => {
        const result = LocaleCleanupManager.clearAll();

        expect(result.success).toBe(true);
        expect(result.timestamp).toBeGreaterThan(0);

        // Verify CookieManager.remove called for all keys
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_PREFERENCE,
        );
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_DETECTION_HISTORY,
        );
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.USER_LOCALE_OVERRIDE,
        );
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_ANALYTICS,
        );
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_CACHE,
        );
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_SETTINGS,
        );

        // Verify LocalStorageManager.remove called for all keys
        expect(LocalStorageManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_PREFERENCE,
        );
        expect(LocalStorageManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_DETECTION_HISTORY,
        );
      });

      it('should return error result when exception occurs', () => {
        vi.mocked(CookieManager.remove).mockImplementation(() => {
          throw new Error('Cookie access denied');
        });

        const result = LocaleCleanupManager.clearAll();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Cookie access denied');
      });

      it('should return unknown error for non-Error exceptions', () => {
        vi.mocked(CookieManager.remove).mockImplementation(() => {
          throw 'string error';
        });

        const result = LocaleCleanupManager.clearAll();

        expect(result.success).toBe(false);
        expect(result.error).toBe('未知错误');
      });
    });

    describe('cleanupExpiredDetections', () => {
      it('should return success when no history data exists', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupExpiredDetections();

        expect(result.success).toBe(true);
        expect(LocalStorageManager.set).not.toHaveBeenCalled();
      });

      it('should return success when history has no detections array', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue({
          lastUpdated: Date.now(),
        });

        const result = LocaleCleanupManager.cleanupExpiredDetections();

        expect(result.success).toBe(true);
      });

      it('should remove expired detections based on maxAge', () => {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        const detections = [
          createDetection({ locale: 'en', timestamp: now - 2 * oneDay }), // expired
          createDetection({ locale: 'zh', timestamp: now - 100 }), // valid
        ];

        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createHistoryData(detections),
        );

        const result = LocaleCleanupManager.cleanupExpiredDetections(oneDay);

        expect(result.success).toBe(true);
        expect(result.data?.cleanedCount).toBe(1);
        expect(result.data?.remainingCount).toBe(1);
        expect(LocalStorageManager.set).toHaveBeenCalled();
      });

      it('should not update storage when no expired detections found', () => {
        const now = Date.now();
        const detections = [
          createDetection({ locale: 'en', timestamp: now - 1000 }),
          createDetection({ locale: 'zh', timestamp: now - 2000 }),
        ];

        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createHistoryData(detections),
        );

        const result = LocaleCleanupManager.cleanupExpiredDetections();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedCount).toBe(0);
        expect(result.data?.remainingCount).toBe(2);
        expect(LocalStorageManager.set).not.toHaveBeenCalled();
      });

      it('should use default maxAge when not specified', () => {
        const now = Date.now();
        const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;

        const detections = [
          createDetection({ locale: 'en', timestamp: now - thirtyOneDays }), // expired (>30 days)
          createDetection({ locale: 'zh', timestamp: now - 1000 }), // valid
        ];

        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createHistoryData(detections),
        );

        const result = LocaleCleanupManager.cleanupExpiredDetections();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedCount).toBe(1);
      });

      it('should return error result when exception occurs', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation(() => {
          throw new Error('Storage read error');
        });

        const result = LocaleCleanupManager.cleanupExpiredDetections();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Storage read error');
      });
    });

    describe('clearSpecificData', () => {
      it('should clear LOCALE_PREFERENCE from both storages', () => {
        const result =
          LocaleCleanupManager.clearSpecificData('LOCALE_PREFERENCE');

        expect(result.success).toBe(true);
        expect(result.data?.dataType).toBe('LOCALE_PREFERENCE');
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_PREFERENCE,
        );
        expect(LocalStorageManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_PREFERENCE,
        );
      });

      it('should clear LOCALE_DETECTION_HISTORY from both storages', () => {
        const result = LocaleCleanupManager.clearSpecificData(
          'LOCALE_DETECTION_HISTORY',
        );

        expect(result.success).toBe(true);
        expect(result.data?.dataType).toBe('LOCALE_DETECTION_HISTORY');
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_DETECTION_HISTORY,
        );
        expect(LocalStorageManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_DETECTION_HISTORY,
        );
      });

      it('should clear USER_LOCALE_OVERRIDE from both storages', () => {
        const result = LocaleCleanupManager.clearSpecificData(
          'USER_LOCALE_OVERRIDE',
        );

        expect(result.success).toBe(true);
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.USER_LOCALE_OVERRIDE,
        );
      });

      it('should clear LOCALE_ANALYTICS from both storages', () => {
        const result =
          LocaleCleanupManager.clearSpecificData('LOCALE_ANALYTICS');

        expect(result.success).toBe(true);
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_ANALYTICS,
        );
      });

      it('should clear LOCALE_CACHE from both storages', () => {
        const result = LocaleCleanupManager.clearSpecificData('LOCALE_CACHE');

        expect(result.success).toBe(true);
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_CACHE,
        );
      });

      it('should clear LOCALE_SETTINGS from both storages', () => {
        const result =
          LocaleCleanupManager.clearSpecificData('LOCALE_SETTINGS');

        expect(result.success).toBe(true);
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_SETTINGS,
        );
      });

      it('should return error result when exception occurs', () => {
        vi.mocked(CookieManager.remove).mockImplementation(() => {
          throw new Error('Remove failed');
        });

        const result =
          LocaleCleanupManager.clearSpecificData('LOCALE_PREFERENCE');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Remove failed');
      });
    });

    describe('cleanupInvalidPreferences', () => {
      it('should return success when no preference data exists', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(0);
      });

      it('should not clean valid localStorage preference', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createValidPreference(),
        );
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(0);
        expect(LocalStorageManager.remove).not.toHaveBeenCalled();
      });

      it('should clean invalid localStorage preference missing required fields', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue({
          locale: 'en',
          // missing source, timestamp, confidence
        });
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
        expect(LocalStorageManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_PREFERENCE,
        );
      });

      it('should clean localStorage preference with invalid locale type', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue({
          locale: 123, // should be string
          source: 'user',
          timestamp: Date.now() - 1000,
          confidence: 0.9,
        });
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
      });

      it('should clean localStorage preference with invalid confidence range', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createValidPreference({ confidence: 1.5 }), // > 1
        );
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
      });

      it('should clean localStorage preference with negative confidence', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createValidPreference({ confidence: -0.5 }),
        );
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
      });

      it('should clean localStorage preference with future timestamp', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createValidPreference({ timestamp: Date.now() + 10000 }),
        );
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
      });

      it('should clean localStorage preference with negative timestamp', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createValidPreference({ timestamp: -1000 }),
        );
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
      });

      it('should not clean valid Cookie preference', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);
        vi.mocked(CookieManager.get).mockReturnValue(
          JSON.stringify(createValidPreference()),
        );

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(0);
        expect(CookieManager.remove).not.toHaveBeenCalled();
      });

      it('should clean invalid Cookie preference', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);
        vi.mocked(CookieManager.get).mockReturnValue(
          JSON.stringify({ locale: 'en' }), // missing required fields
        );

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
        expect(result.data?.issues).toContain('已清理Cookie中的无效偏好数据');
        expect(CookieManager.remove).toHaveBeenCalledWith(
          STORAGE_KEYS.LOCALE_PREFERENCE,
        );
      });

      it('should clean Cookie preference with invalid JSON', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);
        vi.mocked(CookieManager.get).mockReturnValue('invalid-json{');

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(1);
        expect(result.data?.issues).toContain(
          '已清理Cookie中的格式错误偏好数据',
        );
      });

      it('should clean both invalid localStorage and Cookie preferences', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue({ locale: 'en' });
        vi.mocked(CookieManager.get).mockReturnValue('invalid');

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(true);
        expect(result.data?.cleanedItems).toBe(2);
        expect(LocalStorageManager.remove).toHaveBeenCalled();
        expect(CookieManager.remove).toHaveBeenCalled();
      });

      it('should return error result when exception occurs', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation(() => {
          throw new Error('Storage error');
        });

        const result = LocaleCleanupManager.cleanupInvalidPreferences();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Storage error');
      });
    });

    describe('cleanupDuplicateDetections', () => {
      it('should return success when no history data exists', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);

        const result = LocaleCleanupManager.cleanupDuplicateDetections();

        expect(result.success).toBe(true);
        expect(LocalStorageManager.set).not.toHaveBeenCalled();
      });

      it('should return success when history has no detections array', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue({
          lastUpdated: Date.now(),
        });

        const result = LocaleCleanupManager.cleanupDuplicateDetections();

        expect(result.success).toBe(true);
      });

      it('should remove duplicate detections within same minute', () => {
        const baseTime = Date.now();

        const detections = [
          createDetection({
            locale: 'en',
            source: 'browser',
            timestamp: baseTime,
          }),
          createDetection({
            locale: 'en',
            source: 'browser',
            timestamp: baseTime + 1000,
          }), // duplicate (same minute)
          createDetection({
            locale: 'zh',
            source: 'browser',
            timestamp: baseTime,
          }),
        ];

        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createHistoryData(detections),
        );

        const result = LocaleCleanupManager.cleanupDuplicateDetections();

        expect(result.success).toBe(true);
        expect(result.data?.duplicateCount).toBe(1);
        expect(result.data?.remainingCount).toBe(2);
        expect(LocalStorageManager.set).toHaveBeenCalled();
      });

      it('should not consider detections in different minutes as duplicates', () => {
        const baseTime = Date.now();

        const detections = [
          createDetection({
            locale: 'en',
            source: 'browser',
            timestamp: baseTime,
          }),
          createDetection({
            locale: 'en',
            source: 'browser',
            timestamp: baseTime + 2 * MINUTE_MS,
          }), // different minute
        ];

        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createHistoryData(detections),
        );

        const result = LocaleCleanupManager.cleanupDuplicateDetections();

        expect(result.success).toBe(true);
        expect(result.data?.duplicateCount).toBe(0);
        expect(result.data?.remainingCount).toBe(2);
        expect(LocalStorageManager.set).not.toHaveBeenCalled();
      });

      it('should not consider detections with different sources as duplicates', () => {
        const baseTime = Date.now();

        const detections = [
          createDetection({
            locale: 'en',
            source: 'browser',
            timestamp: baseTime,
          }),
          createDetection({
            locale: 'en',
            source: 'cookie',
            timestamp: baseTime,
          }),
        ];

        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createHistoryData(detections),
        );

        const result = LocaleCleanupManager.cleanupDuplicateDetections();

        expect(result.success).toBe(true);
        expect(result.data?.duplicateCount).toBe(0);
        expect(result.data?.remainingCount).toBe(2);
      });

      it('should not consider detections with different locales as duplicates', () => {
        const baseTime = Date.now();

        const detections = [
          createDetection({
            locale: 'en',
            source: 'browser',
            timestamp: baseTime,
          }),
          createDetection({
            locale: 'zh',
            source: 'browser',
            timestamp: baseTime,
          }),
        ];

        vi.mocked(LocalStorageManager.get).mockReturnValue(
          createHistoryData(detections),
        );

        const result = LocaleCleanupManager.cleanupDuplicateDetections();

        expect(result.success).toBe(true);
        expect(result.data?.duplicateCount).toBe(0);
      });

      it('should return error result when exception occurs', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation(() => {
          throw new Error('History read error');
        });

        const result = LocaleCleanupManager.cleanupDuplicateDetections();

        expect(result.success).toBe(false);
        expect(result.error).toBe('History read error');
      });
    });

    describe('getCleanupStats', () => {
      it('should return zero counts when no data exists', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.totalItems).toBe(0);
        expect(stats.expiredDetections).toBe(0);
        expect(stats.invalidPreferences).toBe(0);
        expect(stats.duplicateDetections).toBe(0);
      });

      it('should count total items from both storages', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return { locale: 'en' };
          if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY)
            return { detections: [] };
          return null;
        });
        vi.mocked(CookieManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return 'en';
          return null;
        });

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.totalItems).toBe(3); // 2 localStorage + 1 cookie
      });

      it('should count expired detections', () => {
        const now = Date.now();
        const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;

        vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) {
            return createHistoryData([
              createDetection({ timestamp: now - thirtyOneDays }), // expired
              createDetection({ timestamp: now - thirtyOneDays - 1000 }), // expired
              createDetection({ timestamp: now - 1000 }), // valid
            ]);
          }
          return null;
        });
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.expiredDetections).toBe(2);
      });

      it('should count duplicate detections', () => {
        const baseTime = Date.now();

        vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) {
            return createHistoryData([
              createDetection({
                locale: 'en',
                source: 'browser',
                timestamp: baseTime,
              }),
              createDetection({
                locale: 'en',
                source: 'browser',
                timestamp: baseTime + 1000,
              }), // duplicate
              createDetection({
                locale: 'en',
                source: 'browser',
                timestamp: baseTime + 2000,
              }), // duplicate
              createDetection({
                locale: 'zh',
                source: 'browser',
                timestamp: baseTime,
              }),
            ]);
          }
          return null;
        });
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.duplicateDetections).toBe(2);
      });

      it('should count invalid preferences from localStorage', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
            return { locale: 'en' }; // missing required fields
          }
          return null;
        });
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.invalidPreferences).toBe(1);
      });

      it('should count invalid preferences from Cookie', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);
        vi.mocked(CookieManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
            return JSON.stringify({ locale: 'en' }); // missing required fields
          }
          return null;
        });

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.invalidPreferences).toBe(1);
      });

      it('should count malformed JSON Cookie preference as invalid', () => {
        vi.mocked(LocalStorageManager.get).mockReturnValue(null);
        vi.mocked(CookieManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
            return 'not-valid-json';
          }
          return null;
        });

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.invalidPreferences).toBe(1);
      });

      it('should handle errors gracefully and log warning', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation(() => {
          throw new Error('Storage access error');
        });

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.totalItems).toBe(0);
        expect(logger.warn).toHaveBeenCalledWith(
          '获取清理统计信息时出错',
          expect.objectContaining({ error: expect.any(Error) }),
        );
      });

      it('should not count valid preferences as invalid', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
            return createValidPreference();
          }
          return null;
        });
        vi.mocked(CookieManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
            return JSON.stringify(createValidPreference());
          }
          return null;
        });

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.invalidPreferences).toBe(0);
      });

      it('should handle history without detections property', () => {
        vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
          if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) {
            return { lastUpdated: Date.now() }; // no detections
          }
          return null;
        });
        vi.mocked(CookieManager.get).mockReturnValue(null);

        const stats = LocaleCleanupManager.getCleanupStats();

        expect(stats.expiredDetections).toBe(0);
        expect(stats.duplicateDetections).toBe(0);
      });
    });
  });
});
