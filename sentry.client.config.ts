// This file configures the initialization of Sentry on the browser/client side
// The config you add here will be used whenever a page is visited
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Error filtering and reporting
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      // Don't send certain errors in development
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ChunkLoadError' ||
            error?.value?.includes('Loading chunk')) {
          return null;
        }
        // Show report dialog for exceptions in development
        Sentry.showReportDialog({ eventId: event.event_id });
      }
    }
    return event;
  },

  // Set user context
  initialScope: {
    tags: {
      component: "client"
    },
  },

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Custom error tags
  beforeSendTransaction(event) {
    // Add custom tags to transactions
    event.tags = {
      ...event.tags,
      section: 'client',
    };
    return event;
  },
});
