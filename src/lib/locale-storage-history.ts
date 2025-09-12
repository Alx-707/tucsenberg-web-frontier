/**
 * 语言检测历史管理 - 主入口
 * Locale Detection History Management - Main Entry Point
 *
 * 统一的语言检测历史管理入口，整合所有历史管理功能模块
 */

'use client';

// 重新导出所有模块的功能
export { HistoryCacheManager, addDetectionRecord, getDetectionHistory, updateDetectionHistory, validateHistoryData, createDefaultHistory, getHistorySummary, needsCleanup } from './locale-storage-history-core';export { getRecentDetections, getDetectionsBySource, getDetectionsByLocale, getDetectionsByTimeRange, getDetectionsByConfidence, queryDetections, searchDetections, getUniqueLocales, getUniqueSources, getLocaleGroupStats, getSourceGroupStats, getTimeDistributionStats } from
'./locale-storage-history-query';export { getDetectionStats, getDetectionTrends, generateHistoryInsights, getPerformanceMetrics } from
'./locale-storage-history-stats';export { cleanupExpiredDetections, cleanupDuplicateDetections, limitHistorySize, clearAllHistory, exportHistory, exportHistoryAsJson, importHistory, importHistoryFromJson, createBackup, restoreFromBackup, performMaintenance, getMaintenanceRecommendations } from
'./locale-storage-history-maintenance';export { HistoryEventManager, createRecordAddedEvent, createCleanupEvent, createExportEvent, createImportEvent, createErrorEvent, createDebugListener, createStatsListener, createErrorListener, consoleLogListener, performanceListener, addMultipleListeners, setupDefaultListeners, cleanupEventSystem, getEventSystemStatus } from
'./locale-storage-history-events';

// 导入主要功能用于向后兼容
import type { Locale } from '@/types/i18n';
;
import type {
  LocaleDetectionHistory,
  LocaleDetectionRecord,
  StorageOperationResult,
  StorageEventListener } from
'./locale-storage-types';

import {
  addDetectionRecord,
  getDetectionHistory,
  HistoryCacheManager,
  getHistorySummary } from
'./locale-storage-history-core';

import {
  getRecentDetections,
  getDetectionsBySource,
  getDetectionsByLocale,
  getDetectionsByTimeRange,
  getDetectionsByConfidence,
  queryDetections,
  searchDetections,
  getUniqueLocales,
  getUniqueSources,
  getLocaleGroupStats,
  getSourceGroupStats,
  type QueryConditions } from
'./locale-storage-history-query';

import {
  getDetectionStats,
  getDetectionTrends,
  generateHistoryInsights,
  getPerformanceMetrics } from
'./locale-storage-history-stats';

import {
  cleanupExpiredDetections,
  cleanupDuplicateDetections,
  limitHistorySize,
  clearAllHistory,
  exportHistory,
  exportHistoryAsJson,
  importHistory,
  importHistoryFromJson,
  createBackup,
  restoreFromBackup,
  performMaintenance,
  getMaintenanceRecommendations } from
'./locale-storage-history-maintenance';

import {
  HistoryEventManager,
  createRecordAddedEvent,
  createCleanupEvent,
  createExportEvent,
  createImportEvent,
  createErrorEvent,
  setupDefaultListeners,
  cleanupEventSystem,
  getEventSystemStatus } from
'./locale-storage-history-events';

/**
 * 检测历史管理器 - 向后兼容类
 * Detection history manager - Backward compatible class
 */
export class LocaleHistoryManager {
  /**
   * 添加检测记录
   * Add detection record
   */
  static addDetectionRecord(
  locale: Locale,
  source: string,
  confidence: number,
  metadata?: Record<string, unknown>)
  : StorageOperationResult<LocaleDetectionHistory> {
    const result = addDetectionRecord(locale, source, confidence, metadata);

    if (result.success) {
      HistoryEventManager.emitEvent(createRecordAddedEvent(locale, source, confidence));
    } else {
      HistoryEventManager.emitEvent(createErrorEvent('addDetectionRecord', result.error || 'Unknown error'));
    }

    return result;
  }

  /**
   * 获取检测历史
   * Get detection history
   */
  static getDetectionHistory(): StorageOperationResult<LocaleDetectionHistory> {
    return getDetectionHistory();
  }

  /**
   * 获取最近的检测记录
   * Get recent detections
   */
  static getRecentDetections(limit: number = 10): LocaleDetectionRecord[] {
    return getRecentDetections(limit);
  }

  /**
   * 按来源获取检测记录
   * Get detections by source
   */
  static getDetectionsBySource(source: string): LocaleDetectionRecord[] {
    return getDetectionsBySource(source);
  }

  /**
   * 按语言获取检测记录
   * Get detections by locale
   */
  static getDetectionsByLocale(locale: Locale): LocaleDetectionRecord[] {
    return getDetectionsByLocale(locale);
  }

  /**
   * 获取检测统计信息
   * Get detection statistics
   */
  static getDetectionStats(): ReturnType<typeof getDetectionStats> {
    return getDetectionStats();
  }

  /**
   * 清理过期的检测记录
   * Cleanup expired detection records
   */
  static cleanupExpiredDetections(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): StorageOperationResult<number> {
    const result = cleanupExpiredDetections(maxAgeMs);

    if (result.success) {
      HistoryEventManager.emitEvent(createCleanupEvent('expired', result.data || 0));
    }

    return result;
  }

  /**
   * 清除所有历史记录
   * Clear all history
   */
  static clearAllHistory(): StorageOperationResult<void> {
    const result = clearAllHistory();

    if (result.success) {
      HistoryEventManager.emitEvent(createCleanupEvent('all', 0));
    }

    return result;
  }

  /**
   * 导出历史记录
   * Export history
   */
  static exportHistory(): StorageOperationResult<LocaleDetectionHistory> {
    const result = exportHistory();

    if (result.success && result.data) {
      HistoryEventManager.emitEvent(createExportEvent('backup', result.data.history?.length || 0));
    }

    return result;
  }

  /**
   * 导入历史记录
   * Import history
   */
  static importHistory(history: LocaleDetectionHistory): StorageOperationResult<LocaleDetectionHistory> {
    const result = importHistory(history);

    if (result.success && result.data) {
      HistoryEventManager.emitEvent(createImportEvent('backup', result.data.history?.length || 0, true));
    } else {
      HistoryEventManager.emitEvent(createImportEvent('backup', 0, false));
    }

    return result;
  }

  /**
   * 添加事件监听器
   * Add event listener
   */
  static addEventListener(eventType: string, listener: StorageEventListener): void {
    HistoryEventManager.addEventListener(eventType, listener);
  }

  /**
   * 移除事件监听器
   * Remove event listener
   */
  static removeEventListener(eventType: string, listener: StorageEventListener): void {
    HistoryEventManager.removeEventListener(eventType, listener);
  }

  /**
   * 移除所有事件监听器
   * Remove all event listeners
   */
  static removeAllListeners(): void {
    HistoryEventManager.removeAllListeners();
  }

  /**
   * 获取历史记录摘要
   * Get history summary
   */
  static getHistorySummary(): ReturnType<typeof getHistorySummary> {
    return getHistorySummary();
  }

  /**
   * 获取维护建议
   * Get maintenance recommendations
   */
  static getMaintenanceRecommendations(): ReturnType<typeof getMaintenanceRecommendations> {
    return getMaintenanceRecommendations();
  }

  /**
   * 执行完整的历史维护
   * Perform complete history maintenance
   */
  static performMaintenance(options?: Parameters<typeof performMaintenance>[0]): ReturnType<typeof performMaintenance> {
    return performMaintenance(options || {});
  }

  /**
   * 查询检测记录
   * Query detection records
   */
  static queryDetections(conditions: QueryConditions): ReturnType<typeof queryDetections> {
    return queryDetections(conditions);
  }

  /**
   * 搜索检测记录
   * Search detection records
   */
  static searchDetections(searchTerm: string): LocaleDetectionRecord[] {
    return searchDetections(searchTerm);
  }

  /**
   * 获取检测趋势
   * Get detection trends
   */
  static getDetectionTrends(days: number = 7): ReturnType<typeof getDetectionTrends> {
    return getDetectionTrends(days);
  }

  /**
   * 生成历史洞察
   * Generate history insights
   */
  static generateHistoryInsights(): ReturnType<typeof generateHistoryInsights> {
    return generateHistoryInsights();
  }

  /**
   * 获取性能指标
   * Get performance metrics
   */
  static getPerformanceMetrics(): ReturnType<typeof getPerformanceMetrics> {
    return getPerformanceMetrics();
  }
}

// ==================== 向后兼容的类型别名 ====================

/**
 * 向后兼容的类型别名
 * Backward compatible type aliases
 */
export type {
  LocaleHistoryManager as HistoryManager,
  QueryConditions };