/**
 * format-utils 格式化工具函数测试
 * Tests for formatByteSize, formatDuration, generateUniqueId
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatByteSize,
  formatDuration,
  generateUniqueId,
} from '../format-utils';

// Mock dependencies
vi.mock('@/lib/security-object-access', () => ({
  safeGetArrayItem: vi.fn((arr: unknown[], idx: number) => arr[idx]),
}));

vi.mock('@/constants', () => ({
  ANIMATION_DURATION_VERY_SLOW: 1000,
  BYTES_PER_KB: 1024,
  COUNT_PAIR: 2,
  HOURS_PER_DAY: 24,
  MAGIC_36: 36,
  ONE: 1,
  SECONDS_PER_MINUTE: 60,
  ZERO: 0,
}));

describe('formatByteSize', () => {
  it('should format bytes correctly', () => {
    expect(formatByteSize(0)).toBe('0.00 B');
    expect(formatByteSize(100)).toBe('100.00 B');
    expect(formatByteSize(1023)).toBe('1023.00 B');
  });

  it('should format kilobytes correctly', () => {
    expect(formatByteSize(1024)).toBe('1.00 KB');
    expect(formatByteSize(1536)).toBe('1.50 KB');
    expect(formatByteSize(2048)).toBe('2.00 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatByteSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatByteSize(1.5 * 1024 * 1024)).toBe('1.50 MB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatByteSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatByteSize(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
  });

  it('should format terabytes correctly', () => {
    expect(formatByteSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB');
  });

  it('should cap at terabytes for very large values', () => {
    // 5 PB would be 5 * 1024 TB
    const fivePB = 5 * 1024 * 1024 * 1024 * 1024 * 1024;
    expect(formatByteSize(fivePB)).toBe('5120.00 TB');
  });

  it('should handle decimal values', () => {
    expect(formatByteSize(512)).toBe('512.00 B');
    expect(formatByteSize(1536)).toBe('1.50 KB');
  });

  it('should handle edge case of exactly 1024 bytes', () => {
    expect(formatByteSize(1024)).toBe('1.00 KB');
  });

  it('should handle small fractional bytes', () => {
    expect(formatByteSize(0.5)).toBe('0.50 B');
  });

  it('should handle negative values (edge case)', () => {
    // Function doesn't explicitly handle negatives, but should not throw
    const result = formatByteSize(-100);
    expect(typeof result).toBe('string');
  });
});

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(30000)).toBe('30s');
    expect(formatDuration(59000)).toBe('59s');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(3540000)).toBe('59m 0s');
  });

  it('should format hours and minutes correctly', () => {
    expect(formatDuration(3600000)).toBe('1h 0m');
    expect(formatDuration(5400000)).toBe('1h 30m');
    expect(formatDuration(7200000)).toBe('2h 0m');
  });

  it('should format days and hours correctly', () => {
    expect(formatDuration(86400000)).toBe('1d 0h');
    expect(formatDuration(129600000)).toBe('1d 12h');
    expect(formatDuration(172800000)).toBe('2d 0h');
  });

  it('should handle multi-day durations', () => {
    expect(formatDuration(259200000)).toBe('3d 0h');
    expect(formatDuration(604800000)).toBe('7d 0h');
  });

  it('should truncate (floor) partial units', () => {
    // 1.5 seconds should show as 1s
    expect(formatDuration(1500)).toBe('1s');
    // 1.9 seconds should show as 1s
    expect(formatDuration(1999)).toBe('1s');
  });

  it('should handle edge case at unit boundaries', () => {
    // Just under 1 minute
    expect(formatDuration(59999)).toBe('59s');
    // Just under 1 hour
    expect(formatDuration(3599999)).toBe('59m 59s');
    // Just under 1 day
    expect(formatDuration(86399999)).toBe('23h 59m');
  });

  it('should handle milliseconds less than a second', () => {
    expect(formatDuration(500)).toBe('0s');
    expect(formatDuration(999)).toBe('0s');
  });

  it('should handle very large durations', () => {
    // 365 days
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    expect(formatDuration(oneYear)).toBe('365d 0h');
  });

  it('should handle negative values as edge case', () => {
    // Function doesn't explicitly handle negatives
    const result = formatDuration(-1000);
    expect(typeof result).toBe('string');
  });
});

describe('generateUniqueId', () => {
  describe('with crypto.randomUUID', () => {
    beforeEach(() => {
      // Use vi.stubGlobal for proper crypto mocking
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => '12345678-1234-1234-1234-123456789012'),
        getRandomValues: vi.fn(),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should use crypto.randomUUID when available', () => {
      const id = generateUniqueId();
      expect(id).toBe('12345678123412341234123456789012');
    });

    it('should remove hyphens from UUID', () => {
      const id = generateUniqueId();
      expect(id).not.toContain('-');
    });

    it('should generate 32 character ID', () => {
      const id = generateUniqueId();
      expect(id.length).toBe(32);
    });
  });

  describe('with crypto.getRandomValues fallback', () => {
    beforeEach(() => {
      // Mock crypto with only getRandomValues
      vi.stubGlobal('crypto', {
        randomUUID: undefined,
        getRandomValues: vi.fn((arr: Uint32Array) => {
          arr[0] = 123456789;
          arr[1] = 987654321;
          return arr;
        }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should fallback to getRandomValues when randomUUID unavailable', () => {
      const id = generateUniqueId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate base36 encoded values', () => {
      const id = generateUniqueId();
      // Base36 uses 0-9 and a-z
      expect(id).toMatch(/^[0-9a-z]+$/);
    });
  });

  describe('without crypto support', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should throw error when crypto unavailable', () => {
      expect(() => generateUniqueId()).toThrow(
        'Secure random generator unavailable for unique id',
      );
    });
  });

  describe('uniqueness', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        ids.add(generateUniqueId());
      }

      expect(ids.size).toBe(iterations);
    });
  });
});
