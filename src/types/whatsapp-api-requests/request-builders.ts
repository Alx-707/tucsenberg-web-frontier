/**
 * WhatsApp API 请求构建器
 * WhatsApp API Request Builders
 */

import type { SendMessageRequest } from '@/types/whatsapp-api-requests/message-requests';
import type { ContactData, LocationData } from '@/types/whatsapp-base-types';
import type { TemplateMessage } from '@/types/whatsapp-template-types';

/**
 * 请求构建器辅助函数
 * Request builder helper functions
 */
export const RequestBuilders = {
  /**
   * 构建文本消息请求
   * Build text message request
   */
  buildTextMessage(
    to: string,
    text: string,
    previewUrl?: boolean,
  ): SendMessageRequest {
    const textPayload: { body: string; preview_url?: boolean } = {
      body: text,
    };

    if (previewUrl !== undefined) {
      textPayload.preview_url = previewUrl;
    }

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: textPayload,
    };
  },

  /**
   * 构建模板消息请求
   * Build template message request
   */
  buildTemplateMessage(
    to: string,
    template: TemplateMessage,
  ): SendMessageRequest {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template,
    };
  },

  /**
   * 构建媒体消息请求
   * Build media message request
   */
  buildMediaMessage(
    to: string,
    type: 'image' | 'document' | 'audio' | 'video',
    media: { id?: string; link?: string; caption?: string; filename?: string },
  ): SendMessageRequest {
    // 使用显式分支而不是动态属性，避免 computed property 带来的潜在注入风险，
    // 同时保持与 WhatsApp API 要求一致的 payload 结构。
    switch (type) {
      case 'image':
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'image',
          image: media,
        } as SendMessageRequest;
      case 'document':
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'document',
          document: media,
        } as SendMessageRequest;
      case 'audio':
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'audio',
          audio: media,
        } as SendMessageRequest;
      case 'video':
        return {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'video',
          video: media,
        } as SendMessageRequest;
      default: {
        // TypeScript 保证此处不可达，仅为运行时安全兜底
        const exhaustiveCheck: never = type;
        throw new Error(`Unsupported media message type: ${exhaustiveCheck}`);
      }
    }
  },

  /**
   * 构建位置消息请求
   * Build location message request
   */
  buildLocationMessage(to: string, location: LocationData): SendMessageRequest {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'location',
      location,
    };
  },

  /**
   * 构建联系人消息请求
   * Build contacts message request
   */
  buildContactsMessage(
    to: string,
    contacts: ContactData[],
  ): SendMessageRequest {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'contacts',
      contacts,
    };
  },
};
