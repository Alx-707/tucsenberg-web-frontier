// This file configures the initialization of Sentry for edge runtime
// The config you add here will be used whenever a page or API route is run in edge runtime
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

// Optimized sampling rates for edge runtime performance
const MIDDLEWARE_SAMPLE_RATE = 0.01; // Reduced from 0.1 to 0.01
const PRODUCTION_SAMPLE_RATE = 0.05; // Reduced from 0.1 to 0.05
const API_SAMPLE_RATE = 0.1; // Reduced from 1.0 to 0.1

// Environment variables with fallbacks
const SENTRY_DSN = process.env['SENTRY_DSN'] || '';
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const VERCEL_GIT_COMMIT_SHA =
  process.env['VERCEL_GIT_COMMIT_SHA'] || 'development';

// Only initialize Sentry in production for edge runtime
if (NODE_ENV === 'production' && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Minimal trace sampling for edge runtime performance
    tracesSampleRate: PRODUCTION_SAMPLE_RATE,

    // Disable debug in production
    debug: false,

    // Set user context for edge runtime
    initialScope: {
      tags: {
        component: 'edge',
      },
    },

    // Environment configuration
    environment: NODE_ENV,

    // Release tracking
    release: VERCEL_GIT_COMMIT_SHA,

    // Edge runtime error filtering for production
    beforeSend(event) {
      // Filter out certain non-critical edge runtime errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (
          error?.type === 'TypeError' &&
          (error?.value?.includes('fetch') || error?.value?.includes('network'))
        ) {
          return null;
        }
      }
      return event;
    },

    // Custom edge tags
    beforeSendTransaction(event) {
      // Add custom tags to edge transactions
      event.tags = {
        ...event.tags,
        section: 'edge',
        runtime: 'edge',
      };
      return event;
    },

    // Optimized sampling for edge runtime performance
    tracesSampler: (samplingContext) => {
      // Minimal middleware sampling
      if (samplingContext.name === 'middleware') {
        return MIDDLEWARE_SAMPLE_RATE;
      }

      // Reduced API route sampling
      if (samplingContext['request']?.url?.includes('/api/')) {
        return API_SAMPLE_RATE;
      }

      // Use production sample rate for all other requests
      return PRODUCTION_SAMPLE_RATE;
    },
  });
}
// Development mode: Sentry disabled for edge runtime performance
