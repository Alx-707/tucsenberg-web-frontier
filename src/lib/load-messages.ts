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
import { mergeObjects } from '@/lib/locale-storage-types-utils/object-utils';
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
 * Internal helper: load messages from the source /messages directory.
 *
 * 专门给构建阶段（NEXT_PHASE === 'phase-production-build'）使用，
 * 避免经过 unstable_cache，确保每次构建都直接读取最新的 JSON 文件，
 * 从而消除缓存导致的旧数据问题。
 */
async function loadMessagesFromSource(
  locale: Locale,
  type: 'critical' | 'deferred',
): Promise<Messages> {
  try {
    const filePath = join(process.cwd(), 'messages', locale, `${type}.json`);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as Messages;
  } catch (error) {
    logger.error(`Failed to read ${type} messages for ${locale}:`, error);
    throw new Error(`Cannot load ${type} messages for ${locale}`);
  }
}

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
 * Used only in production runtime for HTTP fetch with CDN caching
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

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
    const safeLocale = sanitizeLocale(locale as string);

    // 构建阶段和开发阶段直接从文件系统读取，避免 HTTP 请求的端口问题
    // 生产环境运行时通过 HTTP fetch 以利用 CDN 缓存
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isBuildTime || isDevelopment) {
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
      } catch (error) {
        logger.error(
          `File system read of critical messages failed for ${locale}:`,
          error,
        );
        return {} as Messages;
      }
    }

    // Production runtime: Fetch from public directory via HTTP
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/messages/${safeLocale}/critical.json`;

    try {
      const revalidate = getRevalidateTime();
      const response = await fetch(url, {
        next: { revalidate },
        cache: 'force-cache',
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
    const safeLocale = sanitizeLocale(locale as string);

    // 构建阶段和开发阶段直接从文件系统读取，避免 HTTP 请求的端口问题
    // 生产环境运行时通过 HTTP fetch 以利用 CDN 缓存
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isBuildTime || isDevelopment) {
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
      } catch (error) {
        logger.error(
          `File system read of deferred messages failed for ${locale}:`,
          error,
        );
        return {} as Messages;
      }
    }

    // Production runtime: Fetch from public directory via HTTP
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/messages/${safeLocale}/deferred.json`;

    try {
      const revalidate = getRevalidateTime();
      const response = await fetch(url, {
        next: { revalidate },
        cache: 'force-cache',
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
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  const [critical, deferred] = await Promise.all([
    isBuildTime
      ? loadMessagesFromSource(locale, 'critical')
      : loadCriticalMessages(locale),
    isBuildTime
      ? loadMessagesFromSource(locale, 'deferred')
      : loadDeferredMessages(locale),
  ]);

  // 使用安全加固的深度合并，确保相同顶层键的嵌套字段不会被整体覆盖
  // 例如：critical 的 footer.vercel.* 与 deferred 的 footer.copyright 可以共存
  const merged = mergeObjects(
    (critical ?? {}) as Record<string, unknown>,
    (deferred ?? {}) as Record<string, unknown>,
  ) as Messages;

  // 在构建阶段按需输出调试信息，用于诊断 MISSING_MESSAGE 根因
  if (
    process.env.I18N_DEBUG_BUILD === '1' &&
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    const topLevelKeys = Object.keys(merged);
    const criticalTopLevelKeys = Object.keys(critical ?? {});
    const deferredTopLevelKeys = Object.keys(deferred ?? {});

    // 检查嵌套路径 products.detail.downloadPdf 是否存在
    const productsValue = (merged as Record<string, unknown>).products;
    let productsDetailHasDownloadPdf = false;
    if (typeof productsValue === 'object' && productsValue !== null) {
      const productsRecord = productsValue as Record<string, unknown>;
      const detailValue = productsRecord.detail;
      if (typeof detailValue === 'object' && detailValue !== null) {
        const detailRecord = detailValue as Record<string, unknown>;
        productsDetailHasDownloadPdf = Object.prototype.hasOwnProperty.call(
          detailRecord,
          'downloadPdf',
        );
      }
    }

    // 仅打印关键信息，避免泄露敏感内容
    // eslint-disable-next-line no-console
    console.error('[i18n-debug] loadCompleteMessages snapshot', {
      locale,
      topLevelKeys,
      criticalTopLevelKeys,
      deferredTopLevelKeys,
      hasProducts: Object.prototype.hasOwnProperty.call(merged, 'products'),
      hasFaq: Object.prototype.hasOwnProperty.call(merged, 'faq'),
      hasPrivacy: Object.prototype.hasOwnProperty.call(merged, 'privacy'),
      deferredHasFaq: Object.prototype.hasOwnProperty.call(
        deferred ?? {},
        'faq',
      ),
      deferredHasPrivacy: Object.prototype.hasOwnProperty.call(
        deferred ?? {},
        'privacy',
      ),
      productsDetailHasDownloadPdf,
    });
  }

  return merged;
}
