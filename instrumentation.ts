import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export async function register() {
  try {
    if (process.env['NEXT_RUNTIME'] === 'nodejs') {
      await import('./sentry.server.config');
    }

    if (process.env['NEXT_RUNTIME'] === 'edge') {
      await import('./sentry.edge.config');
    }
  } catch (error) {
    // 记录错误但不阻止应用启动
    // 使用结构化日志记录错误信息
    logger.error('Failed to register instrumentation', {
      runtime: process.env['NEXT_RUNTIME'],
      nodeEnv: process.env.NODE_ENV,
    }, error instanceof Error ? error : new Error(String(error)));
  }
}

// Required for Sentry 10.x - handles errors from nested React Server Components
export function onRequestError(
  error: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  },
) {
  // Only capture errors in production to avoid noise in development
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureRequestError(error, request, context);
  }
}
