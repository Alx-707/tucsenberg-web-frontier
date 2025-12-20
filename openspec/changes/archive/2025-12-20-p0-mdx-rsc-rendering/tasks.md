## 1. Content Manifest Generation
- [x] 1.1 Create `scripts/generate-content-manifest.ts` to scan `content/{posts,pages,products}/{en,zh}/`
- [x] 1.2 Generate `reports/content-manifest.json` mapping `{type}/{locale}/{slug}` → file path
- [x] 1.3 Add `pnpm content:manifest` script to package.json
- [x] 1.4 Integrate manifest generation into build pipeline

## 2. MDX Component Setup
- [x] 2.1 Update `mdx-components.tsx` with prose/custom component mappings
- [x] 2.2 Ensure typography plugin classes are available (coordinate with p1-tailwind-plugins)
- [x] 2.3 Add TypeScript types for MDX component props

## 3. Blog Page Migration
- [x] 3.1 Refactor `src/app/[locale]/blog/[slug]/page.tsx` to import MDX via manifest
- [x] 3.2 Remove `dangerouslySetInnerHTML` usage
- [x] 3.3 Update `generateStaticParams` to use manifest
- [x] 3.4 Verify blog post rendering with existing content

## 4. Products Page Migration
- [x] 4.1 Refactor `src/app/[locale]/products/[slug]/page.tsx` similarly
- [x] 4.2 Remove `dangerouslySetInnerHTML` usage
- [x] 4.3 Verify product page rendering

## 5. Static Pages Migration (if applicable)
- [x] 5.1 Identify any other pages using innerHTML for MDX
- [x] 5.2 Migrate to RSC rendering pattern

## 6. Validation & Cleanup
- [x] 6.1 Run `grep -r "dangerouslySetInnerHTML" src/app` to confirm zero matches for content
  - Note: Only JSON-LD script injection uses dangerouslySetInnerHTML (legitimate SEO use case)
- [x] 6.2 Run `pnpm build` and verify all routes
- [x] 6.3 Run `pnpm test` for content-related tests
- [x] 6.4 Update documentation if needed
