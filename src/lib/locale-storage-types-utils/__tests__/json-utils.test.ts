/**
 * json-utils JSON 工具函数测试
 * Tests for safeJsonParse, safeJsonStringify
 */

import { describe, expect, it } from 'vitest';
import { safeJsonParse, safeJsonStringify } from '../json-utils';

describe('safeJsonParse', () => {
  describe('valid JSON parsing', () => {
    it('should parse valid JSON string', () => {
      const json = '{"name":"test","value":123}';
      const result = safeJsonParse(json, {});

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse JSON array', () => {
      const json = '[1,2,3,"four"]';
      const result = safeJsonParse(json, []);

      expect(result).toEqual([1, 2, 3, 'four']);
    });

    it('should parse JSON primitives', () => {
      expect(safeJsonParse('"string"', '')).toBe('string');
      expect(safeJsonParse('123', 0)).toBe(123);
      expect(safeJsonParse('true', false)).toBe(true);
      expect(safeJsonParse('false', true)).toBe(false);
      expect(safeJsonParse('null', 'default')).toBeNull();
    });

    it('should parse nested objects', () => {
      const json = '{"outer":{"inner":{"deep":"value"}}}';
      const result = safeJsonParse(json, {});

      expect(result).toEqual({ outer: { inner: { deep: 'value' } } });
    });

    it('should parse arrays with mixed types', () => {
      const json = '[1,"two",null,true,{"key":"value"}]';
      const result = safeJsonParse(json, []);

      expect(result).toEqual([1, 'two', null, true, { key: 'value' }]);
    });

    it('should parse empty structures', () => {
      expect(safeJsonParse('{}', { default: true })).toEqual({});
      expect(safeJsonParse('[]', [1, 2, 3])).toEqual([]);
    });
  });

  describe('invalid JSON handling', () => {
    it('should return default value for invalid JSON', () => {
      const defaultValue = { fallback: true };
      expect(safeJsonParse('invalid', defaultValue)).toBe(defaultValue);
    });

    it('should return default value for malformed JSON', () => {
      const defaultValue = 'default';
      expect(safeJsonParse('{key: value}', defaultValue)).toBe(defaultValue);
    });

    it('should return default value for trailing comma', () => {
      expect(safeJsonParse('{"a":1,}', {})).toEqual({});
    });

    it('should return default value for single quotes', () => {
      expect(safeJsonParse("{'key':'value'}", {})).toEqual({});
    });

    it('should return default value for empty string', () => {
      const defaultValue = { empty: true };
      expect(safeJsonParse('', defaultValue)).toBe(defaultValue);
    });

    it('should return default value for undefined-like strings', () => {
      const defaultValue = null;
      expect(safeJsonParse('undefined', defaultValue)).toBe(defaultValue);
    });

    it('should return default value for truncated JSON', () => {
      expect(safeJsonParse('{"incomplete":', {})).toEqual({});
    });
  });

  describe('type preservation', () => {
    it('should preserve type parameter', () => {
      interface User {
        name: string;
        age: number;
      }

      const json = '{"name":"John","age":30}';
      const result = safeJsonParse<User>(json, { name: '', age: 0 });

      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should return typed default value', () => {
      interface Config {
        enabled: boolean;
        maxItems: number;
      }

      const defaultConfig: Config = { enabled: false, maxItems: 10 };
      const result = safeJsonParse<Config>('invalid', defaultConfig);

      expect(result.enabled).toBe(false);
      expect(result.maxItems).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in JSON', () => {
      const json = '  {  "key"  :  "value"  }  ';
      expect(safeJsonParse(json, {})).toEqual({ key: 'value' });
    });

    it('should handle newlines in JSON', () => {
      const json = '{\n"key":\n"value"\n}';
      expect(safeJsonParse(json, {})).toEqual({ key: 'value' });
    });

    it('should handle escaped characters', () => {
      const json = '{"text":"hello\\nworld\\ttab\\"quote"}';
      expect(safeJsonParse(json, {})).toEqual({
        text: 'hello\nworld\ttab"quote',
      });
    });

    it('should handle unicode characters', () => {
      const json = '{"text":"\\u4e2d\\u6587"}';
      expect(safeJsonParse(json, {})).toEqual({ text: '中文' });
    });

    it('should handle large numbers', () => {
      const json = '{"big":9007199254740991}';
      expect(safeJsonParse(json, {})).toEqual({ big: 9007199254740991 });
    });

    it('should handle scientific notation', () => {
      const json = '{"num":1.5e10}';
      expect(safeJsonParse(json, {})).toEqual({ num: 15000000000 });
    });
  });
});

describe('safeJsonStringify', () => {
  describe('valid object stringification', () => {
    it('should stringify simple object', () => {
      const obj = { name: 'test', value: 123 };
      expect(safeJsonStringify(obj)).toBe('{"name":"test","value":123}');
    });

    it('should stringify array', () => {
      expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should stringify primitives', () => {
      expect(safeJsonStringify('string')).toBe('"string"');
      expect(safeJsonStringify(123)).toBe('123');
      expect(safeJsonStringify(true)).toBe('true');
      expect(safeJsonStringify(false)).toBe('false');
      expect(safeJsonStringify(null)).toBe('null');
    });

    it('should stringify nested objects', () => {
      const obj = { outer: { inner: { deep: 'value' } } };
      expect(safeJsonStringify(obj)).toBe(
        '{"outer":{"inner":{"deep":"value"}}}',
      );
    });

    it('should stringify empty structures', () => {
      expect(safeJsonStringify({})).toBe('{}');
      expect(safeJsonStringify([])).toBe('[]');
    });

    it('should stringify arrays with mixed types', () => {
      expect(safeJsonStringify([1, 'two', null, true])).toBe(
        '[1,"two",null,true]',
      );
    });
  });

  describe('special value handling', () => {
    it('should return undefined for undefined input (JSON.stringify behavior)', () => {
      // JSON.stringify(undefined) returns undefined, not a string
      // safeJsonStringify catches the exception but JSON.stringify(undefined) does not throw
      const result = safeJsonStringify(undefined);
      // JSON.stringify(undefined) === undefined, which is then returned as-is
      // The function doesn't throw, so it returns JSON.stringify result directly
      expect(result).toBeUndefined();
    });

    it('should use custom default value when stringify throws', () => {
      // Create an object that will cause stringify to throw
      interface CircularObj {
        self?: CircularObj;
      }
      const circular: CircularObj = {};
      circular.self = circular;
      expect(safeJsonStringify(circular, '[]')).toBe('[]');
    });

    it('should stringify objects with undefined properties', () => {
      const obj = { defined: 'value', undef: undefined };
      // JSON.stringify omits undefined values
      expect(safeJsonStringify(obj)).toBe('{"defined":"value"}');
    });

    it('should convert NaN to null', () => {
      expect(safeJsonStringify(NaN)).toBe('null');
    });

    it('should convert Infinity to null', () => {
      expect(safeJsonStringify(Infinity)).toBe('null');
      expect(safeJsonStringify(-Infinity)).toBe('null');
    });

    it('should handle objects with NaN/Infinity values', () => {
      const obj = { nan: NaN, inf: Infinity };
      expect(safeJsonStringify(obj)).toBe('{"nan":null,"inf":null}');
    });
  });

  describe('circular reference handling', () => {
    it('should return default value for circular reference', () => {
      interface CircularObj {
        name: string;
        self?: CircularObj;
      }

      const obj: CircularObj = { name: 'circular' };
      obj.self = obj;

      expect(safeJsonStringify(obj)).toBe('{}');
    });

    it('should return custom default for circular reference', () => {
      interface CircularObj {
        self?: CircularObj;
      }

      const obj: CircularObj = {};
      obj.self = obj;

      expect(safeJsonStringify(obj, '"error"')).toBe('"error"');
    });
  });

  describe('function and symbol handling', () => {
    it('should omit functions in objects', () => {
      const obj = {
        name: 'test',
        fn: () => 'hello',
      };
      expect(safeJsonStringify(obj)).toBe('{"name":"test"}');
    });

    it('should return undefined for standalone function (JSON.stringify behavior)', () => {
      const fn = () => 'hello';
      // JSON.stringify(function) returns undefined (not a string)
      expect(safeJsonStringify(fn)).toBeUndefined();
    });

    it('should omit symbol keys', () => {
      const sym = Symbol('key');
      const obj = {
        name: 'test',
        [sym]: 'symbol value',
      };
      expect(safeJsonStringify(obj)).toBe('{"name":"test"}');
    });
  });

  describe('date handling', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T12:00:00.000Z');
      expect(safeJsonStringify(date)).toBe('"2024-01-15T12:00:00.000Z"');
    });

    it('should convert Date in object to ISO string', () => {
      const obj = { created: new Date('2024-01-15T12:00:00.000Z') };
      expect(safeJsonStringify(obj)).toBe(
        '{"created":"2024-01-15T12:00:00.000Z"}',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested objects', () => {
      const deep = { a: { b: { c: { d: { e: 'deep' } } } } };
      const result = safeJsonStringify(deep);
      expect(result).toBe('{"a":{"b":{"c":{"d":{"e":"deep"}}}}}');
    });

    it('should handle large arrays', () => {
      const arr = Array.from({ length: 1000 }, (_, i) => i);
      const result = safeJsonStringify(arr);
      expect(result).toContain('[0,1,2');
      expect(result).toContain('999]');
    });

    it('should handle special characters in strings', () => {
      const obj = { text: 'line1\nline2\ttab' };
      expect(safeJsonStringify(obj)).toBe('{"text":"line1\\nline2\\ttab"}');
    });

    it('should handle unicode characters', () => {
      const obj = { text: '中文日本語한국어' };
      const result = safeJsonStringify(obj);
      expect(result).toContain('中文');
    });

    it('should handle BigInt by returning default', () => {
      // BigInt cannot be serialized, should throw and return default
      const obj = { big: BigInt(9007199254740991) };
      expect(safeJsonStringify(obj)).toBe('{}');
    });
  });
});

describe('safeJsonParse and safeJsonStringify roundtrip', () => {
  it('should roundtrip simple object', () => {
    const original = { name: 'test', value: 123 };
    const json = safeJsonStringify(original);
    const parsed = safeJsonParse(json, {});

    expect(parsed).toEqual(original);
  });

  it('should roundtrip array', () => {
    const original = [1, 'two', null, true, { nested: 'value' }];
    const json = safeJsonStringify(original);
    const parsed = safeJsonParse(json, []);

    expect(parsed).toEqual(original);
  });

  it('should roundtrip complex structure', () => {
    const original = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      metadata: {
        total: 2,
        page: 1,
      },
    };
    const json = safeJsonStringify(original);
    const parsed = safeJsonParse(json, {});

    expect(parsed).toEqual(original);
  });

  it('should handle multiple roundtrips', () => {
    const original = { data: [1, 2, 3] };
    let current = original;

    for (let i = 0; i < 10; i++) {
      const json = safeJsonStringify(current);
      current = safeJsonParse(json, {});
    }

    expect(current).toEqual(original);
  });
});
