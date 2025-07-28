// This file configures the initialization of Sentry on the server side
// The config you add here will be used whenever the server handles a request
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
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
      component: "server"
    },
  },

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Server-side error filtering
  beforeSend(event) {
    // Filter out certain server errors
    if (process.env.NODE_ENV === 'development') {
      // Don't send certain errors in development
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ENOENT' || 
            error?.value?.includes('ECONNREFUSED')) {
          return null;
        }
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
    };
    return event;
  },

  // Configure sampling for different transaction types
  tracesSampler: (samplingContext) => {
    // Sample API routes at a higher rate
    if (samplingContext.request?.url?.includes('/api/')) {
      return 1.0;
    }
    
    // Sample page requests at a lower rate in production
    if (process.env.NODE_ENV === 'production') {
      return 0.1;
    }
    
    // Sample everything in development
    return 1.0;
  },
});
