/**
 * MDX Component Types
 *
 * TypeScript definitions for custom MDX components used in content rendering.
 */

import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/** Base props for heading components */
export interface HeadingProps {
  children: ReactNode;
  id?: string;
  className?: string;
}

/** Props for anchor/link components */
export interface AnchorProps extends ComponentPropsWithoutRef<'a'> {
  children: ReactNode;
  href?: string;
}

/** Props for paragraph components */
export interface ParagraphProps {
  children: ReactNode;
  className?: string;
}

/** Props for list components */
export interface ListProps {
  children: ReactNode;
  className?: string;
}

/** Props for list item components */
export interface ListItemProps {
  children: ReactNode;
  className?: string;
}

/** Props for code components (inline code) */
export interface CodeProps {
  children: ReactNode;
  className?: string;
}

/** Props for pre/code block components */
export interface PreProps {
  children: ReactNode;
  className?: string;
}

/** Props for blockquote components */
export interface BlockquoteProps {
  children: ReactNode;
  className?: string;
}

/** Props for table components */
export interface TableProps {
  children: ReactNode;
  className?: string;
}

/** Props for table header cell components */
export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

/** Props for table data cell components */
export interface TableDataProps {
  children: ReactNode;
  className?: string;
}

/** Custom Callout component props */
export interface CalloutProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: ReactNode;
}

/** MDX content wrapper props */
export interface MDXContentWrapperProps {
  children: ReactNode;
  className?: string;
}

/** MDX frontmatter for blog posts */
export interface BlogFrontmatter {
  title: string;
  description?: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
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

/** MDX frontmatter for products */
export interface ProductFrontmatter {
  title: string;
  slug: string;
  description?: string;
  coverImage: string;
  images?: string[];
  category: string;
  tags?: string[];
  featured?: boolean;
  moq?: string;
  leadTime?: string;
  supplyCapacity?: string;
  certifications?: string[];
  packaging?: string;
  portOfLoading?: string;
  specs?: Record<string, string>;
  relatedProducts?: string[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

/** Generic MDX module interface */
export interface MDXModule<TFrontmatter = Record<string, unknown>> {
  default: React.ComponentType;
  frontmatter?: TFrontmatter;
}
