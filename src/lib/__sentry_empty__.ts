/* eslint-disable no-empty-function */
// Minimal stub for @sentry/nextjs when Sentry bundling is disabled
// Empty functions are intentional (Null Object Pattern) to avoid runtime errors when Sentry is disabled
export function captureException(_e: unknown): void {}
export function captureMessage(_m: string, _l?: unknown): void {}
export function addBreadcrumb(_b: unknown): void {}
export function setTag(_k: string, _v: string): void {}
export function setUser(_u: unknown): void {}
export function setContext(_n: string, _c: Record<string, unknown>): void {}
export function captureRequestError(
  _error: unknown,
  _request: unknown,
  _context: unknown,
): void {}
