/**
 * Unit tests for storage-utils module
 * Tests storage utility functions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStorageKey,
  estimateStorageSize,
  generateChecksum,
  parseStorageKey,
} from '../storage-utils';

describe('storage-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStorageKey', () => {
    it('should create a storage key with prefix and key', () => {
      const result = createStorageKey('app_', 'user_settings');
      expect(result).toBe('app_user_settings');
    });

    it('should handle empty prefix', () => {
      const result = createStorageKey('', 'key');
      expect(result).toBe('key');
    });

    it('should handle empty key', () => {
      const result = createStorageKey('prefix_', '');
      expect(result).toBe('prefix_');
    });

    it('should handle both empty', () => {
      const result = createStorageKey('', '');
      expect(result).toBe('');
    });

    it('should handle special characters in prefix and key', () => {
      const result = createStorageKey('app:', 'user@123');
      expect(result).toBe('app:user@123');
    });
  });

  describe('parseStorageKey', () => {
    it('should extract key from full key with prefix', () => {
      const result = parseStorageKey('app_user_settings', 'app_');
      expect(result).toBe('user_settings');
    });

    it('should return full key if prefix does not match', () => {
      const result = parseStorageKey('other_key', 'app_');
      expect(result).toBe('other_key');
    });

    it('should handle empty prefix', () => {
      const result = parseStorageKey('some_key', '');
      expect(result).toBe('some_key');
    });

    it('should handle key that is exactly the prefix', () => {
      const result = parseStorageKey('app_', 'app_');
      expect(result).toBe('');
    });

    it('should be case-sensitive', () => {
      const result = parseStorageKey('APP_key', 'app_');
      expect(result).toBe('APP_key');
    });

    it('should handle prefix longer than key', () => {
      const result = parseStorageKey('ap', 'app_');
      expect(result).toBe('ap');
    });
  });

  describe('estimateStorageSize', () => {
    it('should estimate size of simple object', () => {
      const data = { name: 'test', value: 123 };
      const size = estimateStorageSize(data);
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate size of string', () => {
      const data = 'Hello, World!';
      const size = estimateStorageSize(data);
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate size of array', () => {
      const data = [1, 2, 3, 4, 5];
      const size = estimateStorageSize(data);
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate size of null', () => {
      const size = estimateStorageSize(null);
      expect(size).toBe(4); // "null"
    });

    it('should estimate size of nested object', () => {
      const data = {
        level1: {
          level2: {
            level3: { value: 'deep' },
          },
        },
      };
      const size = estimateStorageSize(data);
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 for circular reference (error case)', () => {
      const data: Record<string, unknown> = { name: 'test' };
      data.self = data; // Create circular reference
      const size = estimateStorageSize(data);
      expect(size).toBe(0);
    });

    it('should estimate size of empty object', () => {
      const size = estimateStorageSize({});
      expect(size).toBe(2); // "{}"
    });

    it('should estimate size of empty array', () => {
      const size = estimateStorageSize([]);
      expect(size).toBe(2); // "[]"
    });

    it('should estimate size of boolean', () => {
      const sizeTrue = estimateStorageSize(true);
      const sizeFalse = estimateStorageSize(false);
      expect(sizeTrue).toBe(4); // "true"
      expect(sizeFalse).toBe(5); // "false"
    });

    it('should estimate size of number', () => {
      const size = estimateStorageSize(12345);
      expect(size).toBe(5); // "12345"
    });
  });

  describe('generateChecksum', () => {
    it('should generate checksum for simple object', () => {
      const data = { name: 'test', value: 123 };
      const checksum = generateChecksum(data);
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });

    it('should generate consistent checksum for same data', () => {
      const data = { name: 'test', value: 123 };
      const checksum1 = generateChecksum(data);
      const checksum2 = generateChecksum(data);
      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksums for different data', () => {
      const data1 = { name: 'test1' };
      const data2 = { name: 'test2' };
      const checksum1 = generateChecksum(data1);
      const checksum2 = generateChecksum(data2);
      expect(checksum1).not.toBe(checksum2);
    });

    it('should handle empty object', () => {
      const checksum = generateChecksum({});
      expect(typeof checksum).toBe('string');
    });

    it('should handle null', () => {
      const checksum = generateChecksum(null);
      expect(typeof checksum).toBe('string');
    });

    it('should handle arrays', () => {
      const checksum = generateChecksum([1, 2, 3]);
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });

    it('should handle strings', () => {
      const checksum = generateChecksum('hello world');
      expect(typeof checksum).toBe('string');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            language: 'en',
          },
        },
      };
      const checksum = generateChecksum(data);
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });

    it('should produce hex string (base 16)', () => {
      const checksum = generateChecksum({ test: 'data' });
      expect(/^[0-9a-f]+$/.test(checksum)).toBe(true);
    });

    it('should handle empty string', () => {
      const checksum = generateChecksum('');
      expect(typeof checksum).toBe('string');
    });

    it('should handle long strings', () => {
      const longString = 'a'.repeat(10000);
      const checksum = generateChecksum(longString);
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters', () => {
      const data = { message: '你好世界' };
      const checksum = generateChecksum(data);
      expect(typeof checksum).toBe('string');
    });
  });
});
