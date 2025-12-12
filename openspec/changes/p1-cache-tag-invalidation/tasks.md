## 1. Tag Naming Convention
- [x] 1.1 Define tag schema: `domain:entity:identifier[:locale]`
- [x] 1.2 Document valid domains: `i18n`, `content`, `product`, `seo`
- [x] 1.3 Create constants file for tag generation

## 2. i18n Cache Tags
- [x] 2.1 Add `cacheTag('i18n:critical:{locale}')` to critical message loading
- [x] 2.2 Add `cacheTag('i18n:deferred:{locale}')` to deferred loading
- [x] 2.3 Update `pnpm i18n:full` to trigger `revalidateTag`

## 3. Content Cache Tags
- [x] 3.1 Add tags to blog content functions: `content:blog:{slug}:{locale}`
- [x] 3.2 Add tags to product content functions
- [x] 3.3 Add tags to page content functions

## 4. Invalidation Triggers
- [x] 4.1 Create `src/lib/cache/invalidate.ts` utility
- [x] 4.2 Integrate with content sync scripts
- [x] 4.3 Document webhook integration pattern (for future CMS)

## 5. Validation
- [x] 5.1 Verify content update reflects after invalidation
- [x] 5.2 Verify tag-specific invalidation works
- [x] 5.3 Run `pnpm build` - caching still functions
