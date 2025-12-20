# Change: i18n Dynamic Routes and Monitoring

## Why
Dynamic pages (blog/[slug], products/[slug]) lack complete `routing.pathnames` coverage for type-safe language switching. Cache monitoring metrics don't align with actual `unstable_cache` semantics.

## What Changes
- Add dynamic route patterns to `routing.pathnames`
- Type-safe language switcher for dynamic pages
- Align cache metrics with Data Cache tags/revalidate semantics
- Document lang SSR strategy and SEO implications

## Impact
- Affected specs: `i18n`
- Affected code:
  - `src/i18n/routing.ts`
  - `src/components/language-toggle.tsx`
  - `src/lib/i18n-cache-manager.ts`

## Success Criteria
- Dynamic pages preserve slug on language switch
- No 404s during language switching
- Cache metrics reflect actual cache behavior

## Dependencies
- **Benefits from**: p0-i18n-type-safety (type foundation)

## Rollback Strategy
- Revert routing changes
- Simple file-level rollback
