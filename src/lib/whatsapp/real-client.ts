/**
 * Real WhatsApp Client Implementation
 *
 * Provides the actual WhatsApp Business API client implementation
 * for production use. Wraps the existing WhatsAppMessageService
 * and WhatsAppMediaService with the unified client interface.
 */

import type {
  SendMessageRequest,
  WhatsAppServiceResponse,
} from '@/types/whatsapp';
import { logger } from '@/lib/logger';
import { WhatsAppMediaService } from '@/lib/whatsapp-media';
import { WhatsAppMessageService } from '@/lib/whatsapp-messages';
import { WhatsAppUtils } from '@/lib/whatsapp-utils';
import type {
  WhatsAppClient,
  WhatsAppClientConfig,
  WhatsAppClientInfo,
} from '@/lib/whatsapp/client-interface';

const DEFAULT_API_VERSION = 'v18.0';

/**
 * Real WhatsApp Client for production use
 */
export class RealWhatsAppClient implements WhatsAppClient {
  private readonly messageService: WhatsAppMessageService;
  private readonly mediaService: WhatsAppMediaService;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion: string;

  constructor(config: WhatsAppClientConfig) {
    if (!config.accessToken || !config.phoneNumberId) {
      throw new Error('WhatsApp access token and phone number ID are required');
    }

    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this.apiVersion = config.apiVersion || DEFAULT_API_VERSION;

    this.messageService = new WhatsAppMessageService(
      this.accessToken,
      this.phoneNumberId,
    );
    this.mediaService = new WhatsAppMediaService(
      this.accessToken,
      this.phoneNumberId,
    );

    logger.info('[RealWhatsAppClient] Initialized with real API credentials');
  }

  sendMessage(message: SendMessageRequest): Promise<WhatsAppServiceResponse> {
    return this.messageService.sendMessage(message);
  }

  sendTextMessage(
    to: string,
    text: string,
    previewUrl?: boolean,
  ): Promise<WhatsAppServiceResponse> {
    return this.messageService.sendTextMessage(to, text, previewUrl);
  }

  sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WhatsAppServiceResponse> {
    return this.messageService.sendImageMessage(to, imageUrl, caption);
  }

  sendTemplateMessage(args: {
    to: string;
    templateName: string;
    languageCode: string;
    parameters?: string[];
  }): Promise<WhatsAppServiceResponse> {
    return this.messageService.sendTemplateMessage(args);
  }

  sendButtonMessage(args: {
    to: string;
    bodyText: string;
    buttons: Array<{ id: string; title: string }>;
    headerText?: string;
    footerText?: string;
  }): Promise<WhatsAppServiceResponse> {
    return this.messageService.sendButtonMessage(args);
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
    return this.messageService.sendListMessage(args);
  }

  getMediaUrl(mediaId: string): Promise<string | null> {
    return this.mediaService.getMediaUrl(mediaId);
  }

  downloadMedia(mediaId: string): Promise<Buffer | null> {
    return this.mediaService.downloadMedia(mediaId);
  }

  uploadMedia(
    file: Buffer | Blob,
    type: 'image' | 'document' | 'audio' | 'video' | 'sticker',
    filename?: string,
  ): Promise<string | null> {
    return this.mediaService.uploadMedia(file, type, filename);
  }

  isReady(): boolean {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  getClientInfo(): WhatsAppClientInfo {
    return {
      type: 'real',
      phoneNumberId: this.phoneNumberId,
      isConfigured: this.isReady(),
      apiVersion: this.apiVersion,
    };
  }

  // Expose underlying services for advanced use cases
  getMessageService(): WhatsAppMessageService {
    return this.messageService;
  }

  getMediaService(): WhatsAppMediaService {
    return this.mediaService;
  }

  // Static utility methods (proxy to WhatsAppUtils)
  static validatePhoneNumber = WhatsAppUtils.validatePhoneNumber;
  static formatPhoneNumber = WhatsAppUtils.formatPhoneNumber;
  static validateMessageLength = WhatsAppUtils.validateMessageLength;
}
