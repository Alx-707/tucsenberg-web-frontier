# Architecture Guide

## Next.js 16 App Router

### Cache Components Mode

Project has `cacheComponents: true` enabled (`next.config.ts`).

- Pages are cacheable by default
- Use `cacheLife()` for cache duration: `'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max'`
- Use `cacheTag()` to tag caches for selective invalidation

### Async Request APIs (Breaking Change)

Next.js 16 removed sync compatibility layer. These APIs **must be awaited**:

| API | Usage |
|-----|-------|
| `params` | `const { slug } = await params` |
| `searchParams` | `const { query } = await searchParams` |
| `cookies()` | `await cookies()` |
| `headers()` | `await headers()` |
| `draftMode()` | `await draftMode()` |

**Client Components** use React 19 `use()` hook to unwrap Promises.

### Page Props Pattern

```typescript
interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}
```

## Routing

- Locale-based: `/[locale]/page-name`
- Supported: `en`, `zh` (defined in `src/i18n/routing.ts`)
- Middleware handles locale detection and redirects

## Layout Hierarchy

```
src/app/
├── layout.tsx              # Root (minimal)
└── [locale]/
    ├── layout.tsx          # Locale (fonts, metadata, providers)
    ├── page.tsx            # Home
    ├── about/page.tsx
    ├── blog/page.tsx
    ├── contact/page.tsx
    └── products/
        ├── page.tsx        # Listing
        └── [slug]/page.tsx # Detail
```

## Server vs Client Components

| Server (default) | Client (`"use client"`) |
|------------------|-------------------------|
| Data fetching, SEO | Interactivity, hooks, browser APIs |
| async/await | useState, useEffect |
| Direct API/DB access | onClick, onChange |

**Rule**: Push Client boundaries as low as possible in component tree.

### Data Serialization

Server → Client props must be serializable:
- ✅ string, number, boolean, plain objects, arrays
- ❌ functions, class instances, Date objects

## Data Fetching

- Use `async/await` directly in Server Components
- Cached functions in `src/lib/content/`
- Example: `getAllProductsCached()`, `getProductBySlugCached(slug)`

## Key Files

| File | Purpose |
|------|---------|
| `src/i18n/request.ts` | Translation loading |
| `src/i18n/routing.ts` | Locale config |
