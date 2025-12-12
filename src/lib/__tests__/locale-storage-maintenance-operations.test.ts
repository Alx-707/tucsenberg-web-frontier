import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageManager } from '../locale-storage-local';
import { LocaleCleanupManager } from '../locale-storage-maintenance-cleanup';
import { LocaleMaintenanceOperationsManager } from '../locale-storage-maintenance-operations';
import { LocaleValidationManager } from '../locale-storage-maintenance-validation';
import { STORAGE_KEYS } from '../locale-storage-types';

// Type definitions for result.data access
interface CompactResult {
  compactedItems: number;
}

interface OptimizeResult {
  removedCount: number;
  remainingCount: number;
}

interface RebuildResult {
  rebuiltItems: number;
  actions: string[];
}

interface MaintenanceResult {
  totalOperations: number;
  successfulOperations: number;
  results: string[];
}

interface CleanupStats {
  totalItems: number;
  expiredDetections: number;
  invalidPreferences: number;
  duplicateDetections: number;
}

// Mock all dependencies
vi.mock('../locale-storage-local', () => ({
  LocalStorageManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../locale-storage-maintenance-cleanup', () => ({
  LocaleCleanupManager: {
    cleanupExpiredDetections: vi.fn(),
    cleanupDuplicateDetections: vi.fn(),
    cleanupInvalidPreferences: vi.fn(),
    getCleanupStats: vi.fn(),
  },
}));

vi.mock('../locale-storage-maintenance-validation', () => ({
  LocaleValidationManager: {
    validateStorageIntegrity: vi.fn(),
    fixSyncIssues: vi.fn(),
    getValidationSummary: vi.fn(),
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

function createValidHistory(count = 5) {
  const detections = Array.from({ length: count }, (_, i) => ({
    locale: i % 2 === 0 ? 'en' : 'zh',
    source: 'browser',
    timestamp: Date.now() - i * 1000,
    confidence: 0.8,
  }));

  return {
    detections,
    history: detections,
    lastUpdated: Date.now(),
    totalDetections: count,
  };
}

function setupSuccessfulMocks() {
  vi.mocked(LocaleCleanupManager.cleanupExpiredDetections).mockReturnValue({
    success: true,
    timestamp: Date.now(),
    data: 5,
  });
  vi.mocked(LocaleCleanupManager.cleanupDuplicateDetections).mockReturnValue({
    success: true,
    timestamp: Date.now(),
    data: 3,
  });
  vi.mocked(LocaleCleanupManager.cleanupInvalidPreferences).mockReturnValue({
    success: true,
    timestamp: Date.now(),
    data: 2,
  });
  vi.mocked(LocaleValidationManager.validateStorageIntegrity).mockReturnValue({
    success: true,
    timestamp: Date.now(),
  });
  vi.mocked(LocaleValidationManager.fixSyncIssues).mockReturnValue({
    success: true,
    timestamp: Date.now(),
  });
  vi.mocked(LocalStorageManager.get).mockReturnValue(null);
  vi.mocked(LocalStorageManager.set).mockReturnValue(undefined);
}

describe('LocaleMaintenanceOperationsManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));
    vi.clearAllMocks();
    setupSuccessfulMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('performMaintenance', () => {
    it('should perform all maintenance tasks by default', () => {
      const result = LocaleMaintenanceOperationsManager.performMaintenance();

      expect(result.success).toBe(true);
      expect(result.data?.totalOperations).toBe(6); // All 6 tasks enabled by default
      expect(result.data?.successfulOperations).toBe(6);
      expect(LocaleCleanupManager.cleanupExpiredDetections).toHaveBeenCalled();
      expect(
        LocaleCleanupManager.cleanupDuplicateDetections,
      ).toHaveBeenCalled();
      expect(LocaleCleanupManager.cleanupInvalidPreferences).toHaveBeenCalled();
      expect(
        LocaleValidationManager.validateStorageIntegrity,
      ).toHaveBeenCalled();
      expect(LocaleValidationManager.fixSyncIssues).toHaveBeenCalled();
    });

    it('should respect disabled options', () => {
      const result = LocaleMaintenanceOperationsManager.performMaintenance({
        cleanupExpired: false,
        cleanupDuplicates: false,
        cleanupInvalid: false,
        validateData: true,
        fixSyncIssues: true,
        compactStorage: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.totalOperations).toBe(3);
      expect(
        LocaleCleanupManager.cleanupExpiredDetections,
      ).not.toHaveBeenCalled();
      expect(
        LocaleCleanupManager.cleanupDuplicateDetections,
      ).not.toHaveBeenCalled();
      expect(
        LocaleCleanupManager.cleanupInvalidPreferences,
      ).not.toHaveBeenCalled();
    });

    it('should handle partial failures', () => {
      vi.mocked(
        LocaleValidationManager.validateStorageIntegrity,
      ).mockReturnValue({
        success: false,
        error: 'Validation failed',
        timestamp: Date.now(),
      });

      const result = LocaleMaintenanceOperationsManager.performMaintenance();

      expect(result.success).toBe(false);
      expect(result.data?.successfulOperations).toBeLessThan(
        result.data?.totalOperations ?? 0,
      );
      expect(result.error).toContain('维护完成');
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(
        LocaleCleanupManager.cleanupExpiredDetections,
      ).mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      const result = LocaleMaintenanceOperationsManager.performMaintenance();

      expect(result.success).toBe(false);
      expect(result.error).toContain('执行维护失败');
    });

    it('should use custom maxDetectionAge', () => {
      const customAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      LocaleMaintenanceOperationsManager.performMaintenance({
        cleanupExpired: true,
        maxDetectionAge: customAge,
      });

      expect(
        LocaleCleanupManager.cleanupExpiredDetections,
      ).toHaveBeenCalledWith(customAge);
    });

    it('should include result messages for each task', () => {
      const result = LocaleMaintenanceOperationsManager.performMaintenance();

      expect(result.data?.results).toHaveLength(6);
      expect(result.data?.results.some((r) => r.includes('清理过期记录'))).toBe(
        true,
      );
      expect(result.data?.results.some((r) => r.includes('清理重复记录'))).toBe(
        true,
      );
    });
  });

  describe('compactStorage', () => {
    it('should compact all existing storage items', () => {
      const preference = createValidPreference();
      const history = createValidHistory();

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return preference;
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      const result = LocaleMaintenanceOperationsManager.compactStorage();

      expect(result.success).toBe(true);
      expect((result.data as CompactResult | undefined)?.compactedItems).toBe(
        2,
      );
      expect(LocalStorageManager.set).toHaveBeenCalledTimes(2);
    });

    it('should return success when no data exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = LocaleMaintenanceOperationsManager.compactStorage();

      expect(result.success).toBe(true);
      expect((result.data as CompactResult | undefined)?.compactedItems).toBe(
        0,
      );
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = LocaleMaintenanceOperationsManager.compactStorage();

      expect(result.success).toBe(false);
      expect(result.error).toContain('压缩存储失败');
    });
  });

  describe('optimizeDetectionHistory', () => {
    it('should return success when no history exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.optimizeDetectionHistory();

      expect(result.success).toBe(true);
      expect(result.error).toContain('没有检测历史数据');
    });

    it('should return success when detections is not an array', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue({
        detections: 'invalid',
      });

      const result =
        LocaleMaintenanceOperationsManager.optimizeDetectionHistory();

      expect(result.success).toBe(true);
      expect(result.error).toContain('没有检测历史数据');
    });

    it('should not modify history when under 100 records', () => {
      const history = createValidHistory(50);
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const result =
        LocaleMaintenanceOperationsManager.optimizeDetectionHistory();

      expect(result.success).toBe(true);
      expect((result.data as OptimizeResult | undefined)?.removedCount).toBe(0);
      expect((result.data as OptimizeResult | undefined)?.remainingCount).toBe(
        50,
      );
    });

    it('should trim history to 100 records when exceeding limit', () => {
      const history = createValidHistory(150);
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      const result =
        LocaleMaintenanceOperationsManager.optimizeDetectionHistory();

      expect(result.success).toBe(true);
      expect((result.data as OptimizeResult | undefined)?.removedCount).toBe(
        50,
      );
      expect((result.data as OptimizeResult | undefined)?.remainingCount).toBe(
        100,
      );
      expect(LocalStorageManager.set).toHaveBeenCalled();
    });

    it('should sort detections by timestamp (newest first)', () => {
      const history = createValidHistory(120);
      vi.mocked(LocalStorageManager.get).mockReturnValue(history);

      LocaleMaintenanceOperationsManager.optimizeDetectionHistory();

      const setCalls = vi.mocked(LocalStorageManager.set).mock.calls;
      expect(setCalls.length).toBeGreaterThan(0);

      const savedHistory = setCalls[0]![1] as {
        detections: Array<{ timestamp: number }>;
      };
      // Check that detections are sorted by timestamp descending
      for (let i = 1; i < savedHistory.detections.length; i++) {
        expect(
          savedHistory.detections[i - 1]!.timestamp,
        ).toBeGreaterThanOrEqual(savedHistory.detections[i]!.timestamp);
      }
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result =
        LocaleMaintenanceOperationsManager.optimizeDetectionHistory();

      expect(result.success).toBe(false);
      expect(result.error).toContain('优化检测历史失败');
    });
  });

  describe('rebuildStorageIndex', () => {
    it('should rebuild preference data index', () => {
      const preference = createValidPreference();
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return preference;
        return null;
      });

      const result = LocaleMaintenanceOperationsManager.rebuildStorageIndex();

      expect(result.success).toBe(true);
      expect((result.data as RebuildResult | undefined)?.rebuiltItems).toBe(1);
      expect((result.data as RebuildResult | undefined)?.actions).toContain(
        '重建偏好数据索引',
      );
    });

    it('should rebuild history data index', () => {
      const history = createValidHistory(10);
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      const result = LocaleMaintenanceOperationsManager.rebuildStorageIndex();

      expect(result.success).toBe(true);
      expect((result.data as RebuildResult | undefined)?.rebuiltItems).toBe(1);
      expect((result.data as RebuildResult | undefined)?.actions).toContain(
        '重建历史数据索引',
      );
    });

    it('should rebuild both preference and history', () => {
      const preference = {
        ...createValidPreference(),
        metadata: { extra: 'data' },
      };
      const history = createValidHistory(5);

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_PREFERENCE) return preference;
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      const result = LocaleMaintenanceOperationsManager.rebuildStorageIndex();

      expect(result.success).toBe(true);
      expect((result.data as RebuildResult | undefined)?.rebuiltItems).toBe(2);
    });

    it('should filter out invalid detections', () => {
      const history = {
        detections: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: Date.now(),
            confidence: 0.8,
          },
          {
            locale: null,
            source: 'browser',
            timestamp: Date.now(),
            confidence: 0.8,
          }, // Invalid
          {
            locale: 'zh',
            source: null,
            timestamp: Date.now(),
            confidence: 0.8,
          }, // Invalid
          {
            locale: 'fr',
            source: 'user',
            timestamp: Date.now() - 1000,
            confidence: 0.9,
          },
        ],
        lastUpdated: Date.now(),
      };

      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      LocaleMaintenanceOperationsManager.rebuildStorageIndex();

      const setCalls = vi.mocked(LocalStorageManager.set).mock.calls;
      const savedHistory = setCalls[0]![1] as { detections: Array<unknown> };
      expect(savedHistory.detections.length).toBe(2); // Only valid detections
    });

    it('should return success with 0 items when no data exists', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result = LocaleMaintenanceOperationsManager.rebuildStorageIndex();

      expect(result.success).toBe(true);
      expect((result.data as RebuildResult | undefined)?.rebuiltItems).toBe(0);
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocalStorageManager.get).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = LocaleMaintenanceOperationsManager.rebuildStorageIndex();

      expect(result.success).toBe(false);
      expect(result.error).toContain('重建存储索引失败');
    });
  });

  describe('performDeepMaintenance', () => {
    it('should execute all deep maintenance tasks', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.performDeepMaintenance();

      expect(result.success).toBe(true);
      expect(
        (result.data as MaintenanceResult | undefined)?.totalOperations,
      ).toBe(3);
      expect(
        (result.data as MaintenanceResult | undefined)?.successfulOperations,
      ).toBe(3);
    });

    it('should handle partial task failures', () => {
      vi.mocked(
        LocaleValidationManager.validateStorageIntegrity,
      ).mockReturnValue({
        success: false,
        error: 'Validation failed',
        timestamp: Date.now(),
      });

      const result =
        LocaleMaintenanceOperationsManager.performDeepMaintenance();

      expect(result.success).toBe(false);
      expect(
        (result.data as MaintenanceResult | undefined)?.successfulOperations,
      ).toBeLessThan(3);
    });

    it('should include result messages for each task', () => {
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.performDeepMaintenance();

      expect((result.data as MaintenanceResult | undefined)?.results).toContain(
        '标准维护完成',
      );
      expect((result.data as MaintenanceResult | undefined)?.results).toContain(
        '优化历史完成',
      );
      expect((result.data as MaintenanceResult | undefined)?.results).toContain(
        '重建索引完成',
      );
    });
  });

  describe('getMaintenanceRecommendations', () => {
    it('should return good status when no issues', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 0,
        expiredDetections: 0,
        duplicateDetections: 0,
        invalidPreferences: 0,
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 6,
        invalidKeys: 0,
        warningKeys: 0,
        syncIssues: 0,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(result.priority).toBe('low');
      expect(result.recommendations).toContain('存储状态良好，无需特殊维护');
    });

    it('should recommend cleanup for expired detections', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 60,
        expiredDetections: 60, // > 50
        duplicateDetections: 0,
        invalidPreferences: 0,
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 6,
        invalidKeys: 0,
        warningKeys: 0,
        syncIssues: 0,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(
        result.recommendations.some((r) => r.includes('过期检测记录')),
      ).toBe(true);
      expect(result.priority).toBe('medium');
    });

    it('should recommend cleanup for duplicate detections', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 15,
        expiredDetections: 0,
        duplicateDetections: 15, // > 10
        invalidPreferences: 0,
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 6,
        invalidKeys: 0,
        warningKeys: 0,
        syncIssues: 0,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(
        result.recommendations.some((r) => r.includes('重复检测记录')),
      ).toBe(true);
    });

    it('should set high priority for invalid preferences', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 3,
        expiredDetections: 0,
        duplicateDetections: 0,
        invalidPreferences: 3,
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 6,
        invalidKeys: 0,
        warningKeys: 0,
        syncIssues: 0,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(result.priority).toBe('high');
      expect(
        result.recommendations.some((r) => r.includes('无效偏好数据')),
      ).toBe(true);
    });

    it('should recommend fixing invalid keys', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 0,
        expiredDetections: 0,
        duplicateDetections: 0,
        invalidPreferences: 0,
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 4,
        invalidKeys: 2,
        warningKeys: 0,
        syncIssues: 0,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(result.priority).toBe('high');
      expect(result.recommendations.some((r) => r.includes('无效数据'))).toBe(
        true,
      );
    });

    it('should recommend fixing sync issues', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 0,
        expiredDetections: 0,
        duplicateDetections: 0,
        invalidPreferences: 0,
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 6,
        invalidKeys: 0,
        warningKeys: 0,
        syncIssues: 3,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(result.recommendations.some((r) => r.includes('同步问题'))).toBe(
        true,
      );
    });

    it('should recommend history optimization when records exceed limit', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 0,
        expiredDetections: 0,
        duplicateDetections: 0,
        invalidPreferences: 0,
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 6,
        invalidKeys: 0,
        warningKeys: 0,
        syncIssues: 0,
      });

      const history = createValidHistory(250); // > 200
      vi.mocked(LocalStorageManager.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.LOCALE_DETECTION_HISTORY) return history;
        return null;
      });

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(
        result.recommendations.some((r) => r.includes('优化检测历史')),
      ).toBe(true);
    });

    it('should estimate time based on priority', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockReturnValue({
        totalItems: 5,
        expiredDetections: 0,
        duplicateDetections: 0,
        invalidPreferences: 5, // High priority trigger
      } as CleanupStats);
      vi.mocked(LocaleValidationManager.getValidationSummary).mockReturnValue({
        totalKeys: 6,
        validKeys: 6,
        invalidKeys: 0,
        warningKeys: 0,
        syncIssues: 0,
      });
      vi.mocked(LocalStorageManager.get).mockReturnValue(null);

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(result.estimatedTime).toBe('2-5分钟');
    });

    it('should handle exceptions gracefully', () => {
      vi.mocked(LocaleCleanupManager.getCleanupStats).mockImplementation(() => {
        throw new Error('Stats error');
      });

      const result =
        LocaleMaintenanceOperationsManager.getMaintenanceRecommendations();

      expect(result.priority).toBe('medium');
      expect(result.recommendations).toContain(
        '获取维护建议时出错，建议执行基础维护',
      );
    });
  });
});
