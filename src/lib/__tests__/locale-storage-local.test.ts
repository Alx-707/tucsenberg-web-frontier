import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageManager } from '../locale-storage-local';

// Helper to create mock localStorage
function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('LocalStorageManager', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('set', () => {
    it('should set item in localStorage', () => {
      LocalStorageManager.set('key1', 'value1');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'key1',
        JSON.stringify('value1'),
      );
    });

    it('should serialize objects', () => {
      const obj = { nested: { value: 123 } };
      LocalStorageManager.set('key1', obj);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'key1',
        JSON.stringify(obj),
      );
    });

    it('should serialize arrays', () => {
      LocalStorageManager.set('key1', [1, 2, 3]);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'key1',
        JSON.stringify([1, 2, 3]),
      );
    });

    it('should handle errors silently', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      expect(() => LocalStorageManager.set('key1', 'value1')).not.toThrow();
    });

    it('should do nothing when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      LocalStorageManager.set('key1', 'value1');
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should get item from localStorage', () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify('value1'));
      const result = LocalStorageManager.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should parse objects', () => {
      const obj = { nested: { value: 123 } };
      mockStorage.getItem.mockReturnValue(JSON.stringify(obj));
      const result = LocalStorageManager.get<typeof obj>('key1');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent key', () => {
      mockStorage.getItem.mockReturnValue(null);
      const result = LocalStorageManager.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      mockStorage.getItem.mockReturnValue('invalid json{');
      const result = LocalStorageManager.get('key1');
      expect(result).toBeNull();
    });

    it('should return null when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      const result = LocalStorageManager.get('key1');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove item from localStorage', () => {
      LocalStorageManager.remove('key1');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key1');
    });

    it('should handle errors silently', () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => LocalStorageManager.remove('key1')).not.toThrow();
    });

    it('should do nothing when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      LocalStorageManager.remove('key1');
      expect(mockStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true when item exists', () => {
      mockStorage.getItem.mockReturnValue('value');
      expect(LocalStorageManager.exists('key1')).toBe(true);
    });

    it('should return false when item does not exist', () => {
      mockStorage.getItem.mockReturnValue(null);
      expect(LocalStorageManager.exists('key1')).toBe(false);
    });

    it('should return false on error', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Error');
      });
      expect(LocalStorageManager.exists('key1')).toBe(false);
    });

    it('should return false when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.exists('key1')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should get all items', () => {
      mockStorage.setItem('key1', JSON.stringify('value1'));
      mockStorage.setItem('key2', JSON.stringify({ data: 123 }));

      // Mock localStorage iteration
      vi.stubGlobal('localStorage', {
        ...mockStorage,
        length: 2,
        key: vi.fn((i: number) => (i === 0 ? 'key1' : 'key2')),
        getItem: vi.fn((k: string) =>
          k === 'key1'
            ? JSON.stringify('value1')
            : JSON.stringify({ data: 123 }),
        ),
      });

      const result = LocalStorageManager.getAll();
      expect(result).toEqual({
        key1: 'value1',
        key2: { data: 123 },
      });
    });

    it('should return empty object when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.getAll()).toEqual({});
    });

    it('should skip null keys', () => {
      vi.stubGlobal('localStorage', {
        length: 2,
        key: vi.fn((i: number) => (i === 0 ? null : 'key2')),
        getItem: vi.fn(() => JSON.stringify('value')),
      });

      const result = LocalStorageManager.getAll();
      expect(result).toEqual({ key2: 'value' });
    });
  });

  describe('clear', () => {
    it('should clear all localStorage items', () => {
      LocalStorageManager.clear();
      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should handle errors silently', () => {
      mockStorage.clear.mockImplementation(() => {
        throw new Error('Error');
      });
      expect(() => LocalStorageManager.clear()).not.toThrow();
    });

    it('should do nothing when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      LocalStorageManager.clear();
      expect(mockStorage.clear).not.toHaveBeenCalled();
    });
  });

  describe('getUsageSize', () => {
    it('should return 0 when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.getUsageSize()).toBe(0);
    });

    it('should calculate total size', () => {
      vi.stubGlobal('localStorage', {
        length: 1,
        key: vi.fn(() => 'key1'),
        getItem: vi.fn(() => 'value1'),
      });

      const size = LocalStorageManager.getUsageSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should skip items with null value', () => {
      vi.stubGlobal('localStorage', {
        length: 1,
        key: vi.fn(() => 'key1'),
        getItem: vi.fn(() => null),
      });

      expect(LocalStorageManager.getUsageSize()).toBe(0);
    });
  });

  describe('getItemSize', () => {
    it('should return 0 when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.getItemSize('key1')).toBe(0);
    });

    it('should return size for existing item', () => {
      mockStorage.getItem.mockReturnValue('test value');
      const size = LocalStorageManager.getItemSize('key1');
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent item', () => {
      mockStorage.getItem.mockReturnValue(null);
      expect(LocalStorageManager.getItemSize('key1')).toBe(0);
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(LocalStorageManager.isAvailable()).toBe(true);
    });

    it('should return false when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.isAvailable()).toBe(false);
    });

    it('should return false when localStorage throws', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Disabled');
      });
      expect(LocalStorageManager.isAvailable()).toBe(false);
    });
  });

  describe('getRemainingSpace', () => {
    it('should return 0 when localStorage is unavailable', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.getRemainingSpace()).toBe(0);
    });

    it('should return remaining space', () => {
      vi.stubGlobal('localStorage', {
        ...mockStorage,
        length: 0,
      });
      const remaining = LocalStorageManager.getRemainingSpace();
      // 5MB = 5 * 1024 * 1024
      expect(remaining).toBe(5 * 1024 * 1024);
    });
  });

  describe('isNearLimit', () => {
    it('should return true when localStorage is unavailable', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.isNearLimit()).toBe(true);
    });

    it('should return false when usage is low', () => {
      vi.stubGlobal('localStorage', {
        ...mockStorage,
        length: 0,
      });
      expect(LocalStorageManager.isNearLimit()).toBe(false);
    });

    it('should accept custom threshold', () => {
      vi.stubGlobal('localStorage', {
        ...mockStorage,
        length: 0,
      });
      expect(LocalStorageManager.isNearLimit(0.5)).toBe(false);
    });
  });

  describe('setWithExpiry', () => {
    it('should set item with expiry timestamp', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      LocalStorageManager.setWithExpiry('key1', 'value1', 5000);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'key1',
        JSON.stringify({ value: 'value1', expiry: now + 5000 }),
      );

      vi.useRealTimers();
    });
  });

  describe('getWithExpiry', () => {
    it('should return value when not expired', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ value: 'test', expiry: now + 5000 }),
      );

      const result = LocalStorageManager.getWithExpiry<string>('key1');
      expect(result).toBe('test');

      vi.useRealTimers();
    });

    it('should return null when expired', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ value: 'test', expiry: now - 1000 }),
      );

      const result = LocalStorageManager.getWithExpiry<string>('key1');
      expect(result).toBeNull();
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key1');

      vi.useRealTimers();
    });

    it('should return null when item does not exist', () => {
      mockStorage.getItem.mockReturnValue(null);
      expect(LocalStorageManager.getWithExpiry('key1')).toBeNull();
    });
  });

  describe('setMultiple', () => {
    it('should set multiple items', () => {
      LocalStorageManager.setMultiple({
        key1: 'value1',
        key2: { nested: true },
      });

      expect(mockStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMultiple', () => {
    it('should get multiple items', () => {
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === 'key1') return JSON.stringify('value1');
        if (key === 'key2') return JSON.stringify('value2');
        return null;
      });

      const result = LocalStorageManager.getMultiple<string>([
        'key1',
        'key2',
        'key3',
      ]);

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: null,
      });
    });
  });

  describe('removeMultiple', () => {
    it('should remove multiple items', () => {
      LocalStorageManager.removeMultiple(['key1', 'key2', 'key3']);
      expect(mockStorage.removeItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('getByPrefix', () => {
    it('should get items by prefix', () => {
      vi.stubGlobal('localStorage', {
        length: 3,
        key: vi.fn((i: number) => ['prefix_a', 'prefix_b', 'other'][i]),
        getItem: vi.fn((k: string) =>
          k.startsWith('prefix_') ? JSON.stringify(k) : JSON.stringify('other'),
        ),
      });

      const result = LocalStorageManager.getByPrefix<string>('prefix_');

      expect(result).toEqual({
        prefix_a: 'prefix_a',
        prefix_b: 'prefix_b',
      });
    });

    it('should return empty object when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(LocalStorageManager.getByPrefix('prefix_')).toEqual({});
    });
  });

  describe('removeByPrefix', () => {
    it('should remove items by prefix', () => {
      const keysToRemove: string[] = [];
      vi.stubGlobal('localStorage', {
        length: 3,
        key: vi.fn((i: number) => ['prefix_a', 'prefix_b', 'other'][i]),
        removeItem: vi.fn((k: string) => keysToRemove.push(k)),
      });

      LocalStorageManager.removeByPrefix('prefix_');

      expect(keysToRemove).toContain('prefix_a');
      expect(keysToRemove).toContain('prefix_b');
      expect(keysToRemove).not.toContain('other');
    });

    it('should do nothing when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(() => LocalStorageManager.removeByPrefix('prefix_')).not.toThrow();
    });
  });
});
