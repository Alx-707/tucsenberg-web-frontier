# Change: Achieve 85% Global Test Coverage

## Why

Current test coverage is 38.62% (lines), far below the 85% target threshold. This gap exposes the codebase to regression risks and blocks CI enforcement of coverage gates.

## What Changes

- Add unit tests for ~6,200 uncovered lines across 6 phases
- Prioritize by risk and business criticality: Security → External Integrations → Core Libraries → API Routes → Pages → UI
- Follow `TESTING_STANDARDS.md` patterns for consistency
- Enable progressive coverage threshold enforcement in CI (60% → 70% → 80% → 85%)

### Coverage Gap Analysis

| Module Category | Current | Target | Gap (lines) | Phase |
|-----------------|---------|--------|-------------|-------|
| Security (`security-*.ts`) | ~40% | 90% | ~400 | 0 |
| External Integrations (`whatsapp-*.ts`) | 0% | 85% | ~240 | 1 |
| Core i18n (`i18n-*.ts`, `locale-*.ts`) | ~25% | 85% | ~3,000 | 2 |
| Performance Monitoring | 0% | 85% | ~1,200 | 2 |
| API Routes (`app/api/`) | ~55% | 90% | ~400 | 3 |
| Page Components (`app/[locale]/`) | ~35% | 85% | ~600 | 4 |
| UI Components & Hooks | ~45% | 70-85% | ~1,400 | 5 |

### Priority Classification (Revised)

**Critical (P0) - Phase 0/1**:
- `src/lib/security-crypto.ts` (110 lines, 0.9%) - Security critical
- `src/lib/security-object-access.ts` (65 lines, 1.53%) - Security critical
- `src/lib/env.ts` (28 lines, 0%) - Config validation, blocks other tests
- `src/lib/whatsapp*.ts` (236 lines, 0%) - External integration, business critical
- `src/lib/server-action-utils.ts` (69 lines, 1.44%) - Server Actions foundation

**High (P1) - Phase 2**:
- `src/lib/performance-monitoring-*.ts` (~1,200 lines, 0%) - Observability
- `src/lib/locale-storage-*.ts` (~2,500 lines, ~20%) - Core i18n persistence
- `src/lib/i18n-analytics.ts` (109 lines, 0%) - Analytics

**Medium (P2) - Phase 3/4**:
- `src/app/actions.ts` (34 lines, 5.88%) - Server Actions
- `src/app/sitemap.ts` (55 lines, 0%) - SEO critical
- `src/app/[locale]/*/page.tsx` - Page components

**Low (P3) - Phase 5**:
- `src/components/products/*.tsx` - Product UI
- `src/components/layout/*.tsx` - Layout UI
- `src/hooks/web-vitals-*.ts` - Diagnostics hooks

## Impact

- **Affected specs**: `testing`
- **Affected code**: All `src/` directories
- **Risk**: **Medium** (WhatsApp/security/performance modules involve external dependencies and sensitive logic)
- **CI Impact**: Progressive coverage gates enforced at each phase

## Success Criteria

1. Phase 0: Security modules ≥90% coverage, global ≥45%
2. Phase 1: External integrations ≥85% coverage, global ≥50%
3. Phase 2: Core libraries ≥85% coverage, global ≥60%
4. Phase 3: API routes ≥90% coverage, global ≥70%
5. Phase 4: Page components ≥85% coverage, global ≥80%
6. Phase 5: UI/Hooks ≥70-85% coverage, global ≥85%
7. All 4830+ existing tests continue to pass
8. New tests follow `TESTING_STANDARDS.md` patterns

## Phased Threshold Enforcement

| Phase | Global Threshold | Enforcement |
|-------|------------------|-------------|
| 0 | 45% | Warning only |
| 1 | 50% | Warning only |
| 2 | 60% | CI Warning |
| 3 | 70% | CI Blocking |
| 4 | 80% | CI Blocking |
| 5 | 85% | CI Blocking (Final) |
