import { createHmac } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getWhatsAppService,
  handleIncomingMessage,
  resetWhatsAppService,
  sendWhatsAppImage,
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendWhatsAppText,
  verifyWebhook,
  verifyWebhookSignature,
  WhatsAppMediaService,
  WhatsAppMessageService,
  WhatsAppService,
  WhatsAppUtils,
} from '../whatsapp-service';

// Mock dependencies using hoisted pattern
const mockClient = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  sendTextMessage: vi.fn(),
  sendImageMessage: vi.fn(),
  sendTemplateMessage: vi.fn(),
  sendButtonMessage: vi.fn(),
  sendListMessage: vi.fn(),
  getMediaUrl: vi.fn(),
  downloadMedia: vi.fn(),
  uploadMedia: vi.fn(),
  isReady: vi.fn().mockReturnValue(true),
  getClientInfo: vi
    .fn()
    .mockReturnValue({ type: 'mock', phoneNumberId: 'test' }),
}));

const mockEnv = vi.hoisted(() => ({
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
  NODE_ENV: 'test',
}));

vi.mock('@/lib/env', () => ({
  env: mockEnv,
}));

vi.mock('@/lib/whatsapp/client-factory', () => ({
  getWhatsAppClient: () => mockClient,
  resetWhatsAppClient: vi.fn(),
  isMockClient: vi.fn().mockReturnValue(true),
  getClientEnvironmentInfo: vi.fn().mockReturnValue({
    environment: 'test',
    clientType: 'mock',
    hasCredentials: false,
  }),
}));

vi.mock('@/lib/whatsapp-messages', () => ({
  WhatsAppMessageService: class MockWhatsAppMessageService {
    constructor() {}
  },
}));

vi.mock('@/lib/whatsapp-media', () => ({
  WhatsAppMediaService: class MockWhatsAppMediaService {
    constructor() {}
  },
}));

vi.mock('@/lib/whatsapp-utils', () => ({
  WhatsAppUtils: {
    validatePhoneNumber: vi.fn().mockReturnValue(true),
    formatPhoneNumber: vi.fn().mockReturnValue('1234567890'),
    validateMessageLength: vi.fn().mockReturnValue(true),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('WhatsApp Service Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockClient.sendMessage.mockResolvedValue({ success: true });
    mockClient.sendTextMessage.mockResolvedValue({ success: true });
    mockClient.sendImageMessage.mockResolvedValue({ success: true });
    mockClient.sendTemplateMessage.mockResolvedValue({ success: true });
    resetWhatsAppService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('re-exports', () => {
    it('should export WhatsAppService class', () => {
      expect(WhatsAppService).toBeDefined();
      expect(typeof WhatsAppService).toBe('function');
    });

    it('should export WhatsAppMessageService class', () => {
      expect(WhatsAppMessageService).toBeDefined();
      expect(typeof WhatsAppMessageService).toBe('function');
    });

    it('should export WhatsAppMediaService class', () => {
      expect(WhatsAppMediaService).toBeDefined();
      expect(typeof WhatsAppMediaService).toBe('function');
    });

    it('should export WhatsAppUtils object', () => {
      expect(WhatsAppUtils).toBeDefined();
      expect(typeof WhatsAppUtils.validatePhoneNumber).toBe('function');
    });
  });

  describe('verifyWebhook', () => {
    it('should return challenge when mode is subscribe and token matches', () => {
      const result = verifyWebhook(
        'subscribe',
        'verify-token',
        'challenge-123',
      );
      expect(result).toBe('challenge-123');
    });

    it('should return null when mode is not subscribe', () => {
      const result = verifyWebhook(
        'unsubscribe',
        'verify-token',
        'challenge-123',
      );
      expect(result).toBeNull();
    });

    it('should return null when token does not match', () => {
      const result = verifyWebhook('subscribe', 'wrong-token', 'challenge-123');
      expect(result).toBeNull();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true in test mode without signature', () => {
      const result = verifyWebhookSignature('payload', null);
      expect(result).toBe(true);
    });

    it('should verify valid signature', () => {
      const payload = '{"test": "data"}';
      const secret = 'test-secret';
      const hash = createHmac('sha256', secret).update(payload).digest('hex');
      const signature = `sha256=${hash}`;

      const result = verifyWebhookSignature(payload, signature, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"test": "data"}';
      const signature = 'sha256=invalid-hash';

      const result = verifyWebhookSignature(payload, signature, 'secret');
      expect(result).toBe(false);
    });

    it('should reject invalid algorithm', () => {
      const result = verifyWebhookSignature('payload', 'md5=hash', 'secret');
      expect(result).toBe(false);
    });
  });

  describe('handleIncomingMessage', () => {
    it('should return success for valid message with text and auto-reply', async () => {
      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: '1234567890', text: { body: 'hello' } }],
                },
              },
            ],
          },
        ],
      };

      const result = await handleIncomingMessage(body);
      expect(result.success).toBe(true);
      expect(result.autoReplySent).toBe(true);
      expect(mockClient.sendTextMessage).toHaveBeenCalled();
    });

    it('should return success without auto-reply when disabled', async () => {
      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: '1234567890', text: { body: 'hello' } }],
                },
              },
            ],
          },
        ],
      };

      const result = await handleIncomingMessage(body, false);
      expect(result.success).toBe(true);
      expect(result.autoReplySent).toBeUndefined();
      expect(mockClient.sendTextMessage).not.toHaveBeenCalled();
    });

    it('should return success for empty entry', async () => {
      const result = await handleIncomingMessage({ entry: [] });
      expect(result.success).toBe(true);
    });

    it('should return success for invalid body', async () => {
      const result = await handleIncomingMessage('invalid');
      expect(result.success).toBe(true);
    });

    it('should send greeting reply for hello message', async () => {
      await handleIncomingMessage({
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: '123', text: { body: 'Hello' } }],
                },
              },
            ],
          },
        ],
      });

      expect(mockClient.sendTextMessage).toHaveBeenCalled();
      const callArgs = mockClient.sendTextMessage.mock.calls[0];
      expect(callArgs?.[0]).toBe('123');
      expect(callArgs?.[1]).toContain('Hello');
    });

    it('should send help reply for help message', async () => {
      await handleIncomingMessage({
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: '123', text: { body: 'help' } }],
                },
              },
            ],
          },
        ],
      });

      expect(mockClient.sendTextMessage).toHaveBeenCalled();
      const callArgs = mockClient.sendTextMessage.mock.calls[0];
      expect(callArgs?.[0]).toBe('123');
      expect(callArgs?.[1]).toContain('help');
    });

    it('should send pricing reply for price message', async () => {
      await handleIncomingMessage({
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: '123', text: { body: 'price' } }],
                },
              },
            ],
          },
        ],
      });

      expect(mockClient.sendTextMessage).toHaveBeenCalled();
      const callArgs = mockClient.sendTextMessage.mock.calls[0];
      expect(callArgs?.[0]).toBe('123');
      expect(callArgs?.[1]).toContain('pricing');
    });
  });

  describe('getWhatsAppService', () => {
    it('should return singleton instance', () => {
      const service1 = getWhatsAppService();
      const service2 = getWhatsAppService();
      expect(service1).toBe(service2);
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('should send a message using the service singleton', async () => {
      const message = {
        messaging_product: 'whatsapp' as const,
        recipient_type: 'individual' as const,
        to: '1234567890',
        type: 'text' as const,
        text: { body: 'Hello World' },
      };

      await sendWhatsAppMessage(message);
      expect(mockClient.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should return the service response', async () => {
      const expectedResponse = { success: true, messageId: 'msg-123' };
      mockClient.sendMessage.mockResolvedValue(expectedResponse);

      const message = {
        messaging_product: 'whatsapp' as const,
        recipient_type: 'individual' as const,
        to: '1234567890',
        type: 'text' as const,
        text: { body: 'Hello' },
      };

      const result = await sendWhatsAppMessage(message);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sendWhatsAppText', () => {
    it('should send text message with required params', async () => {
      await sendWhatsAppText('1234567890', 'Hello World');

      expect(mockClient.sendTextMessage).toHaveBeenCalledWith(
        '1234567890',
        'Hello World',
        undefined,
      );
    });

    it('should send text message with preview URL option', async () => {
      await sendWhatsAppText('1234567890', 'Check this link', true);

      expect(mockClient.sendTextMessage).toHaveBeenCalledWith(
        '1234567890',
        'Check this link',
        true,
      );
    });
  });

  describe('sendWhatsAppImage', () => {
    it('should send image message with required params', async () => {
      await sendWhatsAppImage('1234567890', 'https://example.com/image.jpg');

      expect(mockClient.sendImageMessage).toHaveBeenCalledWith(
        '1234567890',
        'https://example.com/image.jpg',
        undefined,
      );
    });

    it('should send image message with caption', async () => {
      await sendWhatsAppImage(
        '1234567890',
        'https://example.com/image.jpg',
        'Look at this!',
      );

      expect(mockClient.sendImageMessage).toHaveBeenCalledWith(
        '1234567890',
        'https://example.com/image.jpg',
        'Look at this!',
      );
    });
  });

  describe('sendWhatsAppTemplate', () => {
    it('should send template message with required params', async () => {
      const args = {
        to: '1234567890',
        templateName: 'welcome',
        languageCode: 'en',
      };

      await sendWhatsAppTemplate(args);
      expect(mockClient.sendTemplateMessage).toHaveBeenCalledWith(args);
    });

    it('should send template message with parameters', async () => {
      const args = {
        to: '1234567890',
        templateName: 'order_confirmation',
        languageCode: 'en',
        parameters: ['Order #123', '$50.00'],
      };

      await sendWhatsAppTemplate(args);
      expect(mockClient.sendTemplateMessage).toHaveBeenCalledWith(args);
    });
  });

  describe('singleton behavior', () => {
    it('should reuse the same service instance across calls', async () => {
      await sendWhatsAppText('111', 'First');
      await sendWhatsAppText('222', 'Second');
      await sendWhatsAppText('333', 'Third');

      expect(mockClient.sendTextMessage).toHaveBeenCalledTimes(3);
    });

    it('should work with different convenience functions', async () => {
      await sendWhatsAppText('111', 'Text');
      await sendWhatsAppImage('222', 'https://example.com/img.jpg');
      await sendWhatsAppTemplate({
        to: '333',
        templateName: 'test',
        languageCode: 'en',
      });

      expect(mockClient.sendTextMessage).toHaveBeenCalledTimes(1);
      expect(mockClient.sendImageMessage).toHaveBeenCalledTimes(1);
      expect(mockClient.sendTemplateMessage).toHaveBeenCalledTimes(1);
    });
  });
});
