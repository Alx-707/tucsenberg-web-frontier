# Blog / Products 内容 wrapper 与 Cache Components 使用指南

> 本文档说明 blog / products 内容 wrapper 的位置、签名、使用方式，以及未来如何在这些 wrapper 内安全启用 Next.js 16 的 Cache Components（`"use cache"`、`cacheLife()`、`cacheTag()`）。

## 1. 设计目标

- 在 MDX 内容系统之上，提供 **面向视图的域模型**：`PostSummary`、`PostDetail`、`ProductSummary`、`ProductDetail`。
- 为 `/[locale]/blog` 与 `/[locale]/products` 提供 **统一的数据入口**：
  - `getAllPostsCached(locale, options)`
  - `getPostBySlugCached(locale, slug)`
  - `getProductListingCached(locale, category)`
  - `getProductDetailCached(locale, slug)`
- 保证这些入口：
  - 只依赖显式、可序列化参数（`locale` / `slug` / `category` / `options`）。
  - 不访问 `cookies()`、`headers()`、`draftMode()` 等 request-scoped API。
  - 便于在未来作为 Cache Components 的实现载体添加 `"use cache"` + `cacheLife()` / `cacheTag()`。

## 2. 模块与类型位置

- 类型定义：`src/types/content.ts`
  - `PostSummary` / `PostDetail`
  - `ProductSummary` / `ProductDetail`
  - `PostListOptions`
  - `GetAllPostsCachedFn` / `GetPostBySlugCachedFn`
  - `GetProductListingCachedFn` / `GetProductDetailCachedFn`
- Blog wrapper：`src/lib/content/blog.ts`
  - `getAllPostsCached(locale, options?)`
  - `getPostBySlugCached(locale, slug)`
- Products wrapper：`src/lib/content/products.ts`
  - `getProductListingCached(locale, category)`
  - `getProductDetailCached(locale, slug)`
- Products 底层查询占位：`src/lib/content/products-source.ts`
  - `getProductListing(locale, category): ProductDetail[]`
  - `getProductDetail(locale, slug): ProductDetail`

> 注意：`products-source` 当前仅为占位实现，真实产品内容系统（MDX / CMS 等）接入时，只需要替换这里的实现即可，wrapper 与上层页面无需改动。

## 3. Blog wrapper 使用示例

### 3.1 列表场景（例如 HomeBlogSection 或 `/[locale]/blog`）

```ts
import type { Locale } from '@/types/content';
import { getAllPostsCached } from '@/lib/content/blog';

interface BlogListProps {
  locale: Locale;
}

export async function BlogListSection({ locale }: BlogListProps) {
  const posts = await getAllPostsCached(locale, {
    limit: 3,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
    featured: true,
  });

  // 在这里渲染 PostSummary[]
}
```

### 3.2 详情场景（例如 `/[locale]/blog/[slug]`）

```ts
import type { Locale } from '@/types/content';
import { getPostBySlugCached } from '@/lib/content/blog';

export async function BlogPostPage({ locale, slug }: { locale: Locale; slug: string }) {
  const post = await getPostBySlugCached(locale, slug);

  // 使用 PostDetail 渲染正文、侧边栏、relatedPosts 等
}
```

## 4. Products wrapper 使用示例

### 4.1 列表场景（例如 `/[locale]/products/[category]`）

```ts
import type { Locale } from '@/types/content';
import { getProductListingCached } from '@/lib/content/products';

export async function ProductsGrid({
  locale,
  category,
}: {
  locale: Locale;
  category: string;
}) {
  const products = await getProductListingCached(locale, category);

  // 使用 ProductSummary[] 渲染产品卡片网格
}
```

### 4.2 详情场景（例如 `/[locale]/products/[slug]`）

```ts
import type { Locale } from '@/types/content';
import { getProductDetailCached } from '@/lib/content/products';

export async function ProductDetailPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const product = await getProductDetailCached(locale, slug);

  // 使用 ProductDetail 渲染产品详情与相关结构化数据
}
```

## 5. 与 Cache Components 的关系

根据 Next.js 16 官方文档，Cache Components 通过在 Server Component 或 server-side 函数中使用 `"use cache"` 指令以及 `cacheLife()`、`cacheTag()` 等 API 定义缓存边界与失效策略。结合本项目的约束，推荐做法是：

- **在 wrapper 内部启用 Cache Components，而不是在 page.tsx 中直接混用缓存与 request-scoped API。**
- 确保 wrapper：
  - 只依赖 `locale` / `slug` / `category` / `options` 等显式参数；
  - 不读取 cookies、headers、searchParams 等；
  - 仅调用纯函数式的内容查询工具（如 `getAllPosts`、`getPostBySlug`、`getProductListing`、`getProductDetail`）。

未来在这些 wrapper 内部引入 Cache Components 的典型模式如下（示意）：

```ts
import { cacheLife, cacheTag } from 'next/cache';

export const getAllPostsCached: GetAllPostsCachedFn = async (locale, options) => {
  'use cache';
  cacheLife('days');
  cacheTag(['blog', locale]);

  // 下面保持与当前实现一致
};
```

> 注意：一旦在 wrapper 内使用 `"use cache"`，就不应再在同一调用链中使用 request-scoped API；如需结合用户态信息，请在更上层拆分为“缓存的公共数据 + 非缓存的按用户定制数据”。

## 6. 使用建议与常见误用

- **优先在 Server Component 中调用 wrapper：**
  - 例如 `/[locale]/blog/page.tsx`、`/[locale]/products/[category]/page.tsx`。
  - 避免在 Client Component 中直接引入内容 wrapper，以免打破 bundle 边界或误用 Node-only API。
- **不要在 page.tsx 中直接加 `"use cache"`：**
  - 页面通常需要访问路由参数、searchParams、cookies 等 request-scoped 数据；
  - 缓存应集中在 wrapper / 数据函数中，页面只负责组合与渲染。
- **明确区分列表与详情：**
  - 列表页只依赖 `PostSummary[]` / `ProductSummary[]`；
  - 详情页才使用 `PostDetail` / `ProductDetail`；
  - 避免在列表场景加载不必要的正文内容，提高性能与缓存命中率。

## 7. 快速检查清单

在使用 blog/products wrapper 时，可以用下面的 checklist 自检：

1. 是否只在 Server Component 或 server-side 函数中调用？
2. 是否仅传入 `locale` / `slug` / `category` / `options` 等显式参数？
3. 是否避免在同一函数内使用 `cookies()` / `headers()` / `draftMode()`？
4. 对列表场景是否只使用 `*Summary` 类型，对详情场景是否使用 `*Detail` 类型？
5. 如果未来在 wrapper 内加上 `"use cache"` + `cacheLife()` / `cacheTag()`，当前调用方式是否仍然成立？

满足以上条件，即可在保持类型安全与架构一致性的前提下，为后续 Cache Components 的接入打好基础。

