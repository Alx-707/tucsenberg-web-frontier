# Change: Optimize RSC/Client Boundaries for Performance

## Why

Cross-validated audits (Claude + Codex) identified performance issues related to RSC/Client boundaries that increase hydration cost, bundle size, and unnecessary re-renders. These optimizations reduce First Load JS and improve Core Web Vitals without changing user-facing behavior.

## What Changes

### P0 - High Impact, Low Risk

1. **P0-1: ThemeSwitcher dynamic import in render** - `src/components/ui/theme-switcher.tsx:77-83` creates new dynamic import on every render, causing component type to change on each render cycle
2. **P0-2: Logo unnecessary Client boundary** - `src/components/layout/logo.tsx:7` marked as client but has no interactivity (only Link + Image)
3. **P0-3: CookieConsentProvider scope too wide** - `src/app/[locale]/layout.tsx:105` wraps entire tree but only 2 consumers exist

### P1 - Medium Impact

4. **P1-1: UTM attribution redundant calls** - `storeAttributionData()` called in 4 places on mount instead of once

### Excluded from Scope (after review)

- ~~P1-2: Header Idle wrapper~~ - Valid "defer non-critical interactivity" strategy; no Lighthouse data proving harm
- ~~P1-3: Redundant setRequestLocale~~ - Consistent pattern across all pages; next-intl streaming behavior unverified

## Impact

- **Affected specs**: `performance`
- **Affected code**:
  - `src/components/ui/theme-switcher.tsx`
  - `src/components/layout/logo.tsx`
  - `src/components/layout/__tests__/logo.test.tsx`
  - `src/app/[locale]/layout.tsx`
  - `src/components/forms/contact-form-container.tsx`
  - `src/components/products/product-inquiry-form.tsx`
  - `src/components/blog/blog-newsletter.tsx`
  - `src/components/monitoring/enterprise-analytics-island.tsx`
- **Breaking changes**: None (all internal optimizations)
- **Expected improvement**: Reduced hydration overhead, cleaner component architecture
