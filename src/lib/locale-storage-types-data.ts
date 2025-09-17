/**
 * 语言存储系统数据结构接口
 * Locale Storage System Data Structure Interfaces
 *
 * 提供语言偏好存储系统所需的数据结构接口定义
 */

import type { Locale } from '@/types/i18n';
import type {
  BrowserType,
  CompressionAlgorithm,
  DeviceType,
  EncryptionAlgorithm,
  ErrorType,
  HealthStatus,
  LocaleSource,
  OSType,
  PriorityLevel,
  StorageEventType,
  SyncStatus,
  VersionInfo,
} from '@/lib/locale-storage-types-base';

/**
 * 用户偏好数据结构
 * User locale preference data structure
 */
export interface UserLocalePreference {
  locale: Locale;
  source: LocaleSource;
  timestamp: number;
  confidence: number; // 0-1, 检测置信度
  metadata?: {
    userAgent?: string;
    ipCountry?: string;
    browserLanguages?: string[];
    timezone?: string;
    [key: string]: unknown;
  };
}

/**
 * 语言检测记录
 * Locale detection record
 */
export interface LocaleDetectionRecord {
  locale: Locale;
  source: LocaleSource;
  confidence: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 语言检测历史
 * Locale detection history
 */
export interface LocaleDetectionHistory {
  detections: LocaleDetectionRecord[];
  history: LocaleDetectionRecord[];
  lastUpdated: number;
  totalDetections: number;
  metadata?: Record<string, unknown>;
}

/**
 * 存储统计信息
 * Storage statistics
 */
export interface StorageStats {
  totalEntries: number;
  totalSize: number;
  lastAccessed: number;
  lastModified: number;
  accessCount: number;
  errorCount: number;
  freshness: number;
  hasOverride: boolean;
  historyStats: {
    totalEntries: number;
    uniqueLocales: number;
    oldestEntry: number;
    newestEntry: number;
  };
  compressionRatio?: number;
  encryptionEnabled?: boolean;
  syncStatus?: SyncStatus;
  healthStatus?: HealthStatus;
}

/**
 * 存储操作结果
 * Storage operation result
 */
export interface StorageOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  responseTime?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 存储事件
 * Storage event
 */
export interface StorageEvent<T = unknown> {
  type: StorageEventType;
  data?: T;
  timestamp: number;
  source: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 存储事件监听器
 * Storage event listener
 */
export type StorageEventListener<T = unknown> = (
  event: StorageEvent<T>,
) => void;

/**
 * 存储健康检查
 * Storage health check
 */
export interface StorageHealthCheck {
  isHealthy: boolean;
  status: HealthStatus;
  issues: Array<{
    type: ErrorType;
    severity: PriorityLevel;
    message: string;
    timestamp: number;
  }>;
  performance: {
    readLatency: number;
    writeLatency: number;
    errorRate: number;
    availability: number;
  };
  storage: {
    used: number;
    available: number;
    quota: number;
    utilization: number;
  };
  lastCheck: number;
}

/**
 * 验证结果
 * Validation result
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: T;
  metadata?: Record<string, unknown>;
}

/**
 * 存储备份数据
 * Storage backup data
 */
export interface StorageBackupData {
  version: string;
  timestamp: number;
  checksum: string;
  data: {
    preferences: UserLocalePreference[];
    history: LocaleDetectionHistory[];
    analytics: Record<string, unknown>[];
    settings: Record<string, unknown>;
  };
  metadata: {
    environment: string;
    userAgent: string;
    compression?: CompressionAlgorithm;
    encryption?: EncryptionAlgorithm;
    size: number;
    entryCount: number;
  };
}

/**
 * 存储迁移配置
 * Storage migration configuration
 */
export interface StorageMigrationConfig {
  fromVersion: string;
  toVersion: string;
  strategy: 'incremental' | 'full' | 'selective';
  backupBeforeMigration: boolean;
  rollbackOnFailure: boolean;
  migrationSteps: Array<{
    name: string;
    description: string;
    execute: (data: unknown) => Promise<unknown>;
    rollback?: (data: unknown) => Promise<unknown>;
  }>;
  validation?: {
    preValidation?: (data: unknown) => ValidationResult;
    postValidation?: (data: unknown) => ValidationResult;
  };
}

/**
 * 存储压缩配置
 * Storage compression configuration
 */
export interface StorageCompressionConfig {
  enabled: boolean;
  algorithm: CompressionAlgorithm;
  threshold: number; // 压缩阈值（字节）
  level?: number; // 压缩级别
  options?: Record<string, unknown>;
}

/**
 * 存储加密配置
 * Storage encryption configuration
 */
export interface StorageEncryptionConfig {
  enabled: boolean;
  algorithm: EncryptionAlgorithm;
  keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
  keyLength: number;
  saltLength: number;
  iterations?: number;
  options?: Record<string, unknown>;
}

/**
 * 存储同步配置
 * Storage synchronization configuration
 */
export interface StorageSyncConfig {
  enabled: boolean;
  endpoint?: string;
  interval: number;
  retryAttempts: number;
  timeout: number;
  conflictResolution: 'client' | 'server' | 'merge' | 'manual';
  authentication?: {
    type: 'bearer' | 'basic' | 'oauth';
    credentials: Record<string, string>;
  };
}

/**
 * 设备信息
 * Device information
 */
export interface DeviceInfo {
  browser: {
    type: BrowserType;
    version: string;
    userAgent: string;
  };
  device: {
    type: DeviceType;
    model?: string;
    vendor?: string;
  };
  os: {
    type: OSType;
    version: string;
    architecture?: string;
  };
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
    colorDepth: number;
  };
  capabilities: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    cookies: boolean;
    webWorkers: boolean;
    serviceWorkers: boolean;
  };
}

/**
 * 网络信息
 * Network information
 */
export interface NetworkInfo {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  online: boolean;
}

/**
 * 地理位置信息
 * Geolocation information
 */
export interface GeolocationInfo {
  country: string;
  region?: string;
  city?: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  ipAddress?: string;
  isp?: string;
}

/**
 * 用户会话信息
 * User session information
 */
export interface SessionInfo {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  interactions: number;
  referrer?: string;
  landingPage: string;
  currentPage: string;
  duration: number;
  isActive: boolean;
}

/**
 * 性能指标
 * Performance metrics
 */
export interface PerformanceMetrics {
  storage: {
    readTime: number;
    writeTime: number;
    deleteTime: number;
    size: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    errorRate: number;
  };
  memory: {
    used: number;
    available: number;
    peak: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
}

/**
 * 错误信息
 * Error information
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  stack?: string;
  timestamp: number;
  context?: {
    operation: string;
    data?: unknown;
    environment: string;
    userAgent: string;
  };
  severity: PriorityLevel;
  resolved: boolean;
  resolution?: {
    action: string;
    timestamp: number;
    notes?: string;
  };
}

/**
 * 审计日志条目
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  operation: string;
  resource: string;
  actor: {
    type: 'user' | 'system' | 'api';
    id?: string;
    ip?: string;
    userAgent?: string;
  };
  changes?: {
    before?: unknown;
    after?: unknown;
    fields: string[];
  };
  result: 'success' | 'failure' | 'partial';
  metadata?: Record<string, unknown>;
}

/**
 * 配置快照
 * Configuration snapshot
 */
export interface ConfigSnapshot {
  id: string;
  timestamp: number;
  version: VersionInfo;
  config: Record<string, unknown>;
  checksum: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 数据导出格式
 * Data export format
 */
export interface DataExport {
  format: 'json' | 'csv' | 'xml' | 'binary';
  version: string;
  timestamp: number;
  checksum: string;
  data: unknown;
  metadata: {
    source: string;
    compression?: CompressionAlgorithm;
    encryption?: EncryptionAlgorithm;
    size: number;
    entryCount: number;
  };
}

/**
 * 数据导入结果
 * Data import result
 */
export interface DataImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{
    index: number;
    error: string;
    data?: unknown;
  }>;
  warnings: string[];
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * 存储维护选项
 * Storage maintenance options
 */
export interface MaintenanceOptions {
  /** 是否清理过期的检测记录 */
  cleanupExpired?: boolean;
  /** 过期阈值（毫秒），默认30天 */
  maxDetectionAge?: number;
  /** 是否验证数据完整性 */
  validateData?: boolean;
  /** 是否压缩存储 */
  compactStorage?: boolean;
  /** 是否修复同步问题 */
  fixSyncIssues?: boolean;
  /** 是否清理重复记录 */
  cleanupDuplicates?: boolean;
  /** 是否清理无效数据 */
  cleanupInvalid?: boolean;
}
