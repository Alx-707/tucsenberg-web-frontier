/**
 * 语言检测历史维护和清理 - 主入口
 * 重新导出所有历史维护相关模块
 */

// 重新导出清理功能
export {
  cleanupExpiredDetections,
  cleanupDuplicateDetections,
  limitHistorySize,
  clearAllHistory,
} from './locale-storage-history-maintenance/cleanup';

// 重新导出导入导出功能
export {
  exportHistory,
  exportHistoryAsJson,
  importHistory,
  importHistoryFromJson,
} from './locale-storage-history-maintenance/import-export';

// 重新导出备份和恢复功能
export {
  createBackup,
  restoreFromBackup,
} from './locale-storage-history-maintenance/backup';

// 重新导出维护工具功能
export {
  performMaintenance,
  getMaintenanceRecommendations,
} from './locale-storage-history-maintenance/maintenance';
