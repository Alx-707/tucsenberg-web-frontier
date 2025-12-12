import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import after mocks are set up
import { WhatsAppService } from '../whatsapp-core';
import { WhatsAppUtils } from '../whatsapp-utils';

// Mock dependencies using hoisted pattern for ESM compatibility
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
  isReady: vi.fn(),
  getClientInfo: vi.fn(),
}));

vi.mock('@/lib/whatsapp/client-factory', () => ({
  getWhatsAppClient: () => mockClient,
  createWhatsAppClient: () => mockClient,
  resetWhatsAppClient: vi.fn(),
  isMockClient: vi.fn().mockReturnValue(true),
  getClientEnvironmentInfo: vi.fn().mockReturnValue({
    environment: 'test',
    clientType: 'mock',
    hasCredentials: false,
  }),
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

describe('WhatsAppService (Core with DI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations with default return values
    mockClient.sendMessage.mockResolvedValue({ success: true });
    mockClient.sendTextMessage.mockResolvedValue({ success: true });
    mockClient.sendImageMessage.mockResolvedValue({ success: true });
    mockClient.sendTemplateMessage.mockResolvedValue({ success: true });
    mockClient.sendButtonMessage.mockResolvedValue({ success: true });
    mockClient.sendListMessage.mockResolvedValue({ success: true });
    mockClient.getMediaUrl.mockResolvedValue('https://cdn.example.com/media');
    mockClient.downloadMedia.mockResolvedValue(Buffer.from('test'));
    mockClient.uploadMedia.mockResolvedValue('media-123');
    mockClient.isReady.mockReturnValue(true);
    mockClient.getClientInfo.mockReturnValue({
      type: 'mock',
      phoneNumberId: 'test-phone-id',
      isConfigured: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance using default client from factory', () => {
      const instance = new WhatsAppService();
      expect(instance).toBeInstanceOf(WhatsAppService);
    });

    it('should accept injected client for testing', () => {
      const customClient = {
        ...mockClient,
        getClientInfo: vi.fn().mockReturnValue({ type: 'custom' }),
      };
      const instance = new WhatsAppService(customClient as never);
      expect(instance.getClientInfo()).toEqual({ type: 'custom' });
    });
  });

  describe('isReady', () => {
    it('should delegate to client isReady', () => {
      const service = new WhatsAppService();
      const result = service.isReady();
      expect(mockClient.isReady).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('getClientInfo', () => {
    it('should return client info', () => {
      const service = new WhatsAppService();
      const info = service.getClientInfo();
      expect(info.type).toBe('mock');
      expect(info.phoneNumberId).toBe('test-phone-id');
    });
  });

  describe('getClient', () => {
    it('should return the underlying client', () => {
      const service = new WhatsAppService();
      const client = service.getClient();
      expect(client).toBeDefined();
      expect(client.sendMessage).toBeDefined();
    });
  });

  describe('static utility methods', () => {
    it('should expose validatePhoneNumber', () => {
      WhatsAppService.validatePhoneNumber('1234567890');
      expect(WhatsAppUtils.validatePhoneNumber).toHaveBeenCalledWith(
        '1234567890',
      );
    });

    it('should expose formatPhoneNumber', () => {
      WhatsAppService.formatPhoneNumber('+1 (234) 567-8901');
      expect(WhatsAppUtils.formatPhoneNumber).toHaveBeenCalledWith(
        '+1 (234) 567-8901',
      );
    });

    it('should expose validateMessageLength', () => {
      WhatsAppService.validateMessageLength('test message');
      expect(WhatsAppUtils.validateMessageLength).toHaveBeenCalledWith(
        'test message',
      );
    });
  });

  describe('message methods delegation', () => {
    it('should delegate sendMessage to client', async () => {
      const service = new WhatsAppService();
      const request = {
        messaging_product: 'whatsapp' as const,
        recipient_type: 'individual' as const,
        to: '1234567890',
        type: 'text' as const,
        text: { body: 'Hello' },
      };

      await service.sendMessage(request);
      expect(mockClient.sendMessage).toHaveBeenCalledWith(request);
    });

    it('should delegate sendTextMessage to client', async () => {
      const service = new WhatsAppService();
      await service.sendTextMessage('1234567890', 'Hello', true);
      expect(mockClient.sendTextMessage).toHaveBeenCalledWith(
        '1234567890',
        'Hello',
        true,
      );
    });

    it('should delegate sendImageMessage to client', async () => {
      const service = new WhatsAppService();
      await service.sendImageMessage(
        '1234567890',
        'https://example.com/image.jpg',
        'Caption',
      );
      expect(mockClient.sendImageMessage).toHaveBeenCalledWith(
        '1234567890',
        'https://example.com/image.jpg',
        'Caption',
      );
    });

    it('should delegate sendTemplateMessage to client', async () => {
      const service = new WhatsAppService();
      const args = {
        to: '1234567890',
        templateName: 'welcome',
        languageCode: 'en',
        parameters: ['John'],
      };
      await service.sendTemplateMessage(args);
      expect(mockClient.sendTemplateMessage).toHaveBeenCalledWith(args);
    });

    it('should delegate sendButtonMessage to client', async () => {
      const service = new WhatsAppService();
      const args = {
        to: '1234567890',
        bodyText: 'Choose an option',
        buttons: [{ id: 'btn1', title: 'Option 1' }],
      };
      await service.sendButtonMessage(args);
      expect(mockClient.sendButtonMessage).toHaveBeenCalledWith(args);
    });

    it('should delegate sendListMessage to client', async () => {
      const service = new WhatsAppService();
      const args = {
        to: '1234567890',
        bodyText: 'Select from list',
        buttonText: 'View Options',
        sections: [
          {
            title: 'Section 1',
            rows: [{ id: 'row1', title: 'Row 1' }],
          },
        ],
      };
      await service.sendListMessage(args);
      expect(mockClient.sendListMessage).toHaveBeenCalledWith(args);
    });
  });

  describe('media methods delegation', () => {
    it('should delegate getMediaUrl to client', async () => {
      const service = new WhatsAppService();
      const result = await service.getMediaUrl('media-123');
      expect(mockClient.getMediaUrl).toHaveBeenCalledWith('media-123');
      expect(result).toBe('https://cdn.example.com/media');
    });

    it('should delegate downloadMedia to client', async () => {
      const service = new WhatsAppService();
      const result = await service.downloadMedia('media-123');
      expect(mockClient.downloadMedia).toHaveBeenCalledWith('media-123');
      expect(result).toEqual(Buffer.from('test'));
    });

    it('should delegate uploadMedia to client', async () => {
      const service = new WhatsAppService();
      const file = Buffer.from('test file content');
      const result = await service.uploadMedia(file, 'image', 'test.jpg');
      expect(mockClient.uploadMedia).toHaveBeenCalledWith(
        file,
        'image',
        'test.jpg',
      );
      expect(result).toBe('media-123');
    });
  });

  describe('error handling', () => {
    it('should propagate errors from client', async () => {
      mockClient.sendMessage.mockRejectedValueOnce(new Error('API Error'));
      const service = new WhatsAppService();

      await expect(
        service.sendMessage({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: '123',
          type: 'text',
          text: { body: 'test' },
        }),
      ).rejects.toThrow('API Error');
    });

    it('should return error response from client', async () => {
      mockClient.sendTextMessage.mockResolvedValueOnce({
        success: false,
        error: 'Rate limit exceeded',
      });

      const service = new WhatsAppService();
      const result = await service.sendTextMessage('123', 'test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });
});
