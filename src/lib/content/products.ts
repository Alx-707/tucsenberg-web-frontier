/**
 * Products content wrappers
 *
 * P2-3: cache-friendly wrapper implementations for products content.
 *
 * These functions:
 * - use the products query source (getProductListing, getProductDetail)
 * - expose view-oriented domain models (ProductSummary, ProductDetail)
 * - accept only explicit, serializable arguments (locale, category, slug)
 * - intentionally do NOT use request-scoped APIs (headers, cookies, etc.)
 * - are currently implemented without "use cache"; Cache Components
 *   integration will be handled in later phases.
 */

import type {
  GetProductDetailCachedFn,
  GetProductListingCachedFn,
  ProductDetail,
  ProductSummary,
} from '@/types/content';
import { getProductDetail, getProductListing } from '@/lib/content/products-source';

function mapProductDetailToSummary(product: ProductDetail): ProductSummary {
  const { slug, locale, title } = product;

  return {
    slug,
    locale,
    title,
    ...(product.description !== undefined
      ? { description: product.description }
      : {}),
    ...(product.categories !== undefined
      ? { categories: product.categories }
      : {}),
    ...(product.tags !== undefined ? { tags: product.tags } : {}),
    ...(product.seo !== undefined ? { seo: product.seo } : {}),
  };
}

export const getProductListingCached: GetProductListingCachedFn = async (
  locale,
  category,
) => {
  const products = await Promise.resolve(getProductListing(locale, category));

  return products.map((product) => mapProductDetailToSummary(product));
};

export const getProductDetailCached: GetProductDetailCachedFn = async (
  locale,
  slug,
) => {
  const product = await Promise.resolve(getProductDetail(locale, slug));

  return product;
};
