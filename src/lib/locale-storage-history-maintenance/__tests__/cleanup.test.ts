/**
 * Unit tests for cleanup module
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupDuplicateDetections,
  cleanupExpiredDetections,
  clearAllHistory,
  limitHistorySize,
} from '../cleanup';

// Mock dependencies
const mockGetDetectionHistory = vi.fn();
const mockCreateDefaultHistory = vi.fn();
const mockClearCache = vi.fn();
const mockLocalStorageSet = vi.fn();

vi.mock('@/lib/locale-storage-history-core', () => ({
  getDetectionHistory: () => mockGetDetectionHistory(),
  createDefaultHistory: () => mockCreateDefaultHistory(),
  HistoryCacheManager: {
    clearCache: () => mockClearCache(),
  },
}));

vi.mock('@/lib/locale-storage-local', () => ({
  LocalStorageManager: {
    set: (key: string, value: unknown) => mockLocalStorageSet(key, value),
  },
}));

function createMockHistory(
  recordCount: number,
  options: { expired?: boolean; duplicate?: boolean } = {},
) {
  const now = Date.now();
  const records = Array.from({ length: recordCount }, (_, i) => ({
    locale: options.duplicate ? 'en' : i % 2 === 0 ? 'en' : 'zh',
    source: options.duplicate ? 'browser' : 'browser',
    timestamp: options.duplicate
      ? now - 1000
      : options.expired
        ? now - 60 * 24 * 60 * 60 * 1000 // 60 days ago
        : now - i * 1000,
    confidence: options.duplicate ? 0.9 : 0.9,
  }));

  return {
    history: records,
    lastUpdated: now,
  };
}

describe('cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateDefaultHistory.mockReturnValue({
      history: [],
      lastUpdated: Date.now(),
    });
  });

  describe('cleanupExpiredDetections', () => {
    it('should remove expired records', () => {
      const history = createMockHistory(5, { expired: true });
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
      });

      const result = cleanupExpiredDetections(30 * 24 * 60 * 60 * 1000);

      expect(result.success).toBe(true);
      expect(result.data).toBe(5);
      expect(mockClearCache).toHaveBeenCalled();
    });

    it('should return 0 when no expired records', () => {
      const history = createMockHistory(3);
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
      });

      const result = cleanupExpiredDetections();

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should handle history fetch failure', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: false,
        error: 'Failed',
      });

      const result = cleanupExpiredDetections();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get detection history');
    });

    it('should handle exceptions', () => {
      mockGetDetectionHistory.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = cleanupExpiredDetections();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });

  describe('cleanupDuplicateDetections', () => {
    it('should remove duplicate records', () => {
      const history = createMockHistory(5, { duplicate: true });
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
      });

      const result = cleanupDuplicateDetections();

      expect(result.success).toBe(true);
      expect(result.data).toBe(4); // 5 duplicates -> 1 unique
      expect(mockClearCache).toHaveBeenCalled();
    });

    it('should return 0 when no duplicates', () => {
      const history = createMockHistory(3);
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
      });

      const result = cleanupDuplicateDetections();

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should handle history fetch failure', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: false,
      });

      const result = cleanupDuplicateDetections();

      expect(result.success).toBe(false);
    });

    it('should handle exceptions', () => {
      mockGetDetectionHistory.mockImplementation(() => {
        throw new Error('Error');
      });

      const result = cleanupDuplicateDetections();

      expect(result.success).toBe(false);
    });
  });

  describe('limitHistorySize', () => {
    it('should limit history to max records', () => {
      const history = createMockHistory(150);
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
      });

      const result = limitHistorySize(100);

      expect(result.success).toBe(true);
      expect(result.data).toBe(50);
      expect(mockClearCache).toHaveBeenCalled();
    });

    it('should return 0 when under limit', () => {
      const history = createMockHistory(50);
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: history,
      });

      const result = limitHistorySize(100);

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should handle history fetch failure', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: false,
      });

      const result = limitHistorySize();

      expect(result.success).toBe(false);
    });

    it('should handle exceptions', () => {
      mockGetDetectionHistory.mockImplementation(() => {
        throw new Error('Error');
      });

      const result = limitHistorySize();

      expect(result.success).toBe(false);
    });
  });

  describe('clearAllHistory', () => {
    it('should clear all history', () => {
      const result = clearAllHistory();

      expect(result.success).toBe(true);
      expect(mockLocalStorageSet).toHaveBeenCalledWith(
        'locale_detection_history',
        expect.any(Object),
      );
      expect(mockClearCache).toHaveBeenCalled();
    });

    it('should handle exceptions', () => {
      mockLocalStorageSet.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = clearAllHistory();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage error');
    });
  });
});
