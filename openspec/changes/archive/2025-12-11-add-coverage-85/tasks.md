# Implementation Tasks

## Phase 0: Security & Config Foundation (Target: 38% → 45%)

### 0.1 Security Core Tests
- [x] 0.1.1 Add tests for `src/lib/security-crypto.ts` (0.9% → 90%) ✅
- [x] 0.1.2 Add tests for `src/lib/security-object-access.ts` (1.53% → 90%) ✅
- [x] 0.1.3 Add tests for `src/lib/security/object-guards.ts` (14.43% → 90%) ✅

### 0.2 Security Utilities Tests
- [x] 0.2.1 Add tests for `src/lib/security-headers.ts` (84.12% → 90%) ✅
- [x] 0.2.2 Add tests for `src/lib/security-rate-limit.ts` (69.11% → 90%) ✅
- [x] 0.2.3 Add tests for `src/lib/security-tokens.ts` (73.84% → 90%) ✅
- [x] 0.2.4 Add tests for `src/lib/security-validation.ts` (88.46% → 92%) ✅
- [x] 0.2.5 Add tests for `src/lib/security-file-upload.ts` (70.29% → 90%) ✅

### 0.3 Config & Environment Tests
- [x] 0.3.1 Add tests for `src/lib/env.ts` (0% → 90%) ✅
- [x] 0.3.2 Add tests for `src/lib/server-action-utils.ts` (1.44% → 90%) ✅

**Checkpoint**: Run `pnpm test:coverage`, verify global ≥45%

---

## Phase 1: External Integrations (Target: 45% → 50%)

### 1.1 WhatsApp Integration Tests
- [x] 1.1.1 Add tests for `src/lib/whatsapp.ts` (0% → 85%) ✅
- [x] 1.1.2 Add tests for `src/lib/whatsapp-core.ts` (0% → 85%) ✅
- [x] 1.1.3 Add tests for `src/lib/whatsapp-service.ts` (0% → 85%) ✅
- [x] 1.1.4 Add tests for `src/lib/whatsapp-messages.ts` (0% → 85%) ✅
- [x] 1.1.5 Add tests for `src/lib/whatsapp-media.ts` (0% → 85%) ✅
- [x] 1.1.6 Add tests for `src/lib/whatsapp-utils.ts` (0% → 85%) ✅

### 1.2 External API Route Tests
- [x] 1.2.1 Add tests for `src/app/api/whatsapp/send/route.ts` (66.66% → 90%) ✅
- [x] 1.2.2 Add tests for `src/app/api/whatsapp/webhook/route.ts` (79.16% → 90%) ✅

**Checkpoint**: Run `pnpm test:coverage`, verify global ≥50%

---

## Phase 2: Core Libraries (Target: 50% → 60%)

### 2.1 i18n Cache System Tests (Batch 1: Core)
- [x] 2.1.1 Add tests for `src/lib/i18n-lru-cache.ts` (32.83% → 85%) ✅
- [x] 2.1.2 Add tests for `src/lib/i18n-metrics-collector.ts` (32.06% → 85%) ✅
- [x] 2.1.3 Add tests for `src/lib/i18n-event-collector.ts` (5.76% → 85%) ✅
- [x] 2.1.4 Add tests for `src/lib/i18n-analytics.ts` (0% → 85%) ✅

### 2.2 i18n Cache System Tests (Batch 2: Types & Utils)
- [x] 2.2.1 Add tests for `src/lib/i18n-cache-types-utils.ts` (4.42% → 85%) ✅
- [x] 2.2.2 Add tests for `src/lib/i18n-cache-types-base.ts` (6.38% → 85%) ✅
- [x] 2.2.3 Add tests for `src/lib/i18n-cache-validation-utils.ts` (2.7% → 85%) ✅
- [x] 2.2.4 Add tests for `src/lib/i18n-monitor-core.ts` (20.83% → 85%) ✅

### 2.3 Locale Storage Tests (Batch 1: Core & Config)
- [x] 2.3.1 Add tests for `src/lib/locale-storage-local.ts` (62.24% → 85%) ✅
- [x] 2.3.2 Add tests for `src/lib/locale-storage-cookie.ts` (29.48% → 85%) ✅
- [x] 2.3.3 Add tests for `src/lib/locale-storage-types-base.ts` (74.07% → 90%) ✅
- [x] 2.3.4 Add tests for `src/lib/locale-storage-manager.ts` (48% → 85%) ✅

### 2.4 Locale Storage Tests (Batch 2: Preference)
- [x] 2.4.1 Add tests for `src/lib/locale-storage-preference-core.ts` (38.88% → 85%) ✅
- [x] 2.4.2 Add tests for `src/lib/locale-storage-preference-override.ts` (25.89% → 85%) ✅
- [x] 2.4.3 Add tests for `src/lib/locale-storage-preference-cache.ts` (2.15% → 85%) ✅
- [x] 2.4.4 Add tests for `src/lib/locale-storage-preference.ts` (45.23% → 85%) ✅

### 2.5 Locale Storage Tests (Batch 3: History)
- [x] 2.5.1 Add tests for `src/lib/locale-storage-history-core.ts` (58% → 85%) ✅
- [x] 2.5.2 Add tests for `src/lib/locale-storage-history-events.ts` (13.2% → 85%) ✅
- [x] 2.5.3 Add tests for `src/lib/locale-storage-history-query.ts` (0% → 85%) ✅
- [x] 2.5.4 Add tests for `src/lib/locale-storage-history-stats.ts` (0% → 85%) ✅

### 2.6 Locale Storage Tests (Batch 4: Analytics & Maintenance)
- [x] 2.6.1 Add tests for `src/lib/locale-storage-analytics-core.ts` (93% → maintain) ✅
- [x] 2.6.2 Add tests for `src/lib/locale-storage-analytics-events.ts` (10.2% → 85%) ✅
- [x] 2.6.3 Add tests for `src/lib/locale-storage-analytics-utils.ts` (3.61% → 85%) ✅
- [x] 2.6.4 Add tests for `src/lib/locale-storage-maintenance.ts` (3.22% → 85%) ✅
- [x] 2.6.5 Add tests for `src/lib/locale-storage-maintenance-cleanup.ts` (4.54% → 85%) ✅

### 2.7 Locale Detector Tests
- [x] 2.7.1 Add tests for `src/lib/locale-detector-smart.ts` (63.39% → 85%) ✅
- [x] 2.7.2 Add tests for `src/lib/locale-detector-base.ts` (65.54% → 85%) ✅
- [x] 2.7.3 Add tests for `src/lib/locale-detector.ts` (0% → 85%) ✅

### 2.8 Performance Monitoring Tests (Batch 1: Core)
- [x] 2.8.1 Add tests for `src/lib/performance-monitoring-core.ts` (0% → 85%) ✅
- [x] 2.8.2 Add tests for `src/lib/performance-monitoring-core-config.ts` (0% → 85%) ✅
- [x] 2.8.3 Add tests for `src/lib/performance-monitoring-core-metrics.ts` (0% → 85%) ✅
- [x] 2.8.4 Add tests for `src/lib/performance-monitoring-core-reports.ts` (0% → 85%) ✅
- [x] 2.8.5 Add tests for `src/lib/performance-monitoring-core-conflicts.ts` (0% → 85%) ✅

### 2.9 Performance Monitoring Tests (Batch 2: Config & Integrations)
- [x] 2.9.1 Add tests for `src/lib/performance-monitoring-config-compare.ts` (0% → 85%) ✅
- [x] 2.9.2 Add tests for `src/lib/performance-monitoring-config-history.ts` (0% → 85%) ✅
- [x] 2.9.3 Add tests for `src/lib/performance-monitoring-config-modules.ts` (0% → 85%) ✅
- [x] 2.9.4 Add tests for `src/lib/performance-monitoring-integrations-vitals.ts` (0% → 85%) ✅
- [x] 2.9.5 Add tests for `src/lib/performance-monitoring-integrations-bundle.ts` (0% → 85%) ✅
- [x] 2.9.6 Add tests for `src/lib/performance-monitoring-integrations-react-scan.ts` (0% → 85%) ✅

**Checkpoint**: Run `pnpm test:coverage`, verify global ≥60%

---

## Phase 3: API Routes & Server Actions (Target: 60% → 70%)

### 3.1 Contact API Tests
- [x] 3.1.1 Add tests for `src/app/api/contact/contact-api-utils.ts` (2.38% → 90%) ✅
- [x] 3.1.2 Add tests for `src/app/api/contact/contact-api-validation.ts` (32.69% → 90%) ✅
- [x] 3.1.3 Add tests for `src/app/api/contact/contact-form-error-utils.ts` (7.4% → 90%) ✅

### 3.2 Monitoring API Tests
- [x] 3.2.1 Add tests for `src/app/api/monitoring/dashboard/route.ts` (25% → 90%) ✅
- [x] 3.2.2 Add tests for `src/app/api/monitoring/dashboard/handlers/delete-handler.ts` (0% → 90%) ✅
- [x] 3.2.3 Add tests for `src/app/api/monitoring/dashboard/handlers/get-handler.ts` (0% → 90%) ✅
- [x] 3.2.4 Add tests for `src/app/api/monitoring/dashboard/handlers/put-handler.ts` (0% → 90%) ✅

### 3.3 Other API & Actions Tests
- [x] 3.3.1 Add tests for `src/app/api/inquiry/route.ts` (0% → 90%) ✅
- [x] 3.3.2 Add tests for `src/app/actions.ts` (5.88% → 90%) ✅
- [x] 3.3.3 Add tests for `src/app/sitemap.ts` (0% → 90%) ✅
- [x] 3.3.4 Add tests for `src/app/robots.ts` (0% → 90%) ✅

**Checkpoint**: Run `pnpm test:coverage`, verify global ≥70%. Update CI threshold to 70% (blocking).

---

## Phase 4: Page Components (Target: 70% → 80%)

### 4.1 Main Pages Tests
- [x] 4.1.1 Add tests for `src/app/[locale]/page.tsx` (0% → 85%) ✅
- [x] 4.1.2 Add tests for `src/app/[locale]/about/page.tsx` (0% → 85%) ✅
- [x] 4.1.3 Add tests for `src/app/[locale]/blog/page.tsx` (0% → 85%) ✅
- [x] 4.1.4 Add tests for `src/app/[locale]/terms/page.tsx` (0% → 85%) ✅

### 4.2 Product Pages Tests
- [x] 4.2.1 Add tests for `src/app/[locale]/products/page.tsx` (0% → 85%) ✅
- [x] 4.2.2 Improve tests for `src/app/[locale]/products/[slug]/page.tsx` (66.66% → 85%) ✅

### 4.3 Layout & Error Tests
- [x] 4.3.1 Add tests for `src/app/[locale]/layout.tsx` (0% → simplified test coverage) ✅
- [x] 4.3.2 Add tests for `src/app/[locale]/head.tsx` (0% → limited coverage due to ESM mocking constraints) ✅
- [x] 4.3.3 Add tests for `src/app/global-error.tsx` (0% → 85%) ✅
- [x] 4.3.4 Add tests for `src/app/[locale]/contact/error.tsx` (0% → 85%) ✅

**Checkpoint**: Run `pnpm test:coverage`, verify global ≥80%. Update CI threshold to 80% (blocking).

---

## Phase 5: UI Components & Hooks (Target: 80% → 85%)

### 5.1 Product Components Tests
- [x] 5.1.1 Add tests for `src/components/products/product-card.tsx` (0% → 70%) ✅
- [x] 5.1.2 Add tests for `src/components/products/product-grid.tsx` (0% → 70%) ✅
- [x] 5.1.3 Add tests for `src/components/products/product-gallery.tsx` (0% → 70%) ✅
- [x] 5.1.4 Add tests for `src/components/products/product-inquiry-form.tsx` (0% → 70%) ✅
- [x] 5.1.5 Add tests for `src/components/products/product-actions.tsx` (0% → 70%) ✅
- [x] 5.1.6 Add tests for `src/components/products/product-specs.tsx` (0% → 70%) ✅

### 5.2 Layout Components Tests
- [x] 5.2.1 Add tests for `src/components/layout/vercel-navigation.tsx` (0% → 70%) ✅
- [x] 5.2.2 Add tests for `src/components/layout/logo.tsx` (0% → 70%) ✅
- [x] 5.2.3 Add tests for `src/components/layout/header-client.tsx` (0% → 70%) ✅
- [x] 5.2.4 Add tests for `src/components/layout/nav-switcher.tsx` (0% → 70%) ✅

### 5.3 Blog & Shared Components Tests
- [x] 5.3.1 Add tests for `src/components/blog/post-card.tsx` (0% → 70%) ✅
- [x] 5.3.2 Add tests for `src/components/blog/post-grid.tsx` (0% → 70%) ✅
- [x] 5.3.3 Add tests for `src/components/blog/blog-newsletter.tsx` (0% → 70%) ✅
- [x] 5.3.4 Add tests for `src/components/shared/under-construction-v2-components.tsx` (0% → 70%) ✅

### 5.4 Hook Tests
- [x] 5.4.1 Add tests for `src/hooks/use-keyboard-navigation.ts` (50.48% → 85%) ✅ (existing tests)
- [x] 5.4.2 Add tests for `src/hooks/use-deferred-render.ts` (0% → 85%) ✅
- [x] 5.4.3 Add tests for `src/hooks/theme-transition-core.ts` (38.59% → 85%) ✅
- [x] 5.4.4 Add tests for `src/hooks/web-vitals-diagnostics-analyzer.ts` (20.21% → 85%) ✅
- [x] 5.4.5 Add tests for `src/hooks/web-vitals-diagnostics-export.ts` (14.58% → 85%) ✅
- [x] 5.4.6 Add tests for `src/hooks/web-vitals-diagnostics-calculator.ts` (43.03% → 85%) ✅
- [x] 5.4.7 Add tests for `src/hooks/web-vitals-diagnostics-persistence.ts` (37.2% → 85%) ✅

### 5.5 Other Components Tests
- [x] 5.5.1 Add tests for `src/components/cookie/cookie-banner.tsx` (0% → 70%) ✅
- [x] 5.5.2 Add tests for `src/components/i18n/locale-detection-demo.tsx` (0% → 70%) ✅
- [x] 5.5.3 Add tests for `src/components/performance/web-vitals-indicator.tsx` (0% → 70%) ✅
- [x] 5.5.4 Add tests for `src/components/performance/web-vitals-reporter.tsx` (0% → 70%) ✅

**Checkpoint**: Run `pnpm test:coverage`, verify global ≥85%. Update CI threshold to 85% (blocking, final).

---

## Phase 6: CI Enforcement & Documentation

### 6.1 Enable Final Coverage Gates
- [x] 6.1.1 Update `vitest.config.mts` to enforce 85% threshold ✅ (already configured)
- [x] 6.1.2 Update CI workflow with final coverage gate ✅ (ci.yml:120-122 has blocking coverage check)
- [x] 6.1.3 Add coverage badge to README ✅

### 6.2 Documentation
- [x] 6.2.1 Update `TESTING_STANDARDS.md` with new patterns discovered ✅
- [x] 6.2.2 Document coverage improvement journey in CHANGELOG ✅ (N/A - project does not maintain CHANGELOG)

---

## Task Execution Order Within Phases

Each phase follows dependency order:
1. **Utils/Types** first (shared foundations)
2. **Core logic** second (main functionality)
3. **Integrations** third (combines core + external)
4. **Higher-level** last (depends on all above)

## Verification Checkpoints

After each phase:
1. Run `pnpm test:coverage` to verify coverage increase
2. Ensure all existing tests still pass (`pnpm test`)
3. Review new tests follow `TESTING_STANDARDS.md` patterns
4. Update CI threshold if phase reaches blocking level
