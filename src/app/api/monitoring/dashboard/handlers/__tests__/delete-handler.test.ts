import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODES } from '@/constants/api-error-codes';
import { handleDeleteRequest } from '../delete-handler';

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

describe('handleDeleteRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authorization', () => {
    it('should return 401 when authorization fails', async () => {
      const { validateAdminAccess } =
        await import('@/app/api/contact/contact-api-validation');
      vi.mocked(validateAdminAccess).mockReturnValueOnce(false);

      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('confirmation required', () => {
    it('should require confirmation parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.CONFIRMATION_REQUIRED);
    });

    it('should reject when confirm is false', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=false',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.CONFIRMATION_REQUIRED);
    });

    it('should reject when confirm is not exactly "true"', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=yes',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('successful deletion', () => {
    it('should delete all data when confirm=true', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_DELETED);
      expect(data.deletedAt).toBeDefined();
    });

    it('should delete specific source when provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true&source=web-vitals',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_DELETED);
    });

    it('should delete specific time range when provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true&timeRange=1h',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_DELETED);
    });

    it('should delete with both source and timeRange', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true&source=performance&timeRange=24h',
      );

      const response = handleDeleteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_DELETED);
    });

    it('should log deletion request', async () => {
      const { logger } = await import('@/lib/logger');
      const request = new NextRequest(
        'http://localhost:3000/api/monitoring/dashboard?confirm=true&source=test',
      );

      handleDeleteRequest(request);

      expect(logger.info).toHaveBeenCalledWith(
        'Monitoring dashboard data deletion requested',
        expect.objectContaining({
          source: 'test',
          timeRange: 'all',
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle URL parsing errors gracefully', async () => {
      // Create a request with a malformed URL that throws during URL parsing
      const mockRequest = {
        url: 'not-a-valid-url',
      } as unknown as NextRequest;

      const response = handleDeleteRequest(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.MONITORING_DELETE_FAILED);
    });
  });
});
