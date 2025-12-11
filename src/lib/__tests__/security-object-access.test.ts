import { describe, expect, it } from 'vitest';
import {
  COMMON_WHITELISTS,
  createSafeAccessor,
  isKeySafe,
  safeGetArrayItem,
  safeGetConfig,
  safeGetLanguageConfig,
  safeGetNestedProperty,
  safeGetPathMapping,
  safeGetProperty,
  safeIterateObject,
  safeMergeObjects,
  safeSetProperty,
} from '../security-object-access';

describe('security-object-access', () => {
  describe('safeGetProperty', () => {
    it('should return property value for valid key', () => {
      const obj = { name: 'test', value: 123 };
      expect(safeGetProperty(obj, 'name')).toBe('test');
      expect(safeGetProperty(obj, 'value')).toBe(123);
    });

    it('should return undefined for non-existent key', () => {
      const obj = { name: 'test' };
      expect(safeGetProperty(obj, 'nonExistent')).toBeUndefined();
    });

    it('should block __proto__ access', () => {
      const obj = { name: 'test' };
      expect(safeGetProperty(obj, '__proto__')).toBeUndefined();
    });

    it('should block constructor access', () => {
      const obj = { name: 'test' };
      expect(safeGetProperty(obj, 'constructor')).toBeUndefined();
    });

    it('should block prototype access', () => {
      const obj = { name: 'test' };
      expect(safeGetProperty(obj, 'prototype')).toBeUndefined();
    });

    it('should respect allowedKeys whitelist', () => {
      const obj = { name: 'test', secret: 'hidden' };
      const allowedKeys = ['name'];

      expect(safeGetProperty(obj, 'name', allowedKeys)).toBe('test');
      expect(safeGetProperty(obj, 'secret', allowedKeys)).toBeUndefined();
    });

    it('should handle numeric keys', () => {
      const obj = { 0: 'first', 1: 'second' };
      expect(safeGetProperty(obj, 0)).toBe('first');
      expect(safeGetProperty(obj, 1)).toBe('second');
    });

    it('should handle symbol keys', () => {
      const sym = Symbol('test');
      const obj = { [sym]: 'symbol value' };
      expect(safeGetProperty(obj, sym)).toBe('symbol value');
    });
  });

  describe('safeSetProperty', () => {
    it('should set property for valid key', () => {
      const obj: Record<string, unknown> = {};
      const result = safeSetProperty({ obj, key: 'name', value: 'test' });

      expect(result).toBe(true);
      expect(obj.name).toBe('test');
    });

    it('should block __proto__ setting', () => {
      const obj: Record<string, unknown> = {};
      const result = safeSetProperty({ obj, key: '__proto__', value: {} });

      expect(result).toBe(false);
    });

    it('should block constructor setting', () => {
      const obj: Record<string, unknown> = {};
      const result = safeSetProperty({ obj, key: 'constructor', value: {} });

      expect(result).toBe(false);
    });

    it('should block prototype setting', () => {
      const obj: Record<string, unknown> = {};
      const result = safeSetProperty({ obj, key: 'prototype', value: {} });

      expect(result).toBe(false);
    });

    it('should respect allowedKeys whitelist', () => {
      const obj: Record<string, unknown> = {};
      const allowedKeys = ['name'];

      const result1 = safeSetProperty({
        obj,
        key: 'name',
        value: 'allowed',
        allowedKeys,
      });
      const result2 = safeSetProperty({
        obj,
        key: 'secret',
        value: 'blocked',
        allowedKeys,
      });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(obj.name).toBe('allowed');
      expect(obj.secret).toBeUndefined();
    });

    it('should handle frozen objects gracefully', () => {
      const obj = Object.freeze({ existing: 'value' });
      const result = safeSetProperty({
        obj: obj as Record<string, unknown>,
        key: 'new',
        value: 'test',
      });

      expect(result).toBe(false);
    });
  });

  describe('safeGetLanguageConfig', () => {
    const languageConfig = {
      en: { greeting: 'Hello' },
      zh: { greeting: '你好' },
    };

    it('should return config for valid locale', () => {
      expect(safeGetLanguageConfig(languageConfig, 'en')).toEqual({
        greeting: 'Hello',
      });
      expect(safeGetLanguageConfig(languageConfig, 'zh')).toEqual({
        greeting: '你好',
      });
    });

    it('should return English config for invalid locale', () => {
      expect(safeGetLanguageConfig(languageConfig, 'fr')).toEqual({
        greeting: 'Hello',
      });
      expect(safeGetLanguageConfig(languageConfig, '__proto__')).toEqual({
        greeting: 'Hello',
      });
    });

    it('should return English config for injection attempts', () => {
      expect(safeGetLanguageConfig(languageConfig, 'constructor')).toEqual({
        greeting: 'Hello',
      });
    });
  });

  describe('safeGetPathMapping', () => {
    const pathMap = {
      '/home': 'Home Page',
      '/about': 'About Page',
      '/contact': 'Contact Page',
    };

    it('should return value for existing path', () => {
      expect(safeGetPathMapping(pathMap, '/home', 'Default')).toBe('Home Page');
      expect(safeGetPathMapping(pathMap, '/about', 'Default')).toBe(
        'About Page',
      );
    });

    it('should return default value for non-existent path', () => {
      expect(safeGetPathMapping(pathMap, '/unknown', 'Default')).toBe(
        'Default',
      );
    });

    it('should return default value for injection attempts', () => {
      expect(safeGetPathMapping(pathMap, '__proto__', 'Default')).toBe(
        'Default',
      );
      expect(safeGetPathMapping(pathMap, 'constructor', 'Default')).toBe(
        'Default',
      );
    });
  });

  describe('safeGetConfig', () => {
    const config = {
      apiKey: 'secret123',
      timeout: 5000,
      debug: true,
    };
    const allowedKeys = ['timeout', 'debug'];

    it('should return value for allowed key', () => {
      expect(safeGetConfig(config, 'timeout', allowedKeys)).toBe(5000);
      expect(safeGetConfig(config, 'debug', allowedKeys)).toBe(true);
    });

    it('should return undefined for disallowed key', () => {
      expect(safeGetConfig(config, 'apiKey', allowedKeys)).toBeUndefined();
    });

    it('should return undefined for non-existent key', () => {
      expect(safeGetConfig(config, 'nonExistent', allowedKeys)).toBeUndefined();
    });
  });

  describe('safeGetNestedProperty', () => {
    const nestedObj = {
      level1: {
        level2: {
          value: 'deep value',
        },
      },
      simple: 'simple value',
    };

    it('should access nested property', () => {
      expect(
        safeGetNestedProperty(nestedObj, ['level1', 'level2', 'value']),
      ).toBe('deep value');
    });

    it('should access simple property', () => {
      expect(safeGetNestedProperty(nestedObj, ['simple'])).toBe('simple value');
    });

    it('should return undefined for non-existent path', () => {
      expect(
        safeGetNestedProperty(nestedObj, ['level1', 'nonExistent']),
      ).toBeUndefined();
    });

    it('should return undefined for path through non-object', () => {
      expect(
        safeGetNestedProperty(nestedObj, ['simple', 'deeper']),
      ).toBeUndefined();
    });

    it('should respect allowedKeys whitelist', () => {
      const allowedKeys = ['level1', 'level2', 'value'];
      expect(
        safeGetNestedProperty(
          nestedObj,
          ['level1', 'level2', 'value'],
          allowedKeys,
        ),
      ).toBe('deep value');

      expect(
        safeGetNestedProperty(nestedObj, ['simple'], allowedKeys),
      ).toBeUndefined();
    });

    it('should handle empty path', () => {
      expect(safeGetNestedProperty(nestedObj, [])).toEqual(nestedObj);
    });
  });

  describe('safeGetArrayItem', () => {
    const array = ['first', 'second', 'third'];

    it('should return item at valid index', () => {
      expect(safeGetArrayItem(array, 0)).toBe('first');
      expect(safeGetArrayItem(array, 1)).toBe('second');
      expect(safeGetArrayItem(array, 2)).toBe('third');
    });

    it('should return undefined for negative index', () => {
      expect(safeGetArrayItem(array, -1)).toBeUndefined();
    });

    it('should return undefined for out of bounds index', () => {
      expect(safeGetArrayItem(array, 10)).toBeUndefined();
    });

    it('should return undefined for non-array', () => {
      expect(
        safeGetArrayItem('not an array' as unknown as string[], 0),
      ).toBeUndefined();
    });

    it('should handle empty array', () => {
      expect(safeGetArrayItem([], 0)).toBeUndefined();
    });
  });

  describe('safeIterateObject', () => {
    it('should iterate over all keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result: Array<[string, number]> = [];

      safeIterateObject(obj, (key, value) => {
        result.push([key, value as number]);
      });

      expect(result).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });

    it('should respect allowedKeys whitelist', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const allowedKeys = ['a', 'c'];
      const result: Array<[string, number]> = [];

      safeIterateObject(
        obj,
        (key, value) => {
          result.push([key, value as number]);
        },
        allowedKeys,
      );

      expect(result).toEqual([
        ['a', 1],
        ['c', 3],
      ]);
    });

    it('should not iterate inherited properties', () => {
      const parent = { inherited: 'value' };
      const child = Object.create(parent);
      child.own = 'own value';

      const result: string[] = [];
      safeIterateObject(child, (key) => {
        result.push(key);
      });

      expect(result).toEqual(['own']);
    });
  });

  describe('createSafeAccessor', () => {
    const obj = { name: 'test', secret: 'hidden', value: 123 };
    const allowedKeys = ['name', 'value'];

    it('should create accessor with get method', () => {
      const accessor = createSafeAccessor(obj, allowedKeys);

      expect(accessor.get('name')).toBe('test');
      expect(accessor.get('value')).toBe(123);
      expect(accessor.get('secret')).toBeUndefined();
    });

    it('should create accessor with has method', () => {
      const accessor = createSafeAccessor(obj, allowedKeys);

      expect(accessor.has('name')).toBe(true);
      expect(accessor.has('value')).toBe(true);
      expect(accessor.has('secret')).toBe(false);
      expect(accessor.has('nonExistent')).toBe(false);
    });

    it('should create accessor with keys method', () => {
      const accessor = createSafeAccessor(obj, allowedKeys);

      expect(accessor.keys()).toEqual(['name', 'value']);
    });
  });

  describe('isKeySafe', () => {
    const allowedKeys = ['name', 'value', 'id'];

    it('should return true for allowed keys', () => {
      expect(isKeySafe('name', allowedKeys)).toBe(true);
      expect(isKeySafe('value', allowedKeys)).toBe(true);
      expect(isKeySafe('id', allowedKeys)).toBe(true);
    });

    it('should return false for disallowed keys', () => {
      expect(isKeySafe('secret', allowedKeys)).toBe(false);
      expect(isKeySafe('__proto__', allowedKeys)).toBe(false);
      expect(isKeySafe('constructor', allowedKeys)).toBe(false);
    });
  });

  describe('safeMergeObjects', () => {
    it('should merge objects with allowed keys', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const allowedKeys = ['b', 'c'];

      const result = safeMergeObjects(target, source, allowedKeys);

      expect(result.a).toBe(1);
      expect(result.b).toBe(3);
      expect(result.c).toBe(4);
    });

    it('should not merge disallowed keys', () => {
      const target = { a: 1 };
      const source = { b: 2, secret: 'hidden' };
      const allowedKeys = ['b'];

      const result = safeMergeObjects(target, source, allowedKeys);

      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
      expect((result as Record<string, unknown>).secret).toBeUndefined();
    });

    it('should not merge injection attempts', () => {
      const target = { a: 1 };
      const source = { __proto__: { malicious: true }, b: 2 };
      const allowedKeys = ['__proto__', 'b'];

      const result = safeMergeObjects(target, source, allowedKeys);

      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
    });

    it('should preserve target properties', () => {
      const target = { existing: 'value', toOverride: 'old' };
      const source = { toOverride: 'new' };
      const allowedKeys = ['toOverride'];

      const result = safeMergeObjects(target, source, allowedKeys);

      expect(result.existing).toBe('value');
      expect(result.toOverride).toBe('new');
    });
  });

  describe('COMMON_WHITELISTS', () => {
    it('should have LOCALES whitelist', () => {
      expect(COMMON_WHITELISTS.LOCALES).toEqual(['en', 'zh']);
    });

    it('should have PAGE_TYPES whitelist', () => {
      expect(COMMON_WHITELISTS.PAGE_TYPES).toContain('home');
      expect(COMMON_WHITELISTS.PAGE_TYPES).toContain('about');
      expect(COMMON_WHITELISTS.PAGE_TYPES).toContain('contact');
      expect(COMMON_WHITELISTS.PAGE_TYPES).toContain('privacy');
      expect(COMMON_WHITELISTS.PAGE_TYPES).toContain('terms');
    });

    it('should have THEME_MODES whitelist', () => {
      expect(COMMON_WHITELISTS.THEME_MODES).toEqual([
        'light',
        'dark',
        'system',
      ]);
    });

    it('should have DETECTION_SOURCES whitelist', () => {
      expect(COMMON_WHITELISTS.DETECTION_SOURCES).toEqual([
        'user',
        'geo',
        'browser',
      ]);
    });
  });
});
