/**
 * Blog content wrappers
 *
 * P2-2: cache-friendly wrapper implementations for blog content.
 *
 * These functions:
 * - reuse the lower-level content-query APIs (getAllPosts, getPostBySlug)
 * - expose view-oriented domain models (PostSummary, PostDetail)
 * - accept only explicit, serializable arguments (locale, slug, options)
 * - intentionally do NOT use request-scoped APIs (headers, cookies, etc.)
 * - are currently implemented without "use cache"; Cache Components integration
 *   will be handled in later phases.
 */

import type {
  BlogPost,
  ContentQueryOptions,
  GetAllPostsCachedFn,
  GetPostBySlugCachedFn,
  Locale,
  PostDetail,
  PostListOptions,
  PostSummary,
} from '@/types/content';
import { getAllPosts, getPostBySlug } from '@/lib/content-query';

/**
 * Map a BlogPost entity to a PostSummary domain model.
 */
function mapBlogPostToSummary(post: BlogPost, locale: Locale): PostSummary {
  const { metadata, excerpt, slug } = post;

  return {
    slug: metadata.slug ?? slug,
    locale,
    title: metadata.title,
    publishedAt: metadata.publishedAt,
    ...(metadata.description !== undefined
      ? { description: metadata.description }
      : {}),
    ...(metadata.updatedAt !== undefined
      ? { updatedAt: metadata.updatedAt }
      : {}),
    ...(metadata.tags !== undefined ? { tags: metadata.tags } : {}),
    ...(metadata.categories !== undefined
      ? { categories: metadata.categories }
      : {}),
    ...(metadata.featured !== undefined ? { featured: metadata.featured } : {}),
    ...(metadata.excerpt !== undefined || excerpt !== undefined
      ? { excerpt: metadata.excerpt ?? excerpt }
      : {}),
    ...(metadata.readingTime !== undefined
      ? { readingTime: metadata.readingTime }
      : {}),
    ...(metadata.coverImage !== undefined
      ? { coverImage: metadata.coverImage }
      : {}),
    ...(metadata.seo !== undefined ? { seo: metadata.seo } : {}),
  };
}

/**
 * Map a BlogPost entity to a PostDetail domain model.
 */
function mapBlogPostToDetail(post: BlogPost, locale: Locale): PostDetail {
  const summary = mapBlogPostToSummary(post, locale);

  return {
    ...summary,
    content: post.content,
    filePath: post.filePath,
    ...(post.metadata.relatedPosts !== undefined
      ? { relatedPosts: post.metadata.relatedPosts }
      : {}),
  };
}

function toContentQueryOptions(options?: PostListOptions): ContentQueryOptions {
  if (!options) {
    return {};
  }

  const normalized: ContentQueryOptions = {};

  if (options.limit !== undefined) {
    normalized.limit = options.limit;
  }

  if (options.offset !== undefined) {
    normalized.offset = options.offset;
  }

  if (options.sortBy !== undefined) {
    normalized.sortBy = options.sortBy;
  }

  if (options.sortOrder !== undefined) {
    normalized.sortOrder = options.sortOrder;
  }

  if (options.tags !== undefined) {
    normalized.tags = options.tags;
  }

  if (options.categories !== undefined) {
    normalized.categories = options.categories;
  }

  if (options.featured !== undefined) {
    normalized.featured = options.featured;
  }

  if (options.draft !== undefined) {
    normalized.draft = options.draft;
  }

  return normalized;
}

/**
 * Get all blog posts as PostSummary list for a given locale.
 *
 * This function is designed as a cache-friendly data wrapper: it only depends on
 * its explicit arguments and the underlying content-query implementation.
 */
export const getAllPostsCached: GetAllPostsCachedFn = async (
  locale,
  options,
) => {
  const normalizedOptions = toContentQueryOptions(options);

  const posts = await Promise.resolve(getAllPosts(locale, normalizedOptions));

  return posts.map((post) => mapBlogPostToSummary(post, locale));
};

/**
 * Get a single blog post by slug as a PostDetail model.
 *
 * Errors from the underlying getPostBySlug call are propagated as-is so that
 * callers can apply their own error handling (e.g. mapping to 404 routes).
 */
export const getPostBySlugCached: GetPostBySlugCachedFn = async (
  locale,
  slug,
) => {
  const post = await Promise.resolve(getPostBySlug(slug, locale));

  return mapBlogPostToDetail(post, locale);
};
