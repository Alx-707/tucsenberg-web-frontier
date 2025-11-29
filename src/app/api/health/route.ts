import { NextResponse } from 'next/server';

/**
 * Health check endpoint used by monitoring and cron jobs.
 *
 * Returns a minimal, stable JSON payload so that both automated checks
 * and e2e tests can reliably assert service availability.
 */
export function GET() {
  return NextResponse.json(
    { status: 'ok' },
    {
      status: 200,
      headers: {
        // Health checks should not be cached by intermediaries.
        'cache-control': 'no-store',
      },
    },
  );
}
