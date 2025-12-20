# Change: MDX RSC Rendering - Eliminate innerHTML XSS Surface

## Why
Blog/products pages currently render MDX/Markdown content via `dangerouslySetInnerHTML` without compilation, creating a high-severity XSS attack surface. This violates security rules and poses risk if external content is ever introduced.

## What Changes
- **BREAKING**: Remove all `dangerouslySetInnerHTML` content injection points
- Implement proper MDX RSC rendering pipeline using `@next/mdx`
- Generate `content-manifest.json` for static content discovery
- Enable `mdx-components.tsx` as the single component injection entry

## Impact
- Affected specs: `blog`, `content-management` (new)
- Affected code:
  - `src/app/[locale]/blog/[slug]/page.tsx`
  - `src/app/[locale]/products/[slug]/page.tsx`
  - `src/app/[locale]/pages/[slug]/page.tsx` (if exists)
  - `mdx-components.tsx`
  - New: `scripts/generate-content-manifest.ts`
  - New: `reports/content-manifest.json`

## Success Criteria
- Zero `dangerouslySetInnerHTML` for content rendering
- MDX files compile to React components at build time
- All existing content pages render correctly
- `pnpm build` passes without content errors

## Dependencies
- None (P0 independent task)

## Rollback Strategy
- Feature flag `CONTENT_RENDERER=legacy|mdx` for gradual rollout
- Per-domain migration: blog → products → pages
