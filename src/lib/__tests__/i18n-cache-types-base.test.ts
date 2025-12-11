import { describe, expect, it } from 'vitest';
import {
  CACHE_CONSTANTS,
  CacheError,
  CacheSerializationError,
  CacheStorageError,
  CacheValidationError,
  createCacheKey,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_PRELOAD_CONFIG,
  isCacheConfig,
  isCacheEvent,
  isCacheItem,
  parseCacheKey,
  validateCacheConfig,
} from '../i18n-cache-types-base';

describe('DEFAULT_CACHE_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_CACHE_CONFIG.maxSize).toBe(1000);
    expect(DEFAULT_CACHE_CONFIG.ttl).toBe(300000); // 5 minutes
    expect(DEFAULT_CACHE_CONFIG.enablePersistence).toBe(true);
    expect(DEFAULT_CACHE_CONFIG.storageKey).toBe('i18n_cache');
  });
});

describe('DEFAULT_PRELOAD_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_PRELOAD_CONFIG.enablePreload).toBe(true);
    expect(DEFAULT_PRELOAD_CONFIG.preloadLocales).toEqual(['en', 'zh']);
    expect(DEFAULT_PRELOAD_CONFIG.batchSize).toBe(5);
    expect(DEFAULT_PRELOAD_CONFIG.delayBetweenBatches).toBe(100);
    expect(DEFAULT_PRELOAD_CONFIG.timeout).toBe(5000);
  });
});

describe('CACHE_CONSTANTS', () => {
  it('should have expected constant values', () => {
    expect(CACHE_CONSTANTS.MIN_TTL).toBe(1000);
    expect(CACHE_CONSTANTS.MAX_TTL).toBe(86400000); // 24 hours
    expect(CACHE_CONSTANTS.MIN_CACHE_SIZE).toBe(10);
    expect(CACHE_CONSTANTS.MAX_CACHE_SIZE).toBe(10000);
    expect(CACHE_CONSTANTS.DEFAULT_BATCH_SIZE).toBe(5);
    expect(CACHE_CONSTANTS.MAX_CONCURRENT_LOADS).toBe(10);
    expect(CACHE_CONSTANTS.METRICS_RESET_INTERVAL).toBe(3600000); // 1 hour
    expect(CACHE_CONSTANTS.HEALTH_CHECK_INTERVAL).toBe(300000); // 5 minutes
  });
});

describe('CacheError', () => {
  it('should create error with message', () => {
    const error = new CacheError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('CacheError');
    expect(error.code).toBe('CACHE_ERROR');
  });

  it('should create error with custom code', () => {
    const error = new CacheError('Test error', 'CUSTOM_CODE');
    expect(error.code).toBe('CUSTOM_CODE');
  });

  it('should create error with details', () => {
    const error = new CacheError('Test error', 'CACHE_ERROR', { key: 'value' });
    expect(error.details).toEqual({ key: 'value' });
  });

  it('should be instance of Error', () => {
    const error = new CacheError('Test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('CacheValidationError', () => {
  it('should create validation error', () => {
    const error = new CacheValidationError('Validation failed');
    expect(error.message).toBe('Validation failed');
    expect(error.name).toBe('CacheValidationError');
    expect(error.code).toBe('CACHE_VALIDATION_ERROR');
  });

  it('should create with details', () => {
    const error = new CacheValidationError('Validation failed', {
      field: 'maxSize',
    });
    expect(error.details).toEqual({ field: 'maxSize' });
  });

  it('should be instance of CacheError', () => {
    const error = new CacheValidationError('Test');
    expect(error).toBeInstanceOf(CacheError);
  });
});

describe('CacheStorageError', () => {
  it('should create storage error', () => {
    const error = new CacheStorageError('Storage failed');
    expect(error.message).toBe('Storage failed');
    expect(error.name).toBe('CacheStorageError');
    expect(error.code).toBe('CACHE_STORAGE_ERROR');
  });

  it('should create with details', () => {
    const error = new CacheStorageError('Storage failed', {
      operation: 'write',
    });
    expect(error.details).toEqual({ operation: 'write' });
  });

  it('should be instance of CacheError', () => {
    const error = new CacheStorageError('Test');
    expect(error).toBeInstanceOf(CacheError);
  });
});

describe('CacheSerializationError', () => {
  it('should create serialization error', () => {
    const error = new CacheSerializationError('Serialization failed');
    expect(error.message).toBe('Serialization failed');
    expect(error.name).toBe('CacheSerializationError');
    expect(error.code).toBe('CACHE_SERIALIZATION_ERROR');
  });

  it('should create with details', () => {
    const error = new CacheSerializationError('Serialization failed', {
      type: 'circular',
    });
    expect(error.details).toEqual({ type: 'circular' });
  });

  it('should be instance of CacheError', () => {
    const error = new CacheSerializationError('Test');
    expect(error).toBeInstanceOf(CacheError);
  });
});

describe('isCacheItem', () => {
  it('should return true for valid cache item', () => {
    const item = {
      data: 'test',
      timestamp: Date.now(),
      ttl: 5000,
      hits: 0,
    };
    expect(isCacheItem(item)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isCacheItem(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isCacheItem('string')).toBe(false);
    expect(isCacheItem(123)).toBe(false);
    expect(isCacheItem(undefined)).toBe(false);
  });

  it('should return false when missing data', () => {
    expect(isCacheItem({ timestamp: 1, ttl: 1, hits: 0 })).toBe(false);
  });

  it('should return false when missing timestamp', () => {
    expect(isCacheItem({ data: 'test', ttl: 1, hits: 0 })).toBe(false);
  });

  it('should return false when missing ttl', () => {
    expect(isCacheItem({ data: 'test', timestamp: 1, hits: 0 })).toBe(false);
  });

  it('should return false when missing hits', () => {
    expect(isCacheItem({ data: 'test', timestamp: 1, ttl: 1 })).toBe(false);
  });

  it('should return true when all fields exist regardless of type', () => {
    // Note: isCacheItem only checks property existence, not types
    expect(
      isCacheItem({ data: 'test', timestamp: 'invalid', ttl: 1, hits: 0 }),
    ).toBe(true);
    expect(
      isCacheItem({ data: 'test', timestamp: 1, ttl: 'invalid', hits: 0 }),
    ).toBe(true);
    expect(
      isCacheItem({ data: 'test', timestamp: 1, ttl: 1, hits: 'invalid' }),
    ).toBe(true);
  });
});

describe('isCacheConfig', () => {
  it('should return true for valid config', () => {
    const config = {
      maxSize: 100,
      ttl: 5000,
      enablePersistence: true,
      storageKey: 'test',
    };
    expect(isCacheConfig(config)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isCacheConfig(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isCacheConfig('string')).toBe(false);
    expect(isCacheConfig(123)).toBe(false);
  });

  it('should return false when missing maxSize', () => {
    expect(
      isCacheConfig({ ttl: 5000, enablePersistence: true, storageKey: 'test' }),
    ).toBe(false);
  });

  it('should return false when missing ttl', () => {
    expect(
      isCacheConfig({
        maxSize: 100,
        enablePersistence: true,
        storageKey: 'test',
      }),
    ).toBe(false);
  });

  it('should return false when missing enablePersistence', () => {
    expect(isCacheConfig({ maxSize: 100, ttl: 5000, storageKey: 'test' })).toBe(
      false,
    );
  });

  it('should return false when missing storageKey', () => {
    expect(
      isCacheConfig({ maxSize: 100, ttl: 5000, enablePersistence: true }),
    ).toBe(false);
  });
});

describe('isCacheEvent', () => {
  it('should return true for valid event', () => {
    const event = {
      type: 'hit',
      timestamp: Date.now(),
    };
    expect(isCacheEvent(event)).toBe(true);
  });

  it('should return true for event with optional fields', () => {
    const event = {
      type: 'set',
      timestamp: Date.now(),
      key: 'en:common:greeting',
      data: { value: 'Hello' },
      metadata: { source: 'preload' },
    };
    expect(isCacheEvent(event)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isCacheEvent(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isCacheEvent('string')).toBe(false);
  });

  it('should return false when missing type', () => {
    expect(isCacheEvent({ timestamp: Date.now() })).toBe(false);
  });

  it('should return false when missing timestamp', () => {
    expect(isCacheEvent({ type: 'hit' })).toBe(false);
  });
});

describe('createCacheKey', () => {
  it('should create key with locale only', () => {
    expect(createCacheKey('en')).toBe('en');
  });

  it('should create key with locale and namespace', () => {
    expect(createCacheKey('en', 'common')).toBe('en:common');
  });

  it('should create key with locale, namespace and key', () => {
    expect(createCacheKey('zh', 'products', 'title')).toBe('zh:products:title');
  });
});

describe('parseCacheKey', () => {
  it('should parse locale only', () => {
    const result = parseCacheKey('en');
    expect(result).toEqual({ locale: 'en' });
  });

  it('should parse locale and namespace', () => {
    const result = parseCacheKey('en:common');
    expect(result).toEqual({ locale: 'en', namespace: 'common' });
  });

  it('should parse locale, namespace and key', () => {
    const result = parseCacheKey('zh:products:title');
    expect(result).toEqual({
      locale: 'zh',
      namespace: 'products',
      key: 'title',
    });
  });

  it('should handle empty string', () => {
    const result = parseCacheKey('');
    expect(result).toEqual({ locale: '' });
  });
});

describe('validateCacheConfig', () => {
  it('should pass valid config', () => {
    const result = validateCacheConfig({
      maxSize: 100,
      ttl: 5000,
      enablePersistence: true,
      storageKey: 'test',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for maxSize below minimum', () => {
    const result = validateCacheConfig({ maxSize: 5 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `maxSize must be at least ${CACHE_CONSTANTS.MIN_CACHE_SIZE}`,
    );
  });

  it('should fail for maxSize above maximum', () => {
    const result = validateCacheConfig({ maxSize: 100000 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `maxSize must not exceed ${CACHE_CONSTANTS.MAX_CACHE_SIZE}`,
    );
  });

  it('should fail for ttl below minimum', () => {
    const result = validateCacheConfig({ ttl: 100 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `ttl must be at least ${CACHE_CONSTANTS.MIN_TTL}ms`,
    );
  });

  it('should warn for very high ttl', () => {
    const result = validateCacheConfig({ ttl: 100000000 });
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('ttl is very high');
  });

  it('should fail for empty storageKey', () => {
    const result = validateCacheConfig({ storageKey: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('storageKey must be a non-empty string');
  });

  it('should fail for non-string storageKey', () => {
    // @ts-expect-error - testing invalid input
    const result = validateCacheConfig({ storageKey: 123 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('storageKey must be a non-empty string');
  });

  it('should fail for non-boolean enablePersistence', () => {
    // @ts-expect-error - testing invalid input
    const result = validateCacheConfig({ enablePersistence: 'yes' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('enablePersistence must be a boolean');
  });

  it('should pass when no config provided', () => {
    const result = validateCacheConfig({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate multiple fields at once', () => {
    const result = validateCacheConfig({
      maxSize: 5,
      ttl: 100,
      storageKey: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(3);
  });
});
