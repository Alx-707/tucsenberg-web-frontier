import { describe, expect, it, vi } from 'vitest';
import {
  BaseValidators,
  BROWSER_TYPES,
  COMPRESSION_ALGORITHMS,
  DEVICE_TYPES,
  ENCRYPTION_ALGORITHMS,
  ENVIRONMENT_TYPES,
  ERROR_TYPES,
  HEALTH_STATUS,
  MIGRATION_STATUS,
  OS_TYPES,
  PRIORITY_LEVELS,
  STORAGE_CONSTANTS,
  STORAGE_KEYS,
  STORAGE_TYPES,
  SYNC_STATUS,
  TimestampUtils,
} from '../locale-storage-types-base';

describe('STORAGE_KEYS', () => {
  it('should have expected storage keys', () => {
    expect(STORAGE_KEYS.LOCALE_PREFERENCE).toBe('locale_preference');
    expect(STORAGE_KEYS.LOCALE_DETECTION_HISTORY).toBe(
      'locale_detection_history',
    );
    expect(STORAGE_KEYS.USER_LOCALE_OVERRIDE).toBe('user_locale_override');
    expect(STORAGE_KEYS.LOCALE_ANALYTICS).toBe('locale_analytics');
    expect(STORAGE_KEYS.LOCALE_CACHE).toBe('locale_cache');
    expect(STORAGE_KEYS.LOCALE_SETTINGS).toBe('locale_settings');
  });
});

describe('STORAGE_CONSTANTS', () => {
  it('should have expected size limits', () => {
    expect(STORAGE_CONSTANTS.MAX_COOKIE_SIZE).toBe(4096);
    expect(STORAGE_CONSTANTS.MAX_LOCALSTORAGE_SIZE).toBe(5 * 1024 * 1024);
    expect(STORAGE_CONSTANTS.MAX_SESSIONSTORAGE_SIZE).toBe(5 * 1024 * 1024);
    expect(STORAGE_CONSTANTS.MAX_INDEXEDDB_SIZE).toBe(50 * 1024 * 1024);
  });

  it('should have expected retention times', () => {
    expect(STORAGE_CONSTANTS.DEFAULT_RETENTION_TIME).toBeGreaterThan(0);
    expect(STORAGE_CONSTANTS.CACHE_RETENTION_TIME).toBeGreaterThan(0);
    expect(STORAGE_CONSTANTS.ANALYTICS_RETENTION_TIME).toBeGreaterThan(0);
  });

  it('should have expected performance limits', () => {
    expect(STORAGE_CONSTANTS.MAX_HISTORY_ENTRIES).toBe(100);
    expect(STORAGE_CONSTANTS.MAX_ANALYTICS_ENTRIES).toBe(1000);
    expect(STORAGE_CONSTANTS.MAX_CACHE_ENTRIES).toBe(50);
  });

  it('should have expected compression and encryption config', () => {
    expect(STORAGE_CONSTANTS.COMPRESSION_THRESHOLD).toBe(1024);
    expect(STORAGE_CONSTANTS.ENCRYPTION_KEY_LENGTH).toBe(32);
  });

  it('should have expected sync config', () => {
    expect(STORAGE_CONSTANTS.SYNC_RETRY_ATTEMPTS).toBe(3);
    expect(STORAGE_CONSTANTS.SYNC_INTERVAL).toBeGreaterThan(0);
    expect(STORAGE_CONSTANTS.SYNC_TIMEOUT).toBeGreaterThan(0);
  });

  it('should have expected validation config', () => {
    expect(STORAGE_CONSTANTS.MIN_CONFIDENCE).toBe(0);
    expect(STORAGE_CONSTANTS.MAX_CONFIDENCE).toBe(1);
    expect(STORAGE_CONSTANTS.DEFAULT_CONFIDENCE).toBe(0.5);
  });

  it('should have expected backup config', () => {
    expect(STORAGE_CONSTANTS.MAX_BACKUP_FILES).toBe(5);
    expect(STORAGE_CONSTANTS.BACKUP_INTERVAL).toBeGreaterThan(0);
  });

  it('should have expected retry config', () => {
    expect(STORAGE_CONSTANTS.MAX_RETRY_ATTEMPTS).toBe(3);
    expect(STORAGE_CONSTANTS.RETRY_DELAY).toBe(1000);
  });

  it('should have expected health check config', () => {
    expect(STORAGE_CONSTANTS.HEALTH_CHECK_INTERVAL).toBeGreaterThan(0);
    expect(STORAGE_CONSTANTS.HEALTH_CHECK_TIMEOUT).toBeGreaterThan(0);
  });
});

describe('STORAGE_TYPES', () => {
  it('should have all storage types', () => {
    expect(STORAGE_TYPES.COOKIE).toBe('cookie');
    expect(STORAGE_TYPES.LOCAL_STORAGE).toBe('localStorage');
    expect(STORAGE_TYPES.SESSION_STORAGE).toBe('sessionStorage');
    expect(STORAGE_TYPES.INDEXED_DB).toBe('indexedDB');
    expect(STORAGE_TYPES.MEMORY).toBe('memory');
  });
});

describe('COMPRESSION_ALGORITHMS', () => {
  it('should have all compression algorithms', () => {
    expect(COMPRESSION_ALGORITHMS.NONE).toBe('none');
    expect(COMPRESSION_ALGORITHMS.GZIP).toBe('gzip');
    expect(COMPRESSION_ALGORITHMS.LZ4).toBe('lz4');
    expect(COMPRESSION_ALGORITHMS.BROTLI).toBe('brotli');
  });
});

describe('ENCRYPTION_ALGORITHMS', () => {
  it('should have all encryption algorithms', () => {
    expect(ENCRYPTION_ALGORITHMS.NONE).toBe('none');
    expect(ENCRYPTION_ALGORITHMS.AES_256_GCM).toBe('aes-256-gcm');
    expect(ENCRYPTION_ALGORITHMS.CHACHA20_POLY1305).toBe('chacha20-poly1305');
  });
});

describe('SYNC_STATUS', () => {
  it('should have all sync statuses', () => {
    expect(SYNC_STATUS.IDLE).toBe('idle');
    expect(SYNC_STATUS.SYNCING).toBe('syncing');
    expect(SYNC_STATUS.SUCCESS).toBe('success');
    expect(SYNC_STATUS.ERROR).toBe('error');
    expect(SYNC_STATUS.CONFLICT).toBe('conflict');
  });
});

describe('MIGRATION_STATUS', () => {
  it('should have all migration statuses', () => {
    expect(MIGRATION_STATUS.NOT_STARTED).toBe('not_started');
    expect(MIGRATION_STATUS.IN_PROGRESS).toBe('in_progress');
    expect(MIGRATION_STATUS.COMPLETED).toBe('completed');
    expect(MIGRATION_STATUS.FAILED).toBe('failed');
    expect(MIGRATION_STATUS.ROLLED_BACK).toBe('rolled_back');
  });
});

describe('HEALTH_STATUS', () => {
  it('should have all health statuses', () => {
    expect(HEALTH_STATUS.HEALTHY).toBe('healthy');
    expect(HEALTH_STATUS.WARNING).toBe('warning');
    expect(HEALTH_STATUS.ERROR).toBe('error');
    expect(HEALTH_STATUS.CRITICAL).toBe('critical');
  });
});

describe('ERROR_TYPES', () => {
  it('should have all error types', () => {
    expect(ERROR_TYPES.STORAGE_FULL).toBe('storage_full');
    expect(ERROR_TYPES.QUOTA_EXCEEDED).toBe('quota_exceeded');
    expect(ERROR_TYPES.ACCESS_DENIED).toBe('access_denied');
    expect(ERROR_TYPES.NETWORK_ERROR).toBe('network_error');
    expect(ERROR_TYPES.PARSE_ERROR).toBe('parse_error');
    expect(ERROR_TYPES.VALIDATION_ERROR).toBe('validation_error');
    expect(ERROR_TYPES.ENCRYPTION_ERROR).toBe('encryption_error');
    expect(ERROR_TYPES.COMPRESSION_ERROR).toBe('compression_error');
    expect(ERROR_TYPES.SYNC_ERROR).toBe('sync_error');
    expect(ERROR_TYPES.MIGRATION_ERROR).toBe('migration_error');
    expect(ERROR_TYPES.UNKNOWN_ERROR).toBe('unknown_error');
  });
});

describe('PRIORITY_LEVELS', () => {
  it('should have all priority levels', () => {
    expect(PRIORITY_LEVELS.LOW).toBe('low');
    expect(PRIORITY_LEVELS.MEDIUM).toBe('medium');
    expect(PRIORITY_LEVELS.HIGH).toBe('high');
    expect(PRIORITY_LEVELS.CRITICAL).toBe('critical');
  });
});

describe('ENVIRONMENT_TYPES', () => {
  it('should have all environment types', () => {
    expect(ENVIRONMENT_TYPES.DEVELOPMENT).toBe('development');
    expect(ENVIRONMENT_TYPES.STAGING).toBe('staging');
    expect(ENVIRONMENT_TYPES.PRODUCTION).toBe('production');
    expect(ENVIRONMENT_TYPES.TEST).toBe('test');
  });
});

describe('BROWSER_TYPES', () => {
  it('should have all browser types', () => {
    expect(BROWSER_TYPES.CHROME).toBe('chrome');
    expect(BROWSER_TYPES.FIREFOX).toBe('firefox');
    expect(BROWSER_TYPES.SAFARI).toBe('safari');
    expect(BROWSER_TYPES.EDGE).toBe('edge');
    expect(BROWSER_TYPES.OPERA).toBe('opera');
    expect(BROWSER_TYPES.IE).toBe('ie');
    expect(BROWSER_TYPES.UNKNOWN).toBe('unknown');
  });
});

describe('DEVICE_TYPES', () => {
  it('should have all device types', () => {
    expect(DEVICE_TYPES.DESKTOP).toBe('desktop');
    expect(DEVICE_TYPES.MOBILE).toBe('mobile');
    expect(DEVICE_TYPES.TABLET).toBe('tablet');
    expect(DEVICE_TYPES.UNKNOWN).toBe('unknown');
  });
});

describe('OS_TYPES', () => {
  it('should have all OS types', () => {
    expect(OS_TYPES.WINDOWS).toBe('windows');
    expect(OS_TYPES.MACOS).toBe('macos');
    expect(OS_TYPES.LINUX).toBe('linux');
    expect(OS_TYPES.IOS).toBe('ios');
    expect(OS_TYPES.ANDROID).toBe('android');
    expect(OS_TYPES.UNKNOWN).toBe('unknown');
  });
});

describe('TimestampUtils', () => {
  describe('now', () => {
    it('should return current timestamp', () => {
      const before = Date.now();
      const result = TimestampUtils.now();
      const after = Date.now();

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('isExpired', () => {
    it('should return true for expired timestamp', () => {
      const oldTimestamp = Date.now() - 10000;
      const maxAge = 5000;

      expect(TimestampUtils.isExpired(oldTimestamp, maxAge)).toBe(true);
    });

    it('should return false for non-expired timestamp', () => {
      const recentTimestamp = Date.now() - 1000;
      const maxAge = 5000;

      expect(TimestampUtils.isExpired(recentTimestamp, maxAge)).toBe(false);
    });

    it('should handle exact boundary', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const timestamp = now - 5000;
      const maxAge = 5000;

      // At exact boundary, diff equals maxAge, so NOT expired
      expect(TimestampUtils.isExpired(timestamp, maxAge)).toBe(false);

      // One ms past, should be expired
      expect(TimestampUtils.isExpired(timestamp - 1, maxAge)).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('format', () => {
    it('should format timestamp with default locale', () => {
      const timestamp = new Date('2024-01-15T12:30:00Z').getTime();
      const result = TimestampUtils.format(timestamp);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format timestamp with custom locale', () => {
      const timestamp = new Date('2024-01-15T12:30:00Z').getTime();
      const resultEN = TimestampUtils.format(timestamp, 'en-US');
      const resultZH = TimestampUtils.format(timestamp, 'zh-CN');

      expect(typeof resultEN).toBe('string');
      expect(typeof resultZH).toBe('string');
    });
  });

  describe('diff', () => {
    it('should calculate positive difference', () => {
      const start = 1000;
      const end = 5000;

      expect(TimestampUtils.diff(start, end)).toBe(4000);
    });

    it('should return absolute value for reversed order', () => {
      const start = 5000;
      const end = 1000;

      expect(TimestampUtils.diff(start, end)).toBe(4000);
    });

    it('should return 0 for same timestamps', () => {
      expect(TimestampUtils.diff(1000, 1000)).toBe(0);
    });
  });

  describe('add', () => {
    it('should add milliseconds to timestamp', () => {
      expect(TimestampUtils.add(1000, 500)).toBe(1500);
    });

    it('should handle negative milliseconds', () => {
      expect(TimestampUtils.add(1000, -500)).toBe(500);
    });

    it('should handle zero', () => {
      expect(TimestampUtils.add(1000, 0)).toBe(1000);
    });
  });

  describe('subtract', () => {
    it('should subtract milliseconds from timestamp', () => {
      expect(TimestampUtils.subtract(1000, 500)).toBe(500);
    });

    it('should handle negative result', () => {
      expect(TimestampUtils.subtract(500, 1000)).toBe(-500);
    });

    it('should handle zero', () => {
      expect(TimestampUtils.subtract(1000, 0)).toBe(1000);
    });
  });
});

describe('BaseValidators', () => {
  describe('isValidLocale', () => {
    it('should return true for valid locales', () => {
      expect(BaseValidators.isValidLocale('en')).toBe(true);
      expect(BaseValidators.isValidLocale('zh')).toBe(true);
    });

    it('should return false for invalid locales', () => {
      expect(BaseValidators.isValidLocale('fr')).toBe(false);
      expect(BaseValidators.isValidLocale('de')).toBe(false);
      expect(BaseValidators.isValidLocale('')).toBe(false);
      expect(BaseValidators.isValidLocale('EN')).toBe(false);
    });
  });

  describe('isValidSource', () => {
    it('should return true for valid sources', () => {
      expect(BaseValidators.isValidSource('user')).toBe(true);
      expect(BaseValidators.isValidSource('geo')).toBe(true);
      expect(BaseValidators.isValidSource('browser')).toBe(true);
      expect(BaseValidators.isValidSource('default')).toBe(true);
      expect(BaseValidators.isValidSource('auto')).toBe(true);
      expect(BaseValidators.isValidSource('fallback')).toBe(true);
    });

    it('should return false for invalid sources', () => {
      expect(BaseValidators.isValidSource('invalid')).toBe(false);
      expect(BaseValidators.isValidSource('')).toBe(false);
      expect(BaseValidators.isValidSource('USER')).toBe(false);
    });
  });

  describe('isValidConfidence', () => {
    it('should return true for valid confidence values', () => {
      expect(BaseValidators.isValidConfidence(0)).toBe(true);
      expect(BaseValidators.isValidConfidence(0.5)).toBe(true);
      expect(BaseValidators.isValidConfidence(1)).toBe(true);
    });

    it('should return false for out of range values', () => {
      expect(BaseValidators.isValidConfidence(-0.1)).toBe(false);
      expect(BaseValidators.isValidConfidence(1.1)).toBe(false);
    });

    it('should return false for non-number values', () => {
      // @ts-expect-error - testing invalid input
      expect(BaseValidators.isValidConfidence('0.5')).toBe(false);
      // @ts-expect-error - testing invalid input
      expect(BaseValidators.isValidConfidence(null)).toBe(false);
    });
  });

  describe('isValidTimestamp', () => {
    it('should return true for valid timestamps', () => {
      expect(BaseValidators.isValidTimestamp(Date.now())).toBe(true);
      expect(BaseValidators.isValidTimestamp(Date.now() - 1000)).toBe(true);
      expect(BaseValidators.isValidTimestamp(1)).toBe(true);
    });

    it('should return false for zero or negative timestamps', () => {
      expect(BaseValidators.isValidTimestamp(0)).toBe(false);
      expect(BaseValidators.isValidTimestamp(-1)).toBe(false);
    });

    it('should return false for future timestamps', () => {
      expect(BaseValidators.isValidTimestamp(Date.now() + 100000)).toBe(false);
    });

    it('should return false for non-number values', () => {
      // @ts-expect-error - testing invalid input
      expect(BaseValidators.isValidTimestamp('1234567890')).toBe(false);
      // @ts-expect-error - testing invalid input
      expect(BaseValidators.isValidTimestamp(null)).toBe(false);
    });
  });

  describe('isValidStorageKey', () => {
    it('should return true for valid storage keys', () => {
      expect(BaseValidators.isValidStorageKey('locale_preference')).toBe(true);
      expect(BaseValidators.isValidStorageKey('a')).toBe(true);
      expect(BaseValidators.isValidStorageKey('some_key_123')).toBe(true);
    });

    it('should return false for empty key', () => {
      expect(BaseValidators.isValidStorageKey('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      // @ts-expect-error - testing invalid input
      expect(BaseValidators.isValidStorageKey(123)).toBe(false);
      // @ts-expect-error - testing invalid input
      expect(BaseValidators.isValidStorageKey(null)).toBe(false);
    });

    it('should return false for very long keys', () => {
      // Create a key that exceeds the max filename length (255)
      const longKey = 'a'.repeat(300);
      expect(BaseValidators.isValidStorageKey(longKey)).toBe(false);
    });

    it('should accept keys at max length boundary', () => {
      // Max length is 255 (FILENAME_MAX_LENGTH)
      const maxKey = 'a'.repeat(255);
      expect(BaseValidators.isValidStorageKey(maxKey)).toBe(true);
    });
  });
});
