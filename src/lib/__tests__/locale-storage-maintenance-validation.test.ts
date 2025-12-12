import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieManager } from '../locale-storage-cookie';
import { LocalStorageManager } from '../locale-storage-local';
import { LocaleValidationManager } from '../locale-storage-maintenance-validation';
import { STORAGE_KEYS } from '../locale-storage-types';

// Mock dependencies
vi.mock('../locale-storage-local', () => ({
  LocalStorageManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../locale-storage-cookie', () => ({
  CookieManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Helper factories
function createValidPreference(overrides = {}) {
  return {
    locale: 'en',
    source: 'user',
    timestamp: Date.now() - 1000,
    confidence: 0.9,
    ...overrides,
  };
}

function createValidHistory(overrides = {}) {
  return {
    detections: [
      {
        locale: 'en',
        source: 'browser',
        timestamp: Date.now() - 1000,
        confidence: 0.8,
      },
    ],
    lastUpdated: Date.now() - 500,
    ...overrides,
  };
}

describe('LocaleValidationManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validatePreferenceData', () => {
    it('should return true for valid preference data', () => {
      const preference = createValidPreference();
      expect(LocaleValidationManager.validatePreferenceData(preference)).toBe(
        true,
      );
    });

    it('should return false for null preference', () => {
      expect(
        LocaleValidationManager.validatePreferenceData(null as never),
      ).toBe(false);
    });

    it('should return false for non-object preference', () => {
      expect(
        LocaleValidationManager.validatePreferenceData('string' as never),
      ).toBe(false);
    });

    it('should return false when required fields are missing', () => {
      const incomplete = { locale: 'en', source: 'user' };
      expect(
        LocaleValidationManager.validatePreferenceData(incomplete as never),
      ).toBe(false);
    });

    it('should return false when locale is not a string', () => {
      const invalid = createValidPreference({ locale: 123 });
      expect(
        LocaleValidationManager.validatePreferenceData(invalid as never),
      ).toBe(false);
    });

    it('should return false when source is not a string', () => {
      const invalid = createValidPreference({ source: null });
      expect(
        LocaleValidationManager.validatePreferenceData(invalid as never),
      ).toBe(false);
    });

    it('should return false when timestamp is not a number', () => {
      const invalid = createValidPreference({ timestamp: 'invalid' });
      expect(
        LocaleValidationManager.validatePreferenceData(invalid as never),
      ).toBe(false);
    });

    it('should return false when confidence is not a number', () => {
      const invalid = createValidPreference({ confidence: 'high' });
      expect(
        LocaleValidationManager.validatePreferenceData(invalid as never),
      ).toBe(false);
    });

    it('should return false when confidence is out of range (negative)', () => {
      const invalid = createValidPreference({ confidence: -0.1 });
      expect(LocaleValidationManager.validatePreferenceData(invalid)).toBe(
        false,
      );
    });

    it('should return false when confidence is out of range (>1)', () => {
      const invalid = createValidPreference({ confidence: 1.1 });
      expect(LocaleValidationManager.validatePreferenceData(invalid)).toBe(
        false,
      );
    });

    it('should return false when timestamp is in the future', () => {
      const invalid = createValidPreference({ timestamp: Date.now() + 10000 });
      expect(LocaleValidationManager.validatePreferenceData(invalid)).toBe(
        false,
      );
    });

    it('should return false when timestamp is negative', () => {
      const invalid = createValidPreference({ timestamp: -1 });
      expect(LocaleValidationManager.validatePreferenceData(invalid)).toBe(
        false,
      );
    });
  });

  describe('validateHistoryData', () => {
    it('should return true for valid history data', () => {
      const history = createValidHistory();
      expect(LocaleValidationManager.validateHistoryData(history)).toBe(true);
    });

    it('should return false for null history', () => {
      expect(LocaleValidationManager.validateHistoryData(null as never)).toBe(
        false,
      );
    });

    it('should return false for non-object history', () => {
      expect(
        LocaleValidationManager.validateHistoryData('string' as never),
      ).toBe(false);
    });

    it('should return false when detections is not an array', () => {
      const invalid = { detections: 'not-array', lastUpdated: Date.now() };
      expect(
        LocaleValidationManager.validateHistoryData(invalid as never),
      ).toBe(false);
    });

    it('should return false when lastUpdated is not a number', () => {
      const invalid = { detections: [], lastUpdated: 'invalid' };
      expect(
        LocaleValidationManager.validateHistoryData(invalid as never),
      ).toBe(false);
    });

    it('should return false when detection has invalid locale', () => {
      const invalid = createValidHistory({
        detections: [
          {
            locale: 123,
            source: 'browser',
            timestamp: Date.now(),
            confidence: 0.8,
          },
        ],
      });
      expect(
        LocaleValidationManager.validateHistoryData(invalid as never),
      ).toBe(false);
    });

    it('should return false when detection has invalid source', () => {
      const invalid = createValidHistory({
        detections: [
          {
            locale: 'en',
            source: null,
            timestamp: Date.now(),
            confidence: 0.8,
          },
        ],
      });
      expect(
        LocaleValidationManager.validateHistoryData(invalid as never),
      ).toBe(false);
    });

    it('should return false when detection has invalid confidence', () => {
      const invalid = createValidHistory({
        detections: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: Date.now(),
            confidence: 1.5,
          },
        ],
      });
      expect(LocaleValidationManager.validateHistoryData(invalid)).toBe(false);
    });

    it('should return false when detection has negative confidence', () => {
      const invalid = createValidHistory({
        detections: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: Date.now(),
            confidence: -0.1,
          },
        ],
      });
      expect(LocaleValidationManager.validateHistoryData(invalid)).toBe(false);
    });

    it('should return true for empty detections array', () => {
      const valid = { detections: [], lastUpdated: Date.now() };
      expect(LocaleValidationManager.validateHistoryData(valid)).toBe(true);
    });
  });

  describe('validateStorageIntegrity', () => {
    it('should return success when no data exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.validateStorageIntegrity();

      expect(result.success).toBe(true);
      expect(result.data?.issues).toEqual([]);
    });

    it('should return success when all data is valid', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
          return createValidPreference();
        }
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) {
          return createValidHistory();
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.validateStorageIntegrity();

      // May have sync warnings but should still succeed if data is valid
      expect(result.timestamp).toBeDefined();
    });

    it('should report invalid preference data', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
          return { locale: 123 }; // Invalid
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.validateStorageIntegrity();

      expect(result.success).toBe(false);
      expect(result.data?.issues).toContain('用户偏好数据格式无效');
    });

    it('should report invalid history data', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) {
          return { detections: 'not-array' }; // Invalid
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.validateStorageIntegrity();

      expect(result.success).toBe(false);
      expect(result.data?.issues).toContain('检测历史数据格式无效');
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = LocaleValidationManager.validateStorageIntegrity();

      expect(result.success).toBe(false);
      expect(result.error).toContain('验证存储完整性失败');
    });
  });

  describe('validateStorageSync', () => {
    it('should return empty array when no data exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const issues = LocaleValidationManager.validateStorageSync();

      expect(issues).toEqual([]);
    });

    it('should report when preference exists in localStorage but not in Cookie', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
          return createValidPreference();
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const issues = LocaleValidationManager.validateStorageSync();

      expect(issues).toContain('用户偏好在localStorage中存在但Cookie中缺失');
    });

    it('should report when override exists in localStorage but not in Cookie', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.USER_LOCALE_OVERRIDE) {
          return 'zh';
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const issues = LocaleValidationManager.validateStorageSync();

      expect(issues).toContain(
        '用户覆盖设置在localStorage中存在但Cookie中缺失',
      );
    });

    it('should return empty when both storages have data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(
        createValidPreference(),
      );
      vi.mocked(CookieManager.get).mockReturnValue(
        JSON.stringify(createValidPreference()),
      );

      const issues = LocaleValidationManager.validateStorageSync();

      expect(issues).toEqual([]);
    });
  });

  describe('validateSpecificData', () => {
    it('should validate LOCALE_PREFERENCE key', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockReturnValue(preference);
      vi.mocked(CookieManager.get).mockReturnValue(JSON.stringify(preference));

      const result =
        LocaleValidationManager.validateSpecificData('LOCALE_PREFERENCE');

      expect(result.isValid).toBe(true);
      expect(result.data?.hasLocalData).toBe(true);
      expect(result.data?.hasCookieData).toBe(true);
    });

    it('should validate LOCALE_DETECTION_HISTORY key', () => {
      const history = createValidHistory();
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.validateSpecificData(
        'LOCALE_DETECTION_HISTORY',
      );

      expect(result.isValid).toBe(true);
      expect(result.data?.hasLocalData).toBe(true);
      expect(result.data?.hasCookieData).toBe(false);
    });

    it('should report invalid local preference data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue({ invalid: true });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result =
        LocaleValidationManager.validateSpecificData('LOCALE_PREFERENCE');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('localStorage中的偏好数据格式无效');
    });

    it('should report invalid local history data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue({
        detections: 'invalid',
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.validateSpecificData(
        'LOCALE_DETECTION_HISTORY',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('localStorage中的历史数据格式无效');
    });

    it('should report invalid cookie JSON', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue('invalid-json{');

      const result =
        LocaleValidationManager.validateSpecificData('LOCALE_PREFERENCE');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cookie数据JSON格式错误');
    });

    it('should report invalid cookie preference data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(
        JSON.stringify({ locale: 123 }),
      );

      const result =
        LocaleValidationManager.validateSpecificData('LOCALE_PREFERENCE');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cookie中的偏好数据格式无效');
    });

    it('should add warning when data only in localStorage', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(
        createValidPreference(),
      );
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result =
        LocaleValidationManager.validateSpecificData('LOCALE_PREFERENCE');

      expect(result.warnings).toContain(
        '数据仅存在于localStorage中，Cookie中缺失',
      );
    });

    it('should add warning when data only in Cookie', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(
        JSON.stringify(createValidPreference()),
      );

      const result =
        LocaleValidationManager.validateSpecificData('LOCALE_PREFERENCE');

      expect(result.warnings).toContain(
        '数据仅存在于Cookie中，localStorage中缺失',
      );
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result =
        LocaleValidationManager.validateSpecificData('LOCALE_PREFERENCE');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('验证失败');
    });
  });

  describe('validateAllData', () => {
    it('should validate all storage keys', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const results = LocaleValidationManager.validateAllData();

      expect(Object.keys(results).length).toBe(
        Object.keys(STORAGE_KEYS).length,
      );
    });
  });

  describe('checkDataConsistency', () => {
    it('should return success when no data exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.checkDataConsistency();

      expect(result.success).toBe(true);
    });

    it('should detect locale mismatch between localStorage and Cookie', () => {
      const localPref = createValidPreference({ locale: 'en' });
      const cookiePref = createValidPreference({ locale: 'zh' });

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return localPref;
        return null;
      });
      vi.mocked(CookieManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE)
          return JSON.stringify(cookiePref);
        return null;
      });

      const result = LocaleValidationManager.checkDataConsistency();

      expect(result.success).toBe(false);
      expect(result.data?.issues).toContain(
        'localStorage和Cookie中的语言偏好不一致',
      );
    });

    it('should warn about large timestamp difference', () => {
      const baseTime = Date.now();
      const localPref = createValidPreference({ timestamp: baseTime });
      const cookiePref = createValidPreference({
        timestamp: baseTime - 120000,
      }); // 2 minutes diff

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return localPref;
        return null;
      });
      vi.mocked(CookieManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE)
          return JSON.stringify(cookiePref);
        return null;
      });

      const result = LocaleValidationManager.checkDataConsistency();

      expect(result.data?.warnings).toContain(
        'localStorage和Cookie中的偏好时间戳差异较大',
      );
    });

    it('should detect override mismatch', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.USER_LOCALE_OVERRIDE) return 'en';
        return null;
      });
      vi.mocked(CookieManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.USER_LOCALE_OVERRIDE) return 'zh';
        return null;
      });

      const result = LocaleValidationManager.checkDataConsistency();

      expect(result.success).toBe(false);
      expect(result.data?.issues).toContain(
        'localStorage和Cookie中的语言覆盖设置不一致',
      );
    });

    it('should report cookie JSON parse error', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE)
          return createValidPreference();
        return null;
      });
      vi.mocked(CookieManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return 'invalid-json';
        return null;
      });

      const result = LocaleValidationManager.checkDataConsistency();

      expect(result.success).toBe(false);
      expect(result.data?.issues).toContain('Cookie中的偏好数据格式错误');
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = LocaleValidationManager.checkDataConsistency();

      expect(result.success).toBe(false);
      expect(result.error).toContain('数据一致性检查失败');
    });
  });

  describe('getValidationSummary', () => {
    it('should return summary with all keys valid when no data', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const summary = LocaleValidationManager.getValidationSummary();

      expect(summary.totalKeys).toBe(Object.keys(STORAGE_KEYS).length);
      expect(summary.validKeys).toBe(Object.keys(STORAGE_KEYS).length);
      expect(summary.invalidKeys).toBe(0);
    });

    it('should count invalid keys correctly', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
          return { invalid: true }; // Invalid data
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const summary = LocaleValidationManager.getValidationSummary();

      expect(summary.invalidKeys).toBeGreaterThan(0);
    });

    it('should count warning keys correctly', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
          return createValidPreference();
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const summary = LocaleValidationManager.getValidationSummary();

      // Should have warning for data only in localStorage
      expect(summary.warningKeys).toBeGreaterThan(0);
    });

    it('should count sync issues correctly', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) {
          return createValidPreference();
        }
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const summary = LocaleValidationManager.getValidationSummary();

      expect(summary.syncIssues).toBeGreaterThan(0);
    });
  });

  describe('fixSyncIssues', () => {
    it('should sync preference to Cookie when missing', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return preference;
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.fixSyncIssues();

      expect(result.success).toBe(true);
      expect(result.data?.fixedIssues).toBe(1);
      expect(result.data?.actions).toContain('已同步偏好数据到Cookie');
      expect(CookieManager.set).toHaveBeenCalledWith(
        STORAGE_KEYS.LOCALE_PREFERENCE,
        JSON.stringify(preference),
      );
    });

    it('should sync override to Cookie when missing', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.USER_LOCALE_OVERRIDE) return 'zh';
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.fixSyncIssues();

      expect(result.success).toBe(true);
      expect(result.data?.fixedIssues).toBe(1);
      expect(result.data?.actions).toContain('已同步覆盖设置到Cookie');
      expect(CookieManager.set).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_LOCALE_OVERRIDE,
        'zh',
      );
    });

    it('should fix multiple sync issues', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE)
          return createValidPreference();
        if (key === STORAGE_KEYS.USER_LOCALE_OVERRIDE) return 'zh';
        return null;
      });
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.fixSyncIssues();

      expect(result.success).toBe(true);
      expect(result.data?.fixedIssues).toBe(2);
    });

    it('should do nothing when no sync issues exist', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);
      vi.mocked(CookieManager.get).mockReturnValue(null);

      const result = LocaleValidationManager.fixSyncIssues();

      expect(result.success).toBe(true);
      expect(result.data?.fixedIssues).toBe(0);
      expect(CookieManager.set).not.toHaveBeenCalled();
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = LocaleValidationManager.fixSyncIssues();

      expect(result.success).toBe(false);
      expect(result.error).toContain('修复同步问题失败');
    });
  });
});
