/**
 * Product Inquiry API Route
 * Handles product-specific inquiries via product page drawer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCorsPreflightResponse } from '@/lib/api/cors-utils';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { processLead, type LeadResult } from '@/lib/lead-pipeline';
import { LEAD_TYPES } from '@/lib/lead-pipeline/lead-schema';
import { logger } from '@/lib/logger';
import {
  checkDistributedRateLimit,
  createRateLimitHeaders,
} from '@/lib/security/distributed-rate-limit';
import {
  getClientIP,
  verifyTurnstile,
} from '@/app/api/contact/contact-api-utils';

// HTTP status codes as named constants
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_ERROR = 500;

interface SuccessResponseOptions {
  result: LeadResult;
  clientIP: string;
  processingTime: number;
  headers?: Headers;
}

/**
 * Create success response for product inquiry
 */
function createSuccessResponse(options: SuccessResponseOptions): NextResponse {
  const { result, clientIP, processingTime, headers } = options;
  logger.info('Product inquiry submitted successfully', {
    referenceId: result.referenceId,
    ip: clientIP,
    processingTime,
    emailSent: result.emailSent,
    recordCreated: result.recordCreated,
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Thank you for your inquiry. We will contact you shortly.',
      referenceId: result.referenceId,
    },
    ...(headers ? [{ headers }] : []),
  );
}

/**
 * Create error response for failed inquiry
 */
function createErrorResponse(
  result: LeadResult,
  clientIP: string,
  processingTime: number,
): NextResponse {
  logger.warn('Product inquiry submission failed', {
    error: result.error,
    ip: clientIP,
    processingTime,
  });

  const isValidationError = result.error === 'VALIDATION_ERROR';
  return NextResponse.json(
    {
      success: false,
      error: isValidationError
        ? 'Please check your form inputs and try again.'
        : 'An error occurred processing your inquiry. Please try again.',
    },
    { status: isValidationError ? HTTP_BAD_REQUEST : HTTP_INTERNAL_ERROR },
  );
}

/**
 * Validate Turnstile token and return error response if invalid
 */
async function validateTurnstile(
  token: string | undefined,
  clientIP: string,
): Promise<NextResponse | null> {
  if (!token) {
    logger.warn('Product inquiry missing Turnstile token', { ip: clientIP });
    return NextResponse.json(
      { success: false, error: 'Security verification required' },
      { status: HTTP_BAD_REQUEST },
    );
  }

  const isValid = await verifyTurnstile(token, clientIP);
  if (!isValid) {
    logger.warn('Product inquiry Turnstile verification failed', {
      ip: clientIP,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Security verification failed. Please try again.',
      },
      { status: HTTP_BAD_REQUEST },
    );
  }

  return null;
}

/**
 * POST /api/inquiry
 * Handle product inquiry form submission
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // Check distributed rate limit
    const rateLimitResult = await checkDistributedRateLimit(
      clientIP,
      'inquiry',
    );
    if (!rateLimitResult.allowed) {
      logger.warn('Product inquiry rate limit exceeded', {
        ip: clientIP,
        retryAfter: rateLimitResult.retryAfter,
      });
      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: HTTP_TOO_MANY_REQUESTS, headers },
      );
    }

    const parsedBody = await safeParseJson<{
      turnstileToken?: string;
      [key: string]: unknown;
    }>(request, { route: '/api/inquiry' });

    if (!parsedBody.ok) {
      return NextResponse.json(
        { success: false, error: parsedBody.error },
        { status: HTTP_BAD_REQUEST },
      );
    }

    const turnstileError = await validateTurnstile(
      parsedBody.data?.turnstileToken,
      clientIP,
    );
    if (turnstileError) return turnstileError;

    const { turnstileToken: _token, ...leadData } = parsedBody.data ?? {};
    const result = await processLead({ type: LEAD_TYPES.PRODUCT, ...leadData });
    const processingTime = Date.now() - startTime;

    const headers = createRateLimitHeaders(rateLimitResult);
    return result.success
      ? createSuccessResponse({ result, clientIP, processingTime, headers })
      : createErrorResponse(result, clientIP, processingTime);
  } catch (error) {
    logger.error('Product inquiry submission failed unexpectedly', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      processingTime: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      },
      { status: HTTP_INTERNAL_ERROR },
    );
  }
}

/**
 * OPTIONS /api/inquiry
 * Handle CORS preflight requests
 */
export function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request);
}
