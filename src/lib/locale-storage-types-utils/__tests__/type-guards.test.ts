/**
 * Unit tests for type-guards module
 * Tests type guard functions for locale storage types
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isLocaleDetectionHistory,
  isStorageSyncConfig,
  isUserLocalePreference,
} from '../type-guards';

describe('type-guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isUserLocalePreference', () => {
    it('should return true for valid user locale preference', () => {
      const value = {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: 0.95,
      };
      expect(isUserLocalePreference(value)).toBe(true);
    });

    it('should return true for zh locale', () => {
      const value = {
        locale: 'zh',
        source: 'browser',
        timestamp: Date.now(),
        confidence: 0.8,
      };
      expect(isUserLocalePreference(value)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isUserLocalePreference(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isUserLocalePreference(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isUserLocalePreference('string')).toBe(false);
      expect(isUserLocalePreference(123)).toBe(false);
      expect(isUserLocalePreference(true)).toBe(false);
    });

    it('should return false when missing locale', () => {
      const value = {
        source: 'user',
        timestamp: Date.now(),
        confidence: 0.95,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false when missing source', () => {
      const value = {
        locale: 'en',
        timestamp: Date.now(),
        confidence: 0.95,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false when missing timestamp', () => {
      const value = {
        locale: 'en',
        source: 'user',
        confidence: 0.95,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false when missing confidence', () => {
      const value = {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false for invalid locale', () => {
      const value = {
        locale: 'invalid-locale',
        source: 'user',
        timestamp: Date.now(),
        confidence: 0.95,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false for invalid source', () => {
      const value = {
        locale: 'en',
        source: 'invalid-source',
        timestamp: Date.now(),
        confidence: 0.95,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false for invalid timestamp', () => {
      const value = {
        locale: 'en',
        source: 'user',
        timestamp: -1,
        confidence: 0.95,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false for invalid confidence (< 0)', () => {
      const value = {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: -0.1,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return false for invalid confidence (> 1)', () => {
      const value = {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: 1.5,
      };
      expect(isUserLocalePreference(value)).toBe(false);
    });

    it('should return true for edge case confidence values (0 and 1)', () => {
      const valueZero = {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: 0,
      };
      const valueOne = {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: 1,
      };
      expect(isUserLocalePreference(valueZero)).toBe(true);
      expect(isUserLocalePreference(valueOne)).toBe(true);
    });

    it('should return true with optional metadata', () => {
      const value = {
        locale: 'en',
        source: 'user',
        timestamp: Date.now(),
        confidence: 0.95,
        metadata: { userAgent: 'test' },
      };
      expect(isUserLocalePreference(value)).toBe(true);
    });

    it('should return true for browser source', () => {
      const value = {
        locale: 'en',
        source: 'browser',
        timestamp: Date.now(),
        confidence: 0.8,
      };
      expect(isUserLocalePreference(value)).toBe(true);
    });

    it('should return true for geo source', () => {
      const value = {
        locale: 'zh',
        source: 'geo',
        timestamp: Date.now(),
        confidence: 0.7,
      };
      expect(isUserLocalePreference(value)).toBe(true);
    });
  });

  describe('isLocaleDetectionHistory', () => {
    it('should return true for valid locale detection history', () => {
      const value = {
        detections: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: Date.now(),
            confidence: 0.9,
          },
        ],
        lastUpdated: Date.now(),
        totalDetections: 1,
      };
      expect(isLocaleDetectionHistory(value)).toBe(true);
    });

    it('should return true for empty detections array', () => {
      const value = {
        detections: [],
        lastUpdated: Date.now(),
        totalDetections: 0,
      };
      expect(isLocaleDetectionHistory(value)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isLocaleDetectionHistory(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isLocaleDetectionHistory(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isLocaleDetectionHistory('string')).toBe(false);
      expect(isLocaleDetectionHistory(123)).toBe(false);
    });

    it('should return false when missing detections', () => {
      const value = {
        lastUpdated: Date.now(),
        totalDetections: 0,
      };
      expect(isLocaleDetectionHistory(value)).toBe(false);
    });

    it('should return false when missing lastUpdated', () => {
      const value = {
        detections: [],
        totalDetections: 0,
      };
      expect(isLocaleDetectionHistory(value)).toBe(false);
    });

    it('should return false when missing totalDetections', () => {
      const value = {
        detections: [],
        lastUpdated: Date.now(),
      };
      expect(isLocaleDetectionHistory(value)).toBe(false);
    });

    it('should return false when detections is not an array', () => {
      const value = {
        detections: 'not-array',
        lastUpdated: Date.now(),
        totalDetections: 0,
      };
      expect(isLocaleDetectionHistory(value)).toBe(false);
    });

    it('should return false when lastUpdated is not a number', () => {
      const value = {
        detections: [],
        lastUpdated: '2024-01-01',
        totalDetections: 0,
      };
      expect(isLocaleDetectionHistory(value)).toBe(false);
    });

    it('should return false when totalDetections is not a number', () => {
      const value = {
        detections: [],
        lastUpdated: Date.now(),
        totalDetections: 'zero',
      };
      expect(isLocaleDetectionHistory(value)).toBe(false);
    });

    it('should return true with multiple detections', () => {
      const value = {
        detections: [
          {
            locale: 'en',
            source: 'browser',
            timestamp: Date.now(),
            confidence: 0.9,
          },
          {
            locale: 'zh',
            source: 'geo',
            timestamp: Date.now() - 1000,
            confidence: 0.8,
          },
        ],
        lastUpdated: Date.now(),
        totalDetections: 2,
      };
      expect(isLocaleDetectionHistory(value)).toBe(true);
    });
  });

  describe('isStorageSyncConfig', () => {
    it('should return true for valid storage sync config', () => {
      const value = {
        interval: 5000,
        retryAttempts: 3,
      };
      expect(isStorageSyncConfig(value)).toBe(true);
    });

    it('should return true with zero values', () => {
      const value = {
        interval: 0,
        retryAttempts: 0,
      };
      expect(isStorageSyncConfig(value)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isStorageSyncConfig(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isStorageSyncConfig(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isStorageSyncConfig('string')).toBe(false);
      expect(isStorageSyncConfig(123)).toBe(false);
    });

    it('should return false when missing interval', () => {
      const value = {
        retryAttempts: 3,
      };
      expect(isStorageSyncConfig(value)).toBe(false);
    });

    it('should return false when missing retryAttempts', () => {
      const value = {
        interval: 5000,
      };
      expect(isStorageSyncConfig(value)).toBe(false);
    });

    it('should return false when interval is not a number', () => {
      const value = {
        interval: '5000',
        retryAttempts: 3,
      };
      expect(isStorageSyncConfig(value)).toBe(false);
    });

    it('should return false when retryAttempts is not a number', () => {
      const value = {
        interval: 5000,
        retryAttempts: '3',
      };
      expect(isStorageSyncConfig(value)).toBe(false);
    });

    it('should return true with additional properties', () => {
      const value = {
        interval: 5000,
        retryAttempts: 3,
        extraProperty: 'ignored',
      };
      expect(isStorageSyncConfig(value)).toBe(true);
    });

    it('should return true with large numbers', () => {
      const value = {
        interval: Number.MAX_SAFE_INTEGER,
        retryAttempts: 100,
      };
      expect(isStorageSyncConfig(value)).toBe(true);
    });

    it('should return true with negative numbers (type guard only checks type)', () => {
      const value = {
        interval: -1000,
        retryAttempts: -5,
      };
      expect(isStorageSyncConfig(value)).toBe(true);
    });

    it('should return true with decimal numbers', () => {
      const value = {
        interval: 1000.5,
        retryAttempts: 3.7,
      };
      expect(isStorageSyncConfig(value)).toBe(true);
    });
  });
});
