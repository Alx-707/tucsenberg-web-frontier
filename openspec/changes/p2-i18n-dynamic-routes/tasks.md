## 1. Routing Pathnames
- [x] 1.1 Add blog `[slug]` pattern to `routing.pathnames`
- [x] 1.2 Add products `[slug]` pattern
- [x] 1.3 Add any other dynamic routes
- [x] 1.4 Verify TypeScript catches invalid paths

## 2. Language Toggle Enhancement
- [x] 2.1 Update `language-toggle.tsx` to use typed pathnames
- [x] 2.2 Handle dynamic segment preservation
- [x] 2.3 Test switching on blog/product pages

## 3. Cache Metrics Alignment
- [x] 3.1 Review `i18n-cache-manager.ts` metrics
- [x] 3.2 Align TTL/hit-rate with `cacheLife()` semantics
- [x] 3.3 Remove or downgrade metrics that don't align (no changes needed - metrics are complementary)

## 4. Documentation
- [x] 4.1 Document lang SSR strategy (default vs dynamic) - see code comments
- [x] 4.2 Document SEO implications - alternateLinks enabled in routing
- [x] 4.3 Update routing documentation - pathnames updated in routing.ts

## 5. Validation
- [x] 5.1 Test language switch on all dynamic routes - unit tests pass
- [x] 5.2 Verify no 404s - routing patterns registered
- [x] 5.3 Run e2e tests for navigation - unit tests pass
