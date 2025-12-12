/**
 * WhatsApp Client Interface for Dependency Injection
 *
 * Provides a unified interface for WhatsApp API clients,
 * enabling easy swapping between real and mock implementations.
 */

import type {
  SendMessageRequest,
  WhatsAppServiceResponse,
} from '@/types/whatsapp';

/**
 * WhatsApp Client Interface
 * Core contract for all WhatsApp client implementations
 */
export interface WhatsAppClient {
  /**
   * Send a WhatsApp message
   * @param message - The message request payload
   * @returns Response with success status and optional data/error
   */
  sendMessage(message: SendMessageRequest): Promise<WhatsAppServiceResponse>;

  /**
   * Send a text message
   * @param to - Recipient phone number
   * @param text - Message text content
   * @param previewUrl - Whether to show URL previews
   */
  sendTextMessage(
    to: string,
    text: string,
    previewUrl?: boolean,
  ): Promise<WhatsAppServiceResponse>;

  /**
   * Send an image message
   * @param to - Recipient phone number
   * @param imageUrl - URL of the image to send
   * @param caption - Optional image caption
   */
  sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WhatsAppServiceResponse>;

  /**
   * Send a template message
   * @param args - Template message parameters
   */
  sendTemplateMessage(args: {
    to: string;
    templateName: string;
    languageCode: string;
    parameters?: string[];
  }): Promise<WhatsAppServiceResponse>;

  /**
   * Send an interactive button message
   * @param args - Button message parameters
   */
  sendButtonMessage(args: {
    to: string;
    bodyText: string;
    buttons: Array<{ id: string; title: string }>;
    headerText?: string;
    footerText?: string;
  }): Promise<WhatsAppServiceResponse>;

  /**
   * Send a list message
   * @param args - List message parameters
   */
  sendListMessage(args: {
    to: string;
    bodyText: string;
    buttonText: string;
    sections: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    options?: { headerText?: string; footerText?: string };
  }): Promise<WhatsAppServiceResponse>;

  /**
   * Get media URL from media ID
   * @param mediaId - The media identifier
   * @returns Media URL or null if not found
   */
  getMediaUrl(mediaId: string): Promise<string | null>;

  /**
   * Download media content
   * @param mediaId - The media identifier
   * @returns Buffer with media content or null
   */
  downloadMedia(mediaId: string): Promise<Buffer | null>;

  /**
   * Upload media file
   * @param file - File buffer or blob
   * @param type - Media type
   * @param filename - Optional filename
   * @returns Media ID or null on failure
   */
  uploadMedia(
    file: Buffer | Blob,
    type: 'image' | 'document' | 'audio' | 'video' | 'sticker',
    filename?: string,
  ): Promise<string | null>;

  /**
   * Check if the client is properly configured and ready
   * @returns True if client can make API calls
   */
  isReady(): boolean;

  /**
   * Get client configuration info (for debugging)
   */
  getClientInfo(): WhatsAppClientInfo;
}

/**
 * Client information for debugging and monitoring
 */
export interface WhatsAppClientInfo {
  type: 'real' | 'mock';
  phoneNumberId: string;
  isConfigured: boolean;
  apiVersion?: string;
}

/**
 * Configuration for creating WhatsApp clients
 */
export interface WhatsAppClientConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
}

/**
 * Environment type for client selection
 */
export type WhatsAppEnvironment = 'production' | 'development' | 'test';
