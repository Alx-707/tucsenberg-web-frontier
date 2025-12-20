import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTokenWithExpiry,
  generateApiKey,
  generateCsrfToken,
  generateNonce,
  generateOTP,
  generateSalt,
  generateSecureToken,
  generateSessionToken,
  generateUUID,
  generateVerificationCode,
  isTokenExpired,
  isValidToken,
  isValidUUID,
} from '../security-tokens';

describe('security-tokens', () => {
  describe('generateSecureToken', () => {
    it('should generate token with default length (32 chars)', () => {
      const token = generateSecureToken();
      expect(token.length).toBe(32);
    });

    it('should generate token with custom length', () => {
      const token = generateSecureToken(64);
      expect(token.length).toBe(64);
    });

    it('should generate only hex characters', () => {
      const token = generateSecureToken(100);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('should handle small length', () => {
      const token = generateSecureToken(4);
      expect(token.length).toBe(4);
    });

    it('should handle odd length', () => {
      const token = generateSecureToken(7);
      expect(token.length).toBe(7);
    });
  });

  describe('generateUUID', () => {
    it('should generate valid UUID v4 format', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });

    it('should have correct structure (8-4-4-4-12)', () => {
      const uuid = generateUUID();
      const parts = uuid.split('-');
      expect(parts.length).toBe(5);
      expect(parts[0]!.length).toBe(8);
      expect(parts[1]!.length).toBe(4);
      expect(parts[2]!.length).toBe(4);
      expect(parts[3]!.length).toBe(4);
      expect(parts[4]!.length).toBe(12);
    });

    it('should have version 4 indicator', () => {
      const uuid = generateUUID();
      // Version 4 UUIDs have '4' as the first character of the third segment
      expect(uuid.charAt(14)).toBe('4');
    });

    it('should have correct variant bits', () => {
      const uuid = generateUUID();
      // Variant bits should be '8', '9', 'a', or 'b' as first char of fourth segment
      expect(['8', '9', 'a', 'b']).toContain(uuid.charAt(19).toLowerCase());
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with default prefix', () => {
      const apiKey = generateApiKey();
      expect(apiKey.startsWith('sk_')).toBe(true);
    });

    it('should generate API key with custom prefix', () => {
      const apiKey = generateApiKey('pk');
      expect(apiKey.startsWith('pk_')).toBe(true);
    });

    it('should have correct total length (prefix + underscore + 48 chars)', () => {
      const apiKey = generateApiKey('test');
      // 'test' (4) + '_' (1) + 48 = 53
      expect(apiKey.length).toBe(53);
    });

    it('should generate unique API keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 50; i++) {
        keys.add(generateApiKey());
      }
      expect(keys.size).toBe(50);
    });
  });

  describe('generateSessionToken', () => {
    it('should generate 64 character token', () => {
      const token = generateSessionToken();
      expect(token.length).toBe(64);
    });

    it('should be valid hex string', () => {
      const token = generateSessionToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique session tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 50; i++) {
        tokens.add(generateSessionToken());
      }
      expect(tokens.size).toBe(50);
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate 32 character token', () => {
      const token = generateCsrfToken();
      expect(token.length).toBe(32);
    });

    it('should be valid hex string', () => {
      const token = generateCsrfToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique CSRF tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 50; i++) {
        tokens.add(generateCsrfToken());
      }
      expect(tokens.size).toBe(50);
    });
  });

  describe('generateNonce', () => {
    it('should generate 32 character nonce (128-bit entropy)', () => {
      const nonce = generateNonce();
      expect(nonce.length).toBe(32);
    });

    it('should be valid hex string', () => {
      const nonce = generateNonce();
      expect(/^[0-9a-f]+$/.test(nonce)).toBe(true);
    });

    it('should generate unique nonces', () => {
      const nonces = new Set<string>();
      for (let i = 0; i < 50; i++) {
        nonces.add(generateNonce());
      }
      expect(nonces.size).toBe(50);
    });
  });

  describe('generateOTP', () => {
    it('should generate 6 digit OTP by default', () => {
      const otp = generateOTP();
      expect(otp.length).toBe(6);
    });

    it('should generate custom length OTP', () => {
      const otp = generateOTP(8);
      expect(otp.length).toBe(8);
    });

    it('should contain only digits', () => {
      const otp = generateOTP();
      expect(/^[0-9]+$/.test(otp)).toBe(true);
    });

    it('should generate various OTPs (not always same)', () => {
      const otps = new Set<string>();
      for (let i = 0; i < 20; i++) {
        otps.add(generateOTP());
      }
      // Should have multiple unique values (statistically very unlikely to have all same)
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  describe('generateVerificationCode', () => {
    it('should generate 8 character code by default', () => {
      const code = generateVerificationCode();
      expect(code.length).toBe(8);
    });

    it('should generate custom length code', () => {
      const code = generateVerificationCode(12);
      expect(code.length).toBe(12);
    });

    it('should contain only uppercase letters and digits', () => {
      const code = generateVerificationCode(50);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codes.add(generateVerificationCode());
      }
      expect(codes.size).toBe(50);
    });
  });

  describe('isValidToken', () => {
    it('should return true for valid alphanumeric token', () => {
      expect(isValidToken('abc123XYZ')).toBe(true);
    });

    it('should return true for token with underscore', () => {
      expect(isValidToken('test_token_123')).toBe(true);
    });

    it('should return true for token with hyphen', () => {
      expect(isValidToken('test-token-123')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidToken('')).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(isValidToken(123 as unknown as string)).toBe(false);
      expect(isValidToken(null as unknown as string)).toBe(false);
      expect(isValidToken(undefined as unknown as string)).toBe(false);
    });

    it('should return false for token with invalid characters', () => {
      expect(isValidToken('token@123')).toBe(false);
      expect(isValidToken('token#123')).toBe(false);
      expect(isValidToken('token 123')).toBe(false);
      expect(isValidToken('token.123')).toBe(false);
    });

    it('should validate expected length', () => {
      expect(isValidToken('abc123', 6)).toBe(true);
      expect(isValidToken('abc123', 5)).toBe(false);
      expect(isValidToken('abc123', 7)).toBe(false);
    });

    it('should pass without length check when not specified', () => {
      expect(isValidToken('anylengthtoken')).toBe(true);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('should return true for generated UUID', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false); // No hyphens
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false); // Incomplete
    });

    it('should return false for wrong version', () => {
      // Version 1 UUID (has '1' instead of '4' in third segment)
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });

    it('should return false for wrong variant', () => {
      // Wrong variant bits (has 'c' instead of '8','9','a','b')
      expect(isValidUUID('550e8400-e29b-41d4-c716-446655440000')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('generateSalt', () => {
    it('should generate salt with default length (32 chars for 16 bytes)', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(32); // 16 * 2 hex chars
    });

    it('should generate salt with custom length', () => {
      const salt = generateSalt(8);
      expect(salt.length).toBe(16); // 8 * 2 hex chars
    });

    it('should be valid hex string', () => {
      const salt = generateSalt();
      expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
    });

    it('should generate unique salts', () => {
      const salts = new Set<string>();
      for (let i = 0; i < 50; i++) {
        salts.add(generateSalt());
      }
      expect(salts.size).toBe(50);
    });
  });

  describe('createTokenWithExpiry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create token with default parameters', () => {
      const result = createTokenWithExpiry();

      expect(result.token.length).toBe(32);
      expect(typeof result.expiresAt).toBe('number');
    });

    it('should create token with custom length', () => {
      const result = createTokenWithExpiry(64);
      expect(result.token.length).toBe(64);
    });

    it('should set expiry based on minutes parameter', () => {
      const now = Date.now();
      // Default is 60 minutes, formula: minutes * 60 * 1000
      const result = createTokenWithExpiry(32, 60);

      // 60 minutes = 60 * 60 * 1000 = 3,600,000 ms
      expect(result.expiresAt).toBe(now + 3600000);
    });

    it('should set custom expiry time', () => {
      const now = Date.now();
      const result = createTokenWithExpiry(32, 30); // 30 minutes

      // 30 minutes = 30 * 60 * 1000 = 1,800,000 ms
      expect(result.expiresAt).toBe(now + 1800000);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 50; i++) {
        tokens.add(createTokenWithExpiry().token);
      }
      expect(tokens.size).toBe(50);
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return false for non-expired token', () => {
      const tokenWithExpiry = createTokenWithExpiry(32, 60);
      expect(isTokenExpired(tokenWithExpiry)).toBe(false);
    });

    it('should return true for expired token', () => {
      const tokenWithExpiry = createTokenWithExpiry(32, 1); // 1 minute

      // Advance time past expiry
      vi.advanceTimersByTime(61000); // 61 seconds

      expect(isTokenExpired(tokenWithExpiry)).toBe(true);
    });

    it('should return false right before expiry', () => {
      const tokenWithExpiry = createTokenWithExpiry(32, 1); // 1 minute

      // Advance time to just before expiry
      vi.advanceTimersByTime(59000); // 59 seconds

      expect(isTokenExpired(tokenWithExpiry)).toBe(false);
    });

    it('should return true exactly at expiry boundary', () => {
      const tokenWithExpiry = createTokenWithExpiry(32, 1); // 1 minute = 60000ms

      // Advance time to exactly at expiry + 1ms
      vi.advanceTimersByTime(60001);

      expect(isTokenExpired(tokenWithExpiry)).toBe(true);
    });

    it('should handle custom expiry object', () => {
      const now = Date.now();
      const customToken = {
        token: 'test-token',
        expiresAt: now + 5000, // 5 seconds from now
      };

      expect(isTokenExpired(customToken)).toBe(false);

      vi.advanceTimersByTime(6000);

      expect(isTokenExpired(customToken)).toBe(true);
    });
  });
});
