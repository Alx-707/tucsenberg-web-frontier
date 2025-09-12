/**
 * 语言存储维护操作
 * Locale Storage Maintenance Operations
 *
 * 负责存储数据的维护、压缩和优化操作
 */

'use client';

import type { Locale } from '@/types/i18n';
;
import { CookieManager } from './locale-storage-cookie';
import { LocalStorageManager } from './locale-storage-local';
import { LocaleCleanupManager } from './locale-storage-maintenance-cleanup';
import { LocaleValidationManager } from './locale-storage-maintenance-validation';
import type {
  UserLocalePreference,
  LocaleDetectionHistory,
  StorageOperationResult,
  MaintenanceOptions,
} from './locale-storage-types';
import { STORAGE_KEYS } from './locale-storage-types';

/**
 * 语言存储维护操作管理器
 * Locale storage maintenance operations manager
 */
export class LocaleMaintenanceOperationsManager {
  /**
   * 执行存储维护
   * Perform storage maintenance
   */
  static performMaintenance(options: MaintenanceOptions = {}): StorageOperationResult {
    const {
      cleanupExpired = true,
      maxDetectionAge = 30 * 24 * 60 * 60 * 1000, // 30天
      validateData = true,
      compactStorage = true,
      fixSyncIssues = true,
      cleanupDuplicates = true,
      cleanupInvalid = true,
    } = options;

    try {
      const results: string[] = [];
      let totalOperations = 0;
      let successfulOperations = 0;

      // 清理过期检测记录
      if (cleanupExpired) {
        totalOperations += 1;
        const cleanupResult = LocaleCleanupManager.cleanupExpiredDetections(maxDetectionAge);
        if (cleanupResult.success) {
          successfulOperations += 1;
          results.push(cleanupResult.message);
        } else {
          results.push(`清理过期记录失败: ${cleanupResult.message}`);
        }
      }

      // 清理重复记录
      if (cleanupDuplicates) {
        totalOperations += 1;
        const duplicateResult = LocaleCleanupManager.cleanupDuplicateDetections();
        if (duplicateResult.success) {
          successfulOperations += 1;
          results.push(duplicateResult.message);
        } else {
          results.push(`清理重复记录失败: ${duplicateResult.message}`);
        }
      }

      // 清理无效数据
      if (cleanupInvalid) {
        totalOperations += 1;
        const invalidResult = LocaleCleanupManager.cleanupInvalidPreferences();
        if (invalidResult.success) {
          successfulOperations += 1;
          results.push(invalidResult.message);
        } else {
          results.push(`清理无效数据失败: ${invalidResult.message}`);
        }
      }

      // 验证数据完整性
      if (validateData) {
        totalOperations += 1;
        const validationResult = LocaleValidationManager.validateStorageIntegrity();
        if (validationResult.success) {
          successfulOperations += 1;
          results.push(validationResult.message);
        } else {
          results.push(`数据验证失败: ${validationResult.message}`);
        }
      }

      // 修复同步问题
      if (fixSyncIssues) {
        totalOperations += 1;
        const syncResult = LocaleValidationManager.fixSyncIssues();
        if (syncResult.success) {
          successfulOperations += 1;
          results.push(syncResult.message);
        } else {
          results.push(`修复同步问题失败: ${syncResult.message}`);
        }
      }

      // 压缩存储空间
      if (compactStorage) {
        totalOperations += 1;
        const compactResult = this.compactStorage();
        if (compactResult.success) {
          successfulOperations += 1;
          results.push(compactResult.message);
        } else {
          results.push(`压缩存储失败: ${compactResult.message}`);
        }
      }

      return {
        success: successfulOperations === totalOperations,
        message: `维护完成: ${successfulOperations}/${totalOperations} 操作成功`,
        timestamp: Date.now(),
        data: {
          totalOperations,
          successfulOperations,
          results,
          options,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `执行维护失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * 压缩存储空间
   * Compact storage space
   */
  static compactStorage(): StorageOperationResult {
    try {
      let compactedItems = 0;

      // 重新序列化所有数据以移除多余空格
      Object.values(STORAGE_KEYS).forEach((key) => {
        const data = LocalStorageManager.get(key);
        if (data !== null) {
          // 重新设置数据，这会触发重新序列化
          LocalStorageManager.set(key, data);
          compactedItems += 1;
        }
      });

      return {
        success: true,
        message: `已压缩 ${compactedItems} 项存储数据`,
        timestamp: Date.now(),
        data: { compactedItems },
      };
    } catch (error) {
      return {
        success: false,
        message: `压缩存储失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * 优化检测历史数据
   * Optimize detection history data
   */
  static optimizeDetectionHistory(): StorageOperationResult {
    try {
      const historyData = LocalStorageManager.get<LocaleDetectionHistory>(
        STORAGE_KEYS.LOCALE_DETECTION_HISTORY
      );

      if (!historyData || !Array.isArray(historyData.detections)) {
        return {
          success: true,
          message: '没有检测历史数据需要优化',
          timestamp: Date.now(),
        };
      }

      const originalCount = historyData.detections.length;

      // 按时间排序（最新的在前）
      const sortedDetections = historyData.detections.sort((a, b) => b.timestamp - a.timestamp);

      // 保留最近的100条记录
      const maxRecords = 100;
      const optimizedDetections = sortedDetections.slice(0, maxRecords);

      const removedCount = originalCount - optimizedDetections.length;

      if (removedCount > 0) {
        const updatedHistory: LocaleDetectionHistory = {
          detections: optimizedDetections,
          lastUpdated: Date.now(),
        };

        LocalStorageManager.set(STORAGE_KEYS.LOCALE_DETECTION_HISTORY, updatedHistory);

        return {
          success: true,
          message: `已优化检测历史，移除 ${removedCount} 条旧记录`,
          timestamp: Date.now(),
          data: { removedCount, remainingCount: optimizedDetections.length },
        };
      }

      return {
        success: true,
        message: '检测历史数据已是最优状态',
        timestamp: Date.now(),
        data: { removedCount: 0, remainingCount: originalCount },
      };
    } catch (error) {
      return {
        success: false,
        message: `优化检测历史失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * 重建存储索引
   * Rebuild storage index
   */
  static rebuildStorageIndex(): StorageOperationResult {
    try {
      let rebuiltItems = 0;
      const actions: string[] = [];

      // 重建偏好数据索引
      const preference = LocalStorageManager.get<UserLocalePreference>(
        STORAGE_KEYS.LOCALE_PREFERENCE
      );
      if (preference) {
        // 确保数据结构完整
        const rebuiltPreference: UserLocalePreference = {
          locale: preference.locale,
          source: preference.source,
          timestamp: preference.timestamp,
          confidence: preference.confidence,
          ...(preference.metadata && { metadata: preference.metadata }),
        };

        LocalStorageManager.set(STORAGE_KEYS.LOCALE_PREFERENCE, rebuiltPreference);
        rebuiltItems += 1;
        actions.push('重建偏好数据索引');
      }

      // 重建历史数据索引
      const history = LocalStorageManager.get<LocaleDetectionHistory>(
        STORAGE_KEYS.LOCALE_DETECTION_HISTORY
      );
      if (history) {
        // 确保数据结构完整并按时间排序
        const rebuiltHistory: LocaleDetectionHistory = {
          detections: history.detections
            .filter(detection => detection && detection.locale && detection.source)
            .sort((a, b) => b.timestamp - a.timestamp),
          lastUpdated: Date.now(),
        };

        LocalStorageManager.set(STORAGE_KEYS.LOCALE_DETECTION_HISTORY, rebuiltHistory);
        rebuiltItems += 1;
        actions.push('重建历史数据索引');
      }

      return {
        success: true,
        message: `已重建 ${rebuiltItems} 项存储索引`,
        timestamp: Date.now(),
        data: { rebuiltItems, actions },
      };
    } catch (error) {
      return {
        success: false,
        message: `重建存储索引失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * 执行深度维护
   * Perform deep maintenance
   */
  static performDeepMaintenance(): StorageOperationResult {
    try {
      const results: string[] = [];
      let totalOperations = 0;
      let successfulOperations = 0;

      // 执行标准维护
      totalOperations += 1;
      const standardResult = this.performMaintenance({
        cleanupExpired: true,
        validateData: true,
        compactStorage: true,
        fixSyncIssues: true,
        cleanupDuplicates: true,
        cleanupInvalid: true,
      });
      if (standardResult.success) {
        successfulOperations += 1;
        results.push('标准维护完成');
      } else {
        results.push(`标准维护失败: ${standardResult.message}`);
      }

      // 优化检测历史
      totalOperations += 1;
      const optimizeResult = this.optimizeDetectionHistory();
      if (optimizeResult.success) {
        successfulOperations += 1;
        results.push(optimizeResult.message);
      } else {
        results.push(`优化历史失败: ${optimizeResult.message}`);
      }

      // 重建存储索引
      totalOperations += 1;
      const rebuildResult = this.rebuildStorageIndex();
      if (rebuildResult.success) {
        successfulOperations += 1;
        results.push(rebuildResult.message);
      } else {
        results.push(`重建索引失败: ${rebuildResult.message}`);
      }

      return {
        success: successfulOperations === totalOperations,
        message: `深度维护完成: ${successfulOperations}/${totalOperations} 操作成功`,
        timestamp: Date.now(),
        data: {
          totalOperations,
          successfulOperations,
          results,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `执行深度维护失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * 获取维护建议
   * Get maintenance recommendations
   */
  static getMaintenanceRecommendations(): {
    recommendations: string[];
    priority: 'low' | 'medium' | 'high';
    estimatedTime: string;
  } {
    const recommendations: string[] = [];
    let priority: 'low' | 'medium' | 'high' = 'low';

    try {
      // 检查清理统计
      const cleanupStats = LocaleCleanupManager.getCleanupStats();

      if (cleanupStats.expiredDetections > 50) {
        recommendations.push(`清理 ${cleanupStats.expiredDetections} 条过期检测记录`);
        priority = 'medium';
      }

      if (cleanupStats.duplicateDetections > 10) {
        recommendations.push(`清理 ${cleanupStats.duplicateDetections} 条重复检测记录`);
        priority = 'medium';
      }

      if (cleanupStats.invalidPreferences > 0) {
        recommendations.push(`修复 ${cleanupStats.invalidPreferences} 项无效偏好数据`);
        priority = 'high';
      }

      // 检查验证统计
      const validationSummary = LocaleValidationManager.getValidationSummary();

      if (validationSummary.invalidKeys > 0) {
        recommendations.push(`修复 ${validationSummary.invalidKeys} 项无效数据`);
        priority = 'high';
      }

      if (validationSummary.syncIssues > 0) {
        recommendations.push(`修复 ${validationSummary.syncIssues} 个同步问题`);
        priority = 'medium';
      }

      // 检查历史数据大小
      const historyData = LocalStorageManager.get<LocaleDetectionHistory>(
        STORAGE_KEYS.LOCALE_DETECTION_HISTORY
      );
      if (historyData?.detections && historyData.detections.length > 200) {
        recommendations.push('优化检测历史数据（记录过多）');
        if (priority === 'low') priority = 'medium';
      }

      if (recommendations.length === 0) {
        recommendations.push('存储状态良好，无需特殊维护');
      }

      // 估算维护时间
      let estimatedTime = '< 1分钟';
      if (recommendations.length > 3) {
        estimatedTime = '1-2分钟';
      }
      if (priority === 'high') {
        estimatedTime = '2-5分钟';
      }

      return {
        recommendations,
        priority,
        estimatedTime,
      };
    } catch (error) {
      return {
        recommendations: ['获取维护建议时出错，建议执行基础维护'],
        priority: 'medium',
        estimatedTime: '1-2分钟',
      };
    }
  }
}
