/**
 * 语言存储系统基础类型定义 - 主入口
 * Locale Storage System Base Type Definitions - Main Entry Point
 *
 * 统一的语言存储系统类型入口，整合所有类型定义模块
 */

// 重新导出所有模块的功能
// 导出基础常量和枚举
export { STORAGE_KEYS, STORAGE_CONSTANTS, STORAGE_TYPES, COMPRESSION_ALGORITHMS, ENCRYPTION_ALGORITHMS, SYNC_STATUS, MIGRATION_STATUS, HEALTH_STATUS, ERROR_TYPES, PRIORITY_LEVELS, ENVIRONMENT_TYPES, BROWSER_TYPES, DEVICE_TYPES, OS_TYPES, TimestampUtils, BaseValidators } from './locale-storage-types-base';
// 导出基础类型
export type { StorageKey, LocaleSource, StorageEventType, StorageType, CompressionAlgorithm, EncryptionAlgorithm, SyncStatus, MigrationStatus, HealthStatus, ErrorType, PriorityLevel, EnvironmentType, BrowserType, DeviceType, OSType, VersionInfo } from './locale-storage-types-base';
// 导出数据结构类型
export type { UserLocalePreference, LocaleDetectionRecord, LocaleDetectionHistory, StorageStats, StorageOperationResult, StorageEvent, StorageEventListener, StorageHealthCheck, ValidationResult, StorageBackupData, StorageMigrationConfig, StorageCompressionConfig, StorageEncryptionConfig, StorageSyncConfig, DeviceInfo, NetworkInfo, GeolocationInfo, SessionInfo, PerformanceMetrics, ErrorInfo, AuditLogEntry, ConfigSnapshot, DataExport, DataImportResult } from './locale-storage-types-data';
// 导出配置相关
export { DEFAULT_STORAGE_CONFIG, CONFIG_PRESETS, CONFIG_VALIDATION_RULES, CONFIG_MIGRATIONS } from './locale-storage-types-config';
export type { StorageConfig, EnvironmentConfig, ConfigValidationRules, ConfigMigration, ConfigFactory } from './locale-storage-types-config';
// 导出工具函数
export { isUserLocalePreference, isLocaleDetectionHistory, isStorageConfig, validatePreference, validateDetectionHistory, createStorageKey, parseStorageKey, estimateStorageSize, generateChecksum, deepClone, mergeObjects, compareObjects, formatByteSize, formatDuration, generateUniqueId, throttle, debounce, retry, safeJsonParse, safeJsonStringify } from './locale-storage-types-utils';

// 向后兼容的重新导出
import type { Locale } from '@/types/i18n';
import type {
  STORAGE_KEYS,
  LocaleSource,
  StorageEventType,
  STORAGE_CONSTANTS,
  StorageType,
  CompressionAlgorithm,
  EncryptionAlgorithm,
  SyncStatus,
  MigrationStatus,
  HealthStatus,
  ErrorType,
  PriorityLevel,
  EnvironmentType,
  BrowserType,
  DeviceType,
  OSType,
  VersionInfo,
  TimestampUtils,
  BaseValidators } from
'./locale-storage-types-base';

import type {
  UserLocalePreference,
  LocaleDetectionRecord,
  LocaleDetectionHistory,
  StorageStats,
  StorageOperationResult,
  StorageEvent,
  StorageEventListener,
  StorageHealthCheck,
  ValidationResult,
  StorageBackupData,
  StorageMigrationConfig,
  StorageCompressionConfig,
  StorageEncryptionConfig,
  StorageSyncConfig,
  DeviceInfo,
  NetworkInfo,
  GeolocationInfo,
  SessionInfo,
  PerformanceMetrics,
  ErrorInfo,
  AuditLogEntry,
  ConfigSnapshot,
  DataExport,
  DataImportResult } from
'./locale-storage-types-data';

import type {
  StorageConfig,
  DEFAULT_STORAGE_CONFIG,
  EnvironmentConfig,
  CONFIG_PRESETS,
  ConfigValidationRules,
  CONFIG_VALIDATION_RULES,
  ConfigMigration,
  CONFIG_MIGRATIONS } from
'./locale-storage-types-config';

import {
  isUserLocalePreference,
  isLocaleDetectionHistory,
  isStorageConfig,
  validatePreference,
  validateDetectionHistory,
  createStorageKey,
  parseStorageKey,
  estimateStorageSize,
  generateChecksum,
  deepClone,
  mergeObjects,
  compareObjects,
  formatByteSize,
  formatDuration,
  generateUniqueId,
  throttle,
  debounce,
  retry,
  safeJsonParse,
  safeJsonStringify } from
'./locale-storage-types-utils';

// ==================== 向后兼容的类型别名 ====================

/**
 * 向后兼容的类型别名
 * Backward compatible type aliases
 */
export type {
  // 基础类型
  STORAGE_KEYS as StorageKeys,
  LocaleSource as Source,
  StorageEventType as EventType,

  // 数据结构
  UserLocalePreference as Preference,
  LocaleDetectionRecord as DetectionRecord,
  LocaleDetectionHistory as DetectionHistory,
  StorageOperationResult as OperationResult,
  StorageEvent as Event,
  StorageEventListener as EventListener,

  // 配置
  StorageConfig as Config,
  DEFAULT_STORAGE_CONFIG as DefaultConfig,

  // 工具函数类型
  ValidationResult as Validation };
