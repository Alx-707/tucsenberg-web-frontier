/**
 * WhatsApp Service Types - Main Entry Point
 * WhatsApp Service Configuration and Error Type Definitions
 *
 * 统一的WhatsApp服务类型定义入口，整合所有子模块功能
 */

// 重新导出所有模块的类型和功能
export { validateWhatsAppConfig, validateServiceOptions, mergeWithDefaults } from './whatsapp-service-config';export { isWhatsAppError, isWhatsAppApiError, isWhatsAppValidationError, isWhatsAppRateLimitError, isWhatsAppNetworkError, isWhatsAppAuthError, createErrorFromApiResponse, getErrorSeverity } from
'./whatsapp-service-errors';export { HealthCheckConfig, MetricsConfig, AlertConfig, calculateUptime, calculateErrorRate, determineHealthStatus, createDefaultMetrics, createDefaultHealth, updateMetrics, needsAttention } from
'./whatsapp-service-monitoring';export { Config, ServiceOptions, Status, Health, Metrics, ServiceInterface, ServiceError, isWhatsAppService, createDefaultServiceStatus } from
'./whatsapp-service-interface';

// 导入主要类型用于向后兼容
import type {
  WhatsAppConfig,
  WhatsAppServiceOptions,
  ServiceEnvironmentConfig,
  RetryConfig,
  CircuitBreakerConfig,
  CircuitBreakerState,
  CacheConfig,
  CacheEntry,
  Cache,
  LogEntry,
  Logger,
  MessageType,
  MessageStatus,
  ServiceEnvironment,
  LogLevel,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_CACHE_CONFIG
} from './whatsapp-service-config';
import { DEFAULT_SERVICE_OPTIONS } from './whatsapp-service-config';

import type { WhatsAppError } from './whatsapp-service-errors';
import type { WhatsAppValidationError } from './whatsapp-service-errors';
import { WhatsAppApiError, WhatsAppRateLimitError, WhatsAppNetworkError, WhatsAppAuthError } from './whatsapp-service-errors';;

import type {
  ServiceHealth,
  ServiceMetrics,
  ServiceStatus,
  ServiceEvent,
  MessageSentEvent,
  MessageDeliveredEvent,
  MessageReadEvent,
  MessageFailedEvent,
  ErrorEvent,
  HealthCheckEvent,
  RateLimitEvent,
  WhatsAppServiceEvent } from
'./whatsapp-service-monitoring';

import type {
  WhatsAppServiceInterface,
  ApiRequest,
  ApiResponse,
  MessageRequest,
  MessageResponse,
  WebhookHandler,
  WebhookConfig,
  ServiceFactory,
  ServiceBuilder,
  ServicePlugin,
  PluginManager } from
'./whatsapp-service-interface';

// ==================== 向后兼容的常量导出 ====================

/**
 * 向后兼容的常量导出
 * Backward compatible constant exports
 */
export {
  DEFAULT_SERVICE_OPTIONS,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_CACHE_CONFIG };

// ==================== 向后兼容的类型别名 ====================

/**
 * 向后兼容的类型别名
 * Backward compatible type aliases
 */
export type {
  WhatsAppConfig,
  WhatsAppServiceOptions,
  ServiceEnvironmentConfig,
  RetryConfig,
  CircuitBreakerConfig,
  CircuitBreakerState,
  CacheConfig,
  CacheEntry,
  Cache,
  LogEntry,
  Logger,
  MessageType,
  MessageStatus,
  ServiceEnvironment,
  LogLevel,
  ServiceHealth,
  ServiceMetrics,
  ServiceStatus,
  ServiceEvent,
  MessageSentEvent,
  MessageDeliveredEvent,
  MessageReadEvent,
  MessageFailedEvent,
  ErrorEvent,
  HealthCheckEvent,
  RateLimitEvent,
  WhatsAppServiceEvent,
  WhatsAppServiceInterface,
  ApiRequest,
  ApiResponse,
  MessageRequest,
  MessageResponse,
  WebhookHandler,
  WebhookConfig,
  ServiceFactory,
  ServiceBuilder,
  ServicePlugin,
  PluginManager };


// ==================== 向后兼容的类导出 ====================

/**
 * 向后兼容的错误类导出
 * Backward compatible error class exports
 */
export {
  WhatsAppError,
  WhatsAppApiError,
  WhatsAppValidationError,
  WhatsAppRateLimitError,
  WhatsAppNetworkError,
  WhatsAppAuthError };


// ==================== 便捷工厂函数 ====================

/**
 * 创建默认配置
 * Create default configuration
 */
export function createDefaultConfig(): WhatsAppConfig {
  return {
    accessToken: '',
    phoneNumberId: '',
    verifyToken: '',
    apiVersion: 'v18.0'
  };
}

/**
 * 创建默认服务选项
 * Create default service options
 */
export function createDefaultServiceOptions(): Required<WhatsAppServiceOptions> {
  return { ...DEFAULT_SERVICE_OPTIONS };
}

/**
 * 创建默认服务状态
 * Create default service status
 */
export function createDefaultServiceStatus(): ServiceStatus {
  return {
    isInitialized: false,
    isConnected: false,
    lastActivity: Date.now(),
    health: {
      status: 'healthy',
      lastCheck: Date.now(),
      responseTime: 0,
      errorRate: 0,
      uptime: 100,
      details: {
        api: 'available',
        webhook: 'not_configured',
        phoneNumber: 'unverified'
      }
    },
    metrics: {
      messagesSent: 0,
      messagesDelivered: 0,
      messagesRead: 0,
      messagesFailed: 0,
      apiCalls: 0,
      apiErrors: 0,
      averageResponseTime: 0,
      uptime: 100,
      lastReset: Date.now()
    },
    config: {
      phoneNumberId: '',
      apiVersion: 'v18.0',
      webhookConfigured: false
    }
  };
}

// ==================== 默认导出 ====================

/**
 * 默认导出主要配置类型
 * Default export main configuration type
 */
export default WhatsAppConfig;
