import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('WhatsApp Client Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('detectEnvironment', () => {
    it('should return production when NODE_ENV and VERCEL_ENV are production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'production';
      process.env.WHATSAPP_ACCESS_TOKEN = 'token';
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-id';

      const { getClientEnvironmentInfo } = await import('../client-factory');
      const info = getClientEnvironmentInfo();

      expect(info.environment).toBe('production');
    });

    it('should return test when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';

      const { getClientEnvironmentInfo } = await import('../client-factory');
      const info = getClientEnvironmentInfo();

      expect(info.environment).toBe('test');
    });

    it('should return development for preview deployments', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'preview';

      const { getClientEnvironmentInfo } = await import('../client-factory');
      const info = getClientEnvironmentInfo();

      expect(info.environment).toBe('development');
    });
  });

  describe('createWhatsAppClient', () => {
    it('should create mock client when no credentials', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;

      const { createWhatsAppClient } = await import('../client-factory');
      const client = createWhatsAppClient();

      expect(client.getClientInfo().type).toBe('mock');
    });

    it('should create real client when credentials exist in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.WHATSAPP_ACCESS_TOKEN = 'test-token';
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';

      const { createWhatsAppClient } = await import('../client-factory');
      const client = createWhatsAppClient();

      expect(client.getClientInfo().type).toBe('real');
    });

    it('should throw in production without credentials', async () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'production';
      delete process.env.WHATSAPP_ACCESS_TOKEN;

      const { createWhatsAppClient } = await import('../client-factory');

      expect(() => createWhatsAppClient()).toThrow(
        'WhatsApp credentials not configured for production',
      );
    });
  });

  describe('getWhatsAppClient', () => {
    it('should return singleton instance', async () => {
      process.env.NODE_ENV = 'test';

      const { getWhatsAppClient, resetWhatsAppClient } = await import(
        '../client-factory'
      );

      resetWhatsAppClient();
      const client1 = getWhatsAppClient();
      const client2 = getWhatsAppClient();

      expect(client1).toBe(client2);
    });
  });

  describe('resetWhatsAppClient', () => {
    it('should create new instance after reset', async () => {
      process.env.NODE_ENV = 'test';

      const { getWhatsAppClient, resetWhatsAppClient } = await import(
        '../client-factory'
      );

      const client1 = getWhatsAppClient();
      resetWhatsAppClient();
      const client2 = getWhatsAppClient();

      // Different instances (though both mock)
      expect(client1).not.toBe(client2);
    });
  });

  describe('isMockClient', () => {
    it('should return true for mock client', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.WHATSAPP_ACCESS_TOKEN;

      const { isMockClient, resetWhatsAppClient } = await import(
        '../client-factory'
      );

      resetWhatsAppClient();
      expect(isMockClient()).toBe(true);
    });
  });
});
