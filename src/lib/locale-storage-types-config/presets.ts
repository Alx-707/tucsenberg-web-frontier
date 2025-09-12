/**
 * 语言存储系统环境配置预设
 * Locale Storage System Environment Configuration Presets
 */

import type { StorageConfig } from './interfaces';

/**
 * 配置预设
 * Configuration presets
 */
export const CONFIG_PRESETS: Record<string, Partial<StorageConfig>> = {
  // 开发环境预设
  development: {
    debug: {
      enabled: true,
      logLevel: 'debug',
      logToConsole: true,
      logToStorage: true,
    },
    healthCheck: {
      enabled: true,
      interval: 30 * 1000, // 30秒
      timeout: 5 * 1000,
      retryAttempts: 1,
    },
    errorHandling: {
      retryAttempts: 1,
      retryDelay: 500,
      fallbackStorage: ['localStorage', 'memory'],
      logErrors: true,
    },
  },
  
  // 生产环境预设
  production: {
    debug: {
      enabled: false,
      logLevel: 'error',
      logToConsole: false,
      logToStorage: true,
    },
    compression: {
      enabled: true,
      algorithm: 'gzip',
      threshold: 512,
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      keyLength: 32,
      saltLength: 16,
      iterations: 100000,
    },
    healthCheck: {
      enabled: true,
      interval: 5 * 60 * 1000, // 5分钟
      timeout: 10 * 1000,
      retryAttempts: 3,
    },
  },
  
  // 测试环境预设
  test: {
    enableCookies: false,
    enableLocalStorage: false,
    enableSessionStorage: false,
    enableIndexedDB: false,
    enableMemoryCache: true,
    debug: {
      enabled: false,
      logLevel: 'error',
      logToConsole: false,
      logToStorage: false,
    },
    healthCheck: {
      enabled: false,
      interval: 0,
      timeout: 0,
      retryAttempts: 0,
    },
  },
  
  // 高性能预设
  performance: {
    performance: {
      maxEntries: 50,
      maxSize: 1024 * 1024, // 1MB
      batchSize: 20,
      throttleDelay: 50,
    },
    compression: {
      enabled: true,
      algorithm: 'lz4',
      threshold: 256,
    },
    retention: {
      preferences: 7 * 24 * 60 * 60 * 1000, // 7天
      history: 3 * 24 * 60 * 60 * 1000, // 3天
      analytics: 30 * 24 * 60 * 60 * 1000, // 30天
      cache: 6 * 60 * 60 * 1000, // 6小时
    },
  },
  
  // 安全预设
  security: {
    encryption: {
      enabled: true,
      algorithm: 'chacha20-poly1305',
      keyDerivation: 'argon2',
      keyLength: 32,
      saltLength: 32,
      iterations: 200000,
    },
    sync: {
      enabled: true,
      conflictResolution: 'server',
      authentication: {
        type: 'oauth',
        credentials: {},
      },
    },
    debug: {
      enabled: false,
      logLevel: 'error',
      logToConsole: false,
      logToStorage: false,
    },
  },
};
