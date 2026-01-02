import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODES } from '@/constants/api-error-codes';
import { handlePutRequest } from '../put-handler';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock validateAdminAccess to return true by default
vi.mock('@/app/api/contact/contact-api-validation', () => ({
  validateAdminAccess: vi.fn(() => true),
}));

describe('handlePutRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authorization', () => {
    it('should return 401 when authorization fails', async () => {
      const { validateAdminAccess } =
        await import('@/app/api/contact/contact-api-validation');
      vi.mocked(validateAdminAccess).mockReturnValueOnce(false);

      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({ config: { test: true } }),
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('valid configuration updates', () => {
    it('should update configuration successfully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: {
              alertThreshold: 0.1,
              retentionDays: 30,
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_CONFIG_UPDATED);
      expect(data.data.configUpdated).toContain('alertThreshold');
      expect(data.data.configUpdated).toContain('retentionDays');
    });

    it('should include timestamp in response', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: { enabled: true },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(data.data.timestamp).toBeDefined();
      expect(() => new Date(data.data.timestamp)).not.toThrow();
    });

    it('should accept config with updatedBy field', async () => {
      const { logger } = await import('@/lib/logger');
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: { setting: 'value' },
            updatedBy: 'admin@example.com',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Monitoring dashboard configuration updated',
        expect.objectContaining({
          updatedBy: 'admin@example.com',
        }),
      );
    });

    it('should default updatedBy to system when not provided', async () => {
      const { logger } = await import('@/lib/logger');
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: { setting: 'value' },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      await handlePutRequest(request);

      expect(logger.info).toHaveBeenCalledWith(
        'Monitoring dashboard configuration updated',
        expect.objectContaining({
          updatedBy: 'system',
        }),
      );
    });

    it('should log configuration keys', async () => {
      const { logger } = await import('@/lib/logger');
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: {
              key1: 'value1',
              key2: 'value2',
              key3: 'value3',
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      await handlePutRequest(request);

      expect(logger.info).toHaveBeenCalledWith(
        'Monitoring dashboard configuration updated',
        expect.objectContaining({
          configKeys: ['key1', 'key2', 'key3'],
        }),
      );
    });
  });

  describe('validation errors', () => {
    it('should reject missing config field', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            updatedBy: 'admin',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_CONFIG_INVALID);
    });

    it('should reject null config', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: null,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject non-object config', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: 'string-value',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept array config (arrays are objects in JS)', async () => {
      // Note: Arrays pass typeof === 'object' check, so they're accepted
      // If stricter validation is needed, Array.isArray check should be added
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: ['item1', 'item2'],
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INVALID_JSON_BODY);
    });

    it('should reject empty body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: '',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty config object', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: {},
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.configUpdated).toEqual([]);
    });

    it('should handle nested config objects', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: {
              alerts: {
                email: true,
                slack: false,
              },
              thresholds: {
                cpu: 80,
                memory: 90,
              },
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.configUpdated).toContain('alerts');
      expect(data.data.configUpdated).toContain('thresholds');
    });

    it('should handle special characters in config values', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: {
              webhook: 'https://example.com/webhook?token=abc&type=alert',
              description: 'Test with "quotes" and <tags>',
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePutRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
