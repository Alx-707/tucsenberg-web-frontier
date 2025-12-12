/**
 * Unit tests for import-export module
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/types/i18n';
import type {
  LocaleDetectionHistory,
  LocaleDetectionRecord,
  LocaleSource,
} from '@/lib/locale-storage-types';
import {
  exportHistory,
  exportHistoryAsJson,
  importHistory,
  importHistoryFromJson,
} from '../import-export';

// Mock dependencies
const mockGetDetectionHistory = vi.fn();
const mockValidateHistoryData = vi.fn();
const mockClearCache = vi.fn();
const mockLocalStorageSet = vi.fn();

vi.mock('@/lib/locale-storage-history-core', () => ({
  getDetectionHistory: () => mockGetDetectionHistory(),
  validateHistoryData: (data: unknown) => mockValidateHistoryData(data),
  HistoryCacheManager: {
    clearCache: () => mockClearCache(),
  },
}));

vi.mock('@/lib/locale-storage-local', () => ({
  LocalStorageManager: {
    set: (key: string, value: unknown) => mockLocalStorageSet(key, value),
  },
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

describe('import-export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportHistory', () => {
    it('should export history successfully', () => {
      const history = createValidHistory();
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
        source: 'localStorage',
        timestamp: Date.now(),
      });

      const result = exportHistory();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(history);
    });

    it('should return failure when history not available', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: false,
        error: 'No history found',
        timestamp: Date.now(),
      });

      const result = exportHistory();

      expect(result.success).toBe(false);
    });
  });

  describe('exportHistoryAsJson', () => {
    it('should export history as JSON string', () => {
      const history = createValidHistory();
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: 10,
      });

      const result = exportHistoryAsJson();

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(JSON.parse(result.data!)).toEqual(history);
    });

    it('should return failure when export fails', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: false,
        error: 'Export failed',
        timestamp: Date.now(),
      });

      const result = exportHistoryAsJson();

      expect(result.success).toBe(false);
    });

    it('should handle JSON stringify error', () => {
      const circularRef: Record<string, unknown> = { value: 'test' };
      circularRef.self = circularRef;

      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: circularRef,
        timestamp: Date.now(),
      });

      const result = exportHistoryAsJson();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('importHistory', () => {
    it('should import valid history', () => {
      const history = createValidHistory();
      mockValidateHistoryData.mockReturnValue(true);

      const result = importHistory(history);

      expect(result.success).toBe(true);
      expect(mockLocalStorageSet).toHaveBeenCalledWith(
        'locale_detection_history',
        expect.objectContaining({ history: history.history }),
      );
      expect(mockClearCache).toHaveBeenCalled();
    });

    it('should reject invalid history data', () => {
      mockValidateHistoryData.mockReturnValue(false);

      const result = importHistory({
        detections: [],
        history: [],
        lastUpdated: 0,
        totalDetections: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid history data format');
    });

    it('should handle storage error', () => {
      const history = createValidHistory();
      mockValidateHistoryData.mockReturnValue(true);
      mockLocalStorageSet.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const result = importHistory(history);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage full');
    });
  });

  describe('importHistoryFromJson', () => {
    it('should import history from valid JSON', () => {
      const history = createValidHistory();
      mockValidateHistoryData.mockReturnValue(true);

      const result = importHistoryFromJson(JSON.stringify(history));

      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const result = importHistoryFromJson('invalid-json{');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject valid JSON with invalid data', () => {
      mockValidateHistoryData.mockReturnValue(false);

      const result = importHistoryFromJson('{"history": []}');

      expect(result.success).toBe(false);
    });
  });
});
