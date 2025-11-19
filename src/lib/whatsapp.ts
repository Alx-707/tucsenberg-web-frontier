import WhatsApp from 'whatsapp';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { COUNT_TEN, ZERO } from '@/constants';

import { z } from 'zod';

/**
 * WhatsApp webhook schema definition using Zod
 */
const WhatsAppWebhookSchema = z.object({
  entry: z
    .array(
      z.object({
        changes: z
          .array(
            z.object({
              value: z.object({
                messages: z
                  .array(
                    z.object({
                      from: z.string(),
                      text: z
                        .object({
                          body: z.string(),
                        })
                        .optional(),
                    }),
                  )
                  .optional(),
              }),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});



function extractIncomingMessage(body: unknown) {
  const result = WhatsAppWebhookSchema.safeParse(body);

  if (!result.success) {
    return null;
  }

  const entries = result.data.entry;
  if (!entries || entries.length === 0) {
    return null;
  }

  const [firstEntry] = entries;
  const changes = firstEntry?.changes;
  if (!changes || changes.length === 0) {
    return null;
  }

  const [firstChange] = changes;
  const messages = firstChange?.value.messages;

  if (!messages || messages.length === 0) {
    return null;
  }

  const [firstMessage] = messages;
  return firstMessage;
}

/**
 * WhatsApp Business API 服务类
 * 提供发送消息、处理 webhook 等功能
 */
export class WhatsAppService {
  private client: WhatsApp;

  constructor() {
    if (!env.WHATSAPP_ACCESS_TOKEN) {
      throw new Error('WHATSAPP_ACCESS_TOKEN is required');
    }

    // WhatsApp constructor expects phoneNumberId as number
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID
      ? parseInt(env.WHATSAPP_PHONE_NUMBER_ID, COUNT_TEN)
      : ZERO;
    this.client = new WhatsApp(phoneNumberId);
    // Set token separately if needed
    if (env.WHATSAPP_ACCESS_TOKEN) {
      (this.client as { token?: string }).token = env.WHATSAPP_ACCESS_TOKEN;
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(to: string, message: string) {
    try {
      // WhatsApp API expects recipient as second parameter
      const recipient = parseInt(to, COUNT_TEN);
      const response = await this.client.messages.text(
        {
          body: message,
        },
        recipient,
      );
      return response;
    } catch (_error) {
      // 忽略错误变量
      logger.error(
        'Failed to send WhatsApp message',
        {},
        _error instanceof Error ? _error : new Error(String(_error)),
      );
      throw _error;
    }
  }

  /**
   * 发送模板消息
   */
  async sendTemplateMessage(args: {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: Array<Record<string, unknown>>;
  }) {
    try {
      const { to, templateName, languageCode = 'en', components } = args;
      // WhatsApp API expects recipient as second parameter
      const recipient = parseInt(to, COUNT_TEN);
      // WhatsApp template message with correct structure
      const templateObject: {
        name: string;
        language: {
          policy: 'deterministic';
          code: string;
        };
        components?: Array<Record<string, unknown>>;
      } = {
        name: templateName,
        language: {
          policy: 'deterministic' as const,
          code: languageCode,
        },
      };

      if (components && components.length > 0) {
        templateObject.components = components;
      }
      const response = await this.client.messages.template(
        templateObject as unknown as Parameters<
          typeof this.client.messages.template
        >[0],
        recipient,
      );
      return response;
    } catch (_error) {
      // 忽略错误变量
      logger.error(
        'Failed to send WhatsApp template message',
        {},
        _error instanceof Error ? _error : new Error(String(_error)),
      );
      throw _error;
    }
  }

  /**
   * 验证 webhook 签名
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  }

  /**
   * 处理接收到的消息
   */
  async handleIncomingMessage(body: unknown) {
    try {
      const message = extractIncomingMessage(body);
      if (!message) {
        return { success: true };
      }

      // message is now safely typed and validated by Zod
      const { from } = message;
      const messageBody =
        message.text && typeof message.text === 'object'
          ? message.text.body
          : undefined;

      // 使用logger替代console.log
      logger.info(`Received WhatsApp message from ${from}: ${messageBody}`);

      // 这里可以添加自动回复逻辑
      if (messageBody) {
        await this.sendAutoReply(from, messageBody);
      }

      return { success: true };
    } catch (_error) {
      // 忽略错误变量
      logger.error(
        'Failed to handle incoming WhatsApp message',
        {},
        _error instanceof Error ? _error : new Error(String(_error)),
      );
      throw _error;
    }
  }

  /**
   * 自动回复逻辑
   */
  private async sendAutoReply(to: string, receivedMessage: string) {
    // 简单的自动回复逻辑
    const lowerMessage = receivedMessage.toLowerCase();

    let replyMessage = '';

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      replyMessage =
        'Hello! Thank you for contacting us. How can we help you today?';
    } else if (lowerMessage.includes('help')) {
      replyMessage =
        "We're here to help! Please describe your question or concern.";
    } else if (
      lowerMessage.includes('price') ||
      lowerMessage.includes('cost')
    ) {
      replyMessage =
        'For pricing information, please visit our website or contact our sales team.';
    } else {
      replyMessage =
        'Thank you for your message. Our team will get back to you soon!';
    }

    await this.sendTextMessage(to, replyMessage);
  }
}

// 单例实例
let whatsappService: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappService) {
    whatsappService = new WhatsAppService();
  }
  return whatsappService;
}

// 消息类型定义
export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'media';
  content: {
    body?: string;
    templateName?: string;
    languageCode?: string;
    components?: Array<Record<string, unknown>>;
    mediaUrl?: string;
    caption?: string;
  };
}

// 发送消息的通用函数
export function sendWhatsAppMessage(message: WhatsAppMessage) {
  const service = getWhatsAppService();

  switch (message.type) {
    case 'text':
      return service.sendTextMessage(message.to, message.content.body!);

    case 'template': {
      const payload: {
        to: string;
        templateName: string;
        languageCode?: string;
        components?: Array<Record<string, unknown>>;
      } = {
        to: message.to,
        templateName: message.content.templateName!,
      };
      if (message.content.languageCode)
        payload.languageCode = message.content.languageCode;
      if (message.content.components && message.content.components.length > 0) {
        payload.components = message.content.components;
      }
      return service.sendTemplateMessage(payload);
    }

    default:
      throw new Error(`Unsupported message type: ${message.type}`);
  }
}
