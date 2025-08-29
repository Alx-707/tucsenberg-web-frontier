import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, OPTIONS, POST } from '../route';

describe('CSP Report API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console mocks
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/csp-report', () => {
    const validCSPReport = {
      'csp-report': {
        'document-uri': 'https://example.com/page',
        'referrer': 'https://example.com',
        'violated-directive': 'script-src',
        'effective-directive': 'script-src',
        'original-policy': "default-src 'self'; script-src 'self'",
        'disposition': 'enforce',
        'blocked-uri': 'https://malicious.com/script.js',
        'line-number': 42,
        'column-number': 10,
        'source-file': 'https://example.com/page',
        'status-code': 200,
        'script-sample': 'eval("malicious code")',
      },
    };

    it('应该成功处理有效的CSP报告', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(validCSPReport),
        headers: {
          'content-type': 'application/csp-report',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('received');
      expect(data.timestamp).toBeDefined();
      expect(console.warn).toHaveBeenCalledWith(
        'CSP Violation Report:',
        expect.any(String),
      );
    });

    it('应该拒绝无效的Content-Type', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(validCSPReport),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid content type');
    });

    it('应该处理缺少Content-Type的请求', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(validCSPReport),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid content type');
    });

    it('应该处理无效的JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'content-type': 'application/csp-report',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('应该处理缺少csp-report字段的请求', async () => {
      const invalidReport = {
        'not-csp-report': {},
      };

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(invalidReport),
        headers: {
          'content-type': 'application/csp-report',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid CSP report format');
    });

    it('应该检测可疑的违规模式', async () => {
      const suspiciousReport = {
        'csp-report': {
          ...validCSPReport['csp-report'],
          'blocked-uri': 'data:text/html,<script>eval("malicious")</script>',
          'script-sample': 'eval("dangerous code")',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(suspiciousReport),
        headers: {
          'content-type': 'application/csp-report',
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.error).toHaveBeenCalledWith(
        'SUSPICIOUS CSP VIOLATION DETECTED:',
        expect.objectContaining({
          ip: '192.168.1.100',
          userAgent: expect.any(String),
        }),
      );
    });

    it('应该在开发环境中忽略报告（当CSP_REPORT_URI未设置时）', async () => {
      // Mock development environment without CSP_REPORT_URI
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('CSP_REPORT_URI', '');

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(validCSPReport),
        headers: {
          'content-type': 'application/csp-report',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ignored');
    });

    it('应该正确提取客户端信息', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(validCSPReport),
        headers: {
          'content-type': 'application/csp-report',
          'x-forwarded-for': '203.0.113.1, 192.168.1.1',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          'referer': 'https://example.com/source',
        },
      });

      await POST(request);

      expect(console.warn).toHaveBeenCalledWith(
        'CSP Violation Report:',
        expect.stringContaining('"ip":"203.0.113.1, 192.168.1.1"'),
      );
    });

    it('应该处理生产环境的特殊日志记录', async () => {
      // Mock production environment
      vi.stubEnv('NODE_ENV', 'production');

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(validCSPReport),
        headers: {
          'content-type': 'application/csp-report',
        },
      });

      await POST(request);

      // 在生产环境中应该记录到console.error
      expect(console.error).toHaveBeenCalledWith(
        'Production CSP Violation:',
        expect.any(Object),
      );
    });

    it('应该检测多种可疑模式', async () => {
      const testCases = [
        { pattern: 'eval', field: 'script-sample' },
        { pattern: 'vbscript:', field: 'blocked-uri' },
        { pattern: 'onload', field: 'script-sample' },
        { pattern: 'onerror', field: 'blocked-uri' },
        { pattern: 'onclick', field: 'script-sample' },
      ];

      for (const testCase of testCases) {
        const suspiciousReport = {
          'csp-report': {
            ...validCSPReport['csp-report'],
            [testCase.field]: `some content with ${testCase.pattern} pattern`,
          },
        };

        const request = new NextRequest('http://localhost:3000/api/csp-report', {
          method: 'POST',
          body: JSON.stringify(suspiciousReport),
          headers: {
            'content-type': 'application/csp-report',
          },
        });

        await POST(request);

        expect(console.error).toHaveBeenCalledWith(
          'SUSPICIOUS CSP VIOLATION DETECTED:',
          expect.any(Object),
        );

        // Clear mocks for next iteration
        vi.clearAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
      }
    });
  });

  describe('GET /api/csp-report', () => {
    it('应该返回健康检查信息', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('CSP report endpoint active');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('OPTIONS /api/csp-report', () => {
    it('应该返回正确的CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Allow')).toBe('POST, GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('错误处理', () => {
    it('应该处理请求体解析错误', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: null,
        headers: {
          'content-type': 'application/csp-report',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(console.error).toHaveBeenCalledWith(
        'Error processing CSP report:',
        expect.any(Error),
      );
    });

    it('应该处理意外的错误', async () => {
      const testCSPReport = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'referrer': 'https://example.com',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': "default-src 'self'; script-src 'self'",
          'disposition': 'enforce',
          'blocked-uri': 'https://malicious.com/script.js',
          'line-number': 42,
          'column-number': 10,
          'source-file': 'https://example.com/page',
          'status-code': 200,
          'script-sample': 'eval("malicious code")',
        },
      };

      // Mock JSON.parse to throw an error
      const originalParse = JSON.parse;
      JSON.parse = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        body: JSON.stringify(testCSPReport),
        headers: {
          'content-type': 'application/csp-report',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');

      // Restore original JSON.parse
      JSON.parse = originalParse;
    });
  });
});
