/**
 * Unit tests for stats-analyzer module
 * Tests preference statistics analysis functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserLocalePreference } from '@/lib/locale-storage-types';
import { getPreferenceChangeStats } from '../stats-analyzer';

const mockGetPreferenceHistory = vi.fn();

vi.mock('../history-manager', () => ({
  getPreferenceHistory: () => mockGetPreferenceHistory(),
}));

describe('stats-analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getPreferenceChangeStats', () => {
    it('should return zero stats when history is empty', () => {
      mockGetPreferenceHistory.mockReturnValue([]);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(0);
      expect(stats.localeChanges).toEqual({});
      expect(stats.sourceChanges).toEqual({});
      expect(stats.averageConfidence).toBe(0);
      expect(stats.lastChange).toBeNull();
      expect(stats.changeFrequency).toBe(0);
    });

    it('should calculate total changes correctly', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now(),
        },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 0.7,
          timestamp: Date.now() - 2000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(3);
    });

    it('should count locale changes correctly', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now(),
        },
        {
          locale: 'en',
          source: 'browser',
          confidence: 0.8,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'zh',
          source: 'geo',
          confidence: 0.7,
          timestamp: Date.now() - 2000,
        },
        {
          locale: 'zh',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now() - 3000,
        },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: Date.now() - 4000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.localeChanges['en']).toBe(2);
      expect(stats.localeChanges['zh']).toBe(3);
    });

    it('should count source changes correctly', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now(),
        },
        {
          locale: 'zh',
          source: 'user',
          confidence: 0.8,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'en',
          source: 'browser',
          confidence: 0.7,
          timestamp: Date.now() - 2000,
        },
        {
          locale: 'zh',
          source: 'geo',
          confidence: 0.9,
          timestamp: Date.now() - 3000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.sourceChanges['user']).toBe(2);
      expect(stats.sourceChanges['browser']).toBe(1);
      expect(stats.sourceChanges['geo']).toBe(1);
    });

    it('should calculate average confidence correctly', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.8,
          timestamp: Date.now(),
        },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.6,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 1.0,
          timestamp: Date.now() - 2000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.averageConfidence).toBeCloseTo(0.8, 5);
    });

    it('should return lastChange timestamp from most recent entry', () => {
      const now = Date.now();
      const history: UserLocalePreference[] = [
        { locale: 'en', source: 'user', confidence: 0.9, timestamp: now },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: now - 10000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.lastChange).toBe(now);
    });

    it('should handle single entry history', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.95,
          timestamp: Date.now(),
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(1);
      expect(stats.localeChanges['en']).toBe(1);
      expect(stats.sourceChanges['user']).toBe(1);
      expect(stats.averageConfidence).toBe(0.95);
      expect(stats.changeFrequency).toBe(0); // Single entry, no frequency
    });

    it('should calculate change frequency for multiple entries', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const history: UserLocalePreference[] = [
        { locale: 'en', source: 'user', confidence: 0.9, timestamp: now },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: now - oneDayMs,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 0.7,
          timestamp: now - 2 * oneDayMs,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      // 3 changes over 2 days = 1.5 changes per day
      expect(stats.changeFrequency).toBeGreaterThan(0);
    });

    it('should handle entries with same timestamp', () => {
      const timestamp = Date.now();
      const history: UserLocalePreference[] = [
        { locale: 'en', source: 'user', confidence: 0.9, timestamp },
        { locale: 'zh', source: 'browser', confidence: 0.8, timestamp },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(2);
      expect(stats.changeFrequency).toBe(0); // No time span
    });

    it('should handle all same locale entries', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now(),
        },
        {
          locale: 'en',
          source: 'browser',
          confidence: 0.8,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 0.7,
          timestamp: Date.now() - 2000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.localeChanges['en']).toBe(3);
      expect(Object.keys(stats.localeChanges)).toHaveLength(1);
    });

    it('should handle all same source entries', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now(),
        },
        {
          locale: 'zh',
          source: 'user',
          confidence: 0.8,
          timestamp: Date.now() - 1000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.sourceChanges['user']).toBe(2);
      expect(Object.keys(stats.sourceChanges)).toHaveLength(1);
    });

    it('should handle zero confidence values', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'default',
          confidence: 0,
          timestamp: Date.now(),
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.averageConfidence).toBe(0);
    });

    it('should handle max confidence values', () => {
      const history: UserLocalePreference[] = [
        { locale: 'en', source: 'user', confidence: 1, timestamp: Date.now() },
        {
          locale: 'zh',
          source: 'user',
          confidence: 1,
          timestamp: Date.now() - 1000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.averageConfidence).toBe(1);
    });

    it('should handle mixed confidence values', () => {
      const history: UserLocalePreference[] = [
        { locale: 'en', source: 'user', confidence: 0, timestamp: Date.now() },
        {
          locale: 'zh',
          source: 'user',
          confidence: 0.5,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'en',
          source: 'user',
          confidence: 1,
          timestamp: Date.now() - 2000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.averageConfidence).toBeCloseTo(0.5, 5);
    });

    it('should handle entries with missing timestamps gracefully', () => {
      const history: UserLocalePreference[] = [
        { locale: 'en', source: 'user', confidence: 0.9, timestamp: 0 },
        { locale: 'zh', source: 'browser', confidence: 0.8, timestamp: 0 },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(2);
      expect(stats.lastChange).toBe(0);
    });

    it('should return correct type structure', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now(),
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(typeof stats.totalChanges).toBe('number');
      expect(typeof stats.localeChanges).toBe('object');
      expect(typeof stats.sourceChanges).toBe('object');
      expect(typeof stats.averageConfidence).toBe('number');
      expect(typeof stats.changeFrequency).toBe('number');
      expect(
        stats.lastChange === null || typeof stats.lastChange === 'number',
      ).toBe(true);
    });

    it('should handle large history', () => {
      const history: UserLocalePreference[] = Array.from(
        { length: 100 },
        (_, i) => ({
          locale: i % 2 === 0 ? 'en' : 'zh',
          source: ['user', 'browser', 'geo'][i % 3]!,
          confidence: 0.5 + (i % 50) / 100,
          timestamp: Date.now() - i * 60000,
        }),
      ) as UserLocalePreference[];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(100);
      expect(stats.localeChanges['en']).toBe(50);
      expect(stats.localeChanges['zh']).toBe(50);
    });

    it('should handle very small time span correctly', () => {
      const now = Date.now();
      const history: UserLocalePreference[] = [
        { locale: 'en', source: 'user', confidence: 0.9, timestamp: now },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: now - 1,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(2);
      expect(stats.changeFrequency).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined/null from history manager', () => {
      mockGetPreferenceHistory.mockReturnValue([]);

      const stats = getPreferenceChangeStats();

      expect(stats.totalChanges).toBe(0);
    });

    it('should handle different locale source types', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.9,
          timestamp: Date.now(),
        },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.8,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 0.7,
          timestamp: Date.now() - 2000,
        },
        {
          locale: 'zh',
          source: 'url',
          confidence: 0.6,
          timestamp: Date.now() - 3000,
        },
        {
          locale: 'en',
          source: 'default',
          confidence: 0.5,
          timestamp: Date.now() - 4000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.sourceChanges['user']).toBe(1);
      expect(stats.sourceChanges['browser']).toBe(1);
      expect(stats.sourceChanges['geo']).toBe(1);
      expect(stats.sourceChanges['url']).toBe(1);
      expect(stats.sourceChanges['default']).toBe(1);
    });

    it('should preserve decimal precision in averageConfidence', () => {
      const history: UserLocalePreference[] = [
        {
          locale: 'en',
          source: 'user',
          confidence: 0.333,
          timestamp: Date.now(),
        },
        {
          locale: 'zh',
          source: 'browser',
          confidence: 0.666,
          timestamp: Date.now() - 1000,
        },
        {
          locale: 'en',
          source: 'geo',
          confidence: 0.999,
          timestamp: Date.now() - 2000,
        },
      ];

      mockGetPreferenceHistory.mockReturnValue(history);

      const stats = getPreferenceChangeStats();

      expect(stats.averageConfidence).toBeCloseTo(0.666, 3);
    });
  });
});
