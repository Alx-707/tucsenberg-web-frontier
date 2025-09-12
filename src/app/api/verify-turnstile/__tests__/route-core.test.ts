import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
;
import { POST, GET } from '../route';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    CLOUDFLARE_TURNSTILE_SECRET_KEY: 'test-secret-key',
    CLOUDFLARE_TURNSTILE_ENABLED: 'true',
  },
}));

describe('Verify Turnstile API Route - Core Tests', () => {
  const validRequestBody = {
    token: 'valid-turnstile-token',
    remoteip: '127.0.0.1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('POST /api/verify-turnstile - Basic Functionality', () => {
    it('应该成功验证有效的Turnstile token', async () => {
      // Mock successful Cloudflare response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          'error-codes': [],
          challenge_ts: '2023-01-01T00:00:00.000Z',
          hostname: 'localhost',
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/verify-turnstile',
        {
          method: 'POST',
          body: JSON.stringify(validRequestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Turnstile verification successful');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
    });

    it('应该处理Turnstile验证失败', async () => {
      // Mock failed Cloudflare response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response'],
          challenge_ts: null,
          hostname: 'localhost',
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/verify-turnstile',
        {
          method: 'POST',
          body: JSON.stringify(validRequestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Turnstile verification failed');
      expect(data.errors).toEqual(['invalid-input-response']);
    });

    it('应该处理缺少token的请求', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/verify-turnstile',
        {
          method: 'POST',
          body: JSON.stringify({ remoteip: '127.0.0.1' }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required token parameter');
    });

    it('应该处理空token的请求', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/verify-turnstile',
        {
          method: 'POST',
          body: JSON.stringify({ token: '', remoteip: '127.0.0.1' }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required token parameter');
    });
  });

  describe('GET /api/verify-turnstile - Health Check', () => {
    it('应该返回健康检查信息（配置已启用）', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service).toBe('Turnstile Verification');
      expect(data.status).toBe('enabled');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('应该处理无效的JSON请求体', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/verify-turnstile',
        {
          method: 'POST',
          body: 'invalid-json',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid JSON in request body');
    });

    it('应该处理Cloudflare API网络错误', async () => {
      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest(
        'http://localhost:3000/api/verify-turnstile',
        {
          method: 'POST',
          body: JSON.stringify(validRequestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error during verification');
    });
  });
});
