# Architecture Guide

## Next.js 16 App Router

### Cache Components Mode

Project has `cacheComponents: true` enabled (`next.config.ts`).

- Pages are cacheable by default
- Use `cacheLife()` for cache duration: `'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max'`

**Optional Cache APIs** (not yet used in this project):
- `cacheTag()` — Tag caches for selective invalidation
- `revalidateTag()` — Stale-while-revalidate pattern
- `updateTag()` — Immediate cache refresh

### Cache Components Constraints

**Runtime API restrictions in cached segments**:
- `headers()`, `cookies()`, `searchParams` **cannot** be accessed inside `"use cache"` functions
- If a cached page needs runtime data, wrap the dynamic part in `<Suspense>`

```typescript
// ❌ Error: runtime API in cached segment
async function getCachedData() {
  'use cache';
  const h = await headers(); // Will throw error
}

// ✅ Correct: separate cached and dynamic parts
async function getCachedStaticData() {
  'use cache';
  cacheLife('days');
  return loadStaticContent();
}

// Dynamic part wrapped in Suspense (in page/layout)
<Suspense fallback={<Loading />}>
  <DynamicComponent /> {/* Can use headers/cookies here */}
</Suspense>
```

**PPR / dynamicIO**: Not enabled. See `docs/known-issue/nextjs-i18n-future-upgrade-checklist.md` for upgrade path.

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
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
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
