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
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('detectEnvironment', () => {
    it('should return production when NODE_ENV and VERCEL_ENV are production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'token');
      vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-id');

      const { getClientEnvironmentInfo } = await import('../client-factory');
      const info = getClientEnvironmentInfo();

      expect(info.environment).toBe('production');
    });

    it('should return test when NODE_ENV is test', async () => {
      vi.stubEnv('NODE_ENV', 'test');

      const { getClientEnvironmentInfo } = await import('../client-factory');
      const info = getClientEnvironmentInfo();

      expect(info.environment).toBe('test');
    });

    it('should return development for preview deployments', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('VERCEL_ENV', 'preview');

      const { getClientEnvironmentInfo } = await import('../client-factory');
      const info = getClientEnvironmentInfo();

      expect(info.environment).toBe('development');
    });
  });

  describe('createWhatsAppClient', () => {
    it('should create mock client when no credentials', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      const { createWhatsAppClient } = await import('../client-factory');
      const client = createWhatsAppClient();

      expect(client.getClientInfo().type).toBe('mock');
    });

    it('should create real client when credentials exist in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token');
      vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'test-phone-id');

      const { createWhatsAppClient } = await import('../client-factory');
      const client = createWhatsAppClient();

      expect(client.getClientInfo().type).toBe('real');
    });

    it('should throw in production without credentials', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('VERCEL_ENV', 'production');

      const { createWhatsAppClient } = await import('../client-factory');

      expect(() => createWhatsAppClient()).toThrow(
        'WhatsApp credentials not configured for production',
      );
    });
  });

  describe('getWhatsAppClient', () => {
    it('should return singleton instance', async () => {
      vi.stubEnv('NODE_ENV', 'test');

      const { getWhatsAppClient, resetWhatsAppClient } =
        await import('../client-factory');

      resetWhatsAppClient();
      const client1 = getWhatsAppClient();
      const client2 = getWhatsAppClient();

      expect(client1).toBe(client2);
    });
  });

  describe('resetWhatsAppClient', () => {
    it('should create new instance after reset', async () => {
      vi.stubEnv('NODE_ENV', 'test');

      const { getWhatsAppClient, resetWhatsAppClient } =
        await import('../client-factory');

      const client1 = getWhatsAppClient();
      resetWhatsAppClient();
      const client2 = getWhatsAppClient();

      // Different instances (though both mock)
      expect(client1).not.toBe(client2);
    });
  });

  describe('isMockClient', () => {
    it('should return true for mock client', async () => {
      vi.stubEnv('NODE_ENV', 'test');

      const { isMockClient, resetWhatsAppClient } =
        await import('../client-factory');

      resetWhatsAppClient();
      expect(isMockClient()).toBe(true);
    });
  });
});
