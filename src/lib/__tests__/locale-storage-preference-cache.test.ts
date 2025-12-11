import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieManager } from '@/lib/locale-storage-cookie';
import { LocalStorageManager } from '@/lib/locale-storage-local';
import {
  getUserPreference,
  saveUserPreference,
  validatePreferenceData,
} from '@/lib/locale-storage-preference-core';
import {
  checkDataConsistency,
  fixDataInconsistency,
  getStorageUsage,
  optimizeStoragePerformance,
  PreferenceCacheManager,
  syncPreferenceData,
} from '../locale-storage-preference-cache';

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

vi.mock('@/lib/locale-storage-preference-core', () => ({
  getUserPreference: vi.fn(() => ({
    success: true,
    data: {
      locale: 'en',
      source: 'auto',
      confidence: 0.8,
      timestamp: Date.now(),
    },
  })),
  saveUserPreference: vi.fn(() => ({
    success: true,
    data: {
      locale: 'en',
      source: 'user',
      confidence: 1,
      timestamp: Date.now(),
    },
  })),
  validatePreferenceData: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
}));

function createValidPreference(overrides = {}) {
  return {
    locale: 'en' as const,
    source: 'user' as const,
    confidence: 0.9,
    timestamp: Date.now(),
    metadata: {},
    ...overrides,
  };
}

describe('locale-storage-preference-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PreferenceCacheManager.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('PreferenceCacheManager', () => {
    describe('getCachedPreference', () => {
      it('should return null when cache is empty', () => {
        const result = PreferenceCacheManager.getCachedPreference('test');
        expect(result).toBeNull();
      });

      it('should return cached preference', () => {
        const preference = createValidPreference();
        PreferenceCacheManager.updateCache('test', preference);

        const result = PreferenceCacheManager.getCachedPreference('test');
        expect(result).toEqual(preference);
      });

      it('should return null when cache is expired', () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        const preference = createValidPreference();
        PreferenceCacheManager.updateCache('test', preference);

        // Advance time beyond TTL (5 minutes)
        vi.setSystemTime(now + 6 * 60 * 1000);

        const result = PreferenceCacheManager.getCachedPreference('test');
        expect(result).toBeNull();
      });

      it('should clear cache when expired', () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        PreferenceCacheManager.updateCache('key1', createValidPreference());
        PreferenceCacheManager.updateCache(
          'key2',
          createValidPreference({ locale: 'zh' }),
        );

        vi.setSystemTime(now + 6 * 60 * 1000);
        PreferenceCacheManager.getCachedPreference('key1');

        const status = PreferenceCacheManager.getCacheStatus();
        expect(status.size).toBe(0);
      });
    });

    describe('updateCache', () => {
      it('should add preference to cache', () => {
        const preference = createValidPreference();
        PreferenceCacheManager.updateCache('test', preference);

        const status = PreferenceCacheManager.getCacheStatus();
        expect(status.size).toBe(1);
        expect(status.keys).toContain('test');
      });

      it('should update timestamp', () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        PreferenceCacheManager.updateCache('test', createValidPreference());

        const status = PreferenceCacheManager.getCacheStatus();
        expect(status.age).toBe(0);
      });
    });

    describe('clearCache', () => {
      it('should clear specific key', () => {
        PreferenceCacheManager.updateCache('key1', createValidPreference());
        PreferenceCacheManager.updateCache(
          'key2',
          createValidPreference({ locale: 'zh' }),
        );

        PreferenceCacheManager.clearCache('key1');

        const status = PreferenceCacheManager.getCacheStatus();
        expect(status.size).toBe(1);
        expect(status.keys).not.toContain('key1');
        expect(status.keys).toContain('key2');
      });

      it('should clear all cache when no key provided', () => {
        PreferenceCacheManager.updateCache('key1', createValidPreference());
        PreferenceCacheManager.updateCache(
          'key2',
          createValidPreference({ locale: 'zh' }),
        );

        PreferenceCacheManager.clearCache();

        const status = PreferenceCacheManager.getCacheStatus();
        expect(status.size).toBe(0);
      });
    });

    describe('getCacheStatus', () => {
      it('should return cache status', () => {
        PreferenceCacheManager.updateCache('test', createValidPreference());

        const status = PreferenceCacheManager.getCacheStatus();

        expect(status).toHaveProperty('size');
        expect(status).toHaveProperty('age');
        expect(status).toHaveProperty('isExpired');
        expect(status).toHaveProperty('keys');
      });

      it('should correctly report expiration', () => {
        vi.useFakeTimers();
        const now = Date.now();
        vi.setSystemTime(now);

        PreferenceCacheManager.updateCache('test', createValidPreference());

        let status = PreferenceCacheManager.getCacheStatus();
        expect(status.isExpired).toBe(false);

        vi.setSystemTime(now + 6 * 60 * 1000);
        status = PreferenceCacheManager.getCacheStatus();
        expect(status.isExpired).toBe(true);
      });
    });

    describe('warmUpCache', () => {
      it('should load preference into cache', () => {
        PreferenceCacheManager.warmUpCache();

        expect(getUserPreference).toHaveBeenCalled();
        const cached =
          PreferenceCacheManager.getCachedPreference('locale_preference');
        expect(cached).not.toBeNull();
      });

      it('should not cache when getUserPreference fails', () => {
        vi.mocked(getUserPreference).mockReturnValueOnce({
          success: false,
          error: 'Failed',
          timestamp: Date.now(),
        });

        PreferenceCacheManager.warmUpCache();

        const cached =
          PreferenceCacheManager.getCachedPreference('locale_preference');
        expect(cached).toBeNull();
      });
    });
  });

  describe('syncPreferenceData', () => {
    it('should sync localStorage to cookies', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = syncPreferenceData();

      expect(result.success).toBe(true);
      expect(result.data?.synced).toBe(true);
      expect(CookieManager.set).toHaveBeenCalledWith(
        'locale_preference',
        preference.locale,
      );
    });

    it('should sync cookies to localStorage', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue('zh');

      const result = syncPreferenceData();

      expect(result.success).toBe(true);
      expect(saveUserPreference).toHaveBeenCalled();
    });

    it('should not sync when data is already consistent', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(preference.locale);

      const result = syncPreferenceData();

      expect(result.success).toBe(true);
      expect(result.data?.synced).toBe(false);
    });

    it('should update cache after sync', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      syncPreferenceData();

      const cached =
        PreferenceCacheManager.getCachedPreference('locale_preference');
      expect(cached).not.toBeNull();
    });

    it('should catch and return errors', () => {
      vi.mocked(LocalStorageManager.get).mockImplementationOnce(() => {
        throw new Error('Read error');
      });

      const result = syncPreferenceData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Read error');
    });
  });

  describe('checkDataConsistency', () => {
    it('should return consistent when data matches', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(preference.locale);

      const result = checkDataConsistency();

      expect(result.isConsistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect locale mismatch', () => {
      const preference = createValidPreference({ locale: 'en' });
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue('zh');

      const result = checkDataConsistency();

      expect(result.isConsistent).toBe(false);
      expect(result.issues.some((i) => i.includes('mismatch'))).toBe(true);
    });

    it('should detect no preference data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = checkDataConsistency();

      expect(result.isConsistent).toBe(false);
      expect(result.issues.some((i) => i.includes('No preference data'))).toBe(
        true,
      );
    });

    it('should detect invalid localStorage data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(
        createValidPreference(),
      );
      vi.mocked(CookieManager.get).mockReturnValue('en');
      vi.mocked(validatePreferenceData).mockReturnValueOnce({
        isValid: false,
        errors: ['Invalid locale'],
        warnings: [],
      });

      const result = checkDataConsistency();

      expect(result.isConsistent).toBe(false);
      expect(
        result.issues.some((i) => i.includes('Invalid localStorage')),
      ).toBe(true);
    });

    it('should detect cache inconsistency', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(preference.locale);

      // Set cache with different locale
      PreferenceCacheManager.updateCache(
        'locale_preference',
        createValidPreference({ locale: 'zh' }),
      );

      const result = checkDataConsistency();

      expect(result.isConsistent).toBe(false);
      expect(result.issues.some((i) => i.includes('Cache data'))).toBe(true);
    });

    it('should catch and return errors', () => {
      vi.mocked(LocalStorageManager.get).mockImplementationOnce(() => {
        throw new Error('Access error');
      });

      const result = checkDataConsistency();

      expect(result.isConsistent).toBe(false);
      expect(result.issues[0]).toContain('Error checking consistency');
    });
  });

  describe('fixDataInconsistency', () => {
    it('should return no fix needed when consistent', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(preference.locale);

      const result = fixDataInconsistency();

      expect(result.success).toBe(true);
      expect(result.data?.fixed).toBe(false);
      expect(result.data?.actions).toContain('No issues found');
    });

    it('should fix using localStorage as authoritative', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue('zh');

      const result = fixDataInconsistency();

      expect(result.success).toBe(true);
      expect(result.data?.fixed).toBe(true);
      expect(result.data?.actions).toContain('Cleared cache');
    });

    it('should recover from cookies when localStorage has invalid data', () => {
      // localStorage has invalid data (missing required fields), cookie has valid locale
      // This creates an inconsistency that needs fixing
      const invalidPreference = { locale: '', source: '', confidence: -1 };
      vi.mocked(LocalStorageManager.get).mockReturnValue(
        invalidPreference as unknown as null,
      );
      vi.mocked(CookieManager.get).mockReturnValue('zh');
      // validatePreferenceData will return invalid for this data
      vi.mocked(validatePreferenceData).mockReturnValue({
        isValid: false,
        errors: ['Invalid locale'],
        warnings: [],
      });

      const result = fixDataInconsistency();

      expect(result.success).toBe(true);
      expect(result.data?.fixed).toBe(true);
      expect(
        result.data?.actions.some((a) => a.includes('Recovered from cookies')),
      ).toBe(true);
    });

    it('should create default when no data exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = fixDataInconsistency();

      expect(result.success).toBe(true);
      expect(result.data?.fixed).toBe(true);
      expect(
        result.data?.actions.some((a) => a.includes('Created default')),
      ).toBe(true);
    });

    it('should catch and return errors', () => {
      // checkDataConsistency catches errors and returns isConsistent: false
      // To test the outer catch block, we need to mock something that happens
      // after checkDataConsistency - like PreferenceCacheManager.clearCache
      // But clearCache is a static method. Instead, make checkDataConsistency
      // return inconsistent but then have LocalStorageManager.get throw on second call
      let callCount = 0;
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        callCount++;
        // First call is from checkDataConsistency - return null
        if (callCount === 1) return null;
        // Second call is from fixDataInconsistency after clearing cache - throw error
        throw new Error('Fix error');
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = fixDataInconsistency();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fix error');
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage info', () => {
      vi.stubGlobal('localStorage', {
        length: 1,
        key: vi.fn(() => 'test'),
        getItem: vi.fn(() => 'value'),
      });
      vi.stubGlobal('document', {
        cookie: 'key=value',
      });

      const usage = getStorageUsage();

      expect(usage).toHaveProperty('localStorage');
      expect(usage).toHaveProperty('cookies');
      expect(usage).toHaveProperty('cache');

      vi.unstubAllGlobals();
    });

    it('should handle unavailable storage', () => {
      vi.stubGlobal('localStorage', undefined);
      vi.stubGlobal('document', undefined);

      const usage = getStorageUsage();

      expect(usage.localStorage.available).toBe(false);
      expect(usage.cookies.available).toBe(false);

      vi.unstubAllGlobals();
    });

    it('should include cache status', () => {
      PreferenceCacheManager.updateCache('test', createValidPreference());

      const usage = getStorageUsage();

      expect(usage.cache.size).toBeGreaterThan(0);
    });
  });

  describe('optimizeStoragePerformance', () => {
    it('should optimize storage', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(preference.locale);

      const result = optimizeStoragePerformance();

      expect(result.success).toBe(true);
      expect(result.data?.optimized).toBe(true);
      expect(result.data?.actions).toContain('Warmed up cache');
    });

    it('should clear expired cache', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      PreferenceCacheManager.updateCache('test', createValidPreference());

      vi.setSystemTime(now + 6 * 60 * 1000);

      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(preference.locale);

      const result = optimizeStoragePerformance();

      expect(result.data?.actions).toContain('Cleared expired cache');
    });

    it('should catch and return errors', () => {
      vi.mocked(getUserPreference).mockImplementationOnce(() => {
        throw new Error('Optimize error');
      });

      const result = optimizeStoragePerformance();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Optimize error');
    });

    it('should include performance metrics', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(preference.locale);

      const result = optimizeStoragePerformance();

      expect(result.data?.performance).toHaveProperty('before');
      expect(result.data?.performance).toHaveProperty('after');
      expect(result.data?.performance).toHaveProperty('improvement');
    });
  });
});
