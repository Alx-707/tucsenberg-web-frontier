/**
 * 语言存储系统配置验证规则
 * Locale Storage System Configuration Validation Rules
 */

/**
 * 配置验证规则
 * Configuration validation rules
 */
export interface ConfigValidationRules {
  required: string[];
  optional: string[];
  types: Record<string, string>;
  ranges: Record<string, { min?: number; max?: number }>;
  enums: Record<string, string[]>;
  custom: Record<string, (value: unknown) => boolean>;
}

/**
 * 配置验证器
 * Configuration validator
 */
export const CONFIG_VALIDATION_RULES: ConfigValidationRules = {
  required: [
    'enableCookies',
    'enableLocalStorage',
    'retention.preferences',
    'performance.maxEntries',
  ],
  
  optional: [
    'compression.enabled',
    'encryption.enabled',
    'sync.enabled',
    'debug.enabled',
  ],
  
  types: {
    'enableCookies': 'boolean',
    'enableLocalStorage': 'boolean',
    'retention.preferences': 'number',
    'performance.maxEntries': 'number',
    'compression.algorithm': 'string',
    'encryption.algorithm': 'string',
  },
  
  ranges: {
    'retention.preferences': { min: 0, max: 365 * 24 * 60 * 60 * 1000 },
    'performance.maxEntries': { min: 1, max: 10000 },
    'performance.maxSize': { min: 1024, max: 100 * 1024 * 1024 },
    'encryption.keyLength': { min: 16, max: 64 },
    'compression.threshold': { min: 0, max: 10 * 1024 * 1024 },
  },
  
  enums: {
    'compression.algorithm': ['none', 'gzip', 'lz4', 'brotli'],
    'encryption.algorithm': ['none', 'aes-256-gcm', 'chacha20-poly1305'],
    'sync.conflictResolution': ['client', 'server', 'merge', 'manual'],
    'debug.logLevel': ['error', 'warn', 'info', 'debug'],
  },
  
  custom: {
    'retention.preferences': (value: unknown) => {
      return typeof value === 'number' && value >= 0;
    },
    'performance.maxEntries': (value: unknown) => {
      return typeof value === 'number' && value > 0 && Number.isInteger(value);
    },
  },
};
