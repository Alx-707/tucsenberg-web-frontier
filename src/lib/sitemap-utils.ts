/**
 * Sitemap utility functions
 *
 * Provides helpers for sitemap generation, including lastmod calculation
 * from content timestamps or file system metadata.
 */

import fs from 'fs';

/**
 * Metadata interface for content with optional timestamps.
 */
export interface ContentTimestamps {
  publishedAt?: string | undefined;
  updatedAt?: string | undefined;
}

/**
 * Get the last modified date for content.
 *
 * Priority order:
 * 1. updatedAt from metadata (if valid date)
 * 2. publishedAt from metadata (if valid date)
 * 3. File system mtime (if filePath provided)
 * 4. Current date (fallback)
 *
 * @param metadata - Content metadata with optional timestamps
 * @param filePath - Optional file path for fs.stat fallback
 * @returns Date object representing the last modification time
 */
export function getContentLastModified(
  metadata: ContentTimestamps,
  filePath?: string,
): Date {
  // Priority 1: updatedAt
  if (metadata.updatedAt !== undefined) {
    const date = new Date(metadata.updatedAt);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Priority 2: publishedAt
  if (metadata.publishedAt !== undefined) {
    const date = new Date(metadata.publishedAt);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Priority 3: File system mtime
  if (filePath !== undefined) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const stats = fs.statSync(filePath);
      return stats.mtime;
    } catch {
      // File not found or access error, fall through to default
    }
  }

  // Priority 4: Fallback to current date
  return new Date();
}

/**
 * Get the last modified date for a product.
 *
 * Convenience wrapper that accepts ProductSummary-compatible objects.
 */
export function getProductLastModified(product: {
  publishedAt: string;
  updatedAt?: string | undefined;
}): Date {
  return getContentLastModified({
    publishedAt: product.publishedAt,
    updatedAt: product.updatedAt,
  });
}

/**
 * Static page configuration for lastmod.
 *
 * Maps static page paths to their last modification dates.
 * This can be used for pages that don't have MDX content.
 */
export type StaticPageLastModConfig = Map<string, Date>;

/**
 * Get last modified date for a static page.
 *
 * @param path - The page path (e.g., '/about', '/contact')
 * @param config - Optional static page lastmod configuration
 * @returns Date object, or current date if not configured
 */
export function getStaticPageLastModified(
  path: string,
  config?: StaticPageLastModConfig,
): Date {
  if (config !== undefined) {
    const date = config.get(path);
    if (date !== undefined) {
      return date;
    }
  }
  return new Date();
}
