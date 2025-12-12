import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieManager } from '../locale-storage-cookie';
import { LocalStorageManager } from '../locale-storage-local';
import {
  LocaleImportExportManager,
  type ExportData,
} from '../locale-storage-maintenance-import-export';
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

vi.mock('../locale-storage-maintenance-validation', () => ({
  LocaleValidationManager: {
    validatePreferenceData: vi.fn(),
    validateHistoryData: vi.fn(),
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

// Helper factories
function createValidPreference() {
  return {
    locale: 'en',
    source: 'user',
    timestamp: Date.now() - 1000,
    confidence: 0.9,
  };
}

function createValidHistory() {
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
  };
}

function createValidExportData(
  overrides: Partial<ExportData> = {},
): ExportData {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    metadata: {
      userAgent: 'Test Agent',
      exportedBy: 'LocaleMaintenanceManager',
      dataIntegrity: 'abc123',
    },
    ...overrides,
  };
}

describe('LocaleImportExportManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(LocalStorageManager.get).mockReturnValue(null);
    vi.mocked(LocaleValidationManager.validatePreferenceData).mockReturnValue(
      true,
    );
    vi.mocked(LocaleValidationManager.validateHistoryData).mockReturnValue(
      true,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('exportData', () => {
    it('should export empty data when no storage exists', () => {
      const result = LocaleImportExportManager.exportData();

      expect(result.version).toBe('1.0.0');
      expect(result.timestamp).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.preference).toBeUndefined();
      expect(result.override).toBeUndefined();
      expect(result.history).toBeUndefined();
    });

    it('should export preference data when exists', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return preference;
        return null;
      });

      const result = LocaleImportExportManager.exportData();

      expect(result.preference).toEqual(preference);
    });

    it('should export override when exists', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.USER_LOCALE_OVERRIDE) return 'zh';
        return null;
      });

      const result = LocaleImportExportManager.exportData();

      expect(result.override).toBe('zh');
    });

    it('should export history when exists', () => {
      const history = createValidHistory();
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      const result = LocaleImportExportManager.exportData();

      expect(result.history).toEqual(history);
    });

    it('should include metadata with checksum', () => {
      const result = LocaleImportExportManager.exportData();

      expect(result.metadata.exportedBy).toBe('LocaleMaintenanceManager');
      expect(result.metadata.dataIntegrity).toBeDefined();
    });
  });

  describe('importData', () => {
    it('should reject unsupported version', () => {
      const data = createValidExportData({ version: '2.0.0' });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('不支持的数据版本');
    });

    it('should import preference data', () => {
      const preference = createValidPreference();
      const data = createValidExportData({ preference });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(true);
      expect(result.data?.importedItems).toBe(1);
      expect(LocalStorageManager.set).toHaveBeenCalledWith(
        STORAGE_KEYS.LOCALE_PREFERENCE,
        preference,
      );
      expect(CookieManager.set).toHaveBeenCalledWith(
        STORAGE_KEYS.LOCALE_PREFERENCE,
        JSON.stringify(preference),
      );
    });

    it('should import override data', () => {
      const data = createValidExportData({ override: 'zh' });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(true);
      expect(result.data?.importedItems).toBe(1);
      expect(LocalStorageManager.set).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_LOCALE_OVERRIDE,
        'zh',
      );
    });

    it('should import history data', () => {
      const history = createValidHistory();
      const data = createValidExportData({ history });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(true);
      expect(result.data?.importedItems).toBe(1);
      expect(LocalStorageManager.set).toHaveBeenCalledWith(
        STORAGE_KEYS.LOCALE_DETECTION_HISTORY,
        history,
      );
    });

    it('should report invalid preference data', () => {
      vi.mocked(LocaleValidationManager.validatePreferenceData).mockReturnValue(
        false,
      );
      const data = createValidExportData({
        preference: { invalid: true } as never,
      });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(false);
      expect(result.data?.errors).toContain('用户偏好数据格式无效');
    });

    it('should report invalid override data', () => {
      const data = createValidExportData({ override: 123 as never });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(false);
      expect(result.data?.errors).toContain('用户覆盖设置格式无效');
    });

    it('should report invalid history data', () => {
      vi.mocked(LocaleValidationManager.validateHistoryData).mockReturnValue(
        false,
      );
      const data = createValidExportData({
        history: { invalid: true } as never,
      });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(false);
      expect(result.data?.errors).toContain('检测历史数据格式无效');
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.set).mockImplementation(() => {
        throw new Error('Storage error');
      });
      const data = createValidExportData({
        preference: createValidPreference(),
      });

      const result = LocaleImportExportManager.importData(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('exportAsJson', () => {
    it('should return valid JSON string', () => {
      const jsonString = LocaleImportExportManager.exportAsJson();

      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);
      expect(parsed.version).toBe('1.0.0');
    });

    it('should format with 2-space indentation', () => {
      const jsonString = LocaleImportExportManager.exportAsJson();

      // Check for proper indentation
      expect(jsonString).toContain('\n  ');
    });
  });

  describe('importFromJson', () => {
    it('should import valid JSON string', () => {
      const data = createValidExportData({
        preference: createValidPreference(),
      });
      const jsonString = JSON.stringify(data);

      const result = LocaleImportExportManager.importFromJson(jsonString);

      expect(result.success).toBe(true);
    });

    it('should handle invalid JSON', () => {
      const result = LocaleImportExportManager.importFromJson('invalid-json{');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createBackup', () => {
    it('should create backup with unique key', () => {
      const result = LocaleImportExportManager.createBackup();

      expect(result.success).toBe(true);
      expect(result.data?.backupKey).toMatch(/^locale_backup_\d+$/);
      expect(LocalStorageManager.set).toHaveBeenCalled();
    });

    it('should include backup data in result', () => {
      const result = LocaleImportExportManager.createBackup();

      expect(result.data?.backupData).toBeDefined();
      expect(result.data?.backupData.version).toBe('1.0.0');
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.set).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = LocaleImportExportManager.createBackup();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('restoreBackup', () => {
    it('should restore existing backup', () => {
      const backupData = createValidExportData({
        preference: createValidPreference(),
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(backupData);

      const result =
        LocaleImportExportManager.restoreBackup('locale_backup_123');

      expect(result.success).toBe(true);
    });

    it('should fail when backup does not exist', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleImportExportManager.restoreBackup('locale_backup_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('备份数据不存在');
    });

    it('should handle import errors during restore', () => {
      const invalidBackup = createValidExportData({ version: '2.0.0' });
      vi.mocked(LocalStorageManager.get).mockReturnValue(invalidBackup);

      const result =
        LocaleImportExportManager.restoreBackup('locale_backup_123');

      expect(result.success).toBe(false);
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result =
        LocaleImportExportManager.restoreBackup('locale_backup_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('listBackups', () => {
    it('should return empty array when no backups exist', () => {
      // Mock localStorage
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          length: 0,
          key: () => null,
          getItem: () => null,
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        configurable: true,
      });

      const result = LocaleImportExportManager.listBackups();

      expect(result).toEqual([]);
    });

    it('should list backups sorted by timestamp', () => {
      const backup1 = { timestamp: 1000, version: '1.0.0', metadata: {} };
      const backup2 = { timestamp: 2000, version: '1.0.0', metadata: {} };

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          length: 2,
          key: (i: number) => (i === 0 ? 'locale_backup_1' : 'locale_backup_2'),
          getItem: (key: string) => {
            if (key === 'locale_backup_1') return JSON.stringify(backup1);
            if (key === 'locale_backup_2') return JSON.stringify(backup2);
            return null;
          },
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        configurable: true,
      });

      const result = LocaleImportExportManager.listBackups();

      expect(result.length).toBe(2);
      expect(result[0].timestamp).toBe(2000); // Newest first
    });

    it('should handle invalid backup data', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          length: 1,
          key: () => 'locale_backup_invalid',
          getItem: () => 'invalid-json',
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        configurable: true,
      });

      const result = LocaleImportExportManager.listBackups();

      expect(result.length).toBe(1);
      expect(result[0].isValid).toBe(false);
    });
  });

  describe('deleteBackup', () => {
    it('should delete valid backup key', () => {
      const result =
        LocaleImportExportManager.deleteBackup('locale_backup_123');

      expect(result.success).toBe(true);
      expect(result.data?.deletedKey).toBe('locale_backup_123');
      expect(LocalStorageManager.remove).toHaveBeenCalledWith(
        'locale_backup_123',
      );
    });

    it('should reject invalid backup key', () => {
      const result = LocaleImportExportManager.deleteBackup('invalid_key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的备份键名');
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.remove).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result =
        LocaleImportExportManager.deleteBackup('locale_backup_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('cleanupOldBackups', () => {
    it('should do nothing when under max backups', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          length: 2,
          key: (i: number) => `locale_backup_${i}`,
          getItem: () =>
            JSON.stringify({
              timestamp: Date.now(),
              version: '1.0.0',
              metadata: {},
            }),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        configurable: true,
      });

      const result = LocaleImportExportManager.cleanupOldBackups(5);

      expect(result.success).toBe(true);
      expect(result.error).toContain('没有需要清理的旧备份');
    });

    it('should delete oldest backups when over limit', () => {
      const backups = [
        { key: 'locale_backup_1', timestamp: 1000 },
        { key: 'locale_backup_2', timestamp: 2000 },
        { key: 'locale_backup_3', timestamp: 3000 },
        { key: 'locale_backup_4', timestamp: 4000 },
        { key: 'locale_backup_5', timestamp: 5000 },
        { key: 'locale_backup_6', timestamp: 6000 },
      ];

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          length: 6,
          key: (i: number) => backups[i]?.key ?? null,
          getItem: (key: string) => {
            const backup = backups.find((b) => b.key === key);
            return backup
              ? JSON.stringify({
                  timestamp: backup.timestamp,
                  version: '1.0.0',
                  metadata: {},
                })
              : null;
          },
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        configurable: true,
      });

      const result = LocaleImportExportManager.cleanupOldBackups(3);

      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(3);
      expect(LocalStorageManager.remove).toHaveBeenCalledTimes(3);
    });

    it('should handle exceptions gracefully', () => {
      // Mock listBackups to throw
      vi.spyOn(LocaleImportExportManager, 'listBackups').mockImplementation(
        () => {
          throw new Error('Storage error');
        },
      );

      const result = LocaleImportExportManager.cleanupOldBackups();

      expect(result.success).toBe(false);
      expect(result.error).toContain('清理旧备份失败');

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });

  describe('getExportStats', () => {
    it('should return correct stats when no data exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const stats = LocaleImportExportManager.getExportStats();

      expect(stats.totalItems).toBe(0);
      expect(stats.hasPreference).toBe(false);
      expect(stats.hasOverride).toBe(false);
      expect(stats.hasHistory).toBe(false);
      expect(stats.historyRecords).toBe(0);
    });

    it('should count all items correctly', () => {
      const preference = createValidPreference();
      const history = createValidHistory();

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return preference;
        if (key === STORAGE_KEYS.USER_LOCALE_OVERRIDE) return 'zh';
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      const stats = LocaleImportExportManager.getExportStats();

      expect(stats.totalItems).toBe(3);
      expect(stats.hasPreference).toBe(true);
      expect(stats.hasOverride).toBe(true);
      expect(stats.hasHistory).toBe(true);
      expect(stats.historyRecords).toBe(1);
    });

    it('should calculate last modified correctly', () => {
      const preference = { ...createValidPreference(), timestamp: 1000 };
      const history = { ...createValidHistory(), lastUpdated: 2000 };

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return preference;
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      const stats = LocaleImportExportManager.getExportStats();

      expect(stats.lastModified).toBe(2000);
    });

    it('should calculate data size', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const stats = LocaleImportExportManager.getExportStats();

      expect(stats.dataSize).toBeGreaterThan(0);
    });
  });
});
