/**
 * WhatsApp Business API Core Service
 *
 * Unified service class that provides a high-level API for WhatsApp operations.
 * Uses dependency injection for client selection (real vs mock).
 */

import type {
  SendMessageRequest,
  WhatsAppServiceResponse,
} from '@/types/whatsapp';
import { WhatsAppUtils } from '@/lib/whatsapp-utils';
import { getWhatsAppClient } from '@/lib/whatsapp/client-factory';
import type { WhatsAppClient } from '@/lib/whatsapp/client-interface';

/**
 * WhatsApp Core Service
 *
 * Provides a unified interface for WhatsApp operations with automatic
 * environment-based client selection (real in production, mock in dev/test).
 */
export class WhatsAppService {
  private readonly client: WhatsAppClient;

  /**
   * Create a new WhatsAppService instance
   *
   * @param client - Optional client to inject (for testing)
   */
  constructor(client?: WhatsAppClient) {
    this.client = client || getWhatsAppClient();
  }

  // ==================== Message Methods ====================

  sendMessage(message: SendMessageRequest): Promise<WhatsAppServiceResponse> {
    return this.client.sendMessage(message);
  }

  sendTextMessage(
    to: string,
    text: string,
    previewUrl?: boolean,
  ): Promise<WhatsAppServiceResponse> {
    return this.client.sendTextMessage(to, text, previewUrl);
  }

  sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WhatsAppServiceResponse> {
    return this.client.sendImageMessage(to, imageUrl, caption);
  }

  sendTemplateMessage(args: {
    to: string;
    templateName: string;
    languageCode: string;
    parameters?: string[];
  }): Promise<WhatsAppServiceResponse> {
    return this.client.sendTemplateMessage(args);
  }

  sendButtonMessage(args: {
    to: string;
    bodyText: string;
    buttons: Array<{ id: string; title: string }>;
    headerText?: string;
    footerText?: string;
  }): Promise<WhatsAppServiceResponse> {
    return this.client.sendButtonMessage(args);
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
    return this.client.sendListMessage(args);
  }

  // ==================== Media Methods ====================

  getMediaUrl(mediaId: string): Promise<string | null> {
    return this.client.getMediaUrl(mediaId);
  }

  downloadMedia(mediaId: string): Promise<Buffer | null> {
    return this.client.downloadMedia(mediaId);
  }

  uploadMedia(
    file: Buffer | Blob,
    type: 'image' | 'document' | 'audio' | 'video' | 'sticker',
    filename?: string,
  ): Promise<string | null> {
    return this.client.uploadMedia(file, type, filename);
  }

  // ==================== Utility Methods ====================

  /**
   * Check if the service is ready to send messages
   */
  isReady(): boolean {
    return this.client.isReady();
  }

  /**
   * Get client information for debugging
   */
  getClientInfo() {
    return this.client.getClientInfo();
  }

  /**
   * Get the underlying client (for advanced use cases)
   */
  getClient(): WhatsAppClient {
    return this.client;
  }

  // Static utility methods (proxy to WhatsAppUtils)
  static validatePhoneNumber = WhatsAppUtils.validatePhoneNumber;
  static formatPhoneNumber = WhatsAppUtils.formatPhoneNumber;
  static validateMessageLength = WhatsAppUtils.validateMessageLength;
}
