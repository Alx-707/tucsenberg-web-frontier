/**
 * WhatsApp Business API 消息发送服务
 * 提供各种类型消息的发送功能
 */

import type {
  ImageMessage,
  InteractiveMessage,
  SendMessageRequest,
  TextMessage,
  WhatsAppServiceResponse,
} from '@/types/whatsapp';
import { logger } from '@/lib/logger';

/**
 * WhatsApp 消息发送类
 */
export class WhatsAppMessageService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * 发送消息的通用方法
   */
  async sendMessage(message: SendMessageRequest): Promise<WhatsAppServiceResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const error = data as { error?: { message?: string } };
        throw new Error(error.error?.message || 'Failed to send message');
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      logger.error('WhatsApp API Error', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(
    to: string,
    text: string,
    previewUrl: boolean = false,
  ): Promise<WhatsAppServiceResponse> {
    const message: TextMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: previewUrl,
      },
    };

    return await this.sendMessage(message);
  }

  /**
   * 发送图片消息
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WhatsAppServiceResponse> {
    const message: ImageMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        ...(caption && { caption }),
      },
    };

    return await this.sendMessage(message);
  }

  /**
   * 发送模板消息
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    parameters?: string[],
  ): Promise<WhatsAppServiceResponse> {
    const message: SendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
          policy: 'deterministic',
        },
        ...(parameters && {
          components: [
            {
              type: 'body',
              parameters: parameters.map((param) => ({
                type: 'text',
                text: param,
              })),
            },
          ],
        }),
      },
    };

    return await this.sendMessage(message);
  }

  /**
   * 发送交互式按钮消息
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string,
  ): Promise<WhatsAppServiceResponse> {
    const message: InteractiveMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        ...(headerText && {
          header: {
            type: 'text',
            text: headerText,
          },
        }),
        body: {
          text: bodyText,
        },
        ...(footerText && {
          footer: {
            text: footerText,
          },
        }),
        action: {
          buttons: buttons.map((button) => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title,
            },
          })),
        },
      },
    };

    return await this.sendMessage(message);
  }

  /**
   * 发送列表消息
   */
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    options?: { headerText?: string; footerText?: string },
  ): Promise<WhatsAppServiceResponse> {
    const message: InteractiveMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(options?.headerText && {
          header: {
            type: 'text',
            text: options.headerText,
          },
        }),
        body: {
          text: bodyText,
        },
        ...(options?.footerText && {
          footer: {
            text: options.footerText,
          },
        }),
        action: {
          button: buttonText,
          sections: sections.map((section) => ({
            title: section.title || '',
            rows: section.rows,
          })),
        },
      },
    };

    return await this.sendMessage(message);
  }
}
