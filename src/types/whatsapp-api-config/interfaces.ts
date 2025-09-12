/**
 * WhatsApp API 基础配置接口
 * WhatsApp API Basic Configuration Interfaces
 */

/**
 * API配置
 * API configuration
 */
export interface ApiConfig {
  baseUrl: string;
  version: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  userAgent?: string;
  webhookSecret?: string;
}

/**
 * 扩展API配置
 * Extended API configuration
 */
export interface ExtendedApiConfig extends ApiConfig {
  // 安全配置
  security: {
    validateWebhookSignature: boolean;
    allowedOrigins?: string[];
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
  };

  // 日志配置
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    includeRequestBody: boolean;
    includeResponseBody: boolean;
  };

  // 缓存配置
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'memory' | 'redis' | 'file';
  };

  // 重试配置
  retry: {
    enabled: boolean;
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    baseDelay: number;
    maxDelay: number;
    retryableStatusCodes: number[];
  };

  // 监控配置
  monitoring: {
    enabled: boolean;
    metricsEndpoint?: string;
    healthCheckInterval: number;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
    };
  };
}

/**
 * 环境配置
 * Environment configuration
 */
export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  apiConfig: ApiConfig;
  features: {
    enableWebhooks: boolean;
    enableAnalytics: boolean;
    enableTemplates: boolean;
    enableBatchRequests: boolean;
  };
}

/**
 * Webhook配置
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  verifyToken: string;
  secret?: string;
  fields: string[];
  enableSignatureVerification: boolean;
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
  };
}

/**
 * 客户端配置
 * Client configuration
 */
export interface ClientConfig {
  api: ApiConfig;
  webhook?: WebhookConfig;
  defaultRequestOptions: {
    timeout: number;
    retries: number;
    retryDelay: number;
    headers: Record<string, string>;
  };
  interceptors: {
    request?: Array<(config: Record<string, unknown>) => Record<string, unknown>>;
    response?: Array<(response: Record<string, unknown>) => Record<string, unknown>>;
    error?: Array<(error: unknown) => unknown>;
  };
}
