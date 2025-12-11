/**
 * Tests for all HTTP methods in the monitoring dashboard route
 * Ensures route.ts properly delegates to handlers
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST, PUT } from '../route';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock api-cache-utils for GET handler
vi.mock('@/lib/api-cache-utils', () => ({
  createCachedResponse: vi.fn((data, options) => {
    const { NextResponse } = require('next/server');
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', `public, max-age=${options.maxAge}`);
    return response;
  }),
}));

describe('Monitoring Dashboard Route - All Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should handle POST requests', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'POST',
          body: JSON.stringify({
            source: 'web-vitals',
            metrics: { cls: 0.05 },
            timestamp: Date.now(),
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET', () => {
    it('should handle GET requests', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
      );

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should accept query parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?source=web-vitals&timeRange=24h',
      );

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.source).toBe('web-vitals');
      expect(data.data.timeRange).toBe('24h');
    });
  });

  describe('PUT', () => {
    it('should handle PUT requests', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({
            config: { alertThreshold: 0.1 },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid config', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
        {
          method: 'PUT',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE', () => {
    it('should handle DELETE requests with confirmation', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true',
      );

      const response = DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should require confirmation', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
      );

      const response = DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Confirmation required');
    });

    it('should accept filter parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true&source=web-vitals&timeRange=1h',
      );

      const response = DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('web-vitals');
      expect(data.message).toContain('1h');
    });
  });
});
