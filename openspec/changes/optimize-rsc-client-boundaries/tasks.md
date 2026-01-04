# Tasks: Optimize RSC/Client Boundaries

## 1. P0-1: Fix ThemeSwitcher dynamic import location
- [ ] 1.1 Move `dynamic()` call from inside render to module scope in `src/components/ui/theme-switcher.tsx:77-83`
- [ ] 1.2 Verify theme switching still works correctly
- [ ] 1.3 Run `pnpm build` to confirm no regressions

## 2. P0-2: Convert Logo to Server Component
- [ ] 2.1 Remove `'use client'` directive from `src/components/layout/logo.tsx:7`
- [ ] 2.2 Replace `import { Link } from '@/i18n/routing'` with `import Link from 'next/link'`
- [ ] 2.3 Add `locale` prop to Logo component interface
- [ ] 2.4 Update Logo href to use locale prop: `href={locale ? \`/\${locale}\` : '/'}`
- [ ] 2.5 Update Header component to pass locale prop to Logo
- [ ] 2.6 Update `src/components/layout/__tests__/logo.test.tsx` to mock `next/link` instead of `@/i18n/routing`
- [ ] 2.7 Verify navigation works correctly on all pages

## 3. P0-3: Narrow CookieConsentProvider scope
- [ ] 3.1 Verify only 2 consumers exist: `cookie-banner.tsx` and `enterprise-analytics-island.tsx`
- [ ] 3.2 Move `<CookieConsentProvider>` in `src/app/[locale]/layout.tsx:105` to wrap only the consumers
- [ ] 3.3 Test cookie banner functionality
- [ ] 3.4 Test analytics island functionality (production build)

## 4. P1-1: Consolidate UTM attribution calls
- [ ] 4.1 Create `src/components/attribution-bootstrap.tsx` client component
- [ ] 4.2 Add `<AttributionBootstrap />` to locale layout
- [ ] 4.3 Remove `storeAttributionData()` from `src/components/forms/contact-form-container.tsx:134`
- [ ] 4.4 Remove `storeAttributionData()` from `src/components/products/product-inquiry-form.tsx:335`
- [ ] 4.5 Remove `storeAttributionData()` from `src/components/blog/blog-newsletter.tsx:236`
- [ ] 4.6 Remove `storeAttributionData()` from `src/components/monitoring/enterprise-analytics-island.tsx:54`
- [ ] 4.7 Verify form submissions still include attribution data

## 5. Validation
- [ ] 5.1 Run `pnpm type-check`
- [ ] 5.2 Run `pnpm lint:check`
- [ ] 5.3 Run `pnpm test`
- [ ] 5.4 Run `pnpm build`
- [ ] 5.5 Manual smoke test: Home, Products, Contact pages in both locales
