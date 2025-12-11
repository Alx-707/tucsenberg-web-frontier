import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WhatsAppMessageService } from '../whatsapp-messages';

// Mock the logger to prevent console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('WhatsAppMessageService', () => {
  const mockAccessToken = 'test-access-token';
  const mockPhoneNumberId = 'test-phone-id';
  let service: WhatsAppMessageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WhatsAppMessageService(mockAccessToken, mockPhoneNumberId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provided credentials', () => {
      const instance = new WhatsAppMessageService('token', 'phone-id');
      expect(instance).toBeInstanceOf(WhatsAppMessageService);
    });
  });

  describe('sendMessage', () => {
    it('should return success response on successful API call', async () => {
      const mockResponse = { messages: [{ id: 'msg-123' }] };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }),
      );

      const result = await service.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1234567890',
        type: 'text',
        text: { body: 'Hello' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should call API with correct URL and headers', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1234567890',
        type: 'text',
      });

      expect(fetch).toHaveBeenCalledWith(
        `https://graph.facebook.com/v18.0/${mockPhoneNumberId}/messages`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('should return error response when API returns error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: () =>
            Promise.resolve({ error: { message: 'Invalid recipient' } }),
        }),
      );

      const result = await service.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: 'invalid',
        type: 'text',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recipient');
    });

    it('should return generic error when API error has no message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({}),
        }),
      );

      const result = await service.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1234567890',
        type: 'text',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send message');
    });

    it('should handle fetch exceptions', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      );

      const result = await service.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1234567890',
        type: 'text',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue('String error'));

      const result = await service.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1234567890',
        type: 'text',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('sendTextMessage', () => {
    it('should send text message with correct payload', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ messages: [{ id: 'msg-123' }] }),
        }),
      );

      await service.sendTextMessage('1234567890', 'Hello World');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '1234567890',
            type: 'text',
            text: {
              body: 'Hello World',
              preview_url: false,
            },
          }),
        }),
      );
    });

    it('should enable URL preview when specified', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendTextMessage(
        '1234567890',
        'Check out https://example.com',
        true,
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"preview_url":true'),
        }),
      );
    });

    it('should return service response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ messages: [{ id: 'msg-456' }] }),
        }),
      );

      const result = await service.sendTextMessage('1234567890', 'Test');

      expect(result.success).toBe(true);
    });
  });

  describe('sendImageMessage', () => {
    it('should send image message with URL', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendImageMessage(
        '1234567890',
        'https://example.com/image.jpg',
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '1234567890',
            type: 'image',
            image: {
              link: 'https://example.com/image.jpg',
            },
          }),
        }),
      );
    });

    it('should include caption when provided', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendImageMessage(
        '1234567890',
        'https://example.com/image.jpg',
        'Image caption',
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"caption":"Image caption"'),
        }),
      );
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send template message with basic payload', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendTemplateMessage({
        to: '1234567890',
        templateName: 'hello_world',
        languageCode: 'en_US',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: '1234567890',
            type: 'template',
            template: {
              name: 'hello_world',
              language: {
                code: 'en_US',
                policy: 'deterministic',
              },
            },
          }),
        }),
      );
    });

    it('should include parameters when provided', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendTemplateMessage({
        to: '1234567890',
        templateName: 'greeting',
        languageCode: 'en_US',
        parameters: ['John', 'Doe'],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.template.components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'John' },
            { type: 'text', text: 'Doe' },
          ],
        },
      ]);
    });

    it('should not include components when parameters is empty', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendTemplateMessage({
        to: '1234567890',
        templateName: 'hello_world',
        languageCode: 'en_US',
        parameters: [],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.template.components).toBeUndefined();
    });
  });

  describe('sendButtonMessage', () => {
    it('should send button message with required fields', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendButtonMessage({
        to: '1234567890',
        bodyText: 'Choose an option',
        buttons: [
          { id: 'btn1', title: 'Option 1' },
          { id: 'btn2', title: 'Option 2' },
        ],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.type).toBe('interactive');
      expect(body.interactive.type).toBe('button');
      expect(body.interactive.body.text).toBe('Choose an option');
      expect(body.interactive.action.buttons).toHaveLength(2);
    });

    it('should format buttons correctly', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendButtonMessage({
        to: '1234567890',
        bodyText: 'Test',
        buttons: [{ id: 'yes', title: 'Yes' }],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.action.buttons[0]).toEqual({
        type: 'reply',
        reply: {
          id: 'yes',
          title: 'Yes',
        },
      });
    });

    it('should include header when provided', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendButtonMessage({
        to: '1234567890',
        bodyText: 'Body',
        buttons: [{ id: 'btn1', title: 'OK' }],
        headerText: 'Header Text',
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.header).toEqual({
        type: 'text',
        text: 'Header Text',
      });
    });

    it('should include footer when provided', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendButtonMessage({
        to: '1234567890',
        bodyText: 'Body',
        buttons: [{ id: 'btn1', title: 'OK' }],
        footerText: 'Footer Text',
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.footer).toEqual({
        text: 'Footer Text',
      });
    });

    it('should not include header or footer when not provided', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendButtonMessage({
        to: '1234567890',
        bodyText: 'Body',
        buttons: [{ id: 'btn1', title: 'OK' }],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.header).toBeUndefined();
      expect(body.interactive.footer).toBeUndefined();
    });
  });

  describe('sendListMessage', () => {
    it('should send list message with required fields', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendListMessage({
        to: '1234567890',
        bodyText: 'Select an item',
        buttonText: 'View Options',
        sections: [
          {
            title: 'Section 1',
            rows: [
              { id: 'item1', title: 'Item 1' },
              { id: 'item2', title: 'Item 2', description: 'Description' },
            ],
          },
        ],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.type).toBe('interactive');
      expect(body.interactive.type).toBe('list');
      expect(body.interactive.body.text).toBe('Select an item');
      expect(body.interactive.action.button).toBe('View Options');
    });

    it('should format sections correctly', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendListMessage({
        to: '1234567890',
        bodyText: 'Test',
        buttonText: 'Menu',
        sections: [
          {
            title: 'Products',
            rows: [{ id: 'p1', title: 'Product 1' }],
          },
          {
            rows: [{ id: 'p2', title: 'Product 2' }],
          },
        ],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.action.sections).toHaveLength(2);
      expect(body.interactive.action.sections[0].title).toBe('Products');
      expect(body.interactive.action.sections[1].title).toBe('');
    });

    it('should include header from options', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendListMessage({
        to: '1234567890',
        bodyText: 'Body',
        buttonText: 'Menu',
        sections: [{ rows: [{ id: 'r1', title: 'Row' }] }],
        options: { headerText: 'Header' },
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.header).toEqual({
        type: 'text',
        text: 'Header',
      });
    });

    it('should include footer from options', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendListMessage({
        to: '1234567890',
        bodyText: 'Body',
        buttonText: 'Menu',
        sections: [{ rows: [{ id: 'r1', title: 'Row' }] }],
        options: { footerText: 'Footer' },
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.footer).toEqual({
        text: 'Footer',
      });
    });

    it('should handle multiple sections with rows', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      await service.sendListMessage({
        to: '1234567890',
        bodyText: 'Menu',
        buttonText: 'View',
        sections: [
          {
            title: 'Category A',
            rows: [
              { id: 'a1', title: 'A1', description: 'Desc A1' },
              { id: 'a2', title: 'A2' },
            ],
          },
          {
            title: 'Category B',
            rows: [{ id: 'b1', title: 'B1' }],
          },
        ],
      });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.interactive.action.sections[0].rows).toHaveLength(2);
      expect(body.interactive.action.sections[1].rows).toHaveLength(1);
    });
  });
});
