import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WhatsAppMediaService } from '../whatsapp-media';

// Mock the logger to prevent console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('WhatsAppMediaService', () => {
  const mockAccessToken = 'test-access-token';
  const mockPhoneNumberId = 'test-phone-id';
  let service: WhatsAppMediaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WhatsAppMediaService(mockAccessToken, mockPhoneNumberId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provided credentials', () => {
      const instance = new WhatsAppMediaService('token', 'phone-id');
      expect(instance).toBeInstanceOf(WhatsAppMediaService);
    });
  });

  describe('getMediaUrl', () => {
    it('should return media URL on successful response', async () => {
      const mockMediaUrl = 'https://cdn.example.com/media/12345';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ url: mockMediaUrl }),
        }),
      );

      const result = await service.getMediaUrl('media-123');

      expect(result).toBe(mockMediaUrl);
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/media-123',
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }),
      );
    });

    it('should return null when response has no url', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      const result = await service.getMediaUrl('media-123');

      expect(result).toBeNull();
    });

    it('should return null on failed response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
        }),
      );

      const result = await service.getMediaUrl('media-123');

      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      );

      const result = await service.getMediaUrl('media-123');

      expect(result).toBeNull();
    });
  });

  describe('downloadMedia', () => {
    it('should return buffer on successful download', async () => {
      const mockMediaUrl = 'https://cdn.example.com/media/12345';
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockUint8Array = new Uint8Array(mockArrayBuffer);
      mockUint8Array.set([1, 2, 3, 4, 5, 6, 7, 8]);

      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          // First call: getMediaUrl
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ url: mockMediaUrl }),
          })
          // Second call: download media
          .mockResolvedValueOnce({
            ok: true,
            arrayBuffer: () => Promise.resolve(mockArrayBuffer),
          }),
      );

      const result = await service.downloadMedia('media-123');

      expect(result).toBeInstanceOf(Buffer);
      expect(result?.length).toBe(8);
    });

    it('should return null when getMediaUrl fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
        }),
      );

      const result = await service.downloadMedia('media-123');

      expect(result).toBeNull();
    });

    it('should return null when download fails', async () => {
      const mockMediaUrl = 'https://cdn.example.com/media/12345';
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          // First call: getMediaUrl succeeds
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ url: mockMediaUrl }),
          })
          // Second call: download fails
          .mockResolvedValueOnce({
            ok: false,
          }),
      );

      const result = await service.downloadMedia('media-123');

      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      );

      const result = await service.downloadMedia('media-123');

      expect(result).toBeNull();
    });
  });

  describe('uploadMedia', () => {
    it('should return media id on successful upload with Buffer', async () => {
      const mockMediaId = 'uploaded-media-123';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ id: mockMediaId }),
        }),
      );

      const fileBuffer = Buffer.from('test file content');
      const result = await service.uploadMedia(fileBuffer, 'image', 'test.jpg');

      expect(result).toBe(mockMediaId);
      expect(fetch).toHaveBeenCalledWith(
        `https://graph.facebook.com/v18.0/${mockPhoneNumberId}/media`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }),
      );
    });

    it('should return media id on successful upload with Blob', async () => {
      const mockMediaId = 'uploaded-media-456';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ id: mockMediaId }),
        }),
      );

      const fileBlob = new Blob(['test content'], { type: 'image/jpeg' });
      const result = await service.uploadMedia(fileBlob, 'image', 'test.jpg');

      expect(result).toBe(mockMediaId);
    });

    it('should use default filename when not provided (Buffer)', async () => {
      const mockMediaId = 'uploaded-media-789';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ id: mockMediaId }),
        }),
      );

      const fileBuffer = Buffer.from('test content');
      const result = await service.uploadMedia(fileBuffer, 'document');

      expect(result).toBe(mockMediaId);
    });

    it('should return null when response has no id', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        }),
      );

      const fileBuffer = Buffer.from('test');
      const result = await service.uploadMedia(fileBuffer, 'image');

      expect(result).toBeNull();
    });

    it('should return null on failed upload', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
        }),
      );

      const fileBuffer = Buffer.from('test');
      const result = await service.uploadMedia(fileBuffer, 'image');

      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      );

      const fileBuffer = Buffer.from('test');
      const result = await service.uploadMedia(fileBuffer, 'image');

      expect(result).toBeNull();
    });

    it('should handle all media types', async () => {
      const mediaTypes: Array<
        'image' | 'document' | 'audio' | 'video' | 'sticker'
      > = ['image', 'document', 'audio', 'video', 'sticker'];

      for (const type of mediaTypes) {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ id: `media-${type}` }),
          }),
        );

        const result = await service.uploadMedia(
          Buffer.from('test'),
          type,
          `test.${type}`,
        );
        expect(result).toBe(`media-${type}`);
      }
    });
  });

  describe('deleteMedia', () => {
    it('should return true on successful deletion', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
        }),
      );

      const result = await service.deleteMedia('media-to-delete');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/media-to-delete',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }),
      );
    });

    it('should return false on failed deletion', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
        }),
      );

      const result = await service.deleteMedia('media-to-delete');

      expect(result).toBe(false);
    });

    it('should return false on fetch error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      );

      const result = await service.deleteMedia('media-to-delete');

      expect(result).toBe(false);
    });
  });

  describe('getMediaInfo', () => {
    it('should return media info on successful response', async () => {
      const mockMediaInfo = {
        id: 'media-123',
        url: 'https://cdn.example.com/media',
        mime_type: 'image/jpeg',
        sha256: 'abc123',
        file_size: 12345,
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockMediaInfo),
        }),
      );

      const result = await service.getMediaInfo('media-123');

      expect(result).toEqual(mockMediaInfo);
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/media-123',
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        }),
      );
    });

    it('should return partial media info when some fields missing', async () => {
      const mockMediaInfo = {
        id: 'media-456',
        url: 'https://cdn.example.com/media',
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockMediaInfo),
        }),
      );

      const result = await service.getMediaInfo('media-456');

      expect(result).toEqual(mockMediaInfo);
      expect(result?.mime_type).toBeUndefined();
    });

    it('should return null on failed response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
        }),
      );

      const result = await service.getMediaInfo('media-123');

      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      );

      const result = await service.getMediaInfo('media-123');

      expect(result).toBeNull();
    });
  });
});
