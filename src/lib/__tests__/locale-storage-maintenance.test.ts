import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocaleCleanupManager } from '@/lib/locale-storage-maintenance-cleanup';
import { LocaleImportExportManager } from '@/lib/locale-storage-maintenance-import-export';
import { LocaleMaintenanceOperationsManager } from '@/lib/locale-storage-maintenance-operations';
import { LocaleValidationManager } from '@/lib/locale-storage-maintenance-validation';
import { LocaleMaintenanceManager } from '../locale-storage-maintenance';

// Mock all sub-modules
vi.mock('@/lib/locale-storage-maintenance-cleanup', () => ({
  LocaleCleanupManager: {
    clearAll: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    cleanupExpiredDetections: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
      data: { cleanedCount: 5 },
    })),
    clearSpecificData: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
      data: { dataType: 'LOCALE_PREFERENCE' },
    })),
    cleanupInvalidPreferences: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
      data: { cleanedItems: 2 },
    })),
    cleanupDuplicateDetections: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
      data: { duplicateCount: 3 },
    })),
    getCleanupStats: vi.fn(() => ({
      totalItems: 10,
      expiredDetections: 2,
      invalidPreferences: 1,
      duplicateDetections: 3,
    })),
  },
}));

vi.mock('@/lib/locale-storage-maintenance-validation', () => ({
  LocaleValidationManager: {
    validateStorageIntegrity: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
    })),
    validatePreferenceData: vi.fn(() => true),
    validateHistoryData: vi.fn(() => true),
    validateStorageSync: vi.fn(() => []),
    validateSpecificData: vi.fn(() => ({ isValid: true, errors: [] })),
    validateAllData: vi.fn(() => ({
      preference: { isValid: true },
      history: { isValid: true },
    })),
    checkDataConsistency: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
    })),
    getValidationSummary: vi.fn(() => ({
      totalChecks: 5,
      passedChecks: 5,
      failedChecks: 0,
    })),
    fixSyncIssues: vi.fn(() => ({ success: true, timestamp: Date.now() })),
  },
}));

vi.mock('@/lib/locale-storage-maintenance-operations', () => ({
  LocaleMaintenanceOperationsManager: {
    performMaintenance: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
    })),
    compactStorage: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    optimizeDetectionHistory: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
    })),
    rebuildStorageIndex: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
    })),
    performDeepMaintenance: vi.fn(() => ({
      success: true,
      timestamp: Date.now(),
    })),
    getMaintenanceRecommendations: vi.fn(() => ({
      recommendations: ['Clean expired data'],
      priority: 'low',
    })),
  },
}));

vi.mock('@/lib/locale-storage-maintenance-import-export', () => ({
  LocaleImportExportManager: {
    exportData: vi.fn(() => ({
      preference: { locale: 'en' },
      history: [],
      exportTimestamp: Date.now(),
    })),
    importData: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    exportAsJson: vi.fn(() => '{"test": true}'),
    importFromJson: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    createBackup: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    restoreBackup: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    listBackups: vi.fn(() => ['backup-1', 'backup-2']),
    deleteBackup: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    cleanupOldBackups: vi.fn(() => ({ success: true, timestamp: Date.now() })),
    getExportStats: vi.fn(() => ({
      totalExports: 5,
      lastExport: Date.now(),
    })),
  },
  ExportData: {},
  ImportData: {},
}));

describe('locale-storage-maintenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LocaleMaintenanceManager', () => {
    describe('Cleanup Operations', () => {
      describe('clearAll', () => {
        it('should delegate to LocaleCleanupManager', () => {
          const result = LocaleMaintenanceManager.clearAll();

          expect(LocaleCleanupManager.clearAll).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('cleanupExpiredDetections', () => {
        it('should delegate to LocaleCleanupManager without args', () => {
          const result = LocaleMaintenanceManager.cleanupExpiredDetections();

          expect(
            LocaleCleanupManager.cleanupExpiredDetections,
          ).toHaveBeenCalledWith(undefined);
          expect(result.success).toBe(true);
        });

        it('should delegate to LocaleCleanupManager with maxAge', () => {
          const maxAge = 86400000; // 1 day
          LocaleMaintenanceManager.cleanupExpiredDetections(maxAge);

          expect(
            LocaleCleanupManager.cleanupExpiredDetections,
          ).toHaveBeenCalledWith(maxAge);
        });
      });

      describe('clearSpecificData', () => {
        it('should delegate to LocaleCleanupManager', () => {
          const result =
            LocaleMaintenanceManager.clearSpecificData('LOCALE_PREFERENCE');

          expect(LocaleCleanupManager.clearSpecificData).toHaveBeenCalledWith(
            'LOCALE_PREFERENCE',
          );
          expect(result.success).toBe(true);
        });
      });

      describe('cleanupInvalidPreferences', () => {
        it('should delegate to LocaleCleanupManager', () => {
          const result = LocaleMaintenanceManager.cleanupInvalidPreferences();

          expect(
            LocaleCleanupManager.cleanupInvalidPreferences,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('cleanupDuplicateDetections', () => {
        it('should delegate to LocaleCleanupManager', () => {
          const result = LocaleMaintenanceManager.cleanupDuplicateDetections();

          expect(
            LocaleCleanupManager.cleanupDuplicateDetections,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('getCleanupStats', () => {
        it('should delegate to LocaleCleanupManager', () => {
          const result = LocaleMaintenanceManager.getCleanupStats();

          expect(LocaleCleanupManager.getCleanupStats).toHaveBeenCalled();
          expect(result.totalItems).toBe(10);
        });
      });
    });

    describe('Validation Operations', () => {
      describe('validateStorageIntegrity', () => {
        it('should delegate to LocaleValidationManager', () => {
          const result = LocaleMaintenanceManager.validateStorageIntegrity();

          expect(
            LocaleValidationManager.validateStorageIntegrity,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('validatePreferenceData', () => {
        it('should delegate to LocaleValidationManager', () => {
          const preference = { locale: 'en', source: 'user' };
          const result =
            LocaleMaintenanceManager.validatePreferenceData(preference);

          expect(
            LocaleValidationManager.validatePreferenceData,
          ).toHaveBeenCalledWith(preference);
          expect(result).toBe(true);
        });
      });

      describe('validateHistoryData', () => {
        it('should delegate to LocaleValidationManager', () => {
          const history = { detections: [], lastUpdated: Date.now() };
          const result = LocaleMaintenanceManager.validateHistoryData(history);

          expect(
            LocaleValidationManager.validateHistoryData,
          ).toHaveBeenCalledWith(history);
          expect(result).toBe(true);
        });
      });

      describe('validateStorageSync', () => {
        it('should delegate to LocaleValidationManager', () => {
          const result = LocaleMaintenanceManager.validateStorageSync();

          expect(
            LocaleValidationManager.validateStorageSync,
          ).toHaveBeenCalled();
          expect(result).toEqual([]);
        });
      });

      describe('validateSpecificData', () => {
        it('should delegate to LocaleValidationManager', () => {
          const result = LocaleMaintenanceManager.validateSpecificData(
            'user-locale-preference',
          );

          expect(
            LocaleValidationManager.validateSpecificData,
          ).toHaveBeenCalledWith('user-locale-preference');
          expect(result.isValid).toBe(true);
        });
      });

      describe('validateAllData', () => {
        it('should delegate to LocaleValidationManager', () => {
          const result = LocaleMaintenanceManager.validateAllData();

          expect(LocaleValidationManager.validateAllData).toHaveBeenCalled();
          expect(result.preference.isValid).toBe(true);
        });
      });

      describe('checkDataConsistency', () => {
        it('should delegate to LocaleValidationManager', () => {
          const result = LocaleMaintenanceManager.checkDataConsistency();

          expect(
            LocaleValidationManager.checkDataConsistency,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('getValidationSummary', () => {
        it('should delegate to LocaleValidationManager', () => {
          const result = LocaleMaintenanceManager.getValidationSummary();

          expect(
            LocaleValidationManager.getValidationSummary,
          ).toHaveBeenCalled();
          expect(result.totalChecks).toBe(5);
        });
      });

      describe('fixSyncIssues', () => {
        it('should delegate to LocaleValidationManager', () => {
          const result = LocaleMaintenanceManager.fixSyncIssues();

          expect(LocaleValidationManager.fixSyncIssues).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });
    });

    describe('Maintenance Operations', () => {
      describe('performMaintenance', () => {
        it('should delegate to LocaleMaintenanceOperationsManager without options', () => {
          const result = LocaleMaintenanceManager.performMaintenance();

          expect(
            LocaleMaintenanceOperationsManager.performMaintenance,
          ).toHaveBeenCalledWith({});
          expect(result.success).toBe(true);
        });

        it('should delegate to LocaleMaintenanceOperationsManager with options', () => {
          const options = { cleanExpired: true, validateData: true };
          LocaleMaintenanceManager.performMaintenance(options);

          expect(
            LocaleMaintenanceOperationsManager.performMaintenance,
          ).toHaveBeenCalledWith(options);
        });
      });

      describe('compactStorage', () => {
        it('should delegate to LocaleMaintenanceOperationsManager', () => {
          const result = LocaleMaintenanceManager.compactStorage();

          expect(
            LocaleMaintenanceOperationsManager.compactStorage,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('optimizeDetectionHistory', () => {
        it('should delegate to LocaleMaintenanceOperationsManager', () => {
          const result = LocaleMaintenanceManager.optimizeDetectionHistory();

          expect(
            LocaleMaintenanceOperationsManager.optimizeDetectionHistory,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('rebuildStorageIndex', () => {
        it('should delegate to LocaleMaintenanceOperationsManager', () => {
          const result = LocaleMaintenanceManager.rebuildStorageIndex();

          expect(
            LocaleMaintenanceOperationsManager.rebuildStorageIndex,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('performDeepMaintenance', () => {
        it('should delegate to LocaleMaintenanceOperationsManager', () => {
          const result = LocaleMaintenanceManager.performDeepMaintenance();

          expect(
            LocaleMaintenanceOperationsManager.performDeepMaintenance,
          ).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('getMaintenanceRecommendations', () => {
        it('should delegate to LocaleMaintenanceOperationsManager', () => {
          const result =
            LocaleMaintenanceManager.getMaintenanceRecommendations();

          expect(
            LocaleMaintenanceOperationsManager.getMaintenanceRecommendations,
          ).toHaveBeenCalled();
          expect(result.recommendations).toContain('Clean expired data');
        });
      });
    });

    describe('Import/Export Operations', () => {
      describe('exportData', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const result = LocaleMaintenanceManager.exportData();

          expect(LocaleImportExportManager.exportData).toHaveBeenCalled();
          expect(result.preference).toBeDefined();
        });
      });

      describe('importData', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const data = { preference: { locale: 'en' }, history: [] };
          const result = LocaleMaintenanceManager.importData(data);

          expect(LocaleImportExportManager.importData).toHaveBeenCalledWith(
            data,
          );
          expect(result.success).toBe(true);
        });
      });

      describe('exportAsJson', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const result = LocaleMaintenanceManager.exportAsJson();

          expect(LocaleImportExportManager.exportAsJson).toHaveBeenCalled();
          expect(result).toBe('{"test": true}');
        });
      });

      describe('importFromJson', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const json = '{"test": true}';
          const result = LocaleMaintenanceManager.importFromJson(json);

          expect(LocaleImportExportManager.importFromJson).toHaveBeenCalledWith(
            json,
          );
          expect(result.success).toBe(true);
        });
      });

      describe('createBackup', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const result = LocaleMaintenanceManager.createBackup();

          expect(LocaleImportExportManager.createBackup).toHaveBeenCalled();
          expect(result.success).toBe(true);
        });
      });

      describe('restoreBackup', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const backupKey = 'backup-key-123';
          const result = LocaleMaintenanceManager.restoreBackup(backupKey);

          expect(LocaleImportExportManager.restoreBackup).toHaveBeenCalledWith(
            backupKey,
          );
          expect(result.success).toBe(true);
        });
      });

      describe('listBackups', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const result = LocaleMaintenanceManager.listBackups();

          expect(LocaleImportExportManager.listBackups).toHaveBeenCalled();
          expect(result).toEqual(['backup-1', 'backup-2']);
        });
      });

      describe('deleteBackup', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const backupKey = 'backup-key-123';
          const result = LocaleMaintenanceManager.deleteBackup(backupKey);

          expect(LocaleImportExportManager.deleteBackup).toHaveBeenCalledWith(
            backupKey,
          );
          expect(result.success).toBe(true);
        });
      });

      describe('cleanupOldBackups', () => {
        it('should delegate to LocaleImportExportManager without args', () => {
          const result = LocaleMaintenanceManager.cleanupOldBackups();

          expect(
            LocaleImportExportManager.cleanupOldBackups,
          ).toHaveBeenCalledWith(undefined);
          expect(result.success).toBe(true);
        });

        it('should delegate to LocaleImportExportManager with maxBackups', () => {
          LocaleMaintenanceManager.cleanupOldBackups(5);

          expect(
            LocaleImportExportManager.cleanupOldBackups,
          ).toHaveBeenCalledWith(5);
        });
      });

      describe('getExportStats', () => {
        it('should delegate to LocaleImportExportManager', () => {
          const result = LocaleMaintenanceManager.getExportStats();

          expect(LocaleImportExportManager.getExportStats).toHaveBeenCalled();
          expect(result.totalExports).toBe(5);
        });
      });
    });
  });
});
