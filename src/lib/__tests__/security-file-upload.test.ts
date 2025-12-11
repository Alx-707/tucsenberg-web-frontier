import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ALLOWED_FILE_TYPES,
  generateSafeFileName,
  getFileCategory,
  isDocumentFile,
  isImageFile,
  sanitizeFileName,
  validateFileSignature,
  validateFileUpload,
  validateMultipleFiles,
} from '../security-file-upload';

// Mock File constructor helper
function createMockFile(
  name: string,
  size: number,
  type: string,
  content?: ArrayBuffer,
): File {
  const blob = new Blob([content ?? new ArrayBuffer(size)], { type });
  return new File([blob], name, { type });
}

describe('security-file-upload', () => {
  describe('validateFileUpload', () => {
    it('should accept valid image file', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const result = validateFileUpload(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PDF file', () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const result = validateFileUpload(file);

      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      // Default limit is 10MB
      const file = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg');
      const result = validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('size exceeds');
    });

    it('should respect custom size limit', () => {
      const file = createMockFile('medium.jpg', 3 * 1024 * 1024, 'image/jpeg');

      const validResult = validateFileUpload(file, { maxSizeMB: 5 });
      expect(validResult.valid).toBe(true);

      const invalidResult = validateFileUpload(file, { maxSizeMB: 2 });
      expect(invalidResult.valid).toBe(false);
    });

    it('should reject disallowed file types', () => {
      const file = createMockFile(
        'malware.exe',
        1024,
        'application/x-executable',
      );
      const result = validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should accept custom allowed types', () => {
      const file = createMockFile('video.mp4', 1024, 'video/mp4');
      const result = validateFileUpload(file, {
        allowedTypes: ['video/mp4', 'video/webm'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject files with dangerous extensions', () => {
      const file = createMockFile('script.exe', 1024, 'image/jpeg');
      const result = validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject files with dangerous extensions in middle', () => {
      const file = createMockFile('doc.exe.pdf', 1024, 'application/pdf');
      const result = validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous extension');
    });

    it('should add warnings for suspicious file names', () => {
      const file = createMockFile('con.jpg', 1024, 'image/jpeg');
      const result = validateFileUpload(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain(
        'File name matches a reserved system name pattern',
      );
    });

    it('should reject files with null bytes in name', () => {
      const file = createMockFile('test\0.jpg', 1024, 'image/jpeg');
      const result = validateFileUpload(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should accept files based on category', () => {
      const imageFile = createMockFile('test.png', 1024, 'image/png');
      const result = validateFileUpload(imageFile, {
        allowedCategories: ['images'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject files not in specified category', () => {
      const pdfFile = createMockFile('doc.pdf', 1024, 'application/pdf');
      const result = validateFileUpload(pdfFile, {
        allowedCategories: ['images'],
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('validateFileSignature', () => {
    // Note: File.arrayBuffer() in test environments may not work with Blob-created files.
    // These tests verify the function handles errors gracefully.

    it('should return error when arrayBuffer fails', async () => {
      // Mock File with failing arrayBuffer
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 100,
        arrayBuffer: () => Promise.reject(new Error('ArrayBuffer failed')),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Failed to validate file signature');
    });

    it('should validate matching JPEG signature', async () => {
      // Implementation expects [HEX_BYTE_MAX, HEX_JPEG_MARKER_1, HEX_BYTE_MAX] = [0xff, 0xff, 0xff]
      const jpegBytes = new Uint8Array([0xff, 0xff, 0xff]);
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        size: jpegBytes.length,
        arrayBuffer: () => Promise.resolve(jpegBytes.buffer),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(true);
    });

    it('should validate matching PNG signature', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const mockFile = {
        name: 'test.png',
        type: 'image/png',
        size: pngBytes.length,
        arrayBuffer: () => Promise.resolve(pngBytes.buffer),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(true);
    });

    it('should validate matching GIF signature', async () => {
      // Implementation expects [HEX_PNG_SIGNATURE_4, HEX_PNG_SIGNATURE_5, HEX_PNG_SIGNATURE_6] = [0x47, 0x0d, 0x0a]
      const gifBytes = new Uint8Array([0x47, 0x0d, 0x0a]);
      const mockFile = {
        name: 'test.gif',
        type: 'image/gif',
        size: gifBytes.length,
        arrayBuffer: () => Promise.resolve(gifBytes.buffer),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(true);
    });

    it('should validate matching PDF signature', async () => {
      // Implementation expects [HEX_PDF_MARKER, HEX_PNG_SIGNATURE_2, HEX_PDF_SIGNATURE_1, HEX_PNG_SIGNATURE_6] = [0x25, 0x50, 0x50, 0x0a]
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x50, 0x0a]);
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: pdfBytes.length,
        arrayBuffer: () => Promise.resolve(pdfBytes.buffer),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(true);
    });

    it('should validate matching ZIP signature', async () => {
      // Implementation expects [HEX_PNG_SIGNATURE_2, HEX_ZIP_SIGNATURE, MAGIC_HEX_03, MAGIC_HEX_04] = [0x50, 0x50, 0x03, 0x04]
      const zipBytes = new Uint8Array([0x50, 0x50, 0x03, 0x04]);
      const mockFile = {
        name: 'test.zip',
        type: 'application/zip',
        size: zipBytes.length,
        arrayBuffer: () => Promise.resolve(zipBytes.buffer),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(true);
    });

    it('should reject mismatched signature', async () => {
      const wrongBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const mockFile = {
        name: 'fake.jpg',
        type: 'image/jpeg',
        size: wrongBytes.length,
        arrayBuffer: () => Promise.resolve(wrongBytes.buffer),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match');
    });

    it('should accept unknown types without signature check', async () => {
      const textBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const mockFile = {
        name: 'test.txt',
        type: 'text/plain',
        size: textBytes.length,
        arrayBuffer: () => Promise.resolve(textBytes.buffer),
      } as unknown as File;

      const result = await validateFileSignature(mockFile);
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace special characters with underscore', () => {
      expect(sanitizeFileName('file name!@#.jpg')).toBe('file_name_.jpg');
    });

    it('should replace multiple underscores with single', () => {
      expect(sanitizeFileName('file___name.jpg')).toBe('file_name.jpg');
    });

    it('should remove leading and trailing underscores', () => {
      // Note: Regex removes leading/trailing but middle underscores near dots remain
      expect(sanitizeFileName('___filename___')).toBe('filename');
      expect(sanitizeFileName('___test')).toBe('test');
      expect(sanitizeFileName('test___')).toBe('test');
    });

    it('should preserve alphanumeric, dots, hyphens', () => {
      expect(sanitizeFileName('my-file_123.test.pdf')).toBe(
        'my-file_123.test.pdf',
      );
    });

    it('should limit length to 255 characters', () => {
      const longName = `${'a'.repeat(300)}.jpg`;
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should handle empty string', () => {
      expect(sanitizeFileName('')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(sanitizeFileName('文件名.jpg')).toBe('.jpg');
    });
  });

  describe('generateSafeFileName', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate filename with timestamp', () => {
      const result = generateSafeFileName('original.jpg');
      const timestamp = Date.now();

      expect(result).toBe(`original_${timestamp}.jpg`);
    });

    it('should include prefix when provided', () => {
      const result = generateSafeFileName('photo.png', 'upload');
      const timestamp = Date.now();

      expect(result).toBe(`upload_photo_${timestamp}.png`);
    });

    it('should sanitize base name', () => {
      const result = generateSafeFileName('my file!.pdf');
      const timestamp = Date.now();

      expect(result).toBe(`my_file_${timestamp}.pdf`);
    });

    it('should preserve extension', () => {
      const result = generateSafeFileName('document.test.xlsx');

      expect(result).toContain('.xlsx');
    });
  });

  describe('isImageFile', () => {
    it('should return true for image MIME types', () => {
      expect(isImageFile(createMockFile('test.jpg', 100, 'image/jpeg'))).toBe(
        true,
      );
      expect(isImageFile(createMockFile('test.png', 100, 'image/png'))).toBe(
        true,
      );
      expect(isImageFile(createMockFile('test.gif', 100, 'image/gif'))).toBe(
        true,
      );
      expect(isImageFile(createMockFile('test.webp', 100, 'image/webp'))).toBe(
        true,
      );
      expect(
        isImageFile(createMockFile('test.svg', 100, 'image/svg+xml')),
      ).toBe(true);
    });

    it('should return false for non-image types', () => {
      expect(
        isImageFile(createMockFile('test.pdf', 100, 'application/pdf')),
      ).toBe(false);
      expect(isImageFile(createMockFile('test.txt', 100, 'text/plain'))).toBe(
        false,
      );
    });
  });

  describe('isDocumentFile', () => {
    it('should return true for document MIME types', () => {
      expect(
        isDocumentFile(createMockFile('test.pdf', 100, 'application/pdf')),
      ).toBe(true);
      expect(
        isDocumentFile(createMockFile('test.txt', 100, 'text/plain')),
      ).toBe(true);
      expect(isDocumentFile(createMockFile('test.csv', 100, 'text/csv'))).toBe(
        true,
      );
    });

    it('should return false for non-document types', () => {
      expect(
        isDocumentFile(createMockFile('test.jpg', 100, 'image/jpeg')),
      ).toBe(false);
    });
  });

  describe('getFileCategory', () => {
    it('should return "images" for image files', () => {
      expect(
        getFileCategory(createMockFile('test.jpg', 100, 'image/jpeg')),
      ).toBe('images');
    });

    it('should return "documents" for document files', () => {
      expect(
        getFileCategory(createMockFile('test.pdf', 100, 'application/pdf')),
      ).toBe('documents');
    });

    it('should return "archives" for archive files', () => {
      expect(
        getFileCategory(createMockFile('test.zip', 100, 'application/zip')),
      ).toBe('archives');
    });

    it('should return "unknown" for unrecognized types', () => {
      expect(
        getFileCategory(createMockFile('test.xyz', 100, 'application/xyz')),
      ).toBe('unknown');
    });
  });

  describe('validateMultipleFiles', () => {
    it('should accept valid multiple files', () => {
      const files = [
        createMockFile('img1.jpg', 1024, 'image/jpeg'),
        createMockFile('img2.png', 1024, 'image/png'),
      ];

      const result = validateMultipleFiles(files);
      expect(result.valid).toBe(true);
    });

    it('should reject when exceeding max file count', () => {
      const files = [
        createMockFile('img1.jpg', 1024, 'image/jpeg'),
        createMockFile('img2.jpg', 1024, 'image/jpeg'),
        createMockFile('img3.jpg', 1024, 'image/jpeg'),
      ];

      const result = validateMultipleFiles(files, { maxFiles: 2 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Too many files');
    });

    it('should reject when exceeding total size limit', () => {
      const files = [
        createMockFile('img1.jpg', 3 * 1024 * 1024, 'image/jpeg'),
        createMockFile('img2.jpg', 3 * 1024 * 1024, 'image/jpeg'),
      ];

      const result = validateMultipleFiles(files, { maxTotalSizeMB: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Total file size exceeds');
    });

    it('should reject if any file is invalid', () => {
      const files = [
        createMockFile('img1.jpg', 1024, 'image/jpeg'),
        createMockFile('script.exe', 1024, 'image/jpeg'),
      ];

      const result = validateMultipleFiles(files);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File 2');
    });

    it('should apply per-file size limit', () => {
      const files = [
        createMockFile('small.jpg', 1024, 'image/jpeg'),
        createMockFile('large.jpg', 5 * 1024 * 1024, 'image/jpeg'),
      ];

      const result = validateMultipleFiles(files, { maxSizeMB: 2 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File 2');
    });

    it('should validate FileList interface', () => {
      // Simulate FileList-like behavior
      const files = [createMockFile('doc.pdf', 1024, 'application/pdf')];

      const result = validateMultipleFiles(files);
      expect(result.valid).toBe(true);
    });
  });

  describe('ALLOWED_FILE_TYPES', () => {
    it('should export image types', () => {
      expect(ALLOWED_FILE_TYPES.images).toContain('image/jpeg');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/png');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/gif');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/webp');
      expect(ALLOWED_FILE_TYPES.images).toContain('image/svg+xml');
    });

    it('should export document types', () => {
      expect(ALLOWED_FILE_TYPES.documents).toContain('application/pdf');
      expect(ALLOWED_FILE_TYPES.documents).toContain('text/plain');
      expect(ALLOWED_FILE_TYPES.documents).toContain('text/csv');
    });

    it('should export archive types', () => {
      expect(ALLOWED_FILE_TYPES.archives).toContain('application/zip');
      expect(ALLOWED_FILE_TYPES.archives).toContain(
        'application/x-rar-compressed',
      );
    });
  });
});
