/* eslint-disable no-empty-function */
// No-op Sentry client used when DISABLE_SENTRY_BUNDLE=1
// Exports the same surface without importing @sentry/nextjs or creating dynamic chunks
// Empty functions are intentional (Null Object Pattern) to avoid runtime errors when Sentry is disabled

export function captureException(_error: unknown): void {}
export function captureMessage(_message: string, _level?: unknown): void {}
export function addBreadcrumb(_breadcrumb: unknown): void {}
export function setTag(_key: string, _value: string): void {}
export function setUser(_user: unknown): void {}
export function setContext(
  _name: string,
  _context: Record<string, unknown>,
): void {}
