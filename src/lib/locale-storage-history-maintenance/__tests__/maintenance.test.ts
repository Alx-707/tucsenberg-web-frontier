/**
 * Unit tests for maintenance module
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getMaintenanceRecommendations,
  performMaintenance,
} from '../maintenance';

// Mock dependencies
const mockGetDetectionHistory = vi.fn();
const mockCleanupExpiredDetections = vi.fn();
const mockCleanupDuplicateDetections = vi.fn();
const mockLimitHistorySize = vi.fn();

vi.mock('@/lib/locale-storage-history-core', () => ({
  getDetectionHistory: () => mockGetDetectionHistory(),
}));

vi.mock('@/lib/locale-storage-history-maintenance/cleanup', () => ({
  cleanupExpiredDetections: (maxAge?: number) =>
    mockCleanupExpiredDetections(maxAge),
  cleanupDuplicateDetections: () => mockCleanupDuplicateDetections(),
  limitHistorySize: (maxRecords?: number) => mockLimitHistorySize(maxRecords),
}));

function createMockHistory(
  recordCount: number,
  options: { expired?: boolean; invalid?: boolean; duplicate?: boolean } = {},
) {
  const now = Date.now();
  const records = Array.from({ length: recordCount }, (_, i) => ({
    locale: options.invalid && i === 0 ? '' : i % 2 === 0 ? 'en' : 'zh',
    source: options.invalid && i === 0 ? '' : 'browser',
    timestamp:
      options.expired && i === 0
        ? now - 60 * 24 * 60 * 60 * 1000
        : options.duplicate
          ? now - 1000
          : now - i * 1000,
    confidence: options.invalid && i === 0 ? -1 : 0.9,
  }));

  return {
    history: records,
    lastUpdated: now,
  };
}

describe('maintenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks
    mockCleanupExpiredDetections.mockReturnValue({ success: true, data: 0 });
    mockCleanupDuplicateDetections.mockReturnValue({ success: true, data: 0 });
    mockLimitHistorySize.mockReturnValue({ success: true, data: 0 });
    mockGetDetectionHistory.mockReturnValue({
      success: true,
      data: createMockHistory(10),
    });
  });

  describe('performMaintenance', () => {
    it('should perform all maintenance tasks', () => {
      mockCleanupExpiredDetections.mockReturnValue({ success: true, data: 5 });
      mockCleanupDuplicateDetections.mockReturnValue({
        success: true,
        data: 3,
      });
      mockLimitHistorySize.mockReturnValue({ success: true, data: 2 });

      const result = performMaintenance({});

      expect(result.success).toBe(true);
      expect(result.data?.expiredRemoved).toBe(5);
      expect(result.data?.duplicatesRemoved).toBe(3);
      expect(result.data?.sizeReduced).toBe(2);
    });

    it('should skip expired cleanup when disabled', () => {
      const result = performMaintenance({ cleanupExpired: false });

      expect(result.success).toBe(true);
      expect(result.data?.expiredRemoved).toBe(0);
      expect(mockCleanupExpiredDetections).not.toHaveBeenCalled();
    });

    it('should skip duplicate cleanup when disabled', () => {
      const result = performMaintenance({ removeDuplicates: false });

      expect(result.success).toBe(true);
      expect(result.data?.duplicatesRemoved).toBe(0);
      expect(mockCleanupDuplicateDetections).not.toHaveBeenCalled();
    });

    it('should skip size limit when disabled', () => {
      const result = performMaintenance({ limitSize: false });

      expect(result.success).toBe(true);
      expect(result.data?.sizeReduced).toBe(0);
      expect(mockLimitHistorySize).not.toHaveBeenCalled();
    });

    it('should pass custom maxAge to expired cleanup', () => {
      performMaintenance({ maxAge: 7 * 24 * 60 * 60 * 1000 });

      expect(mockCleanupExpiredDetections).toHaveBeenCalledWith(
        7 * 24 * 60 * 60 * 1000,
      );
    });

    it('should pass custom maxRecords to size limit', () => {
      performMaintenance({ maxRecords: 50 });

      expect(mockLimitHistorySize).toHaveBeenCalledWith(50);
    });

    it('should handle exceptions', () => {
      mockCleanupExpiredDetections.mockImplementation(() => {
        throw new Error('Cleanup error');
      });

      const result = performMaintenance({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cleanup error');
    });
  });

  describe('getMaintenanceRecommendations', () => {
    it('should return no recommendations when history is healthy', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: createMockHistory(10),
      });

      const result = getMaintenanceRecommendations();

      expect(result.urgency).toBe('low');
      expect(result.recommendations).toContain('历史记录状态良好，无需维护');
    });

    it('should recommend cleanup for high record count', () => {
      // 35 > 30 (maxRecords) but < 45 (maxRecords * 1.5) triggers "较多"
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: createMockHistory(35),
      });

      const result = getMaintenanceRecommendations();

      expect(result.recommendations.some((r) => r.includes('较多'))).toBe(true);
    });

    it('should recommend cleanup for very high record count', () => {
      // 60 > 45 (30 * 1.5) triggers "过多" and urgency: high
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: createMockHistory(60),
      });

      const result = getMaintenanceRecommendations();

      expect(result.urgency).toBe('high');
      expect(result.recommendations.some((r) => r.includes('过多'))).toBe(true);
    });

    it('should recommend cleanup for expired records', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: createMockHistory(5, { expired: true }),
      });

      const result = getMaintenanceRecommendations();

      expect(result.recommendations.some((r) => r.includes('过期'))).toBe(true);
    });

    it('should recommend cleanup for duplicate records', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: createMockHistory(5, { duplicate: true }),
      });

      const result = getMaintenanceRecommendations();

      expect(result.recommendations.some((r) => r.includes('重复'))).toBe(true);
    });

    it('should recommend cleanup for invalid records', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: true,
        data: createMockHistory(5, { invalid: true }),
      });

      const result = getMaintenanceRecommendations();

      expect(result.urgency).toBe('high');
      expect(result.recommendations.some((r) => r.includes('无效'))).toBe(true);
    });

    it('should return high urgency when history fetch fails', () => {
      mockGetDetectionHistory.mockReturnValue({
        success: false,
        error: 'Failed',
      });

      const result = getMaintenanceRecommendations();

      expect(result.urgency).toBe('high');
      expect(result.recommendations.some((r) => r.includes('无法获取'))).toBe(
        true,
      );
    });
  });
});
