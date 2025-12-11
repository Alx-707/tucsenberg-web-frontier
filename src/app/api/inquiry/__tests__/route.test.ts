import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processLead } from '@/lib/lead-pipeline';
import {
  checkRateLimit,
  verifyTurnstile,
} from '@/app/api/contact/contact-api-utils';
import { OPTIONS, POST } from '../route';

// Mock dependencies before imports
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/lead-pipeline', () => ({
  processLead: vi.fn(() =>
    Promise.resolve({
      success: true,
      emailSent: true,
      recordCreated: true,
      referenceId: 'ref-123',
    }),
  ),
  LEAD_TYPES: {
    PRODUCT: 'PRODUCT',
    CONTACT: 'CONTACT',
  },
}));

vi.mock('@/lib/lead-pipeline/lead-schema', () => ({
  LEAD_TYPES: {
    PRODUCT: 'PRODUCT',
    CONTACT: 'CONTACT',
  },
}));

vi.mock('@/app/api/contact/contact-api-utils', () => ({
  checkRateLimit: vi.fn(() => true),
  getClientIP: vi.fn(() => '192.168.1.1'),
  verifyTurnstile: vi.fn(() => Promise.resolve(true)),
}));

describe('/api/inquiry route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('POST', () => {
    const validInquiryData = {
      turnstileToken: 'valid-token',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Acme Inc',
      message: 'I am interested in your products.',
      productSlug: 'example-product',
    };

    it('should process valid inquiry successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.referenceId).toBe('ref-123');
      expect(processLead).toHaveBeenCalled();
    });

    it('should return 429 when rate limited', async () => {
      vi.mocked(checkRateLimit).mockReturnValueOnce(false);

      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many requests');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 when turnstile token is missing', async () => {
      const dataWithoutToken = { ...validInquiryData };
      delete (dataWithoutToken as { turnstileToken?: string }).turnstileToken;

      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(dataWithoutToken),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Security verification required');
    });

    it('should return 400 when turnstile verification fails', async () => {
      vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Security verification failed');
    });

    it('should handle processLead failure', async () => {
      vi.mocked(processLead).mockResolvedValueOnce({
        success: false,
        error: 'PROCESSING_ERROR',
        emailSent: false,
        recordCreated: false,
      });

      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle validation error from processLead', async () => {
      vi.mocked(processLead).mockResolvedValueOnce({
        success: false,
        error: 'VALIDATION_ERROR',
        emailSent: false,
        recordCreated: false,
      });

      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('check your form inputs');
    });

    it('should handle unexpected errors', async () => {
      vi.mocked(processLead).mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('unexpected error');
    });

    it('should pass lead type PRODUCT to processLead', async () => {
      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      expect(processLead).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PRODUCT',
        }),
      );
    });

    it('should exclude turnstileToken from lead data', async () => {
      const request = new NextRequest('http://localhost:3000/api/inquiry', {
        method: 'POST',
        body: JSON.stringify(validInquiryData),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      const callArgs = vi.mocked(processLead).mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('turnstileToken');
    });
  });

  describe('OPTIONS', () => {
    it('should return 200 with CORS headers', async () => {
      const response = OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'POST, OPTIONS',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type',
      );
    });

    it('should return empty body', async () => {
      const response = OPTIONS();
      const body = await response.text();

      expect(body).toBe('');
    });
  });
});
