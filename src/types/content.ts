/**
 * Content Management System Types
 *
 * This file defines TypeScript interfaces for the MDX content management system,
 * ensuring type safety across the application.
 */

// Base content metadata interface
export interface ContentMetadata {
  title: string;
  description?: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  featured?: boolean;
  draft?: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

// Blog post specific metadata
export interface BlogPostMetadata extends ContentMetadata {
  excerpt?: string;
  readingTime?: number;
  coverImage?: string;
  relatedPosts?: string[];
}

// Page specific metadata
export interface PageMetadata extends ContentMetadata {
  layout?: 'default' | 'landing' | 'docs' | 'legal';
  showToc?: boolean;
  lastReviewed?: string;
}

// Content with parsed frontmatter and content
export interface ParsedContent<T extends ContentMetadata = ContentMetadata> {
  metadata: T;
  content: string;
  excerpt?: string;
  slug: string;
  filePath: string;
}

// Blog post content
export interface BlogPost extends ParsedContent<BlogPostMetadata> {
  metadata: BlogPostMetadata;
}

// Page content
export interface Page extends ParsedContent<PageMetadata> {
  metadata: PageMetadata;
}

// Content collection types
export type ContentType = 'posts' | 'pages';
export type _ContentType = ContentType;
export type Locale = 'en' | 'zh';

// Content query options
export interface ContentQueryOptions {
  locale?: Locale;
  limit?: number;
  offset?: number;
  sortBy?: 'publishedAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
  categories?: string[];
  featured?: boolean;
  draft?: boolean;
}

// Domain models for cache-friendly blog and products wrappers (Phase 2 - P2-1)

/**
 * Summary view of a blog post for listing pages.
 *
 * Derived primarily from BlogPostMetadata, flattened for consumption in
 * Server Components and future cache-friendly wrappers.
 */
export interface PostSummary {
  slug: string;
  locale: Locale;
  title: string;
  description?: string;
  publishedAt: string;
  updatedAt?: string;
  tags?: string[];
  categories?: string[];
  featured?: boolean;
  excerpt?: string;
  readingTime?: number;
  coverImage?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

/**
 * Detail view of a blog post for individual post pages.
 */
export interface PostDetail extends PostSummary {
  content: string;
  filePath: string;
  relatedPosts?: string[];
}

/**
 * Summary view of a product for listing and overview sections.
 *
 * Products currently re-use the generic ContentMetadata shape; this domain
 * model keeps the fields we expect to surface in the UI.
 */
export interface ProductSummary {
  slug: string;
  locale: Locale;
  title: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

/**
 * Detail view of a product for dedicated product pages.
 */
export interface ProductDetail extends ProductSummary {
  content: string;
  filePath: string;
}

/**
 * Options for cache-friendly blog post listing wrappers.
 *
 * These map directly to a subset of ContentQueryOptions and are intentionally
 * limited to explicit, serializable fields so that future Cache Components
 * wrappers can remain request-agnostic.
 */
export interface PostListOptions {
  limit?: number;
  offset?: number;
  sortBy?: ContentQueryOptions['sortBy'];
  sortOrder?: ContentQueryOptions['sortOrder'];
  tags?: string[];
  categories?: string[];
  featured?: boolean;
  draft?: boolean;
}

/**
 * High-level cache-friendly wrapper signatures designed in P2-1.
 *
 * Implementations will live in src/lib/content/blog.ts and
 * src/lib/content/products.ts in later tasks (P2-2 / P2-3).
 *
 * These functions are intentionally designed to:
 * - accept only explicit, serializable parameters
 * - avoid any request-scoped APIs (cookies, headers, etc.)
 * - be compatible with future "use cache" + cacheLife()/cacheTag() usage
 */
export type GetAllPostsCachedFn = (
  locale: Locale,
  options?: PostListOptions,
) => Promise<PostSummary[]>;

export type GetPostBySlugCachedFn = (
  locale: Locale,
  slug: string,
) => Promise<PostDetail>;

export type GetProductListingCachedFn = (
  locale: Locale,
  category: string,
) => Promise<ProductSummary[]>;

export type GetProductDetailCachedFn = (
  locale: Locale,
  slug: string,
) => Promise<ProductDetail>;

// Content validation result
export interface ContentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Content search result
export interface ContentSearchResult<
  T extends ContentMetadata = ContentMetadata,
> {
  content: ParsedContent<T>;
  score: number;
  highlights: string[];
}

// Global content configuration
export interface ContentConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
  postsPerPage: number;
  enableDrafts: boolean;
  enableSearch: boolean;
  autoGenerateExcerpt: boolean;
  excerptLength: number;
  dateFormat: string;
  timeZone: string;
  enableComments: boolean;
}

// Content statistics
export interface ContentStats {
  totalPosts: number;
  totalPages: number;
  postsByLocale: Record<Locale, number>;
  pagesByLocale: Record<Locale, number>;
  totalTags: number;
  totalCategories: number;
  lastUpdated: string;
}

// Content cache entry
export interface ContentCacheEntry<
  T extends ContentMetadata = ContentMetadata,
> {
  content: ParsedContent<T>;
  cachedAt: string;
  expiresAt: string;
}

// Content index for search
export interface ContentIndex {
  id: string;
  title: string;
  content: string;
  tags: string[];
  categories: string[];
  locale: Locale;
  type: ContentType;
  publishedAt: string;
}

// Error types for content operations
export class ContentError extends Error {
  constructor(
    message: string,
    public _code: string,
    public _filePath?: string,
  ) {
    super(message);
    this.name = 'ContentError';
  }
}

export class ContentValidationError extends ContentError {
  constructor(
    message: string,
    public _validationErrors: string[],
    filePath?: string,
  ) {
    super(message, 'VALIDATION_ERROR', filePath);
    this.name = 'ContentValidationError';
  }
}

export class ContentNotFoundError extends ContentError {
  constructor(slug: string, locale?: Locale) {
    super(
      `Content not found: ${slug}${locale ? ` (locale: ${locale})` : ''}`,
      'NOT_FOUND',
    );
    this.name = 'ContentNotFoundError';
  }
}
