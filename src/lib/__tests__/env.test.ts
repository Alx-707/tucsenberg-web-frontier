import { describe, expect, it } from 'vitest';
/**
 * Tests for env.ts utility functions
 *
 * Note: The env object itself is created via @t3-oss/env-nextjs at module load time
 * and is difficult to test directly. The global test setup mocks @/lib/env.
 * Here we test the exported utility functions by using the mocked env object.
 */

import { env, envUtils, getEnvVar, requireEnvVar } from '../env';

describe('env utilities', () => {
  describe('env object', () => {
    it('should export env object', () => {
      expect(env).toBeDefined();
      expect(typeof env).toBe('object');
    });

    it('should have NODE_ENV property', () => {
      expect(env.NODE_ENV).toBeDefined();
    });
  });

  describe('getEnvVar', () => {
    it('should return NODE_ENV value', () => {
      const result = getEnvVar('NODE_ENV');
      expect(result).toBe('test');
    });

    it('should return string values', () => {
      const result = getEnvVar('TURNSTILE_SECRET_KEY');
      expect(typeof result === 'string' || result === undefined).toBe(true);
    });
  });

  describe('requireEnvVar', () => {
    it('should return TURNSTILE_SECRET_KEY when available', () => {
      // The test setup provides this value
      const result = requireEnvVar('TURNSTILE_SECRET_KEY');
      expect(result).toBe('test-secret-key');
    });

    it('should return RESEND_API_KEY when available', () => {
      const result = requireEnvVar('RESEND_API_KEY');
      expect(result).toBe('test-resend-key');
    });

    it('should return AIRTABLE_API_KEY when available', () => {
      const result = requireEnvVar('AIRTABLE_API_KEY');
      expect(result).toBe('test-airtable-key');
    });
  });

  describe('envUtils', () => {
    describe('environment detection', () => {
      it('should have isDevelopment function', () => {
        expect(typeof envUtils.isDevelopment).toBe('function');
      });

      it('should have isProduction function', () => {
        expect(typeof envUtils.isProduction).toBe('function');
      });

      it('should have isTest function', () => {
        expect(typeof envUtils.isTest).toBe('function');
      });

      it('isTest should return true in test environment', () => {
        expect(envUtils.isTest()).toBe(true);
      });

      it('isDevelopment should return false in test environment', () => {
        expect(envUtils.isDevelopment()).toBe(false);
      });

      it('isProduction should return false in test environment', () => {
        expect(envUtils.isProduction()).toBe(false);
      });
    });

    describe('WhatsApp utilities', () => {
      it('should have getWhatsAppToken function', () => {
        expect(typeof envUtils.getWhatsAppToken).toBe('function');
      });

      it('should have getWhatsAppPhoneId function', () => {
        expect(typeof envUtils.getWhatsAppPhoneId).toBe('function');
      });
    });

    describe('Turnstile utilities', () => {
      it('should have getTurnstileSecret function', () => {
        expect(typeof envUtils.getTurnstileSecret).toBe('function');
      });

      it('should have getTurnstileSiteKey function', () => {
        expect(typeof envUtils.getTurnstileSiteKey).toBe('function');
      });

      it('getTurnstileSecret should return test value', () => {
        expect(envUtils.getTurnstileSecret()).toBe('test-secret-key');
      });
    });

    describe('Resend utilities', () => {
      it('should have getResendApiKey function', () => {
        expect(typeof envUtils.getResendApiKey).toBe('function');
      });

      it('getResendApiKey should return test value', () => {
        expect(envUtils.getResendApiKey()).toBe('test-resend-key');
      });
    });

    describe('Airtable utilities', () => {
      it('should have getAirtableToken function', () => {
        expect(typeof envUtils.getAirtableToken).toBe('function');
      });

      it('should have getAirtableBaseId function', () => {
        expect(typeof envUtils.getAirtableBaseId).toBe('function');
      });

      it('getAirtableToken should return test value', () => {
        expect(envUtils.getAirtableToken()).toBe('test-airtable-key');
      });

      it('getAirtableBaseId should return test value', () => {
        expect(envUtils.getAirtableBaseId()).toBe('test-base-id');
      });
    });
  });
});

describe('env type safety', () => {
  it('should have correct server env vars defined', () => {
    // These are defined in the schema and should exist on the env object
    expect('NODE_ENV' in env).toBe(true);
    expect('TURNSTILE_SECRET_KEY' in env).toBe(true);
    expect('RESEND_API_KEY' in env).toBe(true);
  });

  it('should have correct client env vars defined', () => {
    expect('NEXT_PUBLIC_BASE_URL' in env).toBe(true);
    expect('NEXT_PUBLIC_TURNSTILE_SITE_KEY' in env).toBe(true);
  });
});
