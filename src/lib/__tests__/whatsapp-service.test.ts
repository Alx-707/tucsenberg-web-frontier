import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  sendWhatsAppImage,
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendWhatsAppText,
  WhatsAppMediaService,
  WhatsAppMessageService,
  WhatsAppService,
  WhatsAppUtils,
} from '../whatsapp-service';

// Mock the core service module
const mockServiceMethods = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  sendTextMessage: vi.fn(),
  sendImageMessage: vi.fn(),
  sendTemplateMessage: vi.fn(),
}));

vi.mock('@/lib/whatsapp-core', () => ({
  WhatsAppService: class MockWhatsAppService {
    sendMessage = mockServiceMethods.sendMessage;
    sendTextMessage = mockServiceMethods.sendTextMessage;
    sendImageMessage = mockServiceMethods.sendImageMessage;
    sendTemplateMessage = mockServiceMethods.sendTemplateMessage;
    constructor() {}
  },
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
    mockServiceMethods.sendMessage.mockResolvedValue({ success: true });
    mockServiceMethods.sendTextMessage.mockResolvedValue({ success: true });
    mockServiceMethods.sendImageMessage.mockResolvedValue({ success: true });
    mockServiceMethods.sendTemplateMessage.mockResolvedValue({ success: true });
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

  describe('sendWhatsAppMessage', () => {
    it('should send a message using the service singleton', async () => {
      const message = {
        to: '1234567890',
        type: 'text' as const,
        text: 'Hello World',
      };

      await sendWhatsAppMessage(message);

      expect(mockServiceMethods.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should return the service response', async () => {
      const expectedResponse = { success: true, messageId: 'msg-123' };
      mockServiceMethods.sendMessage.mockResolvedValue(expectedResponse);

      const message = {
        to: '1234567890',
        type: 'text' as const,
        text: 'Hello',
      };

      const result = await sendWhatsAppMessage(message);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sendWhatsAppText', () => {
    it('should send text message with required params', async () => {
      await sendWhatsAppText('1234567890', 'Hello World');

      expect(mockServiceMethods.sendTextMessage).toHaveBeenCalledWith(
        '1234567890',
        'Hello World',
        undefined,
      );
    });

    it('should send text message with preview URL option', async () => {
      await sendWhatsAppText('1234567890', 'Check this link', true);

      expect(mockServiceMethods.sendTextMessage).toHaveBeenCalledWith(
        '1234567890',
        'Check this link',
        true,
      );
    });

    it('should return the service response', async () => {
      const expectedResponse = { success: true };
      mockServiceMethods.sendTextMessage.mockResolvedValue(expectedResponse);

      const result = await sendWhatsAppText('1234567890', 'Hello');

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sendWhatsAppImage', () => {
    it('should send image message with required params', async () => {
      await sendWhatsAppImage('1234567890', 'https://example.com/image.jpg');

      expect(mockServiceMethods.sendImageMessage).toHaveBeenCalledWith(
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

      expect(mockServiceMethods.sendImageMessage).toHaveBeenCalledWith(
        '1234567890',
        'https://example.com/image.jpg',
        'Look at this!',
      );
    });

    it('should return the service response', async () => {
      const expectedResponse = { success: true };
      mockServiceMethods.sendImageMessage.mockResolvedValue(expectedResponse);

      const result = await sendWhatsAppImage(
        '1234567890',
        'https://example.com/image.jpg',
      );

      expect(result).toEqual(expectedResponse);
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

      expect(mockServiceMethods.sendTemplateMessage).toHaveBeenCalledWith(args);
    });

    it('should send template message with parameters', async () => {
      const args = {
        to: '1234567890',
        templateName: 'order_confirmation',
        languageCode: 'en',
        parameters: ['Order #123', '$50.00'],
      };

      await sendWhatsAppTemplate(args);

      expect(mockServiceMethods.sendTemplateMessage).toHaveBeenCalledWith(args);
    });

    it('should return the service response', async () => {
      const expectedResponse = { success: true };
      mockServiceMethods.sendTemplateMessage.mockResolvedValue(
        expectedResponse,
      );

      const args = {
        to: '1234567890',
        templateName: 'welcome',
        languageCode: 'en',
      };

      const result = await sendWhatsAppTemplate(args);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('singleton behavior', () => {
    it('should reuse the same service instance across calls', async () => {
      // Make multiple calls
      await sendWhatsAppText('111', 'First');
      await sendWhatsAppText('222', 'Second');
      await sendWhatsAppText('333', 'Third');

      // All calls should go through the same mock methods
      expect(mockServiceMethods.sendTextMessage).toHaveBeenCalledTimes(3);
    });

    it('should work with different convenience functions', async () => {
      await sendWhatsAppText('111', 'Text');
      await sendWhatsAppImage('222', 'https://example.com/img.jpg');
      await sendWhatsAppTemplate({
        to: '333',
        templateName: 'test',
        languageCode: 'en',
      });

      expect(mockServiceMethods.sendTextMessage).toHaveBeenCalledTimes(1);
      expect(mockServiceMethods.sendImageMessage).toHaveBeenCalledTimes(1);
      expect(mockServiceMethods.sendTemplateMessage).toHaveBeenCalledTimes(1);
    });
  });
});
