/**
 * validators 验证函数测试
 * Tests for validatePreference, validateDetectionHistory
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  LocaleDetectionHistory,
  LocaleDetectionRecord,
  UserLocalePreference,
} from '@/lib/locale-storage-types-data';
import { validateDetectionHistory, validatePreference } from '../validators';

// Mock constants
vi.mock('@/constants', () => ({
  MAGIC_0_3: 0.3,
  MAGIC_0_9: 0.9,
  ONE: 1,
  ZERO: 0,
}));

// Mock BaseValidators
const mockBaseValidators = vi.hoisted(() => ({
  isValidLocale: vi.fn((locale: string) => ['en', 'zh'].includes(locale)),
  isValidSource: vi.fn((source: string) =>
    ['user', 'geo', 'browser', 'default', 'auto', 'fallback'].includes(source),
  ),
  isValidTimestamp: vi.fn(
    (ts: number) => typeof ts === 'number' && ts > 0 && ts <= Date.now(),
  ),
  isValidConfidence: vi.fn(
    (c: number) => typeof c === 'number' && c >= 0 && c <= 1,
  ),
}));

vi.mock('@/lib/locale-storage-types-base', () => ({
  BaseValidators: mockBaseValidators,
}));

vi.mock('@/lib/security-object-access', () => ({
  safeGetArrayItem: vi.fn(
    <T>(arr: T[], idx: number): T | undefined => arr[idx],
  ),
}));

// Factory functions for test data
function createValidPreference(
  overrides: Partial<UserLocalePreference> = {},
): UserLocalePreference {
  return {
    locale: 'en',
    source: 'user',
    timestamp: Date.now() - 1000,
    confidence: 0.95,
    ...overrides,
  };
}

function createValidDetectionRecord(
  overrides: Partial<LocaleDetectionRecord> = {},
): LocaleDetectionRecord {
  return {
    locale: 'en',
    source: 'browser',
    confidence: 0.8,
    timestamp: Date.now() - 1000,
    ...overrides,
  };
}

function createValidHistory(
  overrides: Partial<LocaleDetectionHistory> = {},
): LocaleDetectionHistory {
  const detections = overrides.detections ?? [
    createValidDetectionRecord({ timestamp: Date.now() - 2000 }),
    createValidDetectionRecord({ timestamp: Date.now() - 1000 }),
  ];
  return {
    detections,
    history: detections,
    lastUpdated: Date.now() - 500,
    totalDetections: detections.length,
    ...overrides,
  };
}

describe('validatePreference', () => {
  describe('valid preferences', () => {
    it('should validate a complete valid preference', () => {
      const preference = createValidPreference();
      const result = validatePreference(preference);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate preference with metadata', () => {
      const preference = createValidPreference({
        metadata: {
          userAgent: 'Mozilla/5.0',
          ipCountry: 'US',
          browserLanguages: ['en-US', 'en'],
          timezone: 'America/New_York',
        },
      });
      const result = validatePreference(preference);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate preference without metadata', () => {
      const preference = createValidPreference();
      delete preference.metadata;
      const result = validatePreference(preference);

      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid locale', () => {
    it('should reject invalid locale', () => {
      mockBaseValidators.isValidLocale.mockReturnValueOnce(false);
      const preference = createValidPreference({ locale: 'invalid' as 'en' });
      const result = validatePreference(preference);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid locale');
    });
  });

  describe('invalid source', () => {
    it('should reject invalid source', () => {
      mockBaseValidators.isValidSource.mockReturnValueOnce(false);
      const preference = createValidPreference({
        source: 'invalid' as 'user',
      });
      const result = validatePreference(preference);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid source');
    });
  });

  describe('invalid timestamp', () => {
    it('should reject invalid timestamp', () => {
      mockBaseValidators.isValidTimestamp.mockReturnValueOnce(false);
      const preference = createValidPreference({ timestamp: -1 });
      const result = validatePreference(preference);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid timestamp');
    });
  });

  describe('invalid confidence', () => {
    it('should reject invalid confidence value', () => {
      mockBaseValidators.isValidConfidence.mockReturnValueOnce(false);
      const preference = createValidPreference({ confidence: 1.5 });
      const result = validatePreference(preference);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid confidence value');
    });
  });

  describe('metadata validation', () => {
    it('should add error for non-object metadata', () => {
      const preference = {
        locale: 'en' as const,
        source: 'user' as const,
        timestamp: Date.now() - 1000,
        confidence: 0.95,
        metadata: 'invalid' as unknown as UserLocalePreference['metadata'],
      };
      const result = validatePreference(preference as UserLocalePreference);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Metadata must be an object');
    });

    it('should warn for non-string userAgent', () => {
      const preference = createValidPreference({
        metadata: {
          userAgent: 123 as unknown as string,
        },
      });
      const result = validatePreference(preference);

      expect(result.warnings).toContain('User agent should be a string');
    });

    it('should warn for non-string ipCountry', () => {
      const preference = createValidPreference({
        metadata: {
          ipCountry: 123 as unknown as string,
        },
      });
      const result = validatePreference(preference);

      expect(result.warnings).toContain('IP country should be a string');
    });

    it('should warn for non-array browserLanguages', () => {
      const preference = createValidPreference({
        metadata: {
          browserLanguages: 'en-US' as unknown as string[],
        },
      });
      const result = validatePreference(preference);

      expect(result.warnings).toContain('Browser languages should be an array');
    });

    it('should warn for non-string timezone', () => {
      const preference = createValidPreference({
        metadata: {
          timezone: 123 as unknown as string,
        },
      });
      const result = validatePreference(preference);

      expect(result.warnings).toContain('Timezone should be a string');
    });
  });

  describe('confidence-source consistency', () => {
    it('should warn when user source has low confidence', () => {
      const preference = createValidPreference({
        source: 'user',
        confidence: 0.5, // Below 0.9
      });
      const result = validatePreference(preference);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'User-selected preferences should have high confidence',
      );
    });

    it('should warn when fallback source has high confidence', () => {
      const preference = createValidPreference({
        source: 'fallback',
        confidence: 0.5, // Above 0.3
      });
      const result = validatePreference(preference);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Fallback preferences should have low confidence',
      );
    });

    it('should not warn when user source has high confidence', () => {
      const preference = createValidPreference({
        source: 'user',
        confidence: 0.95,
      });
      const result = validatePreference(preference);

      expect(result.warnings).not.toContain(
        'User-selected preferences should have high confidence',
      );
    });

    it('should not warn when fallback source has low confidence', () => {
      const preference = createValidPreference({
        source: 'fallback',
        confidence: 0.2,
      });
      const result = validatePreference(preference);

      expect(result.warnings).not.toContain(
        'Fallback preferences should have low confidence',
      );
    });
  });

  describe('multiple errors', () => {
    it('should collect multiple validation errors', () => {
      mockBaseValidators.isValidLocale.mockReturnValueOnce(false);
      mockBaseValidators.isValidSource.mockReturnValueOnce(false);
      mockBaseValidators.isValidTimestamp.mockReturnValueOnce(false);
      mockBaseValidators.isValidConfidence.mockReturnValueOnce(false);

      const preference = createValidPreference();
      const result = validatePreference(preference);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('validateDetectionHistory', () => {
  beforeEach(() => {
    // Reset mocks to default behavior
    mockBaseValidators.isValidLocale.mockImplementation((locale: string) =>
      ['en', 'zh'].includes(locale),
    );
    mockBaseValidators.isValidSource.mockImplementation((source: string) =>
      ['user', 'geo', 'browser', 'default', 'auto', 'fallback'].includes(
        source,
      ),
    );
    mockBaseValidators.isValidTimestamp.mockImplementation(
      (ts: number) => typeof ts === 'number' && ts > 0 && ts <= Date.now(),
    );
    mockBaseValidators.isValidConfidence.mockImplementation(
      (c: number) => typeof c === 'number' && c >= 0 && c <= 1,
    );
  });

  describe('valid history', () => {
    it('should validate a complete valid history', () => {
      const history = createValidHistory();
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate history with single detection', () => {
      const history = createValidHistory({
        detections: [createValidDetectionRecord()],
        totalDetections: 1,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(true);
    });

    it('should validate empty history', () => {
      const history = createValidHistory({
        detections: [],
        totalDetections: 0,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid detections array', () => {
    it('should reject non-array detections', () => {
      const history = createValidHistory();
      (history as { detections: unknown }).detections = 'not-array';
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Detections must be an array');
    });
  });

  describe('detection record validation', () => {
    it('should reject invalid locale in detection', () => {
      mockBaseValidators.isValidLocale
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const history = createValidHistory({
        detections: [
          createValidDetectionRecord(),
          createValidDetectionRecord({ locale: 'invalid' as 'en' }),
        ],
        totalDetections: 2,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid locale in detection 1');
    });

    it('should reject invalid source in detection', () => {
      mockBaseValidators.isValidSource
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const history = createValidHistory({
        detections: [
          createValidDetectionRecord(),
          createValidDetectionRecord({ source: 'invalid' as 'browser' }),
        ],
        totalDetections: 2,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid source in detection 1');
    });

    it('should reject invalid timestamp in detection', () => {
      mockBaseValidators.isValidTimestamp
        .mockReturnValueOnce(true) // First detection
        .mockReturnValueOnce(false) // Second detection
        .mockReturnValueOnce(true); // lastUpdated

      const history = createValidHistory({
        detections: [
          createValidDetectionRecord(),
          createValidDetectionRecord({ timestamp: -1 }),
        ],
        totalDetections: 2,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid timestamp in detection 1');
    });

    it('should reject invalid confidence in detection', () => {
      mockBaseValidators.isValidConfidence
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const history = createValidHistory({
        detections: [
          createValidDetectionRecord(),
          createValidDetectionRecord({ confidence: 2 }),
        ],
        totalDetections: 2,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid confidence in detection 1');
    });
  });

  describe('count mismatch', () => {
    it('should warn when totalDetections mismatches array length', () => {
      const history = createValidHistory({
        detections: [
          createValidDetectionRecord(),
          createValidDetectionRecord(),
        ],
        totalDetections: 5, // Mismatch
      });
      const result = validateDetectionHistory(history);

      expect(result.warnings).toContain('Detection count mismatch');
    });
  });

  describe('chronological order', () => {
    it('should warn when detections are not in chronological order', () => {
      const history = createValidHistory({
        detections: [
          createValidDetectionRecord({ timestamp: Date.now() - 1000 }),
          createValidDetectionRecord({ timestamp: Date.now() - 2000 }), // Earlier than previous
        ],
        totalDetections: 2,
      });
      const result = validateDetectionHistory(history);

      expect(result.warnings).toContain(
        'Detections are not in chronological order',
      );
    });

    it('should not warn when detections are in correct order', () => {
      const history = createValidHistory({
        detections: [
          createValidDetectionRecord({ timestamp: Date.now() - 3000 }),
          createValidDetectionRecord({ timestamp: Date.now() - 2000 }),
          createValidDetectionRecord({ timestamp: Date.now() - 1000 }),
        ],
        totalDetections: 3,
      });
      const result = validateDetectionHistory(history);

      expect(result.warnings).not.toContain(
        'Detections are not in chronological order',
      );
    });
  });

  describe('lastUpdated validation', () => {
    it('should reject invalid lastUpdated timestamp', () => {
      mockBaseValidators.isValidTimestamp
        .mockReturnValueOnce(true) // Detection
        .mockReturnValueOnce(false); // lastUpdated

      const history = createValidHistory({
        detections: [createValidDetectionRecord()],
        totalDetections: 1,
        lastUpdated: -1,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid lastUpdated timestamp');
    });
  });

  describe('totalDetections validation', () => {
    it('should reject non-number totalDetections', () => {
      const history = createValidHistory();
      (history as { totalDetections: unknown }).totalDetections = 'invalid';
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid totalDetections');
    });

    it('should reject negative totalDetections', () => {
      const history = createValidHistory({
        totalDetections: -1,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid totalDetections');
    });

    it('should accept zero totalDetections with empty array', () => {
      const history = createValidHistory({
        detections: [],
        totalDetections: 0,
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(true);
    });
  });

  describe('multiple validation issues', () => {
    it('should collect multiple errors and warnings', () => {
      mockBaseValidators.isValidLocale.mockReturnValue(false);
      mockBaseValidators.isValidTimestamp.mockReturnValue(false);

      const history = createValidHistory({
        detections: [
          createValidDetectionRecord(),
          createValidDetectionRecord(),
        ],
        totalDetections: 5, // Mismatch
      });
      const result = validateDetectionHistory(history);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single detection without order warning', () => {
      const history = createValidHistory({
        detections: [createValidDetectionRecord()],
        totalDetections: 1,
      });
      const result = validateDetectionHistory(history);

      expect(result.warnings).not.toContain(
        'Detections are not in chronological order',
      );
    });

    it('should handle detections with same timestamp', () => {
      const timestamp = Date.now() - 1000;
      const history = createValidHistory({
        detections: [
          createValidDetectionRecord({ timestamp }),
          createValidDetectionRecord({ timestamp }),
        ],
        totalDetections: 2,
      });
      const result = validateDetectionHistory(history);

      // Same timestamp should not trigger order warning
      expect(result.warnings).not.toContain(
        'Detections are not in chronological order',
      );
    });
  });
});
