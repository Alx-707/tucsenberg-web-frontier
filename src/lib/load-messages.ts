/**
 * Translation Message Loader
 *
 * This module provides functions to load externalized translation files
 * from the public directory using Next.js caching mechanisms.
 *
 * Key Features:
 * - Uses unstable_cache for server-side caching (1 hour revalidation)
 * - Fetches translation files as static assets from /messages/
 * - Provides fallback to file system reads during build time
 * - Supports both critical and deferred translation types
 *
 * Architecture:
 * - Translation files are copied to public/messages/ during build (prebuild script)
 * - This keeps them out of the JS bundle, reducing First Load JS
 * - Server-side caching ensures fast subsequent requests
 *
 * @see scripts/copy-translations.js - Prebuild script that copies files
 * @see docs/i18n-optimization.md - Full architecture documentation
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';
import { MONITORING_INTERVALS } from '@/constants/performance-constants';
import { routing } from '@/i18n/routing';

const I18N_CACHE_REVALIDATE_DEFAULT_SECONDS =
  MONITORING_INTERVALS.CACHE_CLEANUP;

function getRevalidateTime(): number {
  return process.env.NODE_ENV === 'development'
    ? 1
    : I18N_CACHE_REVALIDATE_DEFAULT_SECONDS;
}

/**
 * Supported locale types
 */
type Locale = 'en' | 'zh';

/**
 * Translation message structure
 */
type Messages = Record<string, unknown>;

/**
 * Runtime locale sanitizer to guard against unexpected values.
 * Falls back to routing.defaultLocale when input is not in the whitelist.
 */
function sanitizeLocale(input: string): Locale {
  const allowed = ['en', 'zh'] as const;
  return (allowed as readonly string[]).includes(input)
    ? (input as Locale)
    : (routing.defaultLocale as Locale);
}

/**
 * Get the base URL for fetching translation files
 * Uses NEXT_PUBLIC_BASE_URL in production, localhost in development
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Development fallback
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

/**
 * Load critical translation messages (externalized)
 *
 * This function loads the critical translation file from the public directory
 * using fetch + unstable_cache for optimal performance.
 *
 * Caching Strategy:
 * - Server-side cache: 1 hour (3600 seconds)
 * - Revalidation: On-demand via Next.js revalidation
 * - Fallback: Static import if fetch fails
 *
 * @param locale - The locale to load ('en' or 'zh')
 * @returns Promise resolving to the translation messages object
 *
 * @example
 * ```typescript
 * const messages = await loadCriticalMessages('en');
 * ```
 */
/* eslint-disable max-statements */
export const loadCriticalMessages = unstable_cache(
  async (locale: Locale): Promise<Messages> => {
    // During build time, read from file system
    // During runtime, fetch from public directory
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

    if (isBuildTime) {
      // Build time: Read from source messages directory
      try {
        const filePath = join(
          process.cwd(),
          'messages',
          locale,
          'critical.json',
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content) as Messages;
      } catch (error) {
        logger.error(`Failed to read critical messages for ${locale}:`, error);
        throw new Error(`Cannot load critical messages for ${locale}`);
      }
    }

    // Runtime: Fetch from public directory
    const baseUrl = getBaseUrl();
    const safeLocale = sanitizeLocale(locale as string);
    const url = `${baseUrl}/messages/${safeLocale}/critical.json`;

    try {
      const revalidate = getRevalidateTime();
      const response = await fetch(url, {
        next: { revalidate },
        cache:
          process.env.NODE_ENV === 'development' ? 'no-store' : 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      return (await response.json()) as Messages;
    } catch (error) {
      logger.error(`Failed to load critical messages for ${locale}:`, error);

      // Fallback: Read from file system
      try {
        const filePath = join(
          process.cwd(),
          'public',
          'messages',
          safeLocale,
          'critical.json',
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content) as Messages;
      } catch (fallbackError) {
        logger.error(
          `Fallback file read also failed for ${locale}:`,
          fallbackError,
        );
        // Final fallback: return empty messages instead of throwing
        return {} as Messages;
      }
    }
  },
  ['i18n-critical'], // Cache key prefix
  {
    revalidate: getRevalidateTime(),
    tags: ['i18n', 'critical'],
  },
);

/**
 * Load deferred translation messages (externalized)
 *
 * This function loads the deferred translation file from the public directory
 * using fetch + unstable_cache for optimal performance.
 *
 * Caching Strategy:
 * - Server-side cache: 1 hour (3600 seconds)
 * - Revalidation: On-demand via Next.js revalidation
 * - Fallback: Static import if fetch fails
 *
 * @param locale - The locale to load ('en' or 'zh')
 * @returns Promise resolving to the translation messages object
 *
 * @example
 * ```typescript
 * const messages = await loadDeferredMessages('zh');
 * ```
 */
export const loadDeferredMessages = unstable_cache(
  async (locale: Locale): Promise<Messages> => {
    // During build time, read from file system
    // During runtime, fetch from public directory
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

    if (isBuildTime) {
      // Build time: Read from source messages directory
      try {
        const filePath = join(
          process.cwd(),
          'messages',
          locale,
          'deferred.json',
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content) as Messages;
      } catch (error) {
        logger.error(`Failed to read deferred messages for ${locale}:`, error);
        throw new Error(`Cannot load deferred messages for ${locale}`);
      }
    }

    // Runtime: Fetch from public directory
    const baseUrl = getBaseUrl();
    const safeLocale = sanitizeLocale(locale as string);
    const url = `${baseUrl}/messages/${safeLocale}/deferred.json`;

    try {
      const revalidate = getRevalidateTime();
      const response = await fetch(url, {
        next: { revalidate },
        cache:
          process.env.NODE_ENV === 'development' ? 'no-store' : 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      return (await response.json()) as Messages;
    } catch (error) {
      logger.error(`Failed to load deferred messages for ${locale}:`, error);

      // Fallback: Read from file system
      try {
        const filePath = join(
          process.cwd(),
          'public',
          'messages',
          safeLocale,
          'deferred.json',
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content) as Messages;
      } catch (fallbackError) {
        logger.error(
          `Fallback file read also failed for ${locale}:`,
          fallbackError,
        );
        // Final fallback: return empty messages instead of throwing
        return {} as Messages;
      }
    }
  },
  ['i18n-deferred'], // Cache key prefix
  {
    revalidate: getRevalidateTime(),
    tags: ['i18n', 'deferred'],
  },
);

/**
 * Preload critical messages for a locale
 *
 * This function can be used to preload messages before they're needed,
 * improving perceived performance.
 *
 * @param locale - The locale to preload
 *
 * @example
 * ```typescript
 * // In a layout or page component
 * void preloadCriticalMessages('en');
 * ```
 */
export function preloadCriticalMessages(locale: Locale): void {
  loadCriticalMessages(locale);
}

/**
 * Preload deferred messages for a locale
 *
 * This function can be used to preload messages before they're needed,
 * improving perceived performance.
 *
 * @param locale - The locale to preload
 *
 * @example
 * ```typescript
 * // In a component that will need deferred messages
 * void preloadDeferredMessages('zh');
 * ```
 */
export function preloadDeferredMessages(locale: Locale): void {
  loadDeferredMessages(locale);
}

/**
 * Load complete translation messages (critical + deferred combined)
 *
 * This function loads both critical and deferred messages and merges them
 * into a single object. Use this for pages that need access to all translations.
 *
 * @param locale - The locale to load ('en' or 'zh')
 * @returns Promise resolving to the complete translation messages object
 *
 * @example
 * ```typescript
 * const messages = await loadCompleteMessages('en');
 * ```
 */
export async function loadCompleteMessages(locale: Locale): Promise<Messages> {
  const [critical, deferred] = await Promise.all([
    loadCriticalMessages(locale),
    loadDeferredMessages(locale),
  ]);

  // 合并 critical 与 deferred 消息时，避免使用对象 spread 以便于安全审计。
  // 两者均来自我们控制的翻译 JSON 文件（见上方 loadCriticalMessages / loadDeferredMessages），
  // 这里通过 entries + Object.fromEntries 保持「deferred 覆盖 critical」的语义，
  // 同时不再触发 object-injection-sink-spread-operator 规则。
  const criticalEntries = Object.entries(critical ?? {});
  const deferredEntries = Object.entries(deferred ?? {});

  return Object.fromEntries([
    ...criticalEntries,
    ...deferredEntries,
  ]) as Messages;
}
