/**
 * 语言存储系统验证和工具函数 - 主入口
 * 重新导出所有语言存储工具相关模块
 */

// 重新导出类型守卫函数
export {
  isUserLocalePreference,
  isLocaleDetectionHistory,
  isStorageConfig,
} from './locale-storage-types-utils/type-guards';

// 重新导出验证函数
export {
  validatePreference,
  validateDetectionHistory,
} from './locale-storage-types-utils/validators';

// 重新导出存储工具函数
export {
  createStorageKey,
  parseStorageKey,
  estimateStorageSize,
  generateChecksum,
} from './locale-storage-types-utils/storage-utils';

// 重新导出对象操作工具函数
export {
  deepClone,
  mergeObjects,
  compareObjects,
} from './locale-storage-types-utils/object-utils';

// 重新导出格式化工具函数
export {
  formatByteSize,
  formatDuration,
  generateUniqueId,
} from './locale-storage-types-utils/format-utils';

// 重新导出异步工具函数
export {
  throttle,
  debounce,
  retry,
} from './locale-storage-types-utils/async-utils';

// 重新导出JSON工具函数
export {
  safeJsonParse,
  safeJsonStringify,
} from './locale-storage-types-utils/json-utils';
