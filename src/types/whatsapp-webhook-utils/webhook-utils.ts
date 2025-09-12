/**
 * WhatsApp Webhook 工具类
 * WhatsApp Webhook Utility Class
 */

import type {
  WebhookPayload,
  WebhookEntry,
} from '../whatsapp-webhook-base';
import type { IncomingWhatsAppMessage } from '../whatsapp-webhook-messages';
import type { WebhookEvent, EventFilter, EventStatistics } from '../whatsapp-webhook-events';
import type {
  WebhookParsingResult,
  WebhookValidationResult,
  SignatureVerificationConfig,
} from './interfaces';

/**
 * Webhook工具函数
 * Webhook utility functions
 */
export class WebhookUtils {
  /**
   * 解析Webhook载荷为事件
   * Parse webhook payload into events
   */
  static parseWebhookPayload(payload: WebhookPayload): WebhookParsingResult {
    const startTime = Date.now();
    const events: WebhookEvent[] = [];
    const errors: Array<{ entry_id?: string; error: string; raw_data?: Record<string, unknown> | string | unknown[] }> = [];

    try {
      for (const entry of payload.entry) {
        try {
          const entryEvents = this.parseWebhookEntry(entry);
          events.push(...entryEvents);
        } catch (error) {
          errors.push({
            entry_id: entry.id,
            error: error instanceof Error ? error.message : 'Unknown parsing error',
            raw_data: entry,
          });
        }
      }

      return {
        success: errors.length === 0,
        events,
        errors,
        metadata: {
          total_entries: payload.entry.length,
          parsed_entries: payload.entry.length - errors.length,
          total_events: events.length,
          parsing_time_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        events: [],
        errors: [{
          error: error instanceof Error ? error.message : 'Failed to parse webhook payload',
          raw_data: payload,
        }],
        metadata: {
          total_entries: payload.entry?.length || 0,
          parsed_entries: 0,
          total_events: 0,
          parsing_time_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 解析单个Webhook条目
   * Parse single webhook entry
   */
  private static parseWebhookEntry(entry: WebhookEntry): WebhookEvent[] {
    const events: WebhookEvent[] = [];
    const timestamp = new Date().toISOString();

    for (const change of entry.changes) {
      const { value } = change;
      const phoneNumberId = value.metadata.phone_number_id;

      // 处理消息
      if (value.messages) {
        for (const message of value.messages) {
          const contact = value.contacts?.find(c => c.wa_id === message.from);
          events.push({
            type: 'message_received',
            timestamp,
            phone_number_id: phoneNumberId,
            from: message.from,
            message: message as IncomingWhatsAppMessage,
            contact,
          });
        }
      }

      // 处理状态更新
      if (value.statuses) {
        for (const status of value.statuses) {
          events.push({
            type: 'message_status',
            timestamp,
            phone_number_id: phoneNumberId,
            status_update: status,
          });
        }
      }

      // 处理错误
      if (value.errors) {
        for (const error of value.errors) {
          events.push({
            type: 'webhook_error',
            timestamp,
            phone_number_id: phoneNumberId,
            error,
          });
        }
      }
    }

    return events;
  }

  /**
   * 验证Webhook载荷
   * Validate webhook payload
   */
  static validateWebhookPayload(payload: unknown): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本结构验证
    if (!payload || typeof payload !== 'object') {
      errors.push('Payload must be an object');
      return { is_valid: false, errors, warnings };
    }

    if (payload.object !== 'whatsapp_business_account') {
      errors.push('Invalid object type, expected "whatsapp_business_account"');
    }

    if (!Array.isArray(payload.entry)) {
      errors.push('Entry must be an array');
    } else {
      // 验证每个条目
      payload.entry.forEach((entry: Record<string, unknown>, index: number) => {
        if (!entry.id) {
          errors.push(`Entry ${index}: Missing id`);
        }
        if (!Array.isArray(entry.changes)) {
          errors.push(`Entry ${index}: Changes must be an array`);
        } else {
          entry.changes.forEach((change: Record<string, unknown>, changeIndex: number) => {
            if (!change.value) {
              errors.push(`Entry ${index}, Change ${changeIndex}: Missing value`);
            }
            if (!change.value?.metadata?.phone_number_id) {
              errors.push(`Entry ${index}, Change ${changeIndex}: Missing phone_number_id`);
            }
          });
        }
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      payload_valid: errors.length === 0,
    };
  }

  /**
   * 验证Webhook签名
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    config: SignatureVerificationConfig
  ): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac(config.algorithm, config.app_secret)
        .update(payload)
        .digest('hex');

      const receivedSignature = signature.replace(/^sha\d+=/, '');
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成事件唯一键
   * Generate event unique key
   */
  static generateEventKey(event: WebhookEvent): string {
    switch (event.type) {
      case 'message_received':
        return `msg_${event.message.id}_${event.timestamp}`;
      case 'message_status':
        return `status_${event.status_update.id}_${event.status_update.status}_${event.timestamp}`;
      default:
        return `${event.type}_${event.phone_number_id}_${event.timestamp}`;
    }
  }

  /**
   * 过滤事件
   * Filter events
   */
  static filterEvents(events: WebhookEvent[], filter: EventFilter): WebhookEvent[] {
    return events.filter(event => {
      // 事件类型过滤
      if (filter.event_types && !filter.event_types.includes(event.type)) {
        return false;
      }

      // 电话号码过滤
      if (filter.phone_number_ids && !filter.phone_number_ids.includes(event.phone_number_id)) {
        return false;
      }

      // 发送者过滤
      if (filter.sender_filters && 'from' in event) {
        const from = (event as Record<string, unknown>).from as string;
        if (filter.sender_filters.include && !filter.sender_filters.include.includes(from)) {
          return false;
        }
        if (filter.sender_filters.exclude && filter.sender_filters.exclude.includes(from)) {
          return false;
        }
      }

      // 时间范围过滤
      if (filter.time_range) {
        const eventTime = new Date(event.timestamp);
        const startTime = new Date(filter.time_range.start);
        const endTime = new Date(filter.time_range.end);
        if (eventTime < startTime || eventTime > endTime) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 聚合事件统计
   * Aggregate event statistics
   */
  static aggregateEventStatistics(events: WebhookEvent[]): EventStatistics {
    const eventsByType: Record<string, number> = {};
    const processingTimes: number[] = [];

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      // 模拟处理时间（实际应用中应该记录真实的处理时间）
      processingTimes.push(Math.random() * 100);
    });

    processingTimes.sort((a, b) => a - b);

    return {
      total_events: events.length,
      events_by_type: eventsByType,
      processing_times: {
        average_ms: processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length || 0,
        min_ms: processingTimes[0] || 0,
        max_ms: processingTimes[processingTimes.length - 1] || 0,
        p95_ms: processingTimes[Math.floor(processingTimes.length * 0.95)] || 0,
        p99_ms: processingTimes[Math.floor(processingTimes.length * 0.99)] || 0,
      },
      error_rate: 0, // 应该基于实际错误计算
      success_rate: 1, // 应该基于实际成功率计算
      last_processed_at: events.length > 0 ? new Date().toISOString() : undefined,
    };
  }
}
