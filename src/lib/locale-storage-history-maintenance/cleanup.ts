/**
 * 语言检测历史清理功能
 * Locale Detection History Cleanup Functions
 */

'use client';

import { CACHE_LIMITS } from '@/constants/i18n-constants';
import { LocalStorageManager } from '../locale-storage-local';
import type {
  LocaleDetectionHistory,
  LocaleDetectionRecord,
  StorageOperationResult,
} from '../locale-storage-types';
import { 
  getDetectionHistory, 
  createDefaultHistory,
  HistoryCacheManager 
} from '../locale-storage-history-core';

/**
 * 清理过期的检测记录
 * Cleanup expired detection records
 */
export function cleanupExpiredDetections(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): StorageOperationResult<number> {
  const startTime = Date.now();
  
  try {
    const historyResult = getDetectionHistory();
    
    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: 'Failed to get detection history',
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }

    const history = historyResult.data;
    const cutoffTime = Date.now() - maxAgeMs;
    const originalCount = history.history.length;
    
    // 过滤掉过期的记录
    history.history = history.history.filter(record => record.timestamp > cutoffTime);
    
    const removedCount = originalCount - history.history.length;
    
    if (removedCount > 0) {
      // 更新时间戳
      history.lastUpdated = Date.now();
      
      // 保存更新后的历史
      const saveResult = LocalStorageManager.set('locale_detection_history', history);
      
      if (saveResult.success) {
        // 清除缓存
        HistoryCacheManager.clearCache();
        
        return {
          success: true,
          data: removedCount,
          source: 'localStorage',
          timestamp: Date.now(),
          responseTime: Date.now() - startTime,
        };
      }
      return {
        success: false,
        error: saveResult.error || 'Failed to save cleaned history',
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
    return {
      success: true,
      data: 0,
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * 清理重复的检测记录
 * Cleanup duplicate detection records
 */
export function cleanupDuplicateDetections(): StorageOperationResult<number> {
  const startTime = Date.now();
  
  try {
    const historyResult = getDetectionHistory();
    
    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: 'Failed to get detection history',
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }

    const history = historyResult.data;
    const originalCount = history.history.length;
    
    // 使用 Set 来跟踪已见过的记录
    const seen = new Set<string>();
    const uniqueRecords: LocaleDetectionRecord[] = [];
    
    history.history.forEach(record => {
      // 创建记录的唯一标识符
      const key = `${record.locale}-${record.source}-${record.timestamp}-${record.confidence}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRecords.push(record);
      }
    });
    
    const removedCount = originalCount - uniqueRecords.length;
    
    if (removedCount > 0) {
      history.history = uniqueRecords;
      history.lastUpdated = Date.now();
      
      const saveResult = LocalStorageManager.set('locale_detection_history', history);
      
      if (saveResult.success) {
        HistoryCacheManager.clearCache();
        
        return {
          success: true,
          data: removedCount,
          source: 'localStorage',
          timestamp: Date.now(),
          responseTime: Date.now() - startTime,
        };
      }
      return {
        success: false,
        error: saveResult.error || 'Failed to save deduplicated history',
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
    return {
      success: true,
      data: 0,
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * 限制历史记录数量
 * Limit history record count
 */
export function limitHistorySize(maxRecords: number = CACHE_LIMITS.MAX_HISTORY_ENTRIES || 100): StorageOperationResult<number> {
  const startTime = Date.now();
  
  try {
    const historyResult = getDetectionHistory();
    
    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: 'Failed to get detection history',
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }

    const history = historyResult.data;
    const originalCount = history.history.length;
    
    if (originalCount > maxRecords) {
      // 保留最新的记录
      history.history = history.history.slice(0, maxRecords);
      history.lastUpdated = Date.now();
      
      const saveResult = LocalStorageManager.set('locale_detection_history', history);
      
      if (saveResult.success) {
        HistoryCacheManager.clearCache();
        
        const removedCount = originalCount - maxRecords;
        return {
          success: true,
          data: removedCount,
          source: 'localStorage',
          timestamp: Date.now(),
          responseTime: Date.now() - startTime,
        };
      }
      return {
        success: false,
        error: saveResult.error || 'Failed to save limited history',
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
    return {
      success: true,
      data: 0,
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * 清除所有历史记录
 * Clear all history
 */
export function clearAllHistory(): StorageOperationResult<void> {
  const startTime = Date.now();
  
  try {
    const defaultHistory = createDefaultHistory();
    const saveResult = LocalStorageManager.set('locale_detection_history', defaultHistory);
    
    if (saveResult.success) {
      HistoryCacheManager.clearCache();
      
      return {
        success: true,
        data: undefined,
        source: 'localStorage',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
    return {
      success: false,
      error: saveResult.error || 'Failed to clear history',
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'localStorage',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  }
}
