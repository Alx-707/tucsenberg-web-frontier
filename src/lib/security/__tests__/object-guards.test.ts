import { describe, expect, it } from 'vitest';
import {
  createSafeProxy,
  createWhitelistAccessor,
  hasOwn,
  SafeAccess,
  safeDeepGet,
  safeDelete,
  safeEntries,
  safeGet,
  safeGetWithDefault,
  safeKeys,
  safeMerge,
  safeSet,
  safeValues,
  validateObjectStructure,
} from '../object-guards';

describe('object-guards', () => {
  describe('hasOwn', () => {
    it('should return true for own properties', () => {
      const obj = { name: 'test', value: 123 };
      expect(hasOwn(obj, 'name')).toBe(true);
      expect(hasOwn(obj, 'value')).toBe(true);
    });

    it('should return false for non-existent properties', () => {
      const obj = { name: 'test' };
      expect(hasOwn(obj, 'nonExistent')).toBe(false);
    });

    it('should return false for inherited properties', () => {
      const parent = { inherited: 'value' };
      const child = Object.create(parent);
      child.own = 'own value';

      expect(hasOwn(child, 'own')).toBe(true);
      expect(hasOwn(child, 'inherited')).toBe(false);
    });

    it('should handle symbol keys', () => {
      const sym = Symbol('test');
      const obj = { [sym]: 'symbol value' };
      expect(hasOwn(obj, sym)).toBe(true);
    });
  });

  describe('safeGet', () => {
    it('should return value for existing property', () => {
      const obj = { name: 'test', count: 42 };
      expect(safeGet(obj, 'name')).toBe('test');
      expect(safeGet(obj, 'count')).toBe(42);
    });

    it('should return undefined for non-existent property', () => {
      const obj = { name: 'test' };
      expect(safeGet(obj, 'nonExistent' as keyof typeof obj)).toBeUndefined();
    });

    it('should not access inherited properties', () => {
      const parent = { inherited: 'value' };
      const child = Object.create(parent);

      expect(safeGet(child, 'inherited')).toBeUndefined();
    });
  });

  describe('safeGetWithDefault', () => {
    it('should return value for existing property', () => {
      const obj = { name: 'test' };
      expect(safeGetWithDefault(obj, 'name', 'default')).toBe('test');
    });

    it('should return default for non-existent property', () => {
      const obj = { name: 'test' };
      expect(
        safeGetWithDefault(obj, 'nonExistent' as keyof typeof obj, 'default'),
      ).toBe('default');
    });

    it('should return default for inherited property', () => {
      const parent = { inherited: 'value' };
      const child = Object.create(parent);

      expect(safeGetWithDefault(child, 'inherited', 'default')).toBe('default');
    });
  });

  describe('safeSet', () => {
    it('should set value for existing property', () => {
      const obj = { name: 'old', count: 0 };
      const result = safeSet(obj, 'name', 'new');

      expect(result).toBe(true);
      expect(obj.name).toBe('new');
    });

    it('should return false for non-existent property', () => {
      const obj = { name: 'test' };
      const result = safeSet(obj, 'nonExistent' as keyof typeof obj, 'value');

      expect(result).toBe(false);
    });

    it('should not set inherited properties', () => {
      const parent = { inherited: 'old' };
      const child = Object.create(parent) as typeof parent;

      const result = safeSet(child, 'inherited', 'new');

      expect(result).toBe(false);
      expect(parent.inherited).toBe('old');
    });
  });

  describe('safeDelete', () => {
    it('should delete existing property', () => {
      const obj: { name?: string; value: number } = { name: 'test', value: 42 };
      const result = safeDelete(obj, 'name');

      expect(result).toBe(true);
      expect(obj.name).toBeUndefined();
      expect(obj.value).toBe(42);
    });

    it('should return false for non-existent property', () => {
      const obj = { name: 'test' };
      const result = safeDelete(obj, 'nonExistent');

      expect(result).toBe(false);
    });
  });

  describe('createWhitelistAccessor', () => {
    interface TestObj {
      allowed: string;
      alsoAllowed: number;
      forbidden: string;
    }

    const obj: TestObj = {
      allowed: 'yes',
      alsoAllowed: 42,
      forbidden: 'no',
    };

    const accessor = createWhitelistAccessor<
      TestObj,
      'allowed' | 'alsoAllowed'
    >(['allowed', 'alsoAllowed']);

    it('should get allowed properties', () => {
      expect(accessor.get(obj, 'allowed')).toBe('yes');
      expect(accessor.get(obj, 'alsoAllowed')).toBe(42);
    });

    it('should return undefined for non-whitelisted properties', () => {
      expect(
        accessor.get(obj, 'forbidden' as 'allowed' | 'alsoAllowed'),
      ).toBeUndefined();
    });

    it('should set allowed properties', () => {
      const testObj = { ...obj };
      const result = accessor.set(testObj, 'allowed', 'updated');

      expect(result).toBe(true);
      expect(testObj.allowed).toBe('updated');
    });

    it('should not set non-whitelisted properties', () => {
      const testObj = { ...obj };
      const result = accessor.set(
        testObj,
        'forbidden' as 'allowed' | 'alsoAllowed',
        'hacked',
      );

      expect(result).toBe(false);
      expect(testObj.forbidden).toBe('no');
    });

    it('should check presence of whitelisted properties', () => {
      expect(accessor.has(obj, 'allowed')).toBe(true);
      expect(accessor.has(obj, 'forbidden' as 'allowed' | 'alsoAllowed')).toBe(
        false,
      );
    });
  });

  describe('safeKeys', () => {
    it('should return own keys only', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(safeKeys(obj)).toEqual(['a', 'b', 'c']);
    });

    it('should not include inherited keys', () => {
      const parent = { inherited: 'value' };
      const child = Object.create(parent);
      child.own = 'own value';

      expect(safeKeys(child)).toEqual(['own']);
    });
  });

  describe('safeValues', () => {
    it('should return values of own properties', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(safeValues(obj)).toEqual([1, 2, 3]);
    });
  });

  describe('safeEntries', () => {
    it('should return entries of own properties', () => {
      const obj = { a: 1, b: 2 };
      expect(safeEntries(obj)).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });
  });

  describe('safeMerge', () => {
    it('should merge objects safely', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = safeMerge(target, source);

      expect(result.a).toBe(1);
      expect(result.b).toBe(3);
      expect(result.c).toBe(4);
    });

    it('should not modify original objects', () => {
      const target = { a: 1 };
      const source = { b: 2 };

      safeMerge(target, source);

      expect(target).toEqual({ a: 1 });
      expect(source).toEqual({ b: 2 });
    });
  });

  describe('safeDeepGet', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
      simple: 'value',
    };

    it('should access nested properties', () => {
      expect(safeDeepGet(obj, 'user.profile.name')).toBe('John');
      expect(safeDeepGet(obj, 'user.profile.age')).toBe(30);
    });

    it('should access simple properties', () => {
      expect(safeDeepGet(obj, 'simple')).toBe('value');
    });

    it('should return undefined for non-existent paths', () => {
      expect(safeDeepGet(obj, 'user.profile.email')).toBeUndefined();
      expect(safeDeepGet(obj, 'nonExistent.path')).toBeUndefined();
    });

    it('should handle null/undefined in path', () => {
      const objWithNull = { level1: null };
      expect(safeDeepGet(objWithNull, 'level1.level2')).toBeUndefined();
    });
  });

  describe('validateObjectStructure', () => {
    it('should return true when all required keys exist', () => {
      const obj = { name: 'test', age: 30, email: 'test@example.com' };
      expect(validateObjectStructure(obj, ['name', 'age'])).toBe(true);
    });

    it('should return false when required keys are missing', () => {
      const obj = { name: 'test' };
      expect(
        validateObjectStructure(obj, ['name', 'age'] as (keyof typeof obj)[]),
      ).toBe(false);
    });

    it('should return true for empty required keys', () => {
      const obj = { name: 'test' };
      expect(validateObjectStructure(obj, [])).toBe(true);
    });
  });

  describe('createSafeProxy', () => {
    it('should allow access to own properties', () => {
      const obj = { name: 'test', value: 42 };
      const proxy = createSafeProxy(obj);

      expect(proxy.name).toBe('test');
      expect(proxy.value).toBe(42);
    });

    it('should restrict access with allowedKeys', () => {
      const obj = { name: 'test', secret: 'hidden' };
      const proxy = createSafeProxy(obj, { allowedKeys: ['name'] });

      expect(proxy.name).toBe('test');
      expect(proxy.secret).toBeUndefined();
    });

    it('should prevent writes when readOnly is true', () => {
      const obj = { name: 'test' };
      const proxy = createSafeProxy(obj, { readOnly: true });

      // Proxy throws TypeError when trap returns false in strict mode
      expect(() => {
        proxy.name = 'changed';
      }).toThrow(TypeError);
      expect(obj.name).toBe('test');
    });

    it('should validate values with validator', () => {
      const obj = { count: 0 };
      const proxy = createSafeProxy(obj, {
        validator: (_, value) => typeof value === 'number' && value >= 0,
      });

      proxy.count = 10;
      expect(obj.count).toBe(10);

      // Proxy throws TypeError when validator returns false
      expect(() => {
        proxy.count = -5;
      }).toThrow(TypeError);
      expect(obj.count).toBe(10); // Not changed due to validation failure
    });

    it('should support has operation', () => {
      const obj = { name: 'test' };
      const proxy = createSafeProxy(obj);

      expect('name' in proxy).toBe(true);
      expect('nonExistent' in proxy).toBe(false);
    });

    it('should support ownKeys operation', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const proxy = createSafeProxy(obj, { allowedKeys: ['a', 'b'] });

      expect(Object.keys(proxy)).toEqual(['a', 'b']);
    });
  });

  describe('SafeAccess', () => {
    describe('config', () => {
      it('should access config values safely', () => {
        const config = { apiKey: 'secret', timeout: 5000 };

        expect(SafeAccess.config(config, 'timeout')).toBe(5000);
        expect(SafeAccess.config(config, 'nonExistent')).toBeUndefined();
      });
    });

    describe('array', () => {
      it('should access array elements safely', () => {
        const arr = ['a', 'b', 'c'];

        expect(SafeAccess.array(arr, 0)).toBe('a');
        expect(SafeAccess.array(arr, 2)).toBe('c');
        expect(SafeAccess.array(arr, -1)).toBeUndefined();
        expect(SafeAccess.array(arr, 10)).toBeUndefined();
      });
    });

    describe('nested', () => {
      it('should access nested properties safely', () => {
        const obj = {
          level1: {
            level2: {
              value: 'deep',
            },
          },
        };

        expect(SafeAccess.nested(obj, 'level1', 'level2', 'value')).toBe(
          'deep',
        );
        expect(SafeAccess.nested(obj, 'level1', 'nonExistent')).toBeUndefined();
      });

      it('should handle null in path', () => {
        const obj = { level1: null };
        expect(SafeAccess.nested(obj, 'level1', 'level2')).toBeUndefined();
      });
    });
  });
});
