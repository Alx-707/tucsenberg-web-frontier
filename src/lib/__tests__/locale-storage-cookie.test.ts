import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_CONFIG, CookieManager } from '../locale-storage-cookie';

// Helper to create mock document.cookie
function createMockDocument() {
  let cookieStore = '';
  return {
    get cookie() {
      return cookieStore;
    },
    set cookie(value: string) {
      // Parse incoming cookie string
      const [nameValue] = value.split(';');
      const [name, val] = nameValue.split('=');

      // Handle deletion (expires in past)
      if (value.includes('expires=Thu, 01 Jan 1970')) {
        const cookies = cookieStore.split('; ').filter(Boolean);
        cookieStore = cookies
          .filter((c) => !c.startsWith(`${name}=`))
          .join('; ');
        return;
      }

      // Add or update cookie
      if (cookieStore) {
        const cookies = cookieStore.split('; ').filter(Boolean);
        const existingIndex = cookies.findIndex((c) =>
          c.startsWith(`${name}=`),
        );
        if (existingIndex >= 0) {
          cookies[existingIndex] = `${name}=${val}`;
        } else {
          cookies.push(`${name}=${val}`);
        }
        cookieStore = cookies.join('; ');
      } else {
        cookieStore = `${name}=${val}`;
      }
    },
    setCookieStore(value: string) {
      cookieStore = value;
    },
  };
}

describe('COOKIE_CONFIG', () => {
  it('should have expected structure', () => {
    expect(COOKIE_CONFIG).toHaveProperty('maxAge');
    expect(COOKIE_CONFIG).toHaveProperty('sameSite', 'lax');
    expect(COOKIE_CONFIG).toHaveProperty('path', '/');
    expect(typeof COOKIE_CONFIG.secure).toBe('boolean');
  });

  it('should have numeric maxAge', () => {
    expect(typeof COOKIE_CONFIG.maxAge).toBe('number');
    expect(COOKIE_CONFIG.maxAge).toBeGreaterThan(0);
  });
});

describe('CookieManager', () => {
  let mockDoc: ReturnType<typeof createMockDocument>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc = createMockDocument();
    vi.stubGlobal('document', mockDoc);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('set', () => {
    it('should set cookie with default options', () => {
      CookieManager.set('testKey', 'testValue');
      expect(mockDoc.cookie).toContain('testKey=testValue');
    });

    it('should encode special characters', () => {
      CookieManager.set('key', 'value with spaces');
      expect(mockDoc.cookie).toContain('key=value%20with%20spaces');
    });

    it('should set cookie with custom options', () => {
      CookieManager.set('key', 'value', {
        maxAge: 3600,
        sameSite: 'strict',
        secure: true,
        path: '/test',
      });
      expect(mockDoc.cookie).toContain('key=value');
    });

    it('should do nothing when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      CookieManager.set('key', 'value');
      // No error should be thrown
    });

    it('should include Secure flag when secure is true', () => {
      // Manually track cookie string before encoding
      let setCookieCall = '';
      vi.stubGlobal('document', {
        get cookie() {
          return '';
        },
        set cookie(value: string) {
          setCookieCall = value;
        },
      });

      CookieManager.set('key', 'value', {
        maxAge: 3600,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });

      expect(setCookieCall).toContain('Secure');
    });

    it('should not include Secure flag when secure is false', () => {
      let setCookieCall = '';
      vi.stubGlobal('document', {
        get cookie() {
          return '';
        },
        set cookie(value: string) {
          setCookieCall = value;
        },
      });

      CookieManager.set('key', 'value', {
        maxAge: 3600,
        sameSite: 'lax',
        secure: false,
        path: '/',
      });

      expect(setCookieCall).not.toContain('Secure');
    });
  });

  describe('get', () => {
    it('should get cookie value', () => {
      mockDoc.setCookieStore('testKey=testValue');
      const result = CookieManager.get('testKey');
      expect(result).toBe('testValue');
    });

    it('should decode URL-encoded values', () => {
      mockDoc.setCookieStore('key=value%20with%20spaces');
      const result = CookieManager.get('key');
      expect(result).toBe('value with spaces');
    });

    it('should return null for non-existent cookie', () => {
      mockDoc.setCookieStore('other=value');
      const result = CookieManager.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      const result = CookieManager.get('key');
      expect(result).toBeNull();
    });

    it('should handle cookies with = in value', () => {
      mockDoc.setCookieStore('key=value=with=equals');
      const result = CookieManager.get('key');
      expect(result).toBe('value=with=equals');
    });

    it('should handle multiple cookies', () => {
      mockDoc.setCookieStore('key1=value1; key2=value2; key3=value3');
      expect(CookieManager.get('key1')).toBe('value1');
      expect(CookieManager.get('key2')).toBe('value2');
      expect(CookieManager.get('key3')).toBe('value3');
    });

    it('should return null for empty cookie value', () => {
      mockDoc.setCookieStore('key=');
      const result = CookieManager.get('key');
      expect(result).toBeNull();
    });

    it('should return null for invalid URI encoding', () => {
      mockDoc.setCookieStore('key=%invalid');
      const result = CookieManager.get('key');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove cookie', () => {
      mockDoc.setCookieStore('testKey=testValue');
      CookieManager.remove('testKey');
      expect(mockDoc.cookie).not.toContain('testKey=testValue');
    });

    it('should do nothing when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      CookieManager.remove('key');
      // No error should be thrown
    });
  });

  describe('exists', () => {
    it('should return true when cookie exists', () => {
      mockDoc.setCookieStore('key=value');
      expect(CookieManager.exists('key')).toBe(true);
    });

    it('should return false when cookie does not exist', () => {
      mockDoc.setCookieStore('other=value');
      expect(CookieManager.exists('nonexistent')).toBe(false);
    });

    it('should return false when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      expect(CookieManager.exists('key')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should get all cookies', () => {
      mockDoc.setCookieStore('key1=value1; key2=value2');
      const result = CookieManager.getAll();
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should return empty object when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      expect(CookieManager.getAll()).toEqual({});
    });

    it('should return empty object when no cookies', () => {
      mockDoc.setCookieStore('');
      expect(CookieManager.getAll()).toEqual({});
    });

    it('should skip cookies with empty names', () => {
      mockDoc.setCookieStore('key1=value1; =emptyName; key2=value2');
      const result = CookieManager.getAll();
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should skip cookies with empty values', () => {
      mockDoc.setCookieStore('key1=value1; key2=; key3=value3');
      const result = CookieManager.getAll();
      expect(result).toEqual({
        key1: 'value1',
        key3: 'value3',
      });
    });

    it('should decode URL-encoded values', () => {
      mockDoc.setCookieStore('key=value%20with%20spaces');
      const result = CookieManager.getAll();
      expect(result).toEqual({ key: 'value with spaces' });
    });

    it('should skip invalid URI encoding', () => {
      mockDoc.setCookieStore('key1=value1; key2=%invalid; key3=value3');
      const result = CookieManager.getAll();
      // key2 should be skipped due to invalid encoding
      expect(result.key1).toBe('value1');
      expect(result.key3).toBe('value3');
    });
  });

  describe('clearAll', () => {
    it('should clear all cookies', () => {
      mockDoc.setCookieStore('key1=value1; key2=value2');
      CookieManager.clearAll();
      expect(mockDoc.cookie).toBe('');
    });

    it('should do nothing when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      CookieManager.clearAll();
      // No error should be thrown
    });
  });

  describe('setWithExpiry', () => {
    it('should set cookie with expiry', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      CookieManager.setWithExpiry({
        name: 'testKey',
        value: 'testValue',
        expiryDays: 7,
      });

      expect(mockDoc.cookie).toContain('testKey=testValue');

      vi.useRealTimers();
    });

    it('should use custom options', () => {
      let setCookieCall = '';
      vi.stubGlobal('document', {
        get cookie() {
          return '';
        },
        set cookie(value: string) {
          setCookieCall = value;
        },
      });

      CookieManager.setWithExpiry({
        name: 'key',
        value: 'value',
        expiryDays: 1,
        options: {
          secure: true,
          sameSite: 'strict',
          path: '/custom',
        },
      });

      expect(setCookieCall).toContain('Secure');
      expect(setCookieCall).toContain('SameSite=strict');
      expect(setCookieCall).toContain('Path=/custom');
    });

    it('should allow overriding maxAge', () => {
      let setCookieCall = '';
      vi.stubGlobal('document', {
        get cookie() {
          return '';
        },
        set cookie(value: string) {
          setCookieCall = value;
        },
      });

      CookieManager.setWithExpiry({
        name: 'key',
        value: 'value',
        expiryDays: 1,
        options: {
          maxAge: 7200,
        },
      });

      expect(setCookieCall).toContain('max-age=7200');
    });
  });

  describe('getExpiry', () => {
    it('should return null and log warning', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // Silent
        });

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const result = CookieManager.getExpiry('key');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      consoleWarnSpy.mockRestore();
    });

    it('should return null in production without warning', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // Silent
        });

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = CookieManager.getExpiry('key');

      expect(result).toBeNull();
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      consoleWarnSpy.mockRestore();
    });
  });

  describe('isSupported', () => {
    it('should return true when cookies are supported', () => {
      expect(CookieManager.isSupported()).toBe(true);
    });

    it('should return false when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      expect(CookieManager.isSupported()).toBe(false);
    });

    it('should return false when cookie operations throw', () => {
      vi.stubGlobal('document', {
        get cookie() {
          throw new Error('Disabled');
        },
        set cookie(_value: string) {
          throw new Error('Disabled');
        },
      });
      expect(CookieManager.isSupported()).toBe(false);
    });
  });

  describe('getSize', () => {
    it('should return size of cookie', () => {
      mockDoc.setCookieStore('key=value');
      const size = CookieManager.getSize('key');
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent cookie', () => {
      mockDoc.setCookieStore('other=value');
      const size = CookieManager.getSize('nonexistent');
      expect(size).toBe(0);
    });

    it('should calculate correct size', () => {
      mockDoc.setCookieStore('key=value');
      const size = CookieManager.getSize('key');
      // 'key=value' = 9 bytes
      expect(size).toBe(9);
    });
  });

  describe('getTotalSize', () => {
    it('should return total size of all cookies', () => {
      mockDoc.setCookieStore('key1=value1; key2=value2');
      const size = CookieManager.getTotalSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 when document is undefined', () => {
      vi.stubGlobal('document', undefined);
      expect(CookieManager.getTotalSize()).toBe(0);
    });

    it('should return 0 for empty cookies', () => {
      mockDoc.setCookieStore('');
      expect(CookieManager.getTotalSize()).toBe(0);
    });
  });

  describe('isNearLimit', () => {
    it('should return false when cookie size is small', () => {
      mockDoc.setCookieStore('key=value');
      expect(CookieManager.isNearLimit()).toBe(false);
    });

    it('should use custom threshold', () => {
      mockDoc.setCookieStore('key=value');
      // With default threshold 0.8, small cookies are not near limit
      expect(CookieManager.isNearLimit(0.001)).toBe(true);
    });

    it('should calculate based on 4096 byte limit', () => {
      // Create a large cookie that would exceed 80% of 4096 (= 3277 bytes)
      const largeValue = 'x'.repeat(3500);
      mockDoc.setCookieStore(`key=${largeValue}`);
      expect(CookieManager.isNearLimit()).toBe(true);
    });
  });

  describe('integration', () => {
    it('should perform full CRUD cycle', () => {
      // Create
      CookieManager.set('testKey', 'testValue');
      expect(CookieManager.exists('testKey')).toBe(true);

      // Read
      expect(CookieManager.get('testKey')).toBe('testValue');

      // Update
      CookieManager.set('testKey', 'newValue');
      expect(CookieManager.get('testKey')).toBe('newValue');

      // Delete
      CookieManager.remove('testKey');
      expect(CookieManager.exists('testKey')).toBe(false);
    });

    it('should handle multiple cookies', () => {
      CookieManager.set('key1', 'value1');
      CookieManager.set('key2', 'value2');
      CookieManager.set('key3', 'value3');

      const allCookies = CookieManager.getAll();
      expect(Object.keys(allCookies).length).toBe(3);

      CookieManager.clearAll();
      expect(CookieManager.getAll()).toEqual({});
    });
  });
});
