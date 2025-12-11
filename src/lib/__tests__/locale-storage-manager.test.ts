import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocaleHistoryManager } from '@/lib/locale-storage-history';
import { LocaleMaintenanceManager } from '@/lib/locale-storage-maintenance';
import { LocalePreferenceManager } from '@/lib/locale-storage-preference';
import { LocaleStorageAnalytics } from '../locale-storage-analytics';
import { LocaleStorageManager } from '../locale-storage-manager';

// Mock dependencies before import
vi.mock('@/lib/locale-storage-preference', () => ({
  LocalePreferenceManager: {
    saveUserPreference: vi.fn(() => ({ success: true })),
    getUserPreference: vi.fn(() => ({
      success: true,
      data: {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: 0.9,
      },
    })),
    setUserOverride: vi.fn(() => ({ success: true })),
    getUserOverride: vi.fn(() => ({ success: true, data: 'en' })),
    clearUserOverride: vi.fn(() => ({ success: true })),
    validatePreference: vi.fn(() => true),
  },
  saveUserPreference: vi.fn(),
  getUserPreference: vi.fn(),
  setUserOverride: vi.fn(),
  getUserOverride: vi.fn(),
  hasUserOverride: vi.fn(),
  clearUserOverride: vi.fn(),
  hasUserPreference: vi.fn(),
  clearUserPreference: vi.fn(),
  getPreferenceHistory: vi.fn(),
  clearPreferenceHistory: vi.fn(),
  getPreferenceSummary: vi.fn(),
  comparePreferences: vi.fn(),
  normalizePreference: vi.fn(),
  updatePreferenceConfidence: vi.fn(),
  getPreferenceSourcePriority: vi.fn(),
  validatePreferenceData: vi.fn(),
  getPreferenceChangeStats: vi.fn(),
  syncPreferenceData: vi.fn(),
  getStorageUsage: vi.fn(),
  checkDataConsistency: vi.fn(),
  fixDataInconsistency: vi.fn(),
  optimizeStoragePerformance: vi.fn(),
  getOverrideHistory: vi.fn(),
  clearOverrideHistory: vi.fn(),
  exportOverrideData: vi.fn(),
  importOverrideData: vi.fn(),
  getOverrideStats: vi.fn(),
  recordOverrideOperation: vi.fn(),
  PreferenceEventManager: vi.fn(),
  PreferenceCacheManager: vi.fn(),
  createDefaultPreference: vi.fn(),
  createPreferenceSavedEvent: vi.fn(),
  createPreferenceLoadedEvent: vi.fn(),
  createPreferenceErrorEvent: vi.fn(),
  createSyncEvent: vi.fn(),
  createOverrideSetEvent: vi.fn(),
  createOverrideClearedEvent: vi.fn(),
  recordPreferenceHistory: vi.fn(),
  setupDefaultListeners: vi.fn(),
  consoleLogListener: vi.fn(),
  historyRecordingListener: vi.fn(),
  getEventSystemStatus: vi.fn(),
  cleanupEventSystem: vi.fn(),
}));

vi.mock('@/lib/locale-storage-history', () => ({
  LocaleHistoryManager: {
    getDetectionHistory: vi.fn(() => ({
      success: true,
      data: { records: [], lastUpdated: Date.now() },
    })),
    addDetectionRecord: vi.fn(() => ({ success: true })),
    getRecentDetections: vi.fn(() => []),
  },
}));

vi.mock('@/lib/locale-storage-analytics', () => ({
  LocaleStorageAnalytics: {
    getStorageStats: vi.fn(() => ({
      totalSize: 1024,
      usedSize: 512,
      availableSize: 512,
      itemCount: 5,
    })),
  },
}));

vi.mock('@/lib/locale-storage-maintenance', () => ({
  LocaleMaintenanceManager: {
    clearAll: vi.fn(() => ({ success: true })),
    cleanupExpiredDetections: vi.fn(() => ({ success: true, removed: 0 })),
    exportData: vi.fn(() => ({
      version: '1.0.0',
      timestamp: Date.now(),
      data: {},
    })),
    importData: vi.fn(() => ({ success: true })),
    performMaintenance: vi.fn(() => ({ success: true })),
    validateStorageIntegrity: vi.fn(() => ({ valid: true, errors: [] })),
  },
}));

describe('LocaleStorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveUserPreference', () => {
    it('should delegate to LocalePreferenceManager', () => {
      const preference = {
        locale: 'en' as const,
        source: 'user' as const,
        timestamp: Date.now(),
        confidence: 0.9,
      };

      LocaleStorageManager.saveUserPreference(preference);

      expect(LocalePreferenceManager.saveUserPreference).toHaveBeenCalledWith(
        preference,
      );
    });
  });

  describe('getUserPreference', () => {
    it('should return preference when successful', () => {
      const result = LocaleStorageManager.getUserPreference();

      expect(LocalePreferenceManager.getUserPreference).toHaveBeenCalled();
      expect(result).toEqual({
        locale: 'en',
        source: 'user',
        timestamp: expect.any(Number),
        confidence: 0.9,
      });
    });

    it('should return null when unsuccessful', () => {
      vi.mocked(LocalePreferenceManager.getUserPreference).mockReturnValueOnce({
        success: false,
        error: 'Not found',
      });

      const result = LocaleStorageManager.getUserPreference();
      expect(result).toBeNull();
    });

    it('should return null when data is undefined', () => {
      vi.mocked(LocalePreferenceManager.getUserPreference).mockReturnValueOnce({
        success: true,
        data: undefined,
      });

      const result = LocaleStorageManager.getUserPreference();
      expect(result).toBeNull();
    });
  });

  describe('setUserOverride', () => {
    it('should delegate to LocalePreferenceManager', () => {
      LocaleStorageManager.setUserOverride('zh');

      expect(LocalePreferenceManager.setUserOverride).toHaveBeenCalledWith(
        'zh',
      );
    });
  });

  describe('getUserOverride', () => {
    it('should return override when successful', () => {
      const result = LocaleStorageManager.getUserOverride();

      expect(LocalePreferenceManager.getUserOverride).toHaveBeenCalled();
      expect(result).toBe('en');
    });

    it('should return null when unsuccessful', () => {
      vi.mocked(LocalePreferenceManager.getUserOverride).mockReturnValueOnce({
        success: false,
        error: 'Not found',
      });

      const result = LocaleStorageManager.getUserOverride();
      expect(result).toBeNull();
    });

    it('should return null when data is undefined', () => {
      vi.mocked(LocalePreferenceManager.getUserOverride).mockReturnValueOnce({
        success: true,
        data: undefined,
      });

      const result = LocaleStorageManager.getUserOverride();
      expect(result).toBeNull();
    });
  });

  describe('clearUserOverride', () => {
    it('should delegate to LocalePreferenceManager', () => {
      LocaleStorageManager.clearUserOverride();

      expect(LocalePreferenceManager.clearUserOverride).toHaveBeenCalled();
    });
  });

  describe('getDetectionHistory', () => {
    it('should return history when successful', () => {
      const result = LocaleStorageManager.getDetectionHistory();

      expect(LocaleHistoryManager.getDetectionHistory).toHaveBeenCalled();
      expect(result).toEqual({
        records: [],
        lastUpdated: expect.any(Number),
      });
    });

    it('should return null when unsuccessful', () => {
      vi.mocked(LocaleHistoryManager.getDetectionHistory).mockReturnValueOnce({
        success: false,
        error: 'Not found',
      });

      const result = LocaleStorageManager.getDetectionHistory();
      expect(result).toBeNull();
    });

    it('should return null when data is falsy', () => {
      vi.mocked(LocaleHistoryManager.getDetectionHistory).mockReturnValueOnce({
        success: true,
        data: undefined,
      });

      const result = LocaleStorageManager.getDetectionHistory();
      expect(result).toBeNull();
    });
  });

  describe('getFallbackLocale', () => {
    it('should return en as fallback', () => {
      const result = LocaleStorageManager.getFallbackLocale();
      expect(result).toBe('en');
    });
  });

  describe('addDetectionRecord', () => {
    it('should delegate to LocaleHistoryManager with transformed data', () => {
      const detection = {
        locale: 'zh' as const,
        source: 'browser',
        timestamp: Date.now(),
        confidence: 0.8,
      };

      LocaleStorageManager.addDetectionRecord(detection);

      expect(LocaleHistoryManager.addDetectionRecord).toHaveBeenCalledWith({
        locale: 'zh',
        source: 'browser',
        confidence: 0.8,
        metadata: { timestamp: detection.timestamp },
      });
    });
  });

  describe('getRecentDetections', () => {
    it('should return recent detections with default limit', () => {
      LocaleStorageManager.getRecentDetections();

      expect(LocaleHistoryManager.getRecentDetections).toHaveBeenCalledWith(5);
    });

    it('should return recent detections with custom limit', () => {
      LocaleStorageManager.getRecentDetections(10);

      expect(LocaleHistoryManager.getRecentDetections).toHaveBeenCalledWith(10);
    });
  });

  describe('clearAll', () => {
    it('should delegate to LocaleMaintenanceManager', () => {
      LocaleStorageManager.clearAll();

      expect(LocaleMaintenanceManager.clearAll).toHaveBeenCalled();
    });
  });

  describe('getStorageStats', () => {
    it('should delegate to LocaleAnalyticsManager', () => {
      const result = LocaleStorageManager.getStorageStats();

      expect(LocaleStorageAnalytics.getStorageStats).toHaveBeenCalled();
      expect(result).toEqual({
        totalSize: 1024,
        usedSize: 512,
        availableSize: 512,
        itemCount: 5,
      });
    });
  });

  describe('validatePreference', () => {
    it('should delegate to LocalePreferenceManager', () => {
      const preference = {
        locale: 'en' as const,
        source: 'user' as const,
        timestamp: Date.now(),
        confidence: 0.9,
      };

      const result = LocaleStorageManager.validatePreference(preference);

      expect(LocalePreferenceManager.validatePreference).toHaveBeenCalledWith(
        preference,
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid preference', () => {
      vi.mocked(LocalePreferenceManager.validatePreference).mockReturnValueOnce(
        false,
      );

      const result = LocaleStorageManager.validatePreference({
        locale: 'invalid' as 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: 0.9,
      });

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredDetections', () => {
    it('should delegate to LocaleMaintenanceManager with default maxAge', () => {
      LocaleStorageManager.cleanupExpiredDetections();

      expect(
        LocaleMaintenanceManager.cleanupExpiredDetections,
      ).toHaveBeenCalled();
      // Default is 30 days
      const call = vi.mocked(LocaleMaintenanceManager.cleanupExpiredDetections)
        .mock.calls[0];
      expect(call[0]).toBeGreaterThan(0);
    });

    it('should delegate to LocaleMaintenanceManager with custom maxAge', () => {
      const customMaxAge = 86400000; // 1 day

      LocaleStorageManager.cleanupExpiredDetections(customMaxAge);

      expect(
        LocaleMaintenanceManager.cleanupExpiredDetections,
      ).toHaveBeenCalledWith(customMaxAge);
    });
  });

  describe('exportData', () => {
    it('should delegate to LocaleMaintenanceManager', () => {
      const result = LocaleStorageManager.exportData();

      expect(LocaleMaintenanceManager.exportData).toHaveBeenCalled();
      expect(result).toEqual({
        version: '1.0.0',
        timestamp: expect.any(Number),
        data: {},
      });
    });
  });

  describe('importData', () => {
    it('should delegate to LocaleMaintenanceManager with full data', () => {
      const preference = {
        locale: 'en' as const,
        source: 'user' as const,
        timestamp: Date.now(),
        confidence: 0.9,
      };
      const history = { records: [], lastUpdated: Date.now() };

      LocaleStorageManager.importData({
        version: '1.0.0',
        timestamp: Date.now(),
        preference,
        override: 'zh',
        history,
      });

      expect(LocaleMaintenanceManager.importData).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
          preference,
          override: 'zh',
          history,
        }),
      );
    });

    it('should use defaults for missing metadata', () => {
      LocaleStorageManager.importData({});

      expect(LocaleMaintenanceManager.importData).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0.0',
          metadata: expect.objectContaining({
            exportedBy: 'LocaleStorageManager',
            dataIntegrity: 'pending-validation',
          }),
        }),
      );
    });

    it('should preserve existing metadata', () => {
      LocaleStorageManager.importData({
        metadata: {
          userAgent: 'CustomAgent',
          exportedBy: 'CustomExporter',
          dataIntegrity: 'verified',
        },
      });

      expect(LocaleMaintenanceManager.importData).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userAgent: 'CustomAgent',
            exportedBy: 'CustomExporter',
            dataIntegrity: 'verified',
          }),
        }),
      );
    });
  });

  describe('performMaintenance', () => {
    it('should delegate to LocaleMaintenanceManager without options', () => {
      const result = LocaleStorageManager.performMaintenance();

      expect(LocaleMaintenanceManager.performMaintenance).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toEqual({ success: true });
    });

    it('should delegate to LocaleMaintenanceManager with options', () => {
      const options = { cleanupExpired: true, optimizeStorage: true };

      LocaleStorageManager.performMaintenance(options);

      expect(LocaleMaintenanceManager.performMaintenance).toHaveBeenCalledWith(
        options,
      );
    });
  });

  describe('validateStorageIntegrity', () => {
    it('should delegate to LocaleMaintenanceManager', () => {
      const result = LocaleStorageManager.validateStorageIntegrity();

      expect(
        LocaleMaintenanceManager.validateStorageIntegrity,
      ).toHaveBeenCalled();
      expect(result).toEqual({ valid: true, errors: [] });
    });
  });

  describe('integration', () => {
    it('should handle full preference workflow', () => {
      const preference = {
        locale: 'zh' as const,
        source: 'user' as const,
        timestamp: Date.now(),
        confidence: 1.0,
      };

      // Save
      LocaleStorageManager.saveUserPreference(preference);
      expect(LocalePreferenceManager.saveUserPreference).toHaveBeenCalledWith(
        preference,
      );

      // Get
      LocaleStorageManager.getUserPreference();
      expect(LocalePreferenceManager.getUserPreference).toHaveBeenCalled();

      // Override
      LocaleStorageManager.setUserOverride('en');
      expect(LocalePreferenceManager.setUserOverride).toHaveBeenCalledWith(
        'en',
      );

      // Get override
      LocaleStorageManager.getUserOverride();
      expect(LocalePreferenceManager.getUserOverride).toHaveBeenCalled();

      // Clear override
      LocaleStorageManager.clearUserOverride();
      expect(LocalePreferenceManager.clearUserOverride).toHaveBeenCalled();
    });

    it('should handle detection history workflow', () => {
      // Add detection
      LocaleStorageManager.addDetectionRecord({
        locale: 'en',
        source: 'browser',
        timestamp: Date.now(),
        confidence: 0.8,
      });
      expect(LocaleHistoryManager.addDetectionRecord).toHaveBeenCalled();

      // Get recent
      LocaleStorageManager.getRecentDetections(3);
      expect(LocaleHistoryManager.getRecentDetections).toHaveBeenCalledWith(3);

      // Get history
      LocaleStorageManager.getDetectionHistory();
      expect(LocaleHistoryManager.getDetectionHistory).toHaveBeenCalled();
    });
  });
});
