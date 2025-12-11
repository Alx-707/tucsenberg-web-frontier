import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WhatsAppService } from '../whatsapp-core';
import { WhatsAppUtils } from '../whatsapp-utils';

// Mock dependencies using hoisted pattern for ESM compatibility
// These mocks must be declared before vi.mock() calls
const mockMessageMethods = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  sendTextMessage: vi.fn(),
  sendImageMessage: vi.fn(),
  sendTemplateMessage: vi.fn(),
  sendButtonMessage: vi.fn(),
  sendListMessage: vi.fn(),
}));

const mockMediaMethods = vi.hoisted(() => ({
  getMediaUrl: vi.fn(),
  downloadMedia: vi.fn(),
  uploadMedia: vi.fn(),
}));

// Mock the message service module with a class that has the methods
vi.mock('@/lib/whatsapp-messages', () => ({
  WhatsAppMessageService: class MockWhatsAppMessageService {
    sendMessage = mockMessageMethods.sendMessage;
    sendTextMessage = mockMessageMethods.sendTextMessage;
    sendImageMessage = mockMessageMethods.sendImageMessage;
    sendTemplateMessage = mockMessageMethods.sendTemplateMessage;
    sendButtonMessage = mockMessageMethods.sendButtonMessage;
    sendListMessage = mockMessageMethods.sendListMessage;
    constructor(_token?: string, _phoneId?: string) {}
  },
}));

// Mock the media service module with a class that has the methods
vi.mock('@/lib/whatsapp-media', () => ({
  WhatsAppMediaService: class MockWhatsAppMediaService {
    getMediaUrl = mockMediaMethods.getMediaUrl;
    downloadMedia = mockMediaMethods.downloadMedia;
    uploadMedia = mockMediaMethods.uploadMedia;
    constructor(_token?: string, _phoneId?: string) {}
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

describe('WhatsAppService (Core)', () => {
  // Vitest uses jsdom environment where `typeof window` is "object"
  // NODE_ENV is "test", not "production"
  // So the early return condition (line 30-35) is FALSE:
  //   process.env.NODE_ENV !== 'production' (true) && typeof window === 'undefined' (false) => false
  // This means validation runs and services are initialized when credentials are valid.
  const mockAccessToken = 'test-access-token';
  const mockPhoneNumberId = 'test-phone-id';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations with default return values
    mockMessageMethods.sendMessage.mockResolvedValue({ success: true });
    mockMessageMethods.sendTextMessage.mockResolvedValue({ success: true });
    mockMessageMethods.sendImageMessage.mockResolvedValue({ success: true });
    mockMessageMethods.sendTemplateMessage.mockResolvedValue({ success: true });
    mockMessageMethods.sendButtonMessage.mockResolvedValue({ success: true });
    mockMessageMethods.sendListMessage.mockResolvedValue({ success: true });
    mockMediaMethods.getMediaUrl.mockResolvedValue(
      'https://cdn.example.com/media',
    );
    mockMediaMethods.downloadMedia.mockResolvedValue(Buffer.from('test'));
    mockMediaMethods.uploadMedia.mockResolvedValue('media-123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('constructor', () => {
    it('should create instance with provided credentials', () => {
      const instance = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(instance).toBeInstanceOf(WhatsAppService);
    });

    it('should store provided credentials in config', () => {
      const instance = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const config = instance.getConfig();

      expect(config.accessToken).toBe(mockAccessToken);
      expect(config.phoneNumberId).toBe(mockPhoneNumberId);
    });

    it('should throw error when credentials are missing', () => {
      // In jsdom environment, validation runs (early return skipped)
      // Empty credentials should throw
      expect(() => new WhatsAppService('', '')).toThrow(
        'WhatsApp access token and phone number ID are required',
      );
    });

    it('should throw error when only token is missing', () => {
      expect(() => new WhatsAppService('', 'phone-id')).toThrow(
        'WhatsApp access token and phone number ID are required',
      );
    });

    it('should throw error when only phone ID is missing', () => {
      expect(() => new WhatsAppService('token', '')).toThrow(
        'WhatsApp access token and phone number ID are required',
      );
    });

    it('should initialize services with valid credentials', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);

      // Services should be initialized - verify by checking accessor methods
      expect(service.getMessageService()).toBeDefined();
      expect(service.getMediaService()).toBeDefined();
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

    it('should validate message with custom max length', () => {
      WhatsAppService.validateMessageLength('test', 100);
      expect(WhatsAppUtils.validateMessageLength).toHaveBeenCalledWith(
        'test',
        100,
      );
    });
  });

  describe('getConfig', () => {
    it('should return configuration object', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const config = service.getConfig();

      expect(config).toEqual({
        accessToken: mockAccessToken,
        phoneNumberId: mockPhoneNumberId,
      });
    });
  });

  describe('service method signatures', () => {
    it('should have sendMessage method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.sendMessage).toBe('function');
    });

    it('should have sendTextMessage method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.sendTextMessage).toBe('function');
    });

    it('should have sendImageMessage method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.sendImageMessage).toBe('function');
    });

    it('should have sendTemplateMessage method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.sendTemplateMessage).toBe('function');
    });

    it('should have sendButtonMessage method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.sendButtonMessage).toBe('function');
    });

    it('should have sendListMessage method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.sendListMessage).toBe('function');
    });

    it('should have getMediaUrl method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.getMediaUrl).toBe('function');
    });

    it('should have downloadMedia method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.downloadMedia).toBe('function');
    });

    it('should have uploadMedia method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.uploadMedia).toBe('function');
    });

    it('should have getMessageService method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.getMessageService).toBe('function');
    });

    it('should have getMediaService method', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      expect(typeof service.getMediaService).toBe('function');
    });
  });

  describe('service accessor methods', () => {
    it('should return message service instance', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const messageService = service.getMessageService();
      // Returns the mocked service
      expect(messageService).toBeDefined();
      expect(messageService.sendMessage).toBeDefined();
    });

    it('should return media service instance', () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const mediaService = service.getMediaService();
      // Returns the mocked service
      expect(mediaService).toBeDefined();
      expect(mediaService.getMediaUrl).toBeDefined();
    });
  });

  describe('message delegation', () => {
    it('should delegate sendMessage to messageService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const request = {
        to: '1234567890',
        type: 'text' as const,
        text: 'Hello',
      };

      await service.sendMessage(request);

      expect(mockMessageMethods.sendMessage).toHaveBeenCalledWith(request);
    });

    it('should delegate sendTextMessage to messageService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);

      await service.sendTextMessage('1234567890', 'Hello', true);

      expect(mockMessageMethods.sendTextMessage).toHaveBeenCalledWith(
        '1234567890',
        'Hello',
        true,
      );
    });

    it('should delegate sendImageMessage to messageService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);

      await service.sendImageMessage(
        '1234567890',
        'https://example.com/image.jpg',
        'Caption',
      );

      expect(mockMessageMethods.sendImageMessage).toHaveBeenCalledWith(
        '1234567890',
        'https://example.com/image.jpg',
        'Caption',
      );
    });

    it('should delegate sendTemplateMessage to messageService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const args = {
        to: '1234567890',
        templateName: 'welcome',
        languageCode: 'en',
        parameters: ['John'],
      };

      await service.sendTemplateMessage(args);

      expect(mockMessageMethods.sendTemplateMessage).toHaveBeenCalledWith(args);
    });

    it('should delegate sendButtonMessage to messageService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const args = {
        to: '1234567890',
        bodyText: 'Choose an option',
        buttons: [{ id: 'btn1', title: 'Option 1' }],
      };

      await service.sendButtonMessage(args);

      expect(mockMessageMethods.sendButtonMessage).toHaveBeenCalledWith(args);
    });

    it('should delegate sendListMessage to messageService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
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

      expect(mockMessageMethods.sendListMessage).toHaveBeenCalledWith(args);
    });
  });

  describe('media delegation', () => {
    it('should delegate getMediaUrl to mediaService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);

      const result = await service.getMediaUrl('media-123');

      expect(mockMediaMethods.getMediaUrl).toHaveBeenCalledWith('media-123');
      expect(result).toBe('https://cdn.example.com/media');
    });

    it('should delegate downloadMedia to mediaService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);

      const result = await service.downloadMedia('media-123');

      expect(mockMediaMethods.downloadMedia).toHaveBeenCalledWith('media-123');
      expect(result).toEqual(Buffer.from('test'));
    });

    it('should delegate uploadMedia to mediaService', async () => {
      const service = new WhatsAppService(mockAccessToken, mockPhoneNumberId);
      const file = Buffer.from('test file content');

      const result = await service.uploadMedia(file, 'image', 'test.jpg');

      expect(mockMediaMethods.uploadMedia).toHaveBeenCalledWith(
        file,
        'image',
        'test.jpg',
      );
      expect(result).toBe('media-123');
    });
  });
});
