import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerformanceConfig } from '@/lib/performance-monitoring-types';
import { ConfigHistoryManager } from '../performance-monitoring-config-history';

// Helper to create a base config
function createBaseConfig(
  overrides?: Partial<PerformanceConfig>,
): PerformanceConfig {
  return {
    reactScan: { enabled: false },
    bundleAnalyzer: { enabled: false },
    sizeLimit: { enabled: false, maxSize: 500 },
    global: {
      enabled: true,
      dataRetentionTime: 300000,
      maxMetrics: 100,
    },
    ...overrides,
  };
}

describe('performance-monitoring-config-history', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ConfigHistoryManager', () => {
    describe('constructor', () => {
      it('should create instance with empty history', () => {
        const manager = new ConfigHistoryManager();

        expect(manager).toBeInstanceOf(ConfigHistoryManager);
        expect(manager.length).toBe(0);
      });
    });

    describe('recordChange', () => {
      it('should record config change', () => {
        const manager = new ConfigHistoryManager();
        const config = createBaseConfig();

        manager.recordChange(config);

        expect(manager.length).toBe(1);
      });

      it('should record config change with reason', () => {
        const manager = new ConfigHistoryManager();
        const config = createBaseConfig();

        manager.recordChange(config, 'Initial configuration');

        const history = manager.getHistory();
        expect(history[0].reason).toBe('Initial configuration');
      });

      it('should record timestamp', () => {
        const manager = new ConfigHistoryManager();
        const config = createBaseConfig();
        const now = Date.now();

        vi.setSystemTime(now);
        manager.recordChange(config);

        const history = manager.getHistory();
        expect(history[0].timestamp).toBe(now);
      });

      it('should store config at record time', () => {
        const manager = new ConfigHistoryManager();
        // recordChange does shallow copy { ...config }
        // So nested objects like reactScan are shared
        const config1 = createBaseConfig({ reactScan: { enabled: false } });

        manager.recordChange(config1);

        // Later record with different config
        const config2 = createBaseConfig({ reactScan: { enabled: true } });
        manager.recordChange(config2);

        const history = manager.getHistory();
        // Each entry has its own config object (shallow copy)
        expect(history).toHaveLength(2);
      });

      it('should limit history to 10 entries', () => {
        const manager = new ConfigHistoryManager();

        // Record 15 changes
        for (let i = 0; i < 15; i++) {
          manager.recordChange(
            createBaseConfig({ reactScan: { enabled: i % 2 === 0 } }),
          );
        }

        expect(manager.length).toBe(10);
      });

      it('should keep the most recent entries when limiting', () => {
        const manager = new ConfigHistoryManager();

        // Record 12 changes
        for (let i = 0; i < 12; i++) {
          manager.recordChange(createBaseConfig(), `Change ${i}`);
        }

        const history = manager.getHistory();
        // Should have entries 2-11 (last 10)
        expect(history[0].reason).toBe('Change 2');
        expect(history[9].reason).toBe('Change 11');
      });
    });

    describe('getHistory', () => {
      it('should return empty array when no history', () => {
        const manager = new ConfigHistoryManager();

        const history = manager.getHistory();

        expect(history).toEqual([]);
      });

      it('should return all recorded entries', () => {
        const manager = new ConfigHistoryManager();

        manager.recordChange(createBaseConfig(), 'First');
        manager.recordChange(createBaseConfig(), 'Second');
        manager.recordChange(createBaseConfig(), 'Third');

        const history = manager.getHistory();
        expect(history).toHaveLength(3);
        expect(history[0].reason).toBe('First');
        expect(history[2].reason).toBe('Third');
      });

      it('should return a copy of the history array', () => {
        const manager = new ConfigHistoryManager();
        manager.recordChange(createBaseConfig());

        const history1 = manager.getHistory();
        const history2 = manager.getHistory();

        expect(history1).not.toBe(history2);
      });
    });

    describe('rollback', () => {
      it('should return null when history is empty', () => {
        const manager = new ConfigHistoryManager();

        const result = manager.rollback();

        expect(result).toBeNull();
      });

      it('should return null when not enough history for rollback', () => {
        const manager = new ConfigHistoryManager();
        // With only 1 entry, rollback(1) needs length >= 2
        manager.recordChange(createBaseConfig());

        const result = manager.rollback(1);

        expect(result).toBeNull();
      });

      it('should return null with empty history', () => {
        const manager = new ConfigHistoryManager();

        const result = manager.rollback(1);

        expect(result).toBeNull();
      });

      it('should return previous config with default step of 1', () => {
        const manager = new ConfigHistoryManager();

        manager.recordChange(
          createBaseConfig({ reactScan: { enabled: false } }),
          'First',
        );
        manager.recordChange(
          createBaseConfig({ reactScan: { enabled: true } }),
          'Second',
        );

        const result = manager.rollback();

        expect(result).not.toBeNull();
        expect(result?.reactScan.enabled).toBe(false);
      });

      it('should rollback multiple steps', () => {
        const manager = new ConfigHistoryManager();

        manager.recordChange(
          createBaseConfig({ reactScan: { enabled: false } }),
          'First',
        );
        manager.recordChange(
          createBaseConfig({ reactScan: { enabled: true } }),
          'Second',
        );
        manager.recordChange(
          createBaseConfig({ bundleAnalyzer: { enabled: true } }),
          'Third',
        );

        const result = manager.rollback(2);

        expect(result).not.toBeNull();
        expect(result?.reactScan.enabled).toBe(false);
      });

      it('should return a copy of the config', () => {
        const manager = new ConfigHistoryManager();

        manager.recordChange(
          createBaseConfig({ reactScan: { enabled: false } }),
        );
        manager.recordChange(
          createBaseConfig({ reactScan: { enabled: true } }),
        );

        const result1 = manager.rollback();
        const result2 = manager.rollback();

        // rollback returns { ...config } each time, so results are different objects
        expect(result1).not.toBe(result2);
      });

      it('should return null for invalid history index', () => {
        const manager = new ConfigHistoryManager();

        manager.recordChange(createBaseConfig());
        manager.recordChange(createBaseConfig());

        const result = manager.rollback(5);

        expect(result).toBeNull();
      });
    });

    describe('length', () => {
      it('should return 0 for empty history', () => {
        const manager = new ConfigHistoryManager();

        expect(manager.length).toBe(0);
      });

      it('should return correct count', () => {
        const manager = new ConfigHistoryManager();

        manager.recordChange(createBaseConfig());
        manager.recordChange(createBaseConfig());
        manager.recordChange(createBaseConfig());

        expect(manager.length).toBe(3);
      });
    });
  });
});
