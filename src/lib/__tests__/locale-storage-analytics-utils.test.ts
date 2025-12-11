import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStorageStats,
  performHealthCheck,
} from '@/lib/locale-storage-analytics-core';
import {
  AccessLogger,
  ErrorLogger,
} from '@/lib/locale-storage-analytics-events';
import {
  CacheManager,
  compressAnalyticsData,
  exportAnalyticsData,
  exportAnalyticsDataAsCsv,
  exportAnalyticsDataAsJson,
  formatByteSize,
  formatDuration,
  formatPercentage,
  generateUniqueId,
  optimizeAnalyticsStorage,
  validateAnalyticsData,
} from '../locale-storage-analytics-utils';

// Mock dependencies
vi.mock('@/lib/locale-storage-analytics-core', () => ({
  getStorageStats: vi.fn(() => ({
    success: true,
    data: {
      totalEntries: 3,
      totalSize: 2048,
      lastAccessed: Date.now(),
      lastModified: Date.now(),
      accessCount: 5,
      errorCount: 1,
      freshness: 0.9,
      hasOverride: false,
      historyStats: {
        totalEntries: 5,
        uniqueLocales: 2,
        oldestEntry: Date.now() - 1000,
        newestEntry: Date.now(),
      },
    },
  })),
  performHealthCheck: vi.fn(() => ({
    success: true,
    data: {
      isHealthy: true,
      status: 'healthy',
      issues: [],
      performance: {
        readLatency: 0,
        writeLatency: 0,
        errorRate: 0,
        availability: 1,
      },
      storage: {
        used: 2048,
        available: 5 * 1024 * 1024 - 2048,
        quota: 5 * 1024 * 1024,
        utilization: 2048 / (5 * 1024 * 1024),
      },
      lastCheck: Date.now(),
    },
  })),
}));

vi.mock('@/lib/locale-storage-analytics-events', () => ({
  AccessLogger: {
    getAccessLog: vi.fn(() => []),
    clearAccessLog: vi.fn(),
    logAccess: vi.fn(),
  },
  ErrorLogger: {
    getErrorLog: vi.fn(() => []),
    clearErrorLog: vi.fn(),
    logError: vi.fn(),
  },
}));

vi.mock('@/lib/locale-storage-analytics-performance', () => ({
  getUsagePatterns: vi.fn(() => ({
    peakHours: [9, 10, 14],
    averageDailyOperations: 50,
    mostUsedKeys: ['pref', 'history'],
  })),
  getPerformanceMetrics: vi.fn(() => ({
    averageReadTime: 5,
    averageWriteTime: 10,
    cacheHitRate: 0.9,
  })),
  getUsageTrends: vi.fn(() => ({
    dailyOperations: [
      { date: '2025-02-01', operations: 100 },
      { date: '2025-02-02', operations: 120 },
    ],
    weeklyGrowth: 0.1,
  })),
}));

describe('locale-storage-analytics-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-01T00:00:00Z'));
    vi.clearAllMocks();
    CacheManager.invalidateCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('CacheManager', () => {
    describe('getCachedMetrics', () => {
      it('should return null when cache is empty', () => {
        const result = CacheManager.getCachedMetrics('test-key');

        expect(result).toBeNull();
      });

      it('should return cached data when valid', () => {
        const data = { value: 'test' };
        CacheManager.setCachedMetrics('test-key', data);

        const result = CacheManager.getCachedMetrics('test-key');

        expect(result).toEqual(data);
      });

      it('should return null when cache is expired', () => {
        CacheManager.setCachedMetrics('test-key', { value: 'test' });

        // Advance time beyond TTL (5 minutes)
        vi.setSystemTime(new Date('2025-02-01T00:06:00Z'));

        const result = CacheManager.getCachedMetrics('test-key');

        expect(result).toBeNull();
      });
    });

    describe('setCachedMetrics', () => {
      it('should store data with timestamp', () => {
        CacheManager.setCachedMetrics('test-key', { value: 'test' });

        const stats = CacheManager.getCacheStats();

        expect(stats.totalEntries).toBe(1);
      });

      it('should overwrite existing entry', () => {
        CacheManager.setCachedMetrics('test-key', { value: 'old' });
        CacheManager.setCachedMetrics('test-key', { value: 'new' });

        const result = CacheManager.getCachedMetrics('test-key');

        expect(result).toEqual({ value: 'new' });
      });
    });

    describe('invalidateCache', () => {
      it('should remove specific key', () => {
        CacheManager.setCachedMetrics('key1', { value: 1 });
        CacheManager.setCachedMetrics('key2', { value: 2 });

        CacheManager.invalidateCache('key1');

        expect(CacheManager.getCachedMetrics('key1')).toBeNull();
        expect(CacheManager.getCachedMetrics('key2')).toEqual({ value: 2 });
      });

      it('should clear all cache when no key specified', () => {
        CacheManager.setCachedMetrics('key1', { value: 1 });
        CacheManager.setCachedMetrics('key2', { value: 2 });

        CacheManager.invalidateCache();

        expect(CacheManager.getCachedMetrics('key1')).toBeNull();
        expect(CacheManager.getCachedMetrics('key2')).toBeNull();
      });
    });

    describe('cleanExpiredCache', () => {
      it('should remove expired entries', () => {
        CacheManager.setCachedMetrics('old-key', { value: 'old' });

        // Advance time beyond TTL
        vi.setSystemTime(new Date('2025-02-01T00:06:00Z'));

        CacheManager.setCachedMetrics('new-key', { value: 'new' });
        CacheManager.cleanExpiredCache();

        expect(CacheManager.getCachedMetrics('old-key')).toBeNull();
        expect(CacheManager.getCachedMetrics('new-key')).toEqual({
          value: 'new',
        });
      });

      it('should keep valid entries', () => {
        CacheManager.setCachedMetrics('key', { value: 'test' });

        CacheManager.cleanExpiredCache();

        expect(CacheManager.getCachedMetrics('key')).toEqual({ value: 'test' });
      });
    });

    describe('getCacheStats', () => {
      it('should return stats for empty cache', () => {
        const stats = CacheManager.getCacheStats();

        expect(stats.totalEntries).toBe(0);
        expect(stats.validEntries).toBe(0);
        expect(stats.expiredEntries).toBe(0);
        expect(stats.hitRate).toBe(0);
      });

      it('should count valid and expired entries', () => {
        CacheManager.setCachedMetrics('old-key', { value: 'old' });

        // Advance time beyond TTL
        vi.setSystemTime(new Date('2025-02-01T00:06:00Z'));

        CacheManager.setCachedMetrics('new-key', { value: 'new' });

        const stats = CacheManager.getCacheStats();

        expect(stats.validEntries).toBe(1);
        expect(stats.expiredEntries).toBe(1);
      });

      it('should calculate hit rate', () => {
        CacheManager.setCachedMetrics('key', { value: 'test' });

        const stats = CacheManager.getCacheStats();

        expect(stats.hitRate).toBe(100);
      });

      it('should estimate memory usage', () => {
        CacheManager.setCachedMetrics('key', { value: 'test-data' });

        const stats = CacheManager.getCacheStats();

        expect(stats.memoryUsage).toBeGreaterThan(0);
      });
    });
  });

  describe('exportAnalyticsData', () => {
    it('should return complete export data', () => {
      const data = exportAnalyticsData();

      expect(data.stats).toBeDefined();
      expect(data.healthCheck).toBeDefined();
      expect(data.usagePatterns).toBeDefined();
      expect(data.performanceMetrics).toBeDefined();
      expect(data.usageTrends).toBeDefined();
      expect(data.accessLog).toBeDefined();
      expect(data.errorLog).toBeDefined();
      expect(data.exportTimestamp).toBeGreaterThan(0);
      expect(data.exportVersion).toBe('1.0.0');
    });

    it('should call dependency functions', () => {
      exportAnalyticsData();

      expect(getStorageStats).toHaveBeenCalled();
      expect(performHealthCheck).toHaveBeenCalled();
      expect(AccessLogger.getAccessLog).toHaveBeenCalledWith(100);
      expect(ErrorLogger.getErrorLog).toHaveBeenCalledWith(50);
    });
  });

  describe('exportAnalyticsDataAsJson', () => {
    it('should return valid JSON string', () => {
      const json = exportAnalyticsDataAsJson();

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include formatted output', () => {
      const json = exportAnalyticsDataAsJson();

      expect(json).toContain('\n');
    });
  });

  describe('exportAnalyticsDataAsCsv', () => {
    it('should return CSV formatted string', () => {
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue([
        {
          key: 'pref',
          operation: 'read',
          timestamp: Date.now(),
          success: true,
          responseTime: 10,
        },
      ]);
      vi.mocked(ErrorLogger.getErrorLog).mockReturnValue([
        {
          error: 'test',
          timestamp: Date.now(),
          context: 'ctx',
          severity: 'medium',
        },
      ]);

      const csv = exportAnalyticsDataAsCsv();

      expect(csv).toContain('=== Access Log ===');
      expect(csv).toContain('=== Error Log ===');
      expect(csv).toContain('=== Usage Trends ===');
      expect(csv).toContain('pref,read');
    });

    it('should handle empty logs', () => {
      const csv = exportAnalyticsDataAsCsv();

      expect(csv).toContain('=== Access Log ===');
    });
  });

  describe('validateAnalyticsData', () => {
    it('should return valid when data is complete', () => {
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue([
        {
          key: 'pref',
          operation: 'read',
          timestamp: Date.now(),
          success: true,
        },
      ]);

      const result = validateAnalyticsData();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect empty access log', () => {
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue([]);

      const result = validateAnalyticsData();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('访问日志为空');
      expect(result.recommendations).toContain(
        '开始记录存储操作以收集分析数据',
      );
    });

    it('should detect high error rate', () => {
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue([
        {
          key: 'pref',
          operation: 'read',
          timestamp: Date.now(),
          success: true,
        },
      ]);
      vi.mocked(ErrorLogger.getErrorLog).mockReturnValue([
        { error: 'e1', timestamp: Date.now(), severity: 'medium' },
        { error: 'e2', timestamp: Date.now(), severity: 'medium' },
      ]);

      const result = validateAnalyticsData();

      expect(result.issues).toContain('错误率过高');
    });

    it('should detect no recent activity', () => {
      const oldTimestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue([
        {
          key: 'pref',
          operation: 'read',
          timestamp: oldTimestamp,
          success: true,
        },
      ]);

      const result = validateAnalyticsData();

      expect(result.issues).toContain('最近一小时无活动记录');
    });

    it('should detect storage stats failure', () => {
      vi.mocked(getStorageStats).mockReturnValue({
        success: false,
        error: 'fail',
        timestamp: Date.now(),
      });

      const result = validateAnalyticsData();

      expect(result.issues).toContain('无法获取存储统计信息');
    });

    it('should detect health check failure', () => {
      vi.mocked(performHealthCheck).mockReturnValue({
        success: false,
        error: 'fail',
        timestamp: Date.now(),
      });

      const result = validateAnalyticsData();

      expect(result.issues).toContain('无法执行健康检查');
    });

    it('should recommend cache cleanup when many expired entries', () => {
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue([
        {
          key: 'pref',
          operation: 'read',
          timestamp: Date.now(),
          success: true,
        },
      ]);

      // Create expired cache entries
      CacheManager.setCachedMetrics('old1', { value: 1 });
      CacheManager.setCachedMetrics('old2', { value: 2 });

      vi.setSystemTime(new Date('2025-02-01T00:06:00Z'));

      const result = validateAnalyticsData();

      expect(result.recommendations).toContain('清理过期缓存以提高性能');
    });

    it('should handle validation errors', () => {
      vi.mocked(getStorageStats).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const result = validateAnalyticsData();

      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('数据验证过程中发生错误');
    });
  });

  describe('compressAnalyticsData', () => {
    it('should return compression info', () => {
      const result = compressAnalyticsData();

      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeDefined();
      expect(result.compressedData).toBeDefined();
    });

    it('should have valid compressed data', () => {
      const result = compressAnalyticsData();

      expect(() => JSON.parse(result.compressedData)).not.toThrow();
    });

    it('should calculate compression ratio', () => {
      const result = compressAnalyticsData();

      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('optimizeAnalyticsStorage', () => {
    it('should return optimization results', () => {
      const result = optimizeAnalyticsStorage();

      expect(result.beforeOptimization).toBeDefined();
      expect(result.afterOptimization).toBeDefined();
      expect(result.optimizationResults).toBeInstanceOf(Array);
    });

    it('should always clean expired cache and report result', () => {
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue([]);
      vi.mocked(ErrorLogger.getErrorLog).mockReturnValue([]);

      const result = optimizeAnalyticsStorage();

      // cleanExpiredCache() always returns true (after <= before is true when both are 0)
      // so it always adds '清理了过期缓存' and never reaches '无需优化，数据已处于最佳状态'
      expect(result.optimizationResults).toContain('清理了过期缓存');
    });

    it('should compress large access log', () => {
      const largeLog = Array.from({ length: 1100 }, (_, i) => ({
        key: `key-${i}`,
        operation: 'read',
        timestamp: Date.now() - i,
        success: true,
      }));
      vi.mocked(AccessLogger.getAccessLog).mockReturnValue(largeLog);

      const result = optimizeAnalyticsStorage();

      expect(
        result.optimizationResults.some((r) => r.includes('压缩访问日志')),
      ).toBe(true);
    });

    it('should compress large error log', () => {
      const largeLog = Array.from({ length: 600 }, (_, i) => ({
        error: `error-${i}`,
        timestamp: Date.now() - i,
        severity: 'medium' as const,
      }));
      vi.mocked(ErrorLogger.getErrorLog).mockReturnValue(largeLog);

      const result = optimizeAnalyticsStorage();

      expect(
        result.optimizationResults.some((r) => r.includes('压缩错误日志')),
      ).toBe(true);
    });

    it('should clean expired cache', () => {
      CacheManager.setCachedMetrics('old', { value: 1 });

      vi.setSystemTime(new Date('2025-02-01T00:06:00Z'));

      const result = optimizeAnalyticsStorage();

      expect(result.optimizationResults).toContain('清理了过期缓存');
    });
  });

  describe('formatByteSize', () => {
    it('should format bytes', () => {
      expect(formatByteSize(500)).toBe('500.00 B');
    });

    it('should format kilobytes', () => {
      expect(formatByteSize(1024)).toBe('1.00 KB');
    });

    it('should format megabytes', () => {
      expect(formatByteSize(1024 * 1024)).toBe('1.00 MB');
    });

    it('should format gigabytes', () => {
      expect(formatByteSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should handle zero', () => {
      expect(formatByteSize(0)).toBe('0.00 B');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5秒');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(65000)).toBe('1分钟 5秒');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3665000)).toBe('1小时 1分钟');
    });

    it('should format days and hours', () => {
      expect(formatDuration(90000000)).toBe('1天 1小时');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0秒');
    });
  });

  describe('formatPercentage', () => {
    it('should format with default decimals', () => {
      expect(formatPercentage(75.5)).toBe('75.5%');
    });

    it('should format with custom decimals', () => {
      expect(formatPercentage(75.555, 2)).toBe('75.56%');
    });

    it('should format zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('should format 100', () => {
      expect(formatPercentage(100)).toBe('100.0%');
    });
  });

  describe('generateUniqueId', () => {
    it('should generate id with analytics prefix', () => {
      const id = generateUniqueId();

      expect(id).toMatch(/^analytics_/);
    });

    it('should generate unique ids', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();

      expect(id1).not.toBe(id2);
    });

    it('should use randomUUID when available', () => {
      const mockUUID = 'test-uuid-1234-5678';
      const originalRandomUUID = crypto.randomUUID;
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

      const id = generateUniqueId();

      expect(id).toBe(`analytics_${mockUUID.replaceAll('-', '')}`);

      crypto.randomUUID = originalRandomUUID;
    });

    it('should fallback to getRandomValues when randomUUID unavailable', () => {
      const originalRandomUUID = crypto.randomUUID;
      Object.defineProperty(crypto, 'randomUUID', {
        value: undefined,
        configurable: true,
      });

      const id = generateUniqueId();

      expect(id).toMatch(/^analytics_\d+_[a-z0-9]+$/);

      Object.defineProperty(crypto, 'randomUUID', {
        value: originalRandomUUID,
        configurable: true,
      });
    });
  });
});
