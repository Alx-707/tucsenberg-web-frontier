## 1. Content Manifest Generation
- [ ] 1.1 Create `scripts/generate-content-manifest.ts` to scan `content/{posts,pages,products}/{en,zh}/`
- [ ] 1.2 Generate `reports/content-manifest.json` mapping `{type}/{locale}/{slug}` → file path
- [ ] 1.3 Add `pnpm content:manifest` script to package.json
- [ ] 1.4 Integrate manifest generation into build pipeline

## 2. MDX Component Setup
- [ ] 2.1 Update `mdx-components.tsx` with prose/custom component mappings
- [ ] 2.2 Ensure typography plugin classes are available (coordinate with p1-tailwind-plugins)
- [ ] 2.3 Add TypeScript types for MDX component props

## 3. Blog Page Migration
- [ ] 3.1 Refactor `src/app/[locale]/blog/[slug]/page.tsx` to import MDX via manifest
- [ ] 3.2 Remove `dangerouslySetInnerHTML` usage
- [ ] 3.3 Update `generateStaticParams` to use manifest
- [ ] 3.4 Verify blog post rendering with existing content

## 4. Products Page Migration
- [ ] 4.1 Refactor `src/app/[locale]/products/[slug]/page.tsx` similarly
- [ ] 4.2 Remove `dangerouslySetInnerHTML` usage
- [ ] 4.3 Verify product page rendering

## 5. Static Pages Migration (if applicable)
- [ ] 5.1 Identify any other pages using innerHTML for MDX
- [ ] 5.2 Migrate to RSC rendering pattern

## 6. Validation & Cleanup
- [ ] 6.1 Run `grep -r "dangerouslySetInnerHTML" src/app` to confirm zero matches for content
- [ ] 6.2 Run `pnpm build` and verify all routes
- [ ] 6.3 Run `pnpm test` for content-related tests
- [ ] 6.4 Update documentation if needed
