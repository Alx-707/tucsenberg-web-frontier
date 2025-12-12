/**
 * Unit tests for backup module
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/types/i18n';
import type {
  LocaleDetectionHistory,
  LocaleDetectionRecord,
  LocaleSource,
} from '@/lib/locale-storage-types';
import { createBackup, restoreFromBackup } from '../backup';

// Mock dependencies
const mockExportHistory = vi.fn();
const mockImportHistory = vi.fn();

vi.mock('@/lib/locale-storage-history-maintenance/import-export', () => ({
  exportHistory: () => mockExportHistory(),
  importHistory: (data: unknown) => mockImportHistory(data),
}));

function createValidHistory(): LocaleDetectionHistory {
  const detections: LocaleDetectionRecord[] = [
    {
      locale: 'en' as Locale,
      source: 'browser' as LocaleSource,
      timestamp: Date.now() - 1000,
      confidence: 0.9,
    },
  ];
  return {
    detections,
    history: detections,
    lastUpdated: Date.now() - 500,
    totalDetections: detections.length,
  };
}

describe('backup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBackup', () => {
    it('should create backup successfully', () => {
      const history = createValidHistory();
      mockExportHistory.mockReturnValue({
        success: true,
        data: history,
        timestamp: Date.now(),
      });

      const result = createBackup();

      expect(result.success).toBe(true);
      expect(result.data?.backup).toEqual(history);
      expect(result.data?.timestamp).toBeDefined();
      expect(result.data?.size).toBeGreaterThan(0);
    });

    it('should return failure when export fails', () => {
      mockExportHistory.mockReturnValue({
        success: false,
        error: 'Export failed',
        timestamp: Date.now(),
      });

      const result = createBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Export failed');
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore backup successfully', () => {
      const history = createValidHistory();
      mockImportHistory.mockReturnValue({
        success: true,
        data: history,
        timestamp: Date.now(),
      });

      const result = restoreFromBackup(history);

      expect(result.success).toBe(true);
      expect(mockImportHistory).toHaveBeenCalledWith(history);
    });

    it('should return failure when import fails', () => {
      const history = createValidHistory();
      mockImportHistory.mockReturnValue({
        success: false,
        error: 'Import failed',
        timestamp: Date.now(),
      });

      const result = restoreFromBackup(history);

      expect(result.success).toBe(false);
    });
  });
});
