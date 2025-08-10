// This file configures the initialization of Sentry on the browser/client side
// This is the new recommended way for Turbopack compatibility
// Replaces sentry.client.config.ts for better Turbopack support
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

// Environment variables with fallbacks
const SENTRY_DSN = process.env['SENTRY_DSN'] || '';
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const VERCEL_GIT_COMMIT_SHA =
  process.env['VERCEL_GIT_COMMIT_SHA'] || 'development';

// Only initialize Sentry in production to reduce bundle size
if (NODE_ENV === 'production' && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Reduced sample rate for production performance
    tracesSampleRate: 0.1,

    // Disable debug in production
    debug: false,

    // Disable Session Replay to significantly reduce bundle size
    // Session Replay adds ~2MB to the bundle and is not critical for basic error tracking
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,

    // Minimal integrations for smaller bundle size
    integrations: [
      // Removed replayIntegration to reduce bundle size by ~2MB
      // Only keep essential error tracking
    ],

    // Set user context
    initialScope: {
      tags: {
        component: 'client',
        turbopack: 'enabled', // 标记使用 Turbopack
      },
    },

    // Environment configuration
    environment: NODE_ENV,

    // Release tracking
    release: VERCEL_GIT_COMMIT_SHA,

    // Optimized error filtering for production
    beforeSend(event) {
      // Filter out non-critical errors to reduce noise
      if (event.exception) {
        const error = event.exception.values?.[0];
        // Skip common non-critical errors
        if (
          error?.type === 'ChunkLoadError' ||
          error?.value?.includes('Loading chunk') ||
          error?.value?.includes('Loading CSS chunk')
        ) {
          return null;
        }
      }
      return event;
    },

    // Minimal transaction tracking
    beforeSendTransaction(event) {
      // Add minimal tags for production
      event.tags = {
        ...event.tags,
        section: 'client',
      };
      return event;
    },
  });
}
// Development mode: Sentry disabled for bundle size optimization

// Conditional export for router monitoring (only in production)
export const onRouterTransitionStart =
  NODE_ENV === 'production' && SENTRY_DSN
    ? Sentry.captureRouterTransitionStart
    : function noOpRouterTransition() {
        // No-op function for development mode
      };
