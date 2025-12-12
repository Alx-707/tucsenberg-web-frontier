/**
 * Cache Utilities Index
 *
 * Exports cache tag generation and invalidation utilities.
 */

export {
  CACHE_DOMAINS,
  CACHE_ENTITIES,
  cacheTags,
  i18nTags,
  contentTags,
  productTags,
  seoTags,
  type CacheDomain,
} from './cache-tags';

export {
  invalidate,
  invalidateI18n,
  invalidateContent,
  invalidateProduct,
  invalidateLocale,
  invalidateDomain,
  invalidateCachePath,
} from './invalidate';
