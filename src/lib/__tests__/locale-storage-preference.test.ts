import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkDataConsistency,
  fixDataInconsistency,
  getStorageUsage,
  optimizeStoragePerformance,
  syncPreferenceData,
} from '@/lib/locale-storage-preference-cache';
import {
  getPreferenceSummary,
  getUserPreference,
  hasUserPreference,
  saveUserPreference,
  updatePreferenceConfidence,
  validatePreferenceData,
} from '@/lib/locale-storage-preference-core';
import {
  createOverrideClearedEvent,
  createOverrideSetEvent,
  createPreferenceErrorEvent,
  createPreferenceLoadedEvent,
  createPreferenceSavedEvent,
  createSyncEvent,
  getPreferenceChangeStats,
  getPreferenceHistory,
  PreferenceEventManager,
  recordPreferenceHistory,
} from '@/lib/locale-storage-preference-events';
import {
  clearUserOverride,
  getOverrideStats,
  getUserOverride,
  hasUserOverride,
  setUserOverride,
} from '@/lib/locale-storage-preference-override';
import { LocalePreferenceManager } from '../locale-storage-preference';

// Mock all sub-modules
vi.mock('@/lib/locale-storage-preference-core', () => ({
  validatePreferenceData: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
  })),
  createDefaultPreference: vi.fn(() => ({
    locale: 'en',
    source: 'default',
    confidence: 0.5,
    timestamp: Date.now(),
    metadata: {},
  })),
  normalizePreference: vi.fn((pref) => pref),
  saveUserPreference: vi.fn(() => ({
    success: true,
    data: {
      locale: 'en',
      source: 'user',
      confidence: 0.9,
      timestamp: Date.now(),
    },
    source: 'localStorage',
    timestamp: Date.now(),
  })),
  getUserPreference: vi.fn(() => ({
    success: true,
    data: {
      locale: 'en',
      source: 'user',
      confidence: 0.9,
      timestamp: Date.now(),
    },
    source: 'localStorage',
    timestamp: Date.now(),
  })),
  updatePreferenceConfidence: vi.fn(() => ({
    success: true,
    data: {
      locale: 'en',
      source: 'user',
      confidence: 0.8,
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  })),
  hasUserPreference: vi.fn(() => true),
  getPreferenceSourcePriority: vi.fn(() => []),
  comparePreferences: vi.fn(() => ({ isEqual: true, differences: [] })),
  getPreferenceSummary: vi.fn(() => ({
    hasPreference: true,
    locale: 'en',
    source: 'user',
    confidence: 0.9,
    age: 0,
    isValid: true,
  })),
  clearUserPreference: vi.fn(() => ({ success: true, timestamp: Date.now() })),
}));

vi.mock('@/lib/locale-storage-preference-override', () => ({
  setUserOverride: vi.fn(() => ({
    success: true,
    data: {
      locale: 'zh',
      source: 'user_override',
      confidence: 1,
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  })),
  getUserOverride: vi.fn(() => ({
    success: true,
    data: 'zh',
    source: 'localStorage',
    timestamp: Date.now(),
  })),
  clearUserOverride: vi.fn(() => ({ success: true, timestamp: Date.now() })),
  hasUserOverride: vi.fn(() => true),
  getOverrideHistory: vi.fn(() => []),
  recordOverrideOperation: vi.fn(),
  getOverrideStats: vi.fn(() => ({
    totalOverrides: 0,
    currentOverride: null,
    lastOverrideTime: null,
    mostUsedLocale: null,
    overrideFrequency: {},
  })),
  clearOverrideHistory: vi.fn(() => ({ success: true, timestamp: Date.now() })),
  exportOverrideData: vi.fn(() => ({
    currentOverride: null,
    history: [],
    stats: {},
    exportTime: Date.now(),
  })),
  importOverrideData: vi.fn(() => ({ success: true, timestamp: Date.now() })),
}));

vi.mock('@/lib/locale-storage-preference-cache', () => ({
  PreferenceCacheManager: {
    getCachedPreference: vi.fn(() => null),
    updateCache: vi.fn(),
    clearCache: vi.fn(),
    getCacheStatus: vi.fn(() => ({
      size: 0,
      age: 0,
      isExpired: false,
      keys: [],
    })),
    warmUpCache: vi.fn(),
  },
  syncPreferenceData: vi.fn(() => ({
    success: true,
    data: { localStorage: null, cookies: null, synced: true },
    timestamp: Date.now(),
  })),
  checkDataConsistency: vi.fn(() => ({
    isConsistent: true,
    issues: [],
    recommendations: [],
  })),
  fixDataInconsistency: vi.fn(() => ({
    success: true,
    data: { fixed: false, actions: ['No issues found'] },
    timestamp: Date.now(),
  })),
  getStorageUsage: vi.fn(() => ({
    localStorage: { available: true, size: 100, quota: 5000000 },
    cookies: { available: true, size: 50, count: 2 },
    cache: { size: 0, age: 0, isExpired: false },
  })),
  optimizeStoragePerformance: vi.fn(() => ({
    success: true,
    data: {
      optimized: true,
      actions: ['Warmed up cache'],
      performance: { before: 0, after: 1, improvement: -1 },
    },
    timestamp: Date.now(),
  })),
}));

vi.mock('@/lib/locale-storage-preference-events', () => ({
  PreferenceEventManager: {
    emitEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    removeAllListeners: vi.fn(),
    getListenerCount: vi.fn(() => 0),
  },
  createPreferenceSavedEvent: vi.fn(() => ({ type: 'preference_saved' })),
  createPreferenceLoadedEvent: vi.fn(() => ({ type: 'preference_loaded' })),
  createOverrideSetEvent: vi.fn(() => ({ type: 'override_set' })),
  createOverrideClearedEvent: vi.fn(() => ({ type: 'override_cleared' })),
  createSyncEvent: vi.fn(() => ({ type: 'sync' })),
  createPreferenceErrorEvent: vi.fn(() => ({ type: 'preference_error' })),
  getPreferenceHistory: vi.fn(() => []),
  recordPreferenceHistory: vi.fn(),
  clearPreferenceHistory: vi.fn(() => ({ success: true })),
  getPreferenceChangeStats: vi.fn(() => ({
    totalChanges: 0,
    changeFrequency: {},
    averageConfidence: 0,
  })),
  consoleLogListener: vi.fn(),
  historyRecordingListener: vi.fn(),
  setupDefaultListeners: vi.fn(),
  cleanupEventSystem: vi.fn(),
  getEventSystemStatus: vi.fn(() => ({ listenerCount: 0, isActive: false })),
}));

function createValidPreference(overrides = {}) {
  return {
    locale: 'en' as const,
    source: 'user' as const,
    confidence: 0.9,
    timestamp: Date.now(),
    metadata: {},
    ...overrides,
  };
}

describe('locale-storage-preference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LocalePreferenceManager', () => {
    describe('saveUserPreference', () => {
      it('should save preference and emit event', () => {
        const preference = createValidPreference();

        const result = LocalePreferenceManager.saveUserPreference(preference);

        expect(result.success).toBe(true);
        expect(saveUserPreference).toHaveBeenCalledWith(preference);
        expect(createPreferenceSavedEvent).toHaveBeenCalled();
        expect(PreferenceEventManager.emitEvent).toHaveBeenCalled();
        expect(recordPreferenceHistory).toHaveBeenCalled();
      });

      it('should emit error event on failure', () => {
        vi.mocked(saveUserPreference).mockReturnValueOnce({
          success: false,
          error: 'Save failed',
          timestamp: Date.now(),
        });

        const preference = createValidPreference();
        const result = LocalePreferenceManager.saveUserPreference(preference);

        expect(result.success).toBe(false);
        expect(createPreferenceErrorEvent).toHaveBeenCalledWith(
          'saveUserPreference',
          'Save failed',
        );
        expect(PreferenceEventManager.emitEvent).toHaveBeenCalled();
      });
    });

    describe('getUserPreference', () => {
      it('should get preference and emit event', () => {
        const result = LocalePreferenceManager.getUserPreference();

        expect(result.success).toBe(true);
        expect(getUserPreference).toHaveBeenCalled();
        expect(createPreferenceLoadedEvent).toHaveBeenCalled();
        expect(PreferenceEventManager.emitEvent).toHaveBeenCalled();
      });

      it('should emit error event on failure', () => {
        vi.mocked(getUserPreference).mockReturnValueOnce({
          success: false,
          error: 'Get failed',
          timestamp: Date.now(),
        });

        const result = LocalePreferenceManager.getUserPreference();

        expect(result.success).toBe(false);
        expect(createPreferenceErrorEvent).toHaveBeenCalledWith(
          'getUserPreference',
          'Get failed',
        );
      });
    });

    describe('setUserOverride', () => {
      it('should set override and emit event', () => {
        const result = LocalePreferenceManager.setUserOverride('zh');

        expect(result.success).toBe(true);
        expect(setUserOverride).toHaveBeenCalledWith('zh', undefined);
        expect(createOverrideSetEvent).toHaveBeenCalledWith('zh', undefined);
        expect(PreferenceEventManager.emitEvent).toHaveBeenCalled();
      });

      it('should pass metadata to setUserOverride', () => {
        const metadata = { reason: 'manual' };
        LocalePreferenceManager.setUserOverride('en', metadata);

        expect(setUserOverride).toHaveBeenCalledWith('en', metadata);
        expect(createOverrideSetEvent).toHaveBeenCalledWith('en', metadata);
      });

      it('should emit error event on failure', () => {
        vi.mocked(setUserOverride).mockReturnValueOnce({
          success: false,
          error: 'Override failed',
          timestamp: Date.now(),
        });

        const result = LocalePreferenceManager.setUserOverride('zh');

        expect(result.success).toBe(false);
        expect(createPreferenceErrorEvent).toHaveBeenCalledWith(
          'setUserOverride',
          'Override failed',
        );
      });
    });

    describe('getUserOverride', () => {
      it('should delegate to getUserOverride', () => {
        const result = LocalePreferenceManager.getUserOverride();

        expect(result.success).toBe(true);
        expect(getUserOverride).toHaveBeenCalled();
      });
    });

    describe('clearUserOverride', () => {
      it('should clear override and emit event', () => {
        const result = LocalePreferenceManager.clearUserOverride();

        expect(result.success).toBe(true);
        expect(clearUserOverride).toHaveBeenCalled();
        expect(createOverrideClearedEvent).toHaveBeenCalled();
        expect(PreferenceEventManager.emitEvent).toHaveBeenCalled();
      });

      it('should emit error event on failure', () => {
        vi.mocked(clearUserOverride).mockReturnValueOnce({
          success: false,
          error: 'Clear failed',
          timestamp: Date.now(),
        });

        const result = LocalePreferenceManager.clearUserOverride();

        expect(result.success).toBe(false);
        expect(createPreferenceErrorEvent).toHaveBeenCalledWith(
          'clearUserOverride',
          'Clear failed',
        );
      });
    });

    describe('updatePreferenceConfidence', () => {
      it('should delegate to updatePreferenceConfidence', () => {
        const result = LocalePreferenceManager.updatePreferenceConfidence(0.8);

        expect(result.success).toBe(true);
        expect(updatePreferenceConfidence).toHaveBeenCalledWith(0.8);
      });
    });

    describe('getPreferenceHistory', () => {
      it('should delegate to getPreferenceHistory', () => {
        const result = LocalePreferenceManager.getPreferenceHistory();

        expect(getPreferenceHistory).toHaveBeenCalled();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('addEventListener', () => {
      it('should delegate to PreferenceEventManager', () => {
        const listener = vi.fn();
        LocalePreferenceManager.addEventListener('preference_saved', listener);

        expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
          'preference_saved',
          listener,
        );
      });
    });

    describe('removeEventListener', () => {
      it('should delegate to PreferenceEventManager', () => {
        const listener = vi.fn();
        LocalePreferenceManager.removeEventListener(
          'preference_saved',
          listener,
        );

        expect(PreferenceEventManager.removeEventListener).toHaveBeenCalledWith(
          'preference_saved',
          listener,
        );
      });
    });

    describe('removeAllListeners', () => {
      it('should delegate to PreferenceEventManager', () => {
        LocalePreferenceManager.removeAllListeners();

        expect(PreferenceEventManager.removeAllListeners).toHaveBeenCalled();
      });
    });

    describe('hasUserPreference', () => {
      it('should delegate to hasUserPreference', () => {
        const result = LocalePreferenceManager.hasUserPreference();

        expect(hasUserPreference).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    describe('hasUserOverride', () => {
      it('should delegate to hasUserOverride', () => {
        const result = LocalePreferenceManager.hasUserOverride();

        expect(hasUserOverride).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    describe('getPreferenceSummary', () => {
      it('should delegate to getPreferenceSummary', () => {
        const result = LocalePreferenceManager.getPreferenceSummary();

        expect(getPreferenceSummary).toHaveBeenCalled();
        expect(result.hasPreference).toBe(true);
      });
    });

    describe('syncPreferenceData', () => {
      it('should sync and emit event', () => {
        const result = LocalePreferenceManager.syncPreferenceData();

        expect(result.success).toBe(true);
        expect(syncPreferenceData).toHaveBeenCalled();
        expect(createSyncEvent).toHaveBeenCalled();
        expect(PreferenceEventManager.emitEvent).toHaveBeenCalled();
      });

      it('should not emit event when sync returns no data', () => {
        vi.mocked(syncPreferenceData).mockReturnValueOnce({
          success: true,
          data: undefined,
          timestamp: Date.now(),
        });

        LocalePreferenceManager.syncPreferenceData();

        expect(createSyncEvent).not.toHaveBeenCalled();
      });
    });

    describe('checkDataConsistency', () => {
      it('should delegate to checkDataConsistency', () => {
        const result = LocalePreferenceManager.checkDataConsistency();

        expect(checkDataConsistency).toHaveBeenCalled();
        expect(result.isConsistent).toBe(true);
      });
    });

    describe('fixDataInconsistency', () => {
      it('should delegate to fixDataInconsistency', () => {
        const result = LocalePreferenceManager.fixDataInconsistency();

        expect(fixDataInconsistency).toHaveBeenCalled();
        expect(result.success).toBe(true);
      });
    });

    describe('getStorageUsage', () => {
      it('should delegate to getStorageUsage', () => {
        const result = LocalePreferenceManager.getStorageUsage();

        expect(getStorageUsage).toHaveBeenCalled();
        expect(result.localStorage.available).toBe(true);
      });
    });

    describe('optimizeStoragePerformance', () => {
      it('should delegate to optimizeStoragePerformance', () => {
        const result = LocalePreferenceManager.optimizeStoragePerformance();

        expect(optimizeStoragePerformance).toHaveBeenCalled();
        expect(result.success).toBe(true);
      });
    });

    describe('getOverrideStats', () => {
      it('should delegate to getOverrideStats', () => {
        const result = LocalePreferenceManager.getOverrideStats();

        expect(getOverrideStats).toHaveBeenCalled();
        expect(result).toHaveProperty('totalOverrides');
      });
    });

    describe('getPreferenceChangeStats', () => {
      it('should delegate to getPreferenceChangeStats', () => {
        const result = LocalePreferenceManager.getPreferenceChangeStats();

        expect(getPreferenceChangeStats).toHaveBeenCalled();
        expect(result).toHaveProperty('totalChanges');
      });
    });

    describe('validatePreference', () => {
      it('should return true for valid preference', () => {
        const preference = createValidPreference();
        const result = LocalePreferenceManager.validatePreference(preference);

        expect(validatePreferenceData).toHaveBeenCalledWith(preference);
        expect(result).toBe(true);
      });

      it('should return false for invalid preference', () => {
        vi.mocked(validatePreferenceData).mockReturnValueOnce({
          isValid: false,
          errors: ['Invalid locale'],
          warnings: [],
        });

        const preference = createValidPreference({ locale: '' });
        const result = LocalePreferenceManager.validatePreference(preference);

        expect(result).toBe(false);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle full preference lifecycle', () => {
      // Save preference
      const preference = createValidPreference();
      LocalePreferenceManager.saveUserPreference(preference);
      expect(saveUserPreference).toHaveBeenCalled();
      expect(PreferenceEventManager.emitEvent).toHaveBeenCalled();

      // Get preference
      LocalePreferenceManager.getUserPreference();
      expect(getUserPreference).toHaveBeenCalled();

      // Set override
      LocalePreferenceManager.setUserOverride('zh');
      expect(setUserOverride).toHaveBeenCalled();

      // Clear override
      LocalePreferenceManager.clearUserOverride();
      expect(clearUserOverride).toHaveBeenCalled();
    });

    it('should handle sync and consistency checks', () => {
      // Sync data
      LocalePreferenceManager.syncPreferenceData();
      expect(syncPreferenceData).toHaveBeenCalled();

      // Check consistency
      LocalePreferenceManager.checkDataConsistency();
      expect(checkDataConsistency).toHaveBeenCalled();

      // Fix inconsistency
      LocalePreferenceManager.fixDataInconsistency();
      expect(fixDataInconsistency).toHaveBeenCalled();

      // Optimize performance
      LocalePreferenceManager.optimizeStoragePerformance();
      expect(optimizeStoragePerformance).toHaveBeenCalled();
    });

    it('should handle event listener lifecycle', () => {
      const listener = vi.fn();

      // Add listener
      LocalePreferenceManager.addEventListener('preference_saved', listener);
      expect(PreferenceEventManager.addEventListener).toHaveBeenCalledWith(
        'preference_saved',
        listener,
      );

      // Remove listener
      LocalePreferenceManager.removeEventListener('preference_saved', listener);
      expect(PreferenceEventManager.removeEventListener).toHaveBeenCalledWith(
        'preference_saved',
        listener,
      );

      // Remove all listeners
      LocalePreferenceManager.removeAllListeners();
      expect(PreferenceEventManager.removeAllListeners).toHaveBeenCalled();
    });
  });
});
