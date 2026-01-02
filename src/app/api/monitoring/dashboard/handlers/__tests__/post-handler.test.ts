import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODES } from '@/constants/api-error-codes';
import { handlePostRequest } from '../post-handler';

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

describe('handlePostRequest', () => {
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
          method: 'POST',
          body: JSON.stringify({ metrics: { test: 1 } }),
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('valid monitoring data', () => {
    it('should process valid monitoring data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: {
              cls: 0.05,
              fid: 100,
              lcp: 2000,
            },
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_DATA_RECEIVED);
    });

    it('should return processed data with id', async () => {
      const timestamp = Date.now();
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'performance',
            metrics: { loadTime: 1500 },
            timestamp,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(data.data.id).toMatch(/^monitoring-\d+$/);
      expect(data.data.source).toBe('performance');
      expect(data.data.metrics).toEqual({ loadTime: 1500 });
      expect(data.data.timestamp).toBe(timestamp);
      expect(data.data.processedAt).toBeDefined();
      expect(data.data.status).toBe('processed');
    });

    it('should log received data', async () => {
      const { logger } = await import('@/lib/logger');
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'test-source',
            metrics: { key1: 1, key2: 2 },
            timestamp: 1234567890,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      await handlePostRequest(request);

      expect(logger.info).toHaveBeenCalledWith(
        'Monitoring dashboard data received',
        expect.objectContaining({
          source: 'test-source',
          timestamp: 1234567890,
          metricsCount: 2,
        }),
      );
    });

    it('should handle different source types', async () => {
      const sources = ['web-vitals', 'performance', 'error', 'bundle', 'i18n'];

      for (const source of sources) {
        const request = new NextRequest(
          'http://localhost:3000/api/monitoring/dashboard',
          {
            method: 'POST',
            body: JSON.stringify({
              source,
              metrics: { test: 1 },
              timestamp: Date.now(),
            }),
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const response = await handlePostRequest(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.source).toBe(source);
      }
    });
  });

  describe('validation errors', () => {
    it('should reject missing source', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            metrics: { cls: 0.05 },
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_INVALID_FORMAT);
    });

    it('should reject missing metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject missing timestamp', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: { cls: 0.05 },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid source type (non-string)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 123,
            metrics: { cls: 0.05 },
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid metrics type (non-object)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: 'not-an-object',
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject null metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: null,
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid timestamp type (non-number)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: { cls: 0.05 },
            timestamp: '2024-01-01',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INVALID_JSON_BODY);
    });

    it('should reject empty body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: '',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject array body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify([{ source: 'test', metrics: {}, timestamp: 1 }]),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty metrics object', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: {},
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle nested metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'performance',
            metrics: {
              navigation: {
                dns: 50,
                tcp: 100,
                ttfb: 200,
              },
              resources: {
                count: 50,
                size: 1024000,
              },
            },
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle large metrics payload', async () => {
      const largeMetrics: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        largeMetrics[`metric_${i}`] = Math.random() * 1000;
      }

      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'batch',
            metrics: largeMetrics,
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle zero timestamp', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: { cls: 0.05 },
            timestamp: 0,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await handlePostRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
