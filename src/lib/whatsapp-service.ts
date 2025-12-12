/**
 * WhatsApp Business API Service - Unified Export Entry Point
 *
 * Provides complete WhatsApp messaging functionality including:
 * - Message sending (text, template, media, interactive)
 * - Webhook handling and auto-reply
 * - Webhook signature verification
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import type { SendMessageRequest } from '@/types/whatsapp';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { WhatsAppService } from '@/lib/whatsapp-core';
import { resetWhatsAppClient } from '@/lib/whatsapp/client-factory';

// Re-export core service and client utilities
export { WhatsAppService } from '@/lib/whatsapp-core';
export { WhatsAppMessageService } from '@/lib/whatsapp-messages';
export { WhatsAppMediaService } from '@/lib/whatsapp-media';
export { WhatsAppUtils } from '@/lib/whatsapp-utils';
export type {
  SendMessageRequest,
  WhatsAppServiceResponse,
} from '@/types/whatsapp';

// Re-export client factory functions
export {
  getWhatsAppClient,
  resetWhatsAppClient,
  isMockClient,
  getClientEnvironmentInfo,
} from '@/lib/whatsapp/client-factory';

// ==================== Webhook Schema ====================

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

// ==================== Webhook Processing ====================

interface IncomingMessage {
  from: string;
  text?: { body: string } | undefined;
}

/**
 * Extract incoming message from webhook payload
 */
function extractIncomingMessage(body: unknown): IncomingMessage | null {
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

  return messages[0] ?? null;
}

/**
 * Generate auto-reply based on incoming message content
 */
function generateAutoReply(receivedMessage: string): string {
  const lowerMessage = receivedMessage.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'Hello! Thank you for contacting us. How can we help you today?';
  }

  if (lowerMessage.includes('help')) {
    return "We're here to help! Please describe your question or concern.";
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return 'For pricing information, please visit our website or contact our sales team.';
  }

  return 'Thank you for your message. Our team will get back to you soon!';
}

// ==================== Unified Service Instance ====================

let whatsappServiceInstance: WhatsAppService | null = null;

/**
 * Get WhatsApp Service singleton
 */
export function getWhatsAppService(): WhatsAppService {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService();
  }
  return whatsappServiceInstance;
}

/**
 * Reset the WhatsApp Service singleton
 */
export function resetWhatsAppService(): void {
  whatsappServiceInstance = null;
  resetWhatsAppClient();
}

// ==================== Webhook Handlers ====================

/**
 * Verify webhook subscription request
 */
export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string,
): string | null {
  if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

/**
 * Verify webhook signature from Meta
 *
 * @param payload - Raw request body
 * @param signature - X-Hub-Signature-256 header value
 * @param appSecret - WhatsApp App Secret for HMAC verification
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string | null,
  appSecret?: string,
): boolean {
  // Skip verification if no signature provided (for local dev)
  if (!signature) {
    logger.warn(
      '[WebhookSignature] No signature provided, skipping verification',
    );
    return !env.NODE_ENV || env.NODE_ENV !== 'production';
  }

  const secret = appSecret || process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    logger.warn('[WebhookSignature] No app secret configured');
    return env.NODE_ENV !== 'production';
  }

  try {
    // Signature format: sha256=<hash>
    const [algorithm, providedHash] = signature.split('=');
    if (algorithm !== 'sha256' || !providedHash) {
      return false;
    }

    const payloadBuffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload, 'utf8');
    const expectedHash = createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(providedHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  } catch (error) {
    logger.error(
      '[WebhookSignature] Verification failed',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    return false;
  }
}

/**
 * Handle incoming WhatsApp message with auto-reply
 */
export async function handleIncomingMessage(
  body: unknown,
  enableAutoReply: boolean = true,
): Promise<{ success: boolean; autoReplySent?: boolean }> {
  try {
    const message = extractIncomingMessage(body);
    if (!message) {
      return { success: true };
    }

    const { from } = message;
    const messageBody = message.text?.body;

    logger.info(
      `[WhatsAppWebhook] Received message from ${from}: ${messageBody?.substring(0, 50)}`,
    );

    if (enableAutoReply && messageBody) {
      const replyMessage = generateAutoReply(messageBody);
      const service = getWhatsAppService();

      const result = await service.sendTextMessage(from, replyMessage);

      if (result.success) {
        logger.info(`[WhatsAppWebhook] Auto-reply sent to ${from}`);
        return { success: true, autoReplySent: true };
      }

      logger.warn(
        `[WhatsAppWebhook] Failed to send auto-reply: ${result.error}`,
      );
      return { success: true, autoReplySent: false };
    }

    return { success: true };
  } catch (error) {
    logger.error(
      '[WhatsAppWebhook] Failed to handle incoming message',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

// ==================== Convenience Functions ====================

/**
 * Send a WhatsApp message
 */
export function sendWhatsAppMessage(message: SendMessageRequest) {
  return getWhatsAppService().sendMessage(message);
}

/**
 * Send a text message
 */
export function sendWhatsAppText(
  to: string,
  text: string,
  previewUrl?: boolean,
) {
  return getWhatsAppService().sendTextMessage(to, text, previewUrl);
}

/**
 * Send an image message
 */
export function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption?: string,
) {
  return getWhatsAppService().sendImageMessage(to, imageUrl, caption);
}

/**
 * Send a template message
 */
export function sendWhatsAppTemplate(args: {
  to: string;
  templateName: string;
  languageCode: string;
  parameters?: string[];
}) {
  return getWhatsAppService().sendTemplateMessage(args);
}
