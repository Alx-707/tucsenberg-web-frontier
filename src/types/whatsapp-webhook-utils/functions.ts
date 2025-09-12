/**
 * WhatsApp Webhook 工具函数
 * WhatsApp Webhook Utility Functions
 */

import type {
  WebhookVerificationRequest,
  WebhookError
} from '../whatsapp-webhook-base';

/**
 * Webhook验证工具函数
 * Webhook verification utility functions
 */
export function isWebhookVerificationRequest(query: unknown): query is WebhookVerificationRequest {
  return (
    query &&
    typeof query === 'object' &&
    'hub.mode' in query &&
    'hub.challenge' in query &&
    'hub.verify_token' in query &&
    query['hub.mode'] === 'subscribe'
  );
}

export function createWebhookVerificationResponse(challenge: string) {
  return { challenge };
}

/**
 * 错误处理工具函数
 * Error handling utility functions
 */
export function createWebhookError(code: number, message: string, details?: string): WebhookError {
  return {
    code,
    title: 'Webhook Error',
    message,
    error_data: details ? { details } : undefined,
  };
}

export function isRetryableError(error: WebhookError): boolean {
  // 5xx 错误通常可以重试
  return error.code >= 500 && error.code < 600;
}

/**
 * 时间工具函数
 * Time utility functions
 */
export function isTimestampValid(timestamp: string, maxAgeSeconds: number = 300): boolean {
  try {
    const eventTime = new Date(timestamp);
    const now = new Date();
    const ageSeconds = (now.getTime() - eventTime.getTime()) / 1000;
    return ageSeconds <= maxAgeSeconds;
  } catch {
    return false;
  }
}
