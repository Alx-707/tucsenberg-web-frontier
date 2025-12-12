/**
 * object-utils 对象操作工具函数测试
 * Tests for deepClone, mergeObjects, compareObjects
 */

import { describe, expect, it, vi } from 'vitest';
import { compareObjects, deepClone, mergeObjects } from '../object-utils';

// Mock dependencies
vi.mock('@/lib/security-object-access', () => ({
  safeGetProperty: vi.fn((obj: Record<string, unknown>, key: string) =>
    Object.prototype.hasOwnProperty.call(obj, key)
      ? Object.getOwnPropertyDescriptor(obj, key)?.value
      : undefined,
  ),
  safeSetProperty: vi.fn(
    (params: { obj: Record<string, unknown>; key: string; value: unknown }) => {
      Object.defineProperty(params.obj, params.key, {
        value: params.value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      return true;
    },
  ),
}));

vi.mock('@/lib/security/object-guards', () => ({
  hasOwn: vi.fn((obj: Record<string, unknown>, key: string) =>
    Object.prototype.hasOwnProperty.call(obj, key),
  ),
}));

describe('deepClone', () => {
  describe('primitive values', () => {
    it('should return primitive values unchanged', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(undefined)).toBeUndefined();
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(false)).toBe(false);
    });

    it('should handle number edge cases', () => {
      expect(deepClone(0)).toBe(0);
      expect(deepClone(-0)).toBe(-0);
      expect(deepClone(Infinity)).toBe(Infinity);
      expect(deepClone(-Infinity)).toBe(-Infinity);
      expect(deepClone(NaN)).toBeNaN();
    });
  });

  describe('Date objects', () => {
    it('should clone Date objects', () => {
      const original = new Date('2024-01-15T12:00:00.000Z');
      const cloned = deepClone(original);

      expect(cloned).toBeInstanceOf(Date);
      expect(cloned.getTime()).toBe(original.getTime());
      expect(cloned).not.toBe(original);
    });

    it('should preserve Date independence', () => {
      const original = new Date('2024-01-15T12:00:00.000Z');
      const cloned = deepClone(original);

      original.setFullYear(2025);
      expect(cloned.getFullYear()).toBe(2024);
    });
  });

  describe('arrays', () => {
    it('should clone simple arrays', () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested arrays', () => {
      const original = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned[0]).not.toBe(original[0]);
    });

    it('should clone arrays with mixed types', () => {
      const original = [1, 'two', null, true, { key: 'value' }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned[4]).not.toBe(original[4]);
    });

    it('should preserve array independence', () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);

      original.push(4);
      expect(cloned).toEqual([1, 2, 3]);
    });

    it('should clone empty array', () => {
      const original: unknown[] = [];
      const cloned = deepClone(original);

      expect(cloned).toEqual([]);
      expect(cloned).not.toBe(original);
    });
  });

  describe('plain objects', () => {
    it('should clone simple objects', () => {
      const original = { name: 'test', value: 123 };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested objects', () => {
      const original = {
        outer: {
          inner: {
            deep: 'value',
          },
        },
      };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.outer).not.toBe(original.outer);
      expect(cloned.outer.inner).not.toBe(original.outer.inner);
    });

    it('should preserve object independence', () => {
      const original = { name: 'test', nested: { value: 1 } };
      const cloned = deepClone(original);

      original.name = 'changed';
      original.nested.value = 999;

      expect(cloned.name).toBe('test');
      expect(cloned.nested.value).toBe(1);
    });

    it('should clone empty object', () => {
      const original = {};
      const cloned = deepClone(original);

      expect(cloned).toEqual({});
      expect(cloned).not.toBe(original);
    });

    it('should clone objects with array properties', () => {
      const original = { items: [1, 2, 3], metadata: { count: 3 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.items).not.toBe(original.items);
    });
  });

  describe('complex structures', () => {
    it('should clone deeply nested mixed structures', () => {
      const original = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'active'] },
          { id: 2, name: 'Bob', tags: ['user'] },
        ],
        metadata: {
          total: 2,
          timestamp: new Date('2024-01-15'),
        },
      };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.users[0]).not.toBe(original.users[0]);
      expect(cloned.users[0]!.tags).not.toBe(original.users[0]!.tags);
    });
  });
});

describe('mergeObjects', () => {
  describe('basic merging', () => {
    it('should merge source into target', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = mergeObjects(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should not modify original target', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3 };
      mergeObjects(target, source);

      expect(target).toEqual({ a: 1, b: 2 });
    });

    it('should return new object', () => {
      const target = { a: 1 };
      const source = { b: 2 };
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result).not.toBe(target);
      expect(result).not.toBe(source);
    });

    it('should handle empty source', () => {
      const target = { a: 1, b: 2 };
      const result = mergeObjects(target, {});

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should handle empty target', () => {
      const target = {};
      const source = { a: 1, b: 2 };
      const result = mergeObjects(target, source);

      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('nested object merging', () => {
    it('should deep merge nested objects', () => {
      const target = {
        outer: {
          a: 1,
          b: 2,
        },
      };
      const source = {
        outer: {
          b: 3,
          c: 4,
        },
      };
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result).toEqual({
        outer: {
          a: 1,
          b: 3,
          c: 4,
        },
      });
    });

    it('should deep merge multiple levels', () => {
      const target = {
        level1: {
          level2: {
            a: 1,
            b: 2,
          },
        },
      };
      const source = {
        level1: {
          level2: {
            b: 3,
            c: 4,
          },
        },
      };
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result.level1.level2).toEqual({ a: 1, b: 3, c: 4 });
    });
  });

  describe('array handling', () => {
    it('should replace arrays (not merge)', () => {
      const target = { items: [1, 2, 3] };
      const source = { items: [4, 5] };
      const result = mergeObjects(target, source);

      expect(result.items).toEqual([4, 5]);
    });

    it('should not merge arrays with objects', () => {
      const target = { data: [1, 2] };
      const source = { data: { key: 'value' } };
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result.data).toEqual({ key: 'value' });
    });
  });

  describe('undefined handling', () => {
    it('should skip undefined source values', () => {
      const target = { a: 1, b: 2 };
      // Test with undefined value - use Record type to allow undefined assignment
      const source: Record<string, unknown> = { c: 3 };
      source['a'] = undefined; // a is explicitly undefined
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should preserve target value when source is undefined', () => {
      const target = { existing: 'value' };
      // Test with undefined value - use Record type to allow undefined assignment
      const source: Record<string, unknown> = {};
      source['existing'] = undefined; // existing is explicitly undefined
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result.existing).toBe('value');
    });
  });

  describe('null handling', () => {
    it('should overwrite with null values', () => {
      const target = { a: 1, b: 'text' };
      const source = { b: null };
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result.b).toBeNull();
    });

    it('should not deep merge null values', () => {
      const target = { nested: { a: 1 } };
      const source = { nested: null };
      const result = mergeObjects(
        target,
        source as unknown as Partial<typeof target>,
      );

      expect(result.nested).toBeNull();
    });
  });

  describe('type preservation', () => {
    it('should preserve target type structure', () => {
      interface Config {
        enabled: boolean;
        maxItems: number;
        options: { debug: boolean };
      }

      const target: Config = {
        enabled: false,
        maxItems: 10,
        options: { debug: false },
      };
      const source: Partial<Config> = {
        enabled: true,
        options: { debug: true },
      };
      const result = mergeObjects(
        target as unknown as Record<string, unknown>,
        source as unknown as Record<string, unknown>,
      ) as unknown as Config;

      expect(result.enabled).toBe(true);
      expect(result.maxItems).toBe(10);
      expect(result.options.debug).toBe(true);
    });
  });
});

describe('compareObjects', () => {
  describe('primitive comparison', () => {
    it('should return true for identical primitives', () => {
      expect(compareObjects(42, 42)).toBe(true);
      expect(compareObjects('test', 'test')).toBe(true);
      expect(compareObjects(true, true)).toBe(true);
      expect(compareObjects(false, false)).toBe(true);
      expect(compareObjects(null, null)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(compareObjects(42, 43)).toBe(false);
      expect(compareObjects('test', 'TEST')).toBe(false);
      expect(compareObjects(true, false)).toBe(false);
    });

    it('should return false for different types', () => {
      expect(compareObjects(42, '42')).toBe(false);
      expect(compareObjects(true, 1)).toBe(false);
      expect(compareObjects(null, undefined)).toBe(false);
    });

    it('should handle null comparison correctly', () => {
      expect(compareObjects(null, null)).toBe(true);
      expect(compareObjects(null, {})).toBe(false);
      expect(compareObjects({}, null)).toBe(false);
    });
  });

  describe('array comparison', () => {
    it('should return true for identical arrays', () => {
      expect(compareObjects([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(compareObjects(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(compareObjects([], [])).toBe(true);
    });

    it('should return false for different arrays', () => {
      expect(compareObjects([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(compareObjects([1, 2, 3], [1, 2])).toBe(false);
      expect(compareObjects([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should compare nested arrays', () => {
      expect(
        compareObjects(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
          ],
        ),
      ).toBe(true);
      expect(
        compareObjects(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 5],
          ],
        ),
      ).toBe(false);
    });

    it('should differentiate arrays from objects', () => {
      expect(compareObjects([1, 2], { 0: 1, 1: 2 })).toBe(false);
      expect(compareObjects({ 0: 1, 1: 2 }, [1, 2])).toBe(false);
    });

    it('should compare arrays with objects', () => {
      expect(compareObjects([{ a: 1 }], [{ a: 1 }])).toBe(true);
      expect(compareObjects([{ a: 1 }], [{ a: 2 }])).toBe(false);
    });
  });

  describe('object comparison', () => {
    it('should return true for identical objects', () => {
      expect(compareObjects({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(compareObjects({}, {})).toBe(true);
    });

    it('should return false for different objects', () => {
      expect(compareObjects({ a: 1 }, { a: 2 })).toBe(false);
      expect(compareObjects({ a: 1 }, { b: 1 })).toBe(false);
      expect(compareObjects({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('should compare nested objects', () => {
      expect(
        compareObjects({ nested: { a: 1, b: 2 } }, { nested: { a: 1, b: 2 } }),
      ).toBe(true);

      expect(
        compareObjects({ nested: { a: 1, b: 2 } }, { nested: { a: 1, b: 3 } }),
      ).toBe(false);
    });

    it('should handle different key counts', () => {
      expect(compareObjects({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should compare objects with array properties', () => {
      expect(compareObjects({ items: [1, 2, 3] }, { items: [1, 2, 3] })).toBe(
        true,
      );

      expect(compareObjects({ items: [1, 2, 3] }, { items: [1, 2] })).toBe(
        false,
      );
    });
  });

  describe('same reference', () => {
    it('should return true for same reference', () => {
      const obj = { a: 1 };
      expect(compareObjects(obj, obj)).toBe(true);

      const arr = [1, 2, 3];
      expect(compareObjects(arr, arr)).toBe(true);
    });
  });

  describe('complex structures', () => {
    it('should compare deeply nested structures', () => {
      const obj1 = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin'] },
          { id: 2, name: 'Bob', tags: ['user'] },
        ],
        metadata: { total: 2 },
      };
      const obj2 = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin'] },
          { id: 2, name: 'Bob', tags: ['user'] },
        ],
        metadata: { total: 2 },
      };
      const obj3 = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin'] },
          { id: 2, name: 'Bob', tags: ['guest'] },
        ],
        metadata: { total: 2 },
      };

      expect(compareObjects(obj1, obj2)).toBe(true);
      expect(compareObjects(obj1, obj3)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty structures', () => {
      expect(compareObjects({}, {})).toBe(true);
      expect(compareObjects([], [])).toBe(true);
      expect(compareObjects({}, [])).toBe(false);
    });

    it('should handle objects with null values', () => {
      expect(compareObjects({ a: null }, { a: null })).toBe(true);
      expect(compareObjects({ a: null }, { a: undefined })).toBe(false);
    });

    it('should handle arrays with null/undefined', () => {
      expect(compareObjects([null, null], [null, null])).toBe(true);
      expect(compareObjects([null], [undefined])).toBe(false);
    });

    it('should compare objects with special property names', () => {
      expect(
        compareObjects({ 'key-with-dash': 1 }, { 'key-with-dash': 1 }),
      ).toBe(true);

      expect(
        compareObjects({ 'key with space': 1 }, { 'key with space': 1 }),
      ).toBe(true);
    });
  });
});
