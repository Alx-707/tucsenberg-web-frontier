// This file configures the initialization of Sentry for edge runtime
// The config you add here will be used whenever a page or API route is run in edge runtime
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Set user context for edge runtime
  initialScope: {
    tags: {
      component: "edge"
    },
  },

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Edge runtime error filtering
  beforeSend(event) {
    // Filter out certain edge runtime errors
    if (process.env.NODE_ENV === 'development') {
      // Don't send certain errors in development
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'TypeError' && 
            error?.value?.includes('fetch')) {
          return null;
        }
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

  // Configure sampling for edge runtime
  tracesSampler: (samplingContext) => {
    // Sample middleware at a lower rate
    if (samplingContext.name === 'middleware') {
      return 0.1;
    }
    
    // Sample API routes at a higher rate
    if (samplingContext.request?.url?.includes('/api/')) {
      return 1.0;
    }
    
    // Default sampling
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },
});
