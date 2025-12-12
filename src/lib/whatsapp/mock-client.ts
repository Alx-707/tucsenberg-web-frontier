/**
 * Mock WhatsApp Client Implementation
 *
 * Provides a mock implementation for development and testing environments.
 * Returns successful responses without making real API calls.
 */

import type {
  SendMessageRequest,
  WhatsAppServiceResponse,
} from '@/types/whatsapp';
import { logger } from '@/lib/logger';
import { WhatsAppUtils } from '@/lib/whatsapp-utils';
import type {
  WhatsAppClient,
  WhatsAppClientInfo,
} from '@/lib/whatsapp/client-interface';

/**
 * Mock WhatsApp Client for development/testing
 */
export class MockWhatsAppClient implements WhatsAppClient {
  private readonly phoneNumberId: string;

  constructor(phoneNumberId: string = 'mock-phone-id') {
    this.phoneNumberId = phoneNumberId;
    logger.info('[MockWhatsAppClient] Initialized mock WhatsApp client');
  }

  private generateMockMessageId(): string {
    return `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createSuccessResponse(): WhatsAppServiceResponse {
    return {
      success: true,
      data: {
        messaging_product: 'whatsapp',
        contacts: [{ input: 'mock-input', wa_id: 'mock-wa-id' }],
        messages: [{ id: this.generateMockMessageId() }],
      },
    };
  }

  sendMessage(_message: SendMessageRequest): Promise<WhatsAppServiceResponse> {
    logger.info('[MockWhatsAppClient] sendMessage called (mock)');
    return Promise.resolve(this.createSuccessResponse());
  }

  sendTextMessage(
    to: string,
    text: string,
    _previewUrl?: boolean,
  ): Promise<WhatsAppServiceResponse> {
    logger.info(
      `[MockWhatsAppClient] sendTextMessage to=${to}, text=${text.substring(0, 50)}...`,
    );
    return Promise.resolve(this.createSuccessResponse());
  }

  sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WhatsAppServiceResponse> {
    logger.info(
      `[MockWhatsAppClient] sendImageMessage to=${to}, url=${imageUrl}, caption=${caption}`,
    );
    return Promise.resolve(this.createSuccessResponse());
  }

  sendTemplateMessage(args: {
    to: string;
    templateName: string;
    languageCode: string;
    parameters?: string[];
  }): Promise<WhatsAppServiceResponse> {
    logger.info(
      `[MockWhatsAppClient] sendTemplateMessage template=${args.templateName}, to=${args.to}`,
    );
    return Promise.resolve(this.createSuccessResponse());
  }

  sendButtonMessage(args: {
    to: string;
    bodyText: string;
    buttons: Array<{ id: string; title: string }>;
    headerText?: string;
    footerText?: string;
  }): Promise<WhatsAppServiceResponse> {
    logger.info(
      `[MockWhatsAppClient] sendButtonMessage to=${args.to}, buttons=${args.buttons.length}`,
    );
    return Promise.resolve(this.createSuccessResponse());
  }

  sendListMessage(args: {
    to: string;
    bodyText: string;
    buttonText: string;
    sections: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    options?: { headerText?: string; footerText?: string };
  }): Promise<WhatsAppServiceResponse> {
    logger.info(
      `[MockWhatsAppClient] sendListMessage to=${args.to}, sections=${args.sections.length}`,
    );
    return Promise.resolve(this.createSuccessResponse());
  }

  getMediaUrl(mediaId: string): Promise<string | null> {
    logger.info(`[MockWhatsAppClient] getMediaUrl mediaId=${mediaId}`);
    return Promise.resolve(`https://mock-cdn.whatsapp.net/media/${mediaId}`);
  }

  downloadMedia(mediaId: string): Promise<Buffer | null> {
    logger.info(`[MockWhatsAppClient] downloadMedia mediaId=${mediaId}`);
    return Promise.resolve(Buffer.from('mock-media-content'));
  }

  uploadMedia(
    _file: Buffer | Blob,
    type: 'image' | 'document' | 'audio' | 'video' | 'sticker',
    filename?: string,
  ): Promise<string | null> {
    logger.info(
      `[MockWhatsAppClient] uploadMedia type=${type}, filename=${filename}`,
    );
    return Promise.resolve(`mock-media-id-${Date.now()}`);
  }

  isReady(): boolean {
    return true;
  }

  getClientInfo(): WhatsAppClientInfo {
    return {
      type: 'mock',
      phoneNumberId: this.phoneNumberId,
      isConfigured: true,
      apiVersion: 'mock-v1',
    };
  }

  // Static utility methods (proxy to WhatsAppUtils)
  static validatePhoneNumber = WhatsAppUtils.validatePhoneNumber;
  static formatPhoneNumber = WhatsAppUtils.formatPhoneNumber;
  static validateMessageLength = WhatsAppUtils.validateMessageLength;
}
