// This file configures the initialization of Sentry on the server side
// The config you add here will be used whenever the server handles a request
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

// Optimized sampling rates for production performance
const PRODUCTION_SAMPLE_RATE = 0.05; // Reduced from 0.1 to 0.05
const API_ROUTE_SAMPLE_RATE = 0.1; // Specific rate for API routes

// Environment variables with fallbacks
const SENTRY_DSN = process.env['SENTRY_DSN'] || '';
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const VERCEL_GIT_COMMIT_SHA =
  process.env['VERCEL_GIT_COMMIT_SHA'] || 'development';

// Only initialize Sentry in production
if (NODE_ENV === 'production' && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Reduced trace sampling for better performance
    tracesSampleRate: PRODUCTION_SAMPLE_RATE,

    // Disable debug in production
    debug: false,

    // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: process.env.NODE_ENV === 'development',

    // Performance Monitoring
    integrations: [
      // Add integrations for performance monitoring
      // Note: nodeProfilingIntegration may not be available in all versions
    ],

    // Set user context for server-side
    initialScope: {
      tags: {
        component: 'server',
        turbopack: 'enabled', // 标记使用 Turbopack
      },
    },

    // Environment configuration
    environment: NODE_ENV,

    // Release tracking
    release: VERCEL_GIT_COMMIT_SHA,

    // Server-side error filtering for production
    beforeSend(event) {
      // Filter out certain non-critical server errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (
          error?.type === 'ENOENT' ||
          error?.value?.includes('ECONNREFUSED') ||
          error?.value?.includes('ENOTFOUND')
        ) {
          return null;
        }
      }
      return event;
    },

    // Custom server tags
    beforeSendTransaction(event) {
      // Add custom tags to server transactions
      event.tags = {
        ...event.tags,
        section: 'server',
        bundler: 'turbopack',
      };
      return event;
    },

    // Optimized sampling for production performance
    tracesSampler: (samplingContext) => {
      // Reduced API route sampling for better performance
      if (samplingContext['request']?.url?.includes('/api/')) {
        return API_ROUTE_SAMPLE_RATE;
      }

      // Use production sample rate for all other requests
      return PRODUCTION_SAMPLE_RATE;
    },
  });
}
// Development mode: Sentry disabled for development performance
