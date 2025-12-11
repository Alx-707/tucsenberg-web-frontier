import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import after mocks are set up
import {
  getWhatsAppService,
  sendWhatsAppMessage,
  WhatsAppService,
} from '../whatsapp';

// Use vi.hoisted for mocks that need to be defined before module loading
const mockMessages = vi.hoisted(() => ({
  text: vi.fn().mockResolvedValue({ messages: [{ id: 'msg-123' }] }),
  template: vi.fn().mockResolvedValue({ messages: [{ id: 'msg-456' }] }),
}));

const mockEnv = vi.hoisted(() => ({
  WHATSAPP_ACCESS_TOKEN: 'test-token',
  WHATSAPP_PHONE_NUMBER_ID: '12345678',
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
}));

vi.mock('@/lib/env', () => ({
  env: mockEnv,
}));

vi.mock('whatsapp', () => ({
  default: class MockWhatsApp {
    messages = mockMessages;
    token?: string;
    constructor() {
      // WhatsApp constructor
    }
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

describe('whatsapp module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations to defaults
    mockMessages.text.mockResolvedValue({ messages: [{ id: 'msg-123' }] });
    mockMessages.template.mockResolvedValue({ messages: [{ id: 'msg-456' }] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WhatsAppService', () => {
    describe('constructor', () => {
      it('should create instance when access token is provided', () => {
        const service = new WhatsAppService();
        expect(service).toBeInstanceOf(WhatsAppService);
      });

      // Note: Testing missing access token requires module reload which is complex
      // The validation is tested by the implementation itself
    });

    describe('sendTextMessage', () => {
      it('should send text message successfully', async () => {
        const service = new WhatsAppService();
        const result = await service.sendTextMessage(
          '1234567890',
          'Hello World',
        );

        expect(result).toEqual({ messages: [{ id: 'msg-123' }] });
      });

      it('should call WhatsApp client with correct parameters', async () => {
        const service = new WhatsAppService();
        await service.sendTextMessage('1234567890', 'Test message');

        expect(mockMessages.text).toHaveBeenCalledWith(
          { body: 'Test message' },
          1234567890,
        );
      });

      it('should handle and rethrow errors', async () => {
        mockMessages.text.mockRejectedValueOnce(new Error('API Error'));

        const service = new WhatsAppService();

        await expect(
          service.sendTextMessage('1234567890', 'Test'),
        ).rejects.toThrow('API Error');
      });

      it('should handle non-Error objects in catch', async () => {
        mockMessages.text.mockRejectedValueOnce('String error');

        const service = new WhatsAppService();

        await expect(
          service.sendTextMessage('1234567890', 'Test'),
        ).rejects.toBe('String error');
      });
    });

    describe('sendTemplateMessage', () => {
      it('should send template message successfully', async () => {
        const service = new WhatsAppService();
        const result = await service.sendTemplateMessage({
          to: '1234567890',
          templateName: 'hello_world',
          languageCode: 'en',
        });

        expect(result).toEqual({ messages: [{ id: 'msg-456' }] });
      });

      it('should call WhatsApp client with correct template structure', async () => {
        const service = new WhatsAppService();
        await service.sendTemplateMessage({
          to: '1234567890',
          templateName: 'greeting',
          languageCode: 'en_US',
        });

        expect(mockMessages.template).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'greeting',
            language: {
              policy: 'deterministic',
              code: 'en_US',
            },
          }),
          1234567890,
        );
      });

      it('should include components when provided', async () => {
        const components = [
          { type: 'body', parameters: [{ type: 'text', text: 'John' }] },
        ];

        const service = new WhatsAppService();
        await service.sendTemplateMessage({
          to: '1234567890',
          templateName: 'greeting',
          languageCode: 'en',
          components,
        });

        expect(mockMessages.template).toHaveBeenCalledWith(
          expect.objectContaining({
            components,
          }),
          1234567890,
        );
      });

      it('should not include components when empty array', async () => {
        const service = new WhatsAppService();
        await service.sendTemplateMessage({
          to: '1234567890',
          templateName: 'hello',
          languageCode: 'en',
          components: [],
        });

        const callArg = mockMessages.template.mock.calls[0][0];
        expect(callArg.components).toBeUndefined();
      });

      it('should handle template errors', async () => {
        mockMessages.template.mockRejectedValueOnce(
          new Error('Template not found'),
        );

        const service = new WhatsAppService();

        await expect(
          service.sendTemplateMessage({
            to: '1234567890',
            templateName: 'nonexistent',
            languageCode: 'en',
          }),
        ).rejects.toThrow('Template not found');
      });

      it('should use default language code when not provided', async () => {
        const service = new WhatsAppService();
        await service.sendTemplateMessage({
          to: '1234567890',
          templateName: 'hello',
        });

        expect(mockMessages.template).toHaveBeenCalledWith(
          expect.objectContaining({
            language: {
              policy: 'deterministic',
              code: 'en',
            },
          }),
          1234567890,
        );
      });
    });

    describe('verifyWebhook', () => {
      it('should return challenge when mode is subscribe and token matches', () => {
        const service = new WhatsAppService();
        const result = service.verifyWebhook(
          'subscribe',
          'verify-token',
          'challenge-123',
        );

        expect(result).toBe('challenge-123');
      });

      it('should return null when mode is not subscribe', () => {
        const service = new WhatsAppService();
        const result = service.verifyWebhook(
          'unsubscribe',
          'verify-token',
          'challenge-123',
        );

        expect(result).toBeNull();
      });

      it('should return null when token does not match', () => {
        const service = new WhatsAppService();
        const result = service.verifyWebhook(
          'subscribe',
          'wrong-token',
          'challenge-123',
        );

        expect(result).toBeNull();
      });
    });

    describe('handleIncomingMessage', () => {
      it('should return success for valid message with text', async () => {
        const service = new WhatsAppService();
        const body = {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: '1234567890',
                        text: { body: 'hello' },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        const result = await service.handleIncomingMessage(body);

        expect(result).toEqual({ success: true });
      });

      it('should return success without auto-reply for message without text', async () => {
        const service = new WhatsAppService();
        const body = {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: '1234567890',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        const result = await service.handleIncomingMessage(body);

        expect(result).toEqual({ success: true });
        // Should not send auto-reply for messages without text
        expect(mockMessages.text).not.toHaveBeenCalled();
      });

      it('should return success for empty entry', async () => {
        const service = new WhatsAppService();
        const body = { entry: [] };

        const result = await service.handleIncomingMessage(body);

        expect(result).toEqual({ success: true });
      });

      it('should return success for missing entry', async () => {
        const service = new WhatsAppService();
        const body = {};

        const result = await service.handleIncomingMessage(body);

        expect(result).toEqual({ success: true });
      });

      it('should return success for empty changes', async () => {
        const service = new WhatsAppService();
        const body = { entry: [{ changes: [] }] };

        const result = await service.handleIncomingMessage(body);

        expect(result).toEqual({ success: true });
      });

      it('should return success for empty messages', async () => {
        const service = new WhatsAppService();
        const body = {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [],
                  },
                },
              ],
            },
          ],
        };

        const result = await service.handleIncomingMessage(body);

        expect(result).toEqual({ success: true });
      });

      it('should handle invalid webhook body', async () => {
        const service = new WhatsAppService();
        const body = 'invalid';

        const result = await service.handleIncomingMessage(body);

        expect(result).toEqual({ success: true });
      });

      it('should handle errors and rethrow', async () => {
        mockMessages.text.mockRejectedValueOnce(new Error('Network error'));

        const service = new WhatsAppService();
        const body = {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [{ from: '123', text: { body: 'hello' } }],
                  },
                },
              ],
            },
          ],
        };

        await expect(service.handleIncomingMessage(body)).rejects.toThrow(
          'Network error',
        );
      });
    });

    describe('auto-reply logic', () => {
      it('should reply with greeting for hello message', async () => {
        const service = new WhatsAppService();
        await service.handleIncomingMessage({
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

        expect(mockMessages.text).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.stringContaining('Hello'),
          }),
          123,
        );
      });

      it('should reply with greeting for hi message', async () => {
        const service = new WhatsAppService();
        await service.handleIncomingMessage({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [{ from: '123', text: { body: 'Hi there' } }],
                  },
                },
              ],
            },
          ],
        });

        expect(mockMessages.text).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.stringContaining('Hello'),
          }),
          123,
        );
      });

      it('should reply with help message for help request', async () => {
        const service = new WhatsAppService();
        await service.handleIncomingMessage({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [{ from: '123', text: { body: 'I need help' } }],
                  },
                },
              ],
            },
          ],
        });

        expect(mockMessages.text).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.stringContaining('help'),
          }),
          123,
        );
      });

      it('should reply with pricing info for price inquiry', async () => {
        const service = new WhatsAppService();
        await service.handleIncomingMessage({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      { from: '123', text: { body: "What's the price?" } },
                    ],
                  },
                },
              ],
            },
          ],
        });

        expect(mockMessages.text).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.stringContaining('pricing'),
          }),
          123,
        );
      });

      it('should reply with pricing info for cost inquiry', async () => {
        const service = new WhatsAppService();
        await service.handleIncomingMessage({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      { from: '123', text: { body: 'How much cost?' } },
                    ],
                  },
                },
              ],
            },
          ],
        });

        expect(mockMessages.text).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.stringContaining('pricing'),
          }),
          123,
        );
      });

      it('should reply with default message for other messages', async () => {
        const service = new WhatsAppService();
        await service.handleIncomingMessage({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      { from: '123', text: { body: 'Random message here' } },
                    ],
                  },
                },
              ],
            },
          ],
        });

        expect(mockMessages.text).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.stringContaining('Thank you'),
          }),
          123,
        );
      });
    });
  });

  describe('getWhatsAppService', () => {
    it('should return a WhatsAppService instance', () => {
      const service = getWhatsAppService();
      expect(service).toBeInstanceOf(WhatsAppService);
    });

    it('should return the same instance on subsequent calls', () => {
      const service1 = getWhatsAppService();
      const service2 = getWhatsAppService();
      expect(service1).toBe(service2);
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('should send text message', async () => {
      const result = await sendWhatsAppMessage({
        to: '1234567890',
        type: 'text',
        content: {
          body: 'Test message',
        },
      });

      expect(result).toBeDefined();
      expect(mockMessages.text).toHaveBeenCalled();
    });

    it('should send template message', async () => {
      const result = await sendWhatsAppMessage({
        to: '1234567890',
        type: 'template',
        content: {
          templateName: 'hello_world',
          languageCode: 'en',
        },
      });

      expect(result).toBeDefined();
      expect(mockMessages.template).toHaveBeenCalled();
    });

    it('should throw error for unsupported message type', () => {
      expect(() =>
        sendWhatsAppMessage({
          to: '1234567890',
          type: 'media' as 'text',
          content: {},
        }),
      ).toThrow('Unsupported message type: media');
    });

    it('should include template components when provided', async () => {
      await sendWhatsAppMessage({
        to: '1234567890',
        type: 'template',
        content: {
          templateName: 'greeting',
          languageCode: 'en',
          components: [{ type: 'body' }],
        },
      });

      expect(mockMessages.template).toHaveBeenCalledWith(
        expect.objectContaining({
          components: [{ type: 'body' }],
        }),
        1234567890,
      );
    });

    it('should not include components for empty array', async () => {
      await sendWhatsAppMessage({
        to: '1234567890',
        type: 'template',
        content: {
          templateName: 'greeting',
          languageCode: 'en',
          components: [],
        },
      });

      const callArg = mockMessages.template.mock.calls[0][0];
      expect(callArg.components).toBeUndefined();
    });
  });
});
