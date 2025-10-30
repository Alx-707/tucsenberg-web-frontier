/*
 * Lightweight Sentry client wrapper for on-demand loading.
 * - Avoids bundling @sentry/nextjs in the shared chunk
 * - Only loads in production when actually used
 * - In tests, respects vi.mock('@sentry/nextjs') via dynamic import
 */

type SentryModule = typeof import('@sentry/nextjs');

const DISABLE_SENTRY =
  process.env['NEXT_PUBLIC_DISABLE_SENTRY'] === '1' ||
  process.env['DISABLE_SENTRY_BUNDLE'] === '1';

let sentryPromise: Promise<SentryModule> | null = null;

function loadSentry(): Promise<SentryModule> | null {
  // Only load on the client or modern runtimes; keep production-only to reduce noise
  if (DISABLE_SENTRY) return null;
  if (process.env.NODE_ENV !== 'production') return null;
  if (!sentryPromise) {
    // Dynamic import is mockable by Vitest (vi.mock('@sentry/nextjs'))
    sentryPromise = import('@sentry/nextjs');
  }
  return sentryPromise;
}

function withSentry(action: (s: SentryModule) => void) {
  const p = loadSentry();
  if (!p) return; // no-op in non-production
  p.then((s) => {
    try {
      action(s);
    } catch {
      // swallow errors from Sentry calls to avoid impacting UX
    }
  }).catch(() => {
    // swallow promise rejection to avoid unhandled rejection
  });
}

export function captureException(error: unknown) {
  withSentry((s) => s.captureException(error));
}

export function captureMessage(
  message: string,
  level?: Parameters<SentryModule['captureMessage']>[1],
) {
  withSentry((s) => {
    if (level !== undefined) {
      s.captureMessage(message, level);
    } else {
      s.captureMessage(message);
    }
  });
}

export function addBreadcrumb(
  breadcrumb: Parameters<SentryModule['addBreadcrumb']>[0],
) {
  withSentry((s) => s.addBreadcrumb(breadcrumb));
}

export function setTag(key: string, value: string) {
  withSentry((s) => s.setTag(key, value));
}

export function setUser(user: Parameters<SentryModule['setUser']>[0]) {
  withSentry((s) => s.setUser(user));
}

export function setContext(name: string, context: Record<string, unknown>) {
  withSentry((s) => s.setContext(name, context));
}

// For potential future use; intentionally not exported to keep surface minimal
// function flush(timeout?: number) { withSentry((s) => s.flush(timeout)); }
