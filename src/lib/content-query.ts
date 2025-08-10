/**
 * Content Management System - Query Functions
 *
 * This module provides functions for querying, filtering, sorting,
 * and paginating content.
 */
import path from 'path';
import {
  BlogPost,
  BlogPostMetadata,
  ContentError,
  ContentMetadata,
  ContentNotFoundError,
  ContentQueryOptions,
  ContentStats,
  ContentType,
  Locale,
  Page,
  PageMetadata,
  ParsedContent,
} from '@/types/content';
import { getContentFiles, parseContentFile } from './content-parser';
import { getContentConfig, PAGES_DIR, POSTS_DIR } from './content-utils';

/**
 * Check if draft posts are allowed based on configuration and options
 */
function isDraftAllowed(
  post: ParsedContent<BlogPostMetadata>,
  options: ContentQueryOptions,
): boolean {
  // Filter drafts in production
  if (!getContentConfig().enableDrafts && post.metadata.draft) {
    return false;
  }

  // Apply draft filter from options
  if (options.draft !== undefined && post.metadata.draft !== options.draft) {
    return false;
  }

  return true;
}

/**
 * Check if post matches featured filter
 */
function matchesFeaturedFilter(
  post: ParsedContent<BlogPostMetadata>,
  options: ContentQueryOptions,
): boolean {
  if (
    options.featured !== undefined &&
    post.metadata.featured !== options.featured
  ) {
    return false;
  }
  return true;
}

/**
 * Check if post matches tag filters
 */
function matchesTags(
  post: ParsedContent<BlogPostMetadata>,
  tags?: string[],
): boolean {
  if (tags && !tags.some((tag) => post.metadata.tags?.includes(tag))) {
    return false;
  }
  return true;
}

/**
 * Check if post matches category filters
 */
function matchesCategories(
  post: ParsedContent<BlogPostMetadata>,
  categories?: string[],
): boolean {
  if (
    categories &&
    !categories.some((cat) => post.metadata.categories?.includes(cat))
  ) {
    return false;
  }
  return true;
}

/**
 * Filter posts based on content configuration and query options
 */
function filterPosts(
  posts: ParsedContent<BlogPostMetadata>[],
  options: ContentQueryOptions,
): BlogPost[] {
  return posts.filter((post) => {
    return (
      isDraftAllowed(post, options) &&
      matchesFeaturedFilter(post, options) &&
      matchesTags(post, options.tags) &&
      matchesCategories(post, options.categories)
    );
  }) as BlogPost[];
}

/**
 * Get field value from post metadata with type safety
 */
function getFieldValue(post: BlogPost, field: string): string {
  switch (field) {
    case 'publishedAt':
      return post.metadata.publishedAt || '';
    case 'updatedAt':
      return post.metadata.updatedAt || '';
    case 'title':
      return post.metadata.title || '';
    default:
      throw new ContentError(
        `Unexpected sort field: ${field}`,
        'INVALID_SORT_FIELD',
      );
  }
}

/**
 * Compare two values with specified sort order
 */
function compareValues(
  aValue: string,
  bValue: string,
  sortOrder: 'asc' | 'desc',
): number {
  if (sortOrder === 'desc') {
    return bValue.localeCompare(aValue);
  }
  return aValue.localeCompare(bValue);
}

/**
 * Create a sort comparator function for posts
 */
function createSortComparator(sortBy: string, sortOrder: 'asc' | 'desc') {
  return (a: BlogPost, b: BlogPost): number => {
    const aValue = getFieldValue(a, sortBy);
    const bValue = getFieldValue(b, sortBy);
    return compareValues(aValue, bValue, sortOrder);
  };
}

/**
 * Validate sort field to prevent object injection
 */
function validateSortField(sortBy: string): void {
  const allowedSortFields = ['publishedAt', 'updatedAt', 'title'] as const;

  if (
    !allowedSortFields.includes(sortBy as (typeof allowedSortFields)[number])
  ) {
    throw new ContentError(
      `Invalid sort field: ${sortBy}. Allowed fields: ${allowedSortFields.join(', ')}`,
      'INVALID_SORT_FIELD',
    );
  }
}

/**
 * Sort posts with type-safe property access
 */
function sortPosts(
  posts: BlogPost[],
  options: ContentQueryOptions,
): BlogPost[] {
  const sortBy = options.sortBy || 'publishedAt';
  const sortOrder = options.sortOrder || 'desc';

  // Validate sort field to prevent object injection
  validateSortField(sortBy);

  // Create and apply sort comparator
  const comparator = createSortComparator(sortBy, sortOrder);
  posts.sort(comparator);

  return posts;
}

/**
 * Apply pagination to posts
 */
function paginatePosts(
  posts: BlogPost[],
  options: ContentQueryOptions,
): BlogPost[] {
  if (options.offset || options.limit) {
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : undefined;
    return posts.slice(start, end);
  }
  return posts;
}

/**
 * Get all blog posts
 */
export function getAllPosts(
  locale?: Locale,
  options: ContentQueryOptions = {},
): BlogPost[] {
  const files = getContentFiles(POSTS_DIR, locale);
  const parsedPosts = files.map((file) =>
    parseContentFile<BlogPostMetadata>(file, 'posts'),
  );

  const filteredPosts = filterPosts(parsedPosts, options);
  const sortedPosts = sortPosts(filteredPosts, options);
  const paginatedPosts = paginatePosts(sortedPosts, options);

  return paginatedPosts;
}

/**
 * Get all pages
 */
export function getAllPages(locale?: Locale): Page[] {
  const files = getContentFiles(PAGES_DIR, locale);
  return files
    .map((file) => parseContentFile<PageMetadata>(file, 'pages'))
    .filter((page) => {
      // Filter drafts in production
      const config = getContentConfig();
      return config.enableDrafts || !page.metadata.draft;
    }) as Page[];
}

/**
 * Get content by slug
 */
export function getContentBySlug<T extends ContentMetadata = ContentMetadata>(
  slug: string,
  type: ContentType,
  locale?: Locale,
): ParsedContent<T> {
  const contentDir = type === 'posts' ? POSTS_DIR : PAGES_DIR;
  const files = getContentFiles(contentDir, locale);

  const matchingFile = files.find((file) => {
    const fileSlug = path.basename(file, path.extname(file));
    return fileSlug === slug || fileSlug.startsWith(`${slug}.`);
  });

  if (!matchingFile) {
    throw new ContentNotFoundError(slug, locale);
  }

  return parseContentFile<T>(matchingFile, type);
}

/**
 * Get blog post by slug
 */
export function getPostBySlug(slug: string, locale?: Locale): BlogPost {
  return getContentBySlug<BlogPostMetadata>(slug, 'posts', locale) as BlogPost;
}

/**
 * Get page by slug
 */
export function getPageBySlug(slug: string, locale?: Locale): Page {
  return getContentBySlug<PageMetadata>(slug, 'pages', locale) as Page;
}

/**
 * Get content statistics
 */
export function getContentStats(): ContentStats {
  const config = getContentConfig();
  const stats: ContentStats = {
    totalPosts: 0,
    totalPages: 0,
    postsByLocale: {} as Record<Locale, number>,
    pagesByLocale: {} as Record<Locale, number>,
    totalTags: 0,
    totalCategories: 0,
    lastUpdated: new Date().toISOString(),
  };

  // Count posts by locale
  for (const locale of config.supportedLocales) {
    const posts = getAllPosts(locale);
    const pages = getAllPages(locale);

    // Use type-safe property access with explicit validation
    if (locale === 'en' || locale === 'zh') {
      // Safe property assignment for known locales
      if (locale === 'en') {
        stats.postsByLocale.en = posts.length;
        stats.pagesByLocale.en = pages.length;
      } else {
        stats.postsByLocale.zh = posts.length;
        stats.pagesByLocale.zh = pages.length;
      }
    }
    stats.totalPosts += posts.length;
    stats.totalPages += pages.length;
  }

  return stats;
}
