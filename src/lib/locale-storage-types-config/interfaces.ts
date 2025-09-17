/**
 * 语言存储系统基础配置接口
 * Locale Storage System Basic Configuration Interfaces
 */

import type {
  EnvironmentType,
  StorageType,
} from '@/lib/locale-storage-types-base';
import type {
  StorageCompressionConfig,
  StorageEncryptionConfig,
  StorageSyncConfig,
} from '@/lib/locale-storage-types-data';

/**
 * 存储配置
 * Storage configuration
 */
export interface StorageConfig {
  enableCookies: boolean;
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
  enableIndexedDB: boolean;
  enableMemoryCache: boolean;

  // 数据保留配置
  retention: {
    preferences: number; // 偏好数据保留时间
    history: number; // 历史数据保留时间
    analytics: number; // 分析数据保留时间
    cache: number; // 缓存数据保留时间
  };

  // 性能配置
  performance: {
    maxEntries: number; // 最大条目数
    maxSize: number; // 最大存储大小
    batchSize: number; // 批处理大小
    throttleDelay: number; // 节流延迟
  };

  // 压缩配置
  compression: StorageCompressionConfig;

  // 加密配置
  encryption: StorageEncryptionConfig;

  // 同步配置
  sync: StorageSyncConfig;

  // 健康检查配置
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retryAttempts: number;
  };

  // 错误处理配置
  errorHandling: {
    retryAttempts: number;
    retryDelay: number;
    fallbackStorage: StorageType[];
    logErrors: boolean;
  };

  // 调试配置
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logToConsole: boolean;
    logToStorage: boolean;
  };
}

/**
 * 环境配置
 * Environment configuration
 */
export interface EnvironmentConfig {
  environment: EnvironmentType;
  config: Partial<StorageConfig>;
  description?: string;
  features?: string[];
}
