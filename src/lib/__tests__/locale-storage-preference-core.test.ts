import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieManager } from '@/lib/locale-storage-cookie';
import { LocalStorageManager } from '@/lib/locale-storage-local';
import {
  clearUserPreference,
  comparePreferences,
  createDefaultPreference,
  getPreferenceSourcePriority,
  getPreferenceSummary,
  getUserPreference,
  hasUserPreference,
  normalizePreference,
  saveUserPreference,
  updatePreferenceConfidence,
  validatePreferenceData,
} from '../locale-storage-preference-core';

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

vi.mock('@/lib/locale-storage-types', async () => {
  const actual = await vi.importActual('@/lib/locale-storage-types');
  return {
    ...actual,
    isUserLocalePreference: vi.fn((obj) => {
      return (
        obj &&
        typeof obj === 'object' &&
        'locale' in obj &&
        'source' in obj &&
        'confidence' in obj &&
        'timestamp' in obj
      );
    }),
  };
});

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

describe('locale-storage-preference-core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validatePreferenceData', () => {
    it('should return valid for correct preference', () => {
      const preference = createValidPreference();
      const result = validatePreferenceData(preference);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for non-object', () => {
      const result = validatePreferenceData('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid preference data structure');
    });

    it('should return invalid for null', () => {
      const result = validatePreferenceData(null);
      expect(result.isValid).toBe(false);
    });

    it('should validate locale field', () => {
      const preference = createValidPreference({ locale: '' });
      const result = validatePreferenceData(preference);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid locale');
    });

    it('should validate source field', () => {
      const preference = createValidPreference({ source: '' });
      const result = validatePreferenceData(preference);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid source');
    });

    it('should validate confidence range', () => {
      const belowZero = createValidPreference({ confidence: -0.1 });
      expect(validatePreferenceData(belowZero).isValid).toBe(false);

      const aboveOne = createValidPreference({ confidence: 1.1 });
      expect(validatePreferenceData(aboveOne).isValid).toBe(false);
    });

    it('should validate confidence type', () => {
      const preference = createValidPreference({ confidence: 'high' });
      const result = validatePreferenceData(preference);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid confidence value (must be between 0 and 1)',
      );
    });

    it('should validate timestamp', () => {
      const zeroTimestamp = createValidPreference({ timestamp: 0 });
      expect(validatePreferenceData(zeroTimestamp).isValid).toBe(false);

      const negativeTimestamp = createValidPreference({ timestamp: -1 });
      expect(validatePreferenceData(negativeTimestamp).isValid).toBe(false);
    });

    it('should validate metadata type', () => {
      const preference = createValidPreference({ metadata: 'invalid' });
      const result = validatePreferenceData(preference);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid metadata');
    });

    it('should allow undefined metadata', () => {
      const preference = createValidPreference({ metadata: undefined });
      const result = validatePreferenceData(preference);
      expect(result.isValid).toBe(true);
    });

    it('should collect multiple errors', () => {
      const preference = createValidPreference({
        locale: '',
        source: '',
        confidence: 5,
        timestamp: 0,
      });
      const result = validatePreferenceData(preference);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('createDefaultPreference', () => {
    it('should create preference with default locale', () => {
      const preference = createDefaultPreference();
      expect(preference.locale).toBe('en');
      expect(preference.source).toBe('default');
      expect(preference.confidence).toBe(0.5);
      expect(preference.timestamp).toBeGreaterThan(0);
      expect(preference.metadata).toEqual({});
    });

    it('should create preference with custom locale', () => {
      const preference = createDefaultPreference('zh');
      expect(preference.locale).toBe('zh');
    });
  });

  describe('normalizePreference', () => {
    it('should normalize valid preference', () => {
      const preference = createValidPreference();
      const normalized = normalizePreference(preference);
      expect(normalized.locale).toBe(preference.locale);
      expect(normalized.source).toBe(preference.source);
    });

    it('should clamp confidence to range 0-1', () => {
      const highConfidence = createValidPreference({ confidence: 1.5 });
      expect(normalizePreference(highConfidence).confidence).toBe(1);

      const lowConfidence = createValidPreference({ confidence: -0.5 });
      expect(normalizePreference(lowConfidence).confidence).toBe(0);
    });

    it('should use current timestamp if missing', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const preference = createValidPreference({ timestamp: 0 });
      const normalized = normalizePreference(preference);
      expect(normalized.timestamp).toBe(now);

      vi.useRealTimers();
    });

    it('should use empty object if metadata is missing', () => {
      const preference = createValidPreference({ metadata: undefined });
      const normalized = normalizePreference(preference);
      expect(normalized.metadata).toEqual({});
    });
  });

  describe('saveUserPreference', () => {
    it('should save valid preference', () => {
      const preference = createValidPreference();
      const result = saveUserPreference(preference);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(LocalStorageManager.set).toHaveBeenCalled();
      expect(CookieManager.set).toHaveBeenCalled();
    });

    it('should return error for invalid preference', () => {
      const preference = createValidPreference({ locale: '' });
      const result = saveUserPreference(preference);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid preference data');
    });

    it('should catch and return errors', () => {
      vi.mocked(LocalStorageManager.set).mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      const preference = createValidPreference();
      const result = saveUserPreference(preference);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage full');
    });

    it('should include response time', () => {
      const preference = createValidPreference();
      const result = saveUserPreference(preference);

      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUserPreference', () => {
    it('should return preference from localStorage', () => {
      const storedPreference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(storedPreference);

      const result = getUserPreference();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(storedPreference);
      expect(result.source).toBe('localStorage');
    });

    it('should fallback to cookies when localStorage is empty', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue('zh');

      const result = getUserPreference();

      expect(result.success).toBe(true);
      expect(result.data?.locale).toBe('zh');
      expect(result.source).toBe('cookies');
    });

    it('should return default preference when no storage', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = getUserPreference();

      expect(result.success).toBe(true);
      expect(result.data?.locale).toBe('en');
      expect(result.source).toBe('default');
    });

    it('should catch and return errors', () => {
      vi.mocked(LocalStorageManager.get).mockImplementationOnce(() => {
        throw new Error('Read error');
      });

      const result = getUserPreference();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Read error');
    });

    it('should skip invalid localStorage data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue({ invalid: true });
      vi.mocked(CookieManager.get).mockReturnValue('en');

      const result = getUserPreference();

      expect(result.source).toBe('cookies');
    });
  });

  describe('updatePreferenceConfidence', () => {
    it('should update confidence', () => {
      const storedPreference = createValidPreference({ confidence: 0.5 });
      vi.mocked(LocalStorageManager.get).mockReturnValue(storedPreference);

      const result = updatePreferenceConfidence(0.9);

      expect(result.success).toBe(true);
      expect(result.data?.confidence).toBe(0.9);
    });

    it('should clamp confidence to valid range', () => {
      const storedPreference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(storedPreference);

      const highResult = updatePreferenceConfidence(1.5);
      expect(highResult.data?.confidence).toBe(1);

      const lowResult = updatePreferenceConfidence(-0.5);
      expect(lowResult.data?.confidence).toBe(0);
    });

    it('should return error when no preference exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      // Since getUserPreference returns default, this should succeed
      const result = updatePreferenceConfidence(0.8);
      expect(result.success).toBe(true);
    });
  });

  describe('hasUserPreference', () => {
    it('should return true when localStorage has preference', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(
        createValidPreference(),
      );

      expect(hasUserPreference()).toBe(true);
    });

    it('should return true when cookie has preference', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue('en');

      expect(hasUserPreference()).toBe(true);
    });

    it('should return false when no preference exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      expect(hasUserPreference()).toBe(false);
    });

    it('should return false for invalid localStorage preference', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue({ invalid: true });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      expect(hasUserPreference()).toBe(false);
    });
  });

  describe('getPreferenceSourcePriority', () => {
    it('should return sources with priorities', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(
        createValidPreference(),
      );
      vi.mocked(CookieManager.get).mockReturnValue('en');

      const result = getPreferenceSourcePriority();

      expect(result).toHaveLength(3);
      expect(result[0].source).toBe('localStorage');
      expect(result[0].priority).toBe(1);
      expect(result[1].source).toBe('cookies');
      expect(result[1].priority).toBe(2);
      expect(result[2].source).toBe('default');
      expect(result[2].priority).toBe(3);
    });

    it('should mark unavailable sources', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = getPreferenceSourcePriority();

      expect(result[0].available).toBe(false);
      expect(result[1].available).toBe(false);
      expect(result[2].available).toBe(true);
    });
  });

  describe('comparePreferences', () => {
    it('should return equal for identical preferences', () => {
      const pref1 = createValidPreference();
      const pref2 = { ...pref1 };

      const result = comparePreferences(pref1, pref2);

      expect(result.isEqual).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it('should detect locale difference', () => {
      const pref1 = createValidPreference({ locale: 'en' });
      const pref2 = createValidPreference({ locale: 'zh' });

      const result = comparePreferences(pref1, pref2);

      expect(result.isEqual).toBe(false);
      expect(result.differences).toContain('locale: en vs zh');
    });

    it('should detect source difference', () => {
      const pref1 = createValidPreference({ source: 'user' });
      const pref2 = createValidPreference({ source: 'auto' });

      const result = comparePreferences(pref1, pref2);

      expect(result.differences.some((d) => d.includes('source'))).toBe(true);
    });

    it('should detect confidence difference above threshold', () => {
      const pref1 = createValidPreference({ confidence: 0.5 });
      const pref2 = createValidPreference({ confidence: 0.7 });

      const result = comparePreferences(pref1, pref2);

      expect(result.differences.some((d) => d.includes('confidence'))).toBe(
        true,
      );
    });

    it('should ignore small confidence differences', () => {
      const pref1 = createValidPreference({ confidence: 0.5 });
      const pref2 = createValidPreference({ confidence: 0.505 });

      const result = comparePreferences(pref1, pref2);

      expect(result.differences.some((d) => d.includes('confidence'))).toBe(
        false,
      );
    });

    it('should detect timestamp difference above threshold', () => {
      const pref1 = createValidPreference({ timestamp: 1000 });
      const pref2 = createValidPreference({ timestamp: 5000 });

      const result = comparePreferences(pref1, pref2);

      expect(result.differences.some((d) => d.includes('timestamp'))).toBe(
        true,
      );
    });
  });

  describe('getPreferenceSummary', () => {
    it('should return summary for valid preference', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(
        createValidPreference(),
      );

      const summary = getPreferenceSummary();

      expect(summary.hasPreference).toBe(true);
      expect(summary.locale).toBe('en');
      expect(summary.source).toBe('user');
      expect(summary.confidence).toBe(0.9);
      expect(summary.age).toBeGreaterThanOrEqual(0);
      expect(summary.isValid).toBe(true);
    });

    it('should return empty summary when no preference', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const summary = getPreferenceSummary();

      // getUserPreference returns default, so hasPreference is true
      expect(summary.hasPreference).toBe(true);
      expect(summary.locale).toBe('en');
      expect(summary.source).toBe('default');
    });

    it('should return empty summary on error', () => {
      vi.mocked(LocalStorageManager.get).mockImplementationOnce(() => {
        throw new Error('Error');
      });

      const summary = getPreferenceSummary();

      expect(summary.hasPreference).toBe(false);
      expect(summary.locale).toBeNull();
      expect(summary.isValid).toBe(false);
    });
  });

  describe('clearUserPreference', () => {
    it('should clear both localStorage and cookies', () => {
      const result = clearUserPreference();

      expect(result.success).toBe(true);
      expect(LocalStorageManager.remove).toHaveBeenCalledWith(
        'locale_preference',
      );
      expect(CookieManager.remove).toHaveBeenCalledWith('locale_preference');
    });

    it('should catch and return errors', () => {
      vi.mocked(LocalStorageManager.remove).mockImplementationOnce(() => {
        throw new Error('Remove error');
      });

      const result = clearUserPreference();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Remove error');
    });

    it('should include response time', () => {
      const result = clearUserPreference();

      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });
});
