# MDX Content System

## Directory Structure

```
content/
├── config/content.json    # Global content settings
├── posts/{locale}/*.mdx   # Blog posts
├── pages/{locale}/*.mdx   # Static pages
└── products/{locale}/*.mdx # Product details (B2B)
```

**Rule**: Every content file must exist in both `en/` and `zh/` with identical `slug`.

## Frontmatter Schemas

### Posts (Blog)

```yaml
---
locale: 'en'                    # Required: 'en' | 'zh'
title: 'Post Title'             # Required
slug: 'post-slug'               # Required: URL path
description: 'Summary text'     # Required
publishedAt: '2024-01-15'       # Required: YYYY-MM-DD
updatedAt: '2024-01-15'         # Optional
author: 'Author Name'           # Required
tags: ['Tag1', 'Tag2']          # Optional
categories: ['Category']        # Optional
featured: true                  # Optional: homepage display
draft: false                    # Optional: hide from production
excerpt: 'Preview text...'      # Optional: custom excerpt
readingTime: 5                  # Optional: minutes
coverImage: '/images/...'       # Optional
seo:                            # Optional: override defaults
  title: 'SEO Title'
  description: 'SEO description'
  keywords: ['keyword1']
  ogImage: '/images/og.jpg'
---
```

### Pages (Static)

```yaml
---
locale: 'en'
title: 'Page Title'
slug: 'page-slug'
description: 'Page description'
publishedAt: '2024-01-10'
updatedAt: '2024-01-15'
author: 'Author Name'
layout: 'default'               # Optional: page layout variant
showToc: true                   # Optional: table of contents
lastReviewed: '2024-01-15'      # Optional
draft: false
seo:
  title: 'SEO Title'
  description: 'SEO description'
  keywords: ['keyword1']
  ogImage: '/images/og.jpg'
---
```

### Products (B2B-specific)

```yaml
---
title: 'Product Name'
slug: 'product-slug'
description: 'Product summary'
coverImage: '/images/products/cover.jpg'
images:                         # Product gallery
  - '/images/products/1.jpg'
  - '/images/products/2.jpg'
category: 'Category Name'
tags: ['Tag1', 'Tag2']
featured: true                  # Homepage display

# B2B Trade Fields (Required for products)
moq: '5 units'                  # Minimum Order Quantity
leadTime: '15-20 days'          # Production/shipping time
supplyCapacity: '500 units/month'
certifications:                 # Quality certifications
  - 'CE'
  - 'ISO 9001'
packaging: 'Packaging description'
portOfLoading: 'Shanghai, China'

# Technical Specifications
specs:
  'Spec Name': 'Spec Value'
  'Voltage': 'AC 380V'
  'Weight': '45 kg'

# Relations
relatedProducts:                # Other product slugs
  - 'related-product-slug'

seo:
  title: 'Product SEO Title'
  description: 'Product SEO description'
  keywords: ['keyword1']
---
```

## Creating Content

### New Blog Post

1. Create file: `content/posts/en/my-post.mdx`
2. Create translation: `content/posts/zh/my-post.mdx`
3. Use identical `slug` in both files
4. Body supports full MDX (React components in markdown)

### New Product

1. Create file: `content/products/en/my-product.mdx`
2. Create translation: `content/products/zh/my-product.mdx`
3. **Must include** all B2B fields: `moq`, `leadTime`, `supplyCapacity`
4. Add to related products in other files if needed

## Querying Content

```typescript
import { getAllPosts, getPostBySlug } from '@/lib/content';

// Get all posts for locale
const posts = await getAllPosts('en');

// Get single post
const post = await getPostBySlug('en', 'my-post');
```

## Image Paths

- Store in `public/images/` directory
- Reference with absolute paths: `/images/blog/cover.jpg`
- Use descriptive names: `product-name-angle.jpg`
