import * as Sentry from '@sentry/nextjs';

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
    // 在生产环境中，这里可以使用专门的日志服务
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to register instrumentation:', error);
    }
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
