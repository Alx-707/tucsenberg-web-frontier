import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CacheStats } from '@/lib/i18n-cache-types-base';
import {
  CacheKeyUtils,
  CacheSerializationUtils,
  CacheSizeUtils,
  CacheStatsUtils,
  CacheTimeUtils,
} from '../i18n-cache-types-utils';

describe('CacheKeyUtils', () => {
  describe('create', () => {
    it('should create key with locale only', () => {
      const key = CacheKeyUtils.create('en');
      expect(key).toBe('en');
    });

    it('should create key with locale and namespace', () => {
      const key = CacheKeyUtils.create('en', 'common');
      expect(key).toBe('en:common');
    });

    it('should create key with locale, namespace and key', () => {
      const key = CacheKeyUtils.create('zh', 'products', 'title');
      expect(key).toBe('zh:products:title');
    });
  });

  describe('parse', () => {
    it('should parse locale only', () => {
      const result = CacheKeyUtils.parse('en');
      expect(result).toEqual({ locale: 'en' });
    });

    it('should parse locale and namespace', () => {
      const result = CacheKeyUtils.parse('en:common');
      expect(result).toEqual({ locale: 'en', namespace: 'common' });
    });

    it('should parse locale, namespace and key', () => {
      const result = CacheKeyUtils.parse('zh:products:title');
      expect(result).toEqual({
        locale: 'zh',
        namespace: 'products',
        key: 'title',
      });
    });

    it('should handle empty string', () => {
      const result = CacheKeyUtils.parse('');
      expect(result).toEqual({ locale: '' });
    });
  });

  describe('validate', () => {
    it('should return true for valid keys', () => {
      expect(CacheKeyUtils.validate('en')).toBe(true);
      expect(CacheKeyUtils.validate('en:common:greeting')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(CacheKeyUtils.validate('')).toBe(false);
    });

    it('should return false for keys exceeding 256 chars', () => {
      const longKey = 'a'.repeat(257);
      expect(CacheKeyUtils.validate(longKey)).toBe(false);
    });

    it('should return true for keys at boundary (256 chars)', () => {
      const boundaryKey = 'a'.repeat(256);
      expect(CacheKeyUtils.validate(boundaryKey)).toBe(true);
    });
  });

  describe('normalize', () => {
    it('should lowercase the key', () => {
      expect(CacheKeyUtils.normalize('EN:COMMON')).toBe('en:common');
    });

    it('should trim whitespace', () => {
      expect(CacheKeyUtils.normalize('  en:common  ')).toBe('en:common');
    });

    it('should replace invalid characters with underscore', () => {
      expect(CacheKeyUtils.normalize('en common greeting!')).toBe(
        'en_common_greeting_',
      );
    });

    it('should preserve valid characters', () => {
      expect(CacheKeyUtils.normalize('en:common-key_123')).toBe(
        'en:common-key_123',
      );
    });
  });

  describe('createPattern', () => {
    it('should create pattern with locale only', () => {
      const pattern = CacheKeyUtils.createPattern('en');
      expect(pattern).toBe('en:*:*');
    });

    it('should create pattern with locale and namespace', () => {
      const pattern = CacheKeyUtils.createPattern('en', 'common');
      expect(pattern).toBe('en:common:*');
    });

    it('should create wildcard pattern when no locale', () => {
      const pattern = CacheKeyUtils.createPattern();
      expect(pattern).toBe('*:*:*');
    });

    it('should create pattern with namespace but no locale', () => {
      const pattern = CacheKeyUtils.createPattern(undefined, 'products');
      expect(pattern).toBe('*:products:*');
    });
  });
});

describe('CacheTimeUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('isExpired', () => {
    it('should return true when expired', () => {
      const timestamp = Date.now() - 5000;
      const ttl = 3000;
      expect(CacheTimeUtils.isExpired(timestamp, ttl)).toBe(true);
    });

    it('should return false when not expired', () => {
      const timestamp = Date.now() - 1000;
      const ttl = 5000;
      expect(CacheTimeUtils.isExpired(timestamp, ttl)).toBe(false);
    });

    it('should return false when exactly at boundary', () => {
      const timestamp = Date.now();
      const ttl = 1000;
      vi.advanceTimersByTime(1000);
      expect(CacheTimeUtils.isExpired(timestamp, ttl)).toBe(false);
    });

    it('should return true right after boundary', () => {
      const timestamp = Date.now();
      const ttl = 1000;
      vi.advanceTimersByTime(1001);
      expect(CacheTimeUtils.isExpired(timestamp, ttl)).toBe(true);
    });
  });

  describe('getRemainingTime', () => {
    it('should return positive time when not expired', () => {
      const timestamp = Date.now();
      const ttl = 5000;
      vi.advanceTimersByTime(2000);
      expect(CacheTimeUtils.getRemainingTime(timestamp, ttl)).toBe(3000);
    });

    it('should return zero when expired', () => {
      const timestamp = Date.now() - 10000;
      const ttl = 5000;
      expect(CacheTimeUtils.getRemainingTime(timestamp, ttl)).toBe(0);
    });

    it('should return full ttl for fresh item', () => {
      const timestamp = Date.now();
      const ttl = 5000;
      expect(CacheTimeUtils.getRemainingTime(timestamp, ttl)).toBe(5000);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(CacheTimeUtils.formatDuration(5000)).toBe('5s');
    });

    it('should format minutes', () => {
      expect(CacheTimeUtils.formatDuration(120000)).toBe('2m 0s');
    });

    it('should format hours', () => {
      expect(CacheTimeUtils.formatDuration(3660000)).toBe('1h 1m');
    });

    it('should format days', () => {
      expect(CacheTimeUtils.formatDuration(90000000)).toBe('1d 1h');
    });

    it('should handle zero', () => {
      expect(CacheTimeUtils.formatDuration(0)).toBe('0s');
    });
  });

  describe('parseTimeString', () => {
    it('should parse milliseconds', () => {
      expect(CacheTimeUtils.parseTimeString('500ms')).toBe(500);
    });

    it('should parse seconds', () => {
      expect(CacheTimeUtils.parseTimeString('10s')).toBe(10000);
    });

    it('should parse minutes', () => {
      expect(CacheTimeUtils.parseTimeString('5m')).toBe(300000);
    });

    it('should parse hours', () => {
      expect(CacheTimeUtils.parseTimeString('2h')).toBe(7200000);
    });

    it('should parse days', () => {
      expect(CacheTimeUtils.parseTimeString('1d')).toBe(86400000);
    });

    it('should throw for invalid format', () => {
      expect(() => CacheTimeUtils.parseTimeString('invalid')).toThrow(
        'Invalid time format: invalid',
      );
    });

    it('should throw for unsupported unit', () => {
      expect(() => CacheTimeUtils.parseTimeString('5w')).toThrow(
        'Invalid time format: 5w',
      );
    });
  });
});

describe('CacheSizeUtils', () => {
  describe('estimateSize', () => {
    it('should estimate size of string', () => {
      const size = CacheSizeUtils.estimateSize('hello');
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate size of object', () => {
      const size = CacheSizeUtils.estimateSize({ key: 'value', num: 123 });
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate size of array', () => {
      const size = CacheSizeUtils.estimateSize([1, 2, 3, 4, 5]);
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 for circular reference', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj['self'] = obj;
      const size = CacheSizeUtils.estimateSize(obj);
      expect(size).toBe(0);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(CacheSizeUtils.formatBytes(500)).toBe('500.00 B');
    });

    it('should format kilobytes', () => {
      expect(CacheSizeUtils.formatBytes(1536)).toBe('1.50 KB');
    });

    it('should format megabytes', () => {
      expect(CacheSizeUtils.formatBytes(1572864)).toBe('1.50 MB');
    });

    it('should format gigabytes', () => {
      expect(CacheSizeUtils.formatBytes(1610612736)).toBe('1.50 GB');
    });

    it('should handle zero', () => {
      expect(CacheSizeUtils.formatBytes(0)).toBe('0.00 B');
    });
  });

  describe('parseSize', () => {
    it('should parse bytes with space', () => {
      expect(CacheSizeUtils.parseSize('100 B')).toBe(100);
    });

    it('should parse bytes without space', () => {
      expect(CacheSizeUtils.parseSize('100B')).toBe(100);
    });

    it('should handle lowercase bytes', () => {
      expect(CacheSizeUtils.parseSize('100 b')).toBe(100);
    });

    it('should handle decimal values for bytes', () => {
      expect(CacheSizeUtils.parseSize('1.5 B')).toBe(1.5);
    });

    it('should handle whitespace', () => {
      expect(CacheSizeUtils.parseSize(' 100 B ')).toBe(100);
    });

    it('should throw for invalid format', () => {
      expect(() => CacheSizeUtils.parseSize('invalid')).toThrow(
        'Invalid size format',
      );
    });

    it('should throw for missing number', () => {
      expect(() => CacheSizeUtils.parseSize('B')).toThrow(
        'Invalid size format',
      );
    });

    it('should throw for multiple dots', () => {
      expect(() => CacheSizeUtils.parseSize('1.2.3 B')).toThrow(
        'Invalid size format',
      );
    });

    it('should throw for invalid characters in number part', () => {
      expect(() => CacheSizeUtils.parseSize('1a2 B')).toThrow(
        'Invalid size format',
      );
    });

    it('should throw for unknown unit', () => {
      expect(() => CacheSizeUtils.parseSize('100 XB')).toThrow(
        'Invalid size format',
      );
    });
  });
});

describe('CacheStatsUtils', () => {
  describe('calculateHitRate', () => {
    it('should calculate hit rate correctly', () => {
      expect(CacheStatsUtils.calculateHitRate(80, 20)).toBe(0.8);
    });

    it('should return 0 for no requests', () => {
      expect(CacheStatsUtils.calculateHitRate(0, 0)).toBe(0);
    });

    it('should return 1 for all hits', () => {
      expect(CacheStatsUtils.calculateHitRate(100, 0)).toBe(1);
    });

    it('should return 0 for all misses', () => {
      expect(CacheStatsUtils.calculateHitRate(0, 100)).toBe(0);
    });
  });

  describe('calculateAverageAge', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should calculate average age correctly', () => {
      const now = Date.now();
      const items = [
        { timestamp: now - 1000 },
        { timestamp: now - 3000 },
        { timestamp: now - 5000 },
      ];
      const avgAge = CacheStatsUtils.calculateAverageAge(items);
      expect(avgAge).toBe(3000);
    });

    it('should return 0 for empty array', () => {
      expect(CacheStatsUtils.calculateAverageAge([])).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ timestamp: Date.now() - 2000 }];
      expect(CacheStatsUtils.calculateAverageAge(items)).toBe(2000);
    });
  });

  describe('generateReport', () => {
    it('should generate formatted report', () => {
      const stats: CacheStats = {
        size: 100,
        totalHits: 500,
        averageAge: 60000,
      };

      const report = CacheStatsUtils.generateReport(stats);

      expect(report).toContain('Cache Statistics:');
      expect(report).toContain('- Size: 100 items');
      expect(report).toContain('- Total Hits: 500');
      expect(report).toContain('- Average Age: 1m 0s');
    });
  });

  describe('compareStats', () => {
    it('should calculate differences correctly', () => {
      const before: CacheStats = {
        size: 50,
        totalHits: 100,
        averageAge: 30000,
      };
      const after: CacheStats = {
        size: 80,
        totalHits: 200,
        averageAge: 45000,
      };

      const diff = CacheStatsUtils.compareStats(before, after);

      expect(diff.sizeDiff).toBe(30);
      expect(diff.hitsDiff).toBe(100);
      expect(diff.ageDiff).toBe(15000);
    });

    it('should handle negative differences', () => {
      const before: CacheStats = {
        size: 100,
        totalHits: 200,
        averageAge: 60000,
      };
      const after: CacheStats = {
        size: 50,
        totalHits: 100,
        averageAge: 30000,
      };

      const diff = CacheStatsUtils.compareStats(before, after);

      expect(diff.sizeDiff).toBe(-50);
      expect(diff.hitsDiff).toBe(-100);
      expect(diff.ageDiff).toBe(-30000);
    });
  });
});

describe('CacheSerializationUtils', () => {
  describe('serialize', () => {
    it('should serialize object', () => {
      const data = { key: 'value', num: 123 };
      const result = CacheSerializationUtils.serialize(data);
      expect(result).toBe('{"key":"value","num":123}');
    });

    it('should serialize array', () => {
      const data = [1, 2, 3];
      const result = CacheSerializationUtils.serialize(data);
      expect(result).toBe('[1,2,3]');
    });

    it('should serialize primitive', () => {
      expect(CacheSerializationUtils.serialize('hello')).toBe('"hello"');
      expect(CacheSerializationUtils.serialize(123)).toBe('123');
      expect(CacheSerializationUtils.serialize(true)).toBe('true');
    });

    it('should throw for circular reference', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj['self'] = obj;
      expect(() => CacheSerializationUtils.serialize(obj)).toThrow(
        'Serialization failed',
      );
    });
  });

  describe('deserialize', () => {
    it('should deserialize object', () => {
      const result = CacheSerializationUtils.deserialize<{
        key: string;
        num: number;
      }>('{"key":"value","num":123}');
      expect(result).toEqual({ key: 'value', num: 123 });
    });

    it('should deserialize array', () => {
      const result = CacheSerializationUtils.deserialize<number[]>('[1,2,3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should throw for invalid JSON', () => {
      expect(() => CacheSerializationUtils.deserialize('invalid json')).toThrow(
        'Deserialization failed',
      );
    });
  });

  describe('safeSerialize', () => {
    it('should serialize valid data', () => {
      const result = CacheSerializationUtils.safeSerialize({ a: 1 });
      expect(result).toBe('{"a":1}');
    });

    it('should return fallback for circular reference', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj['self'] = obj;
      const result = CacheSerializationUtils.safeSerialize(obj);
      expect(result).toBe('{}');
    });

    it('should use custom fallback', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj['self'] = obj;
      const result = CacheSerializationUtils.safeSerialize(
        obj,
        '{"error":true}',
      );
      expect(result).toBe('{"error":true}');
    });
  });

  describe('safeDeserialize', () => {
    it('should deserialize valid JSON', () => {
      const result = CacheSerializationUtils.safeDeserialize<{ a: number }>(
        '{"a":1}',
        { a: 0 },
      );
      expect(result).toEqual({ a: 1 });
    });

    it('should return fallback for invalid JSON', () => {
      const result = CacheSerializationUtils.safeDeserialize<{ a: number }>(
        'invalid',
        { a: 0 },
      );
      expect(result).toEqual({ a: 0 });
    });
  });
});
