/**
 * Products content query source (placeholder).
 *
 * P2-3: This module defines the low-level query functions for products that
 * will be implemented in future phases when the real products content system
 * is introduced (e.g. MDX, headless CMS).
 *
 * The cache-friendly wrappers in src/lib/content/products.ts depend on these
 * functions, and tests replace them via vi.mock to validate wrapper behavior
 * without requiring a concrete backend implementation.
 */

import type { Locale, ProductDetail } from '@/types/content';

export function getProductListing(
  _locale: Locale,
  _category: string,
): ProductDetail[] {
  throw new Error('Products content queries are not implemented yet.');
}

export function getProductDetail(
  _locale: Locale,
  _slug: string,
): ProductDetail {
  throw new Error('Products content queries are not implemented yet.');
}
