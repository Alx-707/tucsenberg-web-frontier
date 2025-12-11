import { describe, expect, it } from 'vitest';
import { CacheValidationUtils } from '../i18n-cache-validation-utils';

describe('CacheValidationUtils', () => {
  describe('validateItem', () => {
    it('should return true for valid cache item', () => {
      const item = {
        data: 'test value',
        timestamp: Date.now(),
        ttl: 5000,
        hits: 0,
      };
      expect(CacheValidationUtils.validateItem(item)).toBe(true);
    });

    it('should return true for item with any data type', () => {
      expect(
        CacheValidationUtils.validateItem({
          data: { nested: 'object' },
          timestamp: Date.now(),
          ttl: 5000,
          hits: 0,
        }),
      ).toBe(true);

      expect(
        CacheValidationUtils.validateItem({
          data: [1, 2, 3],
          timestamp: Date.now(),
          ttl: 5000,
          hits: 0,
        }),
      ).toBe(true);

      expect(
        CacheValidationUtils.validateItem({
          data: null,
          timestamp: Date.now(),
          ttl: 5000,
          hits: 0,
        }),
      ).toBe(true);
    });

    it('should return false for null', () => {
      expect(CacheValidationUtils.validateItem(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(CacheValidationUtils.validateItem('string')).toBe(false);
      expect(CacheValidationUtils.validateItem(123)).toBe(false);
      expect(CacheValidationUtils.validateItem(undefined)).toBe(false);
    });

    it('should return false when missing data', () => {
      expect(
        CacheValidationUtils.validateItem({
          timestamp: Date.now(),
          ttl: 5000,
          hits: 0,
        }),
      ).toBe(false);
    });

    it('should return false when missing timestamp', () => {
      expect(
        CacheValidationUtils.validateItem({
          data: 'test',
          ttl: 5000,
          hits: 0,
        }),
      ).toBe(false);
    });

    it('should return false when missing ttl', () => {
      expect(
        CacheValidationUtils.validateItem({
          data: 'test',
          timestamp: Date.now(),
          hits: 0,
        }),
      ).toBe(false);
    });

    it('should return false when missing hits', () => {
      expect(
        CacheValidationUtils.validateItem({
          data: 'test',
          timestamp: Date.now(),
          ttl: 5000,
        }),
      ).toBe(false);
    });

    it('should return false when timestamp is not a number', () => {
      expect(
        CacheValidationUtils.validateItem({
          data: 'test',
          timestamp: 'not-a-number',
          ttl: 5000,
          hits: 0,
        }),
      ).toBe(false);
    });

    it('should return false when ttl is not a number', () => {
      expect(
        CacheValidationUtils.validateItem({
          data: 'test',
          timestamp: Date.now(),
          ttl: 'not-a-number',
          hits: 0,
        }),
      ).toBe(false);
    });

    it('should return false when hits is not a number', () => {
      expect(
        CacheValidationUtils.validateItem({
          data: 'test',
          timestamp: Date.now(),
          ttl: 5000,
          hits: 'not-a-number',
        }),
      ).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should pass valid config', () => {
      const result = CacheValidationUtils.validateConfig({
        maxSize: 100,
        ttl: 5000,
        enablePersistence: true,
        storageKey: 'test-cache',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass when no config provided', () => {
      const result = CacheValidationUtils.validateConfig({});
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for non-number maxSize', () => {
      // @ts-expect-error - testing invalid input
      const result = CacheValidationUtils.validateConfig({
        maxSize: 'invalid',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxSize must be a positive number');
    });

    it('should fail for maxSize less than 1', () => {
      const result = CacheValidationUtils.validateConfig({ maxSize: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxSize must be a positive number');
    });

    it('should warn for very large maxSize', () => {
      const result = CacheValidationUtils.validateConfig({ maxSize: 200000 });
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'maxSize is very large, consider reducing it',
      );
    });

    it('should fail for non-number ttl', () => {
      // @ts-expect-error - testing invalid input
      const result = CacheValidationUtils.validateConfig({ ttl: 'invalid' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ttl must be a non-negative number');
    });

    it('should fail for negative ttl', () => {
      const result = CacheValidationUtils.validateConfig({ ttl: -1 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ttl must be a non-negative number');
    });

    it('should allow ttl of 0', () => {
      const result = CacheValidationUtils.validateConfig({ ttl: 0 });
      expect(result.isValid).toBe(true);
    });

    it('should warn for very long ttl', () => {
      const result = CacheValidationUtils.validateConfig({ ttl: 100000000 });
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'ttl is very long (>24h), consider reducing it',
      );
    });

    it('should fail for empty storageKey', () => {
      const result = CacheValidationUtils.validateConfig({ storageKey: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('storageKey must be a non-empty string');
    });

    it('should fail for non-string storageKey', () => {
      // @ts-expect-error - testing invalid input
      const result = CacheValidationUtils.validateConfig({ storageKey: 123 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('storageKey must be a non-empty string');
    });

    it('should fail for non-boolean enablePersistence', () => {
      // @ts-expect-error - testing invalid input
      const result = CacheValidationUtils.validateConfig({
        enablePersistence: 'yes',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('enablePersistence must be a boolean');
    });

    it('should validate multiple fields at once', () => {
      const result = CacheValidationUtils.validateConfig({
        maxSize: 0,
        ttl: -1,
        storageKey: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });

  describe('validateAdvancedConfig', () => {
    it('should pass valid advanced config', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        maxSize: 100,
        ttl: 5000,
        compression: {
          enableCompression: true,
          threshold: 1024,
          level: 6,
        },
        performance: {
          maxConcurrentLoads: 5,
          loadTimeout: 5000,
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should inherit base config validation', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        maxSize: 0,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxSize must be a positive number');
    });

    it('should fail for negative compression threshold', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        compression: {
          enableCompression: true,
          threshold: -1,
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'compression threshold must be non-negative',
      );
    });

    it('should pass when compression is disabled with negative threshold', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        compression: {
          enableCompression: false,
          threshold: -1,
        },
      });
      expect(result.isValid).toBe(true);
    });

    it('should fail for compression level below 1', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        compression: {
          enableCompression: true,
          threshold: 1024,
          level: 0,
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'compression level must be between 1 and 9',
      );
    });

    it('should fail for compression level above 9', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        compression: {
          enableCompression: true,
          threshold: 1024,
          level: 10,
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'compression level must be between 1 and 9',
      );
    });

    it('should pass for compression level at boundaries', () => {
      expect(
        CacheValidationUtils.validateAdvancedConfig({
          compression: {
            enableCompression: true,
            threshold: 1024,
            level: 1,
          },
        }).isValid,
      ).toBe(true);

      expect(
        CacheValidationUtils.validateAdvancedConfig({
          compression: {
            enableCompression: true,
            threshold: 1024,
            level: 9,
          },
        }).isValid,
      ).toBe(true);
    });

    it('should fail for maxConcurrentLoads less than 1', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        performance: {
          maxConcurrentLoads: 0,
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxConcurrentLoads must be at least 1');
    });

    it('should warn for very short loadTimeout', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        performance: {
          loadTimeout: 500,
        },
      });
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'loadTimeout is very short (<1s), consider increasing it',
      );
    });

    it('should pass for loadTimeout at 1 second', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        performance: {
          loadTimeout: 1000,
        },
      });
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate multiple advanced config errors', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        maxSize: 0,
        compression: {
          enableCompression: true,
          threshold: -1,
          level: 15,
        },
        performance: {
          maxConcurrentLoads: 0,
        },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should pass when no advanced config provided', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({});
      expect(result.isValid).toBe(true);
    });

    it('should not check undefined compression fields', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        compression: {
          enableCompression: true,
          threshold: 1024,
          // level not provided
        },
      });
      expect(result.isValid).toBe(true);
    });

    it('should not check undefined performance fields', () => {
      const result = CacheValidationUtils.validateAdvancedConfig({
        performance: {
          // maxConcurrentLoads not provided
          // loadTimeout not provided
        },
      });
      expect(result.isValid).toBe(true);
    });
  });
});
