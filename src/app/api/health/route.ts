import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET(_req: NextRequest) {
  return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
