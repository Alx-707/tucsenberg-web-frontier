import { NextRequest, NextResponse } from 'next/server';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import {
  getClientIP,
  verifyTurnstile,
} from '@/app/api/contact/contact-api-utils';

interface TurnstileVerificationRequest {
  token: string;
  remoteip?: string;
}

/**
 * Validate request body
 */
function validateRequestBody(body: TurnstileVerificationRequest) {
  if (!body.token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing token',
        message: 'Turnstile token is required',
      },
      { status: 400 },
    );
  }
  return null;
}

/**
 * Verify Cloudflare Turnstile token
 *
 * This endpoint verifies the Turnstile token on the server side
 * to ensure the user has passed the bot protection challenge.
 * Uses the shared verifyTurnstile function for consistency.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Turnstile is configured
    if (!env.TURNSTILE_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Turnstile not configured',
          message: 'Bot protection is not properly configured on the server',
        },
        { status: 500 },
      );
    }

    // Parse request body (safe JSON parse)
    const parsedBody = await safeParseJson<TurnstileVerificationRequest>(
      request,
      {
        route: '/api/verify-turnstile',
      },
    );
    if (!parsedBody.ok) {
      return NextResponse.json(
        {
          success: false,
          error: parsedBody.error,
        },
        { status: 400 },
      );
    }
    const body = parsedBody.data;

    // Validate request body
    const validationError = validateRequestBody(body);
    if (validationError) {
      return validationError;
    }

    // Get client IP (prefer remoteip from body if provided)
    const clientIP = body.remoteip || getClientIP(request);

    // Use shared verifyTurnstile function
    const isValid = await verifyTurnstile(body.token, clientIP);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification failed',
          message: 'Bot protection challenge failed',
        },
        { status: 400 },
      );
    }

    // Verification successful
    return NextResponse.json(
      {
        success: true,
        message: 'Verification successful',
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error('Error verifying Turnstile token', { error: error as Error });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while verifying the token',
      },
      { status: 500 },
    );
  }
}

/**
 * Handle GET requests (for health checks)
 */
export function GET() {
  const isConfigured = Boolean(env.TURNSTILE_SECRET_KEY);

  return NextResponse.json(
    {
      status: 'Turnstile verification endpoint active',
      configured: isConfigured,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

/**
 * Only allow POST and GET methods
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
