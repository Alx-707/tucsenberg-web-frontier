# Change: Quality Gate Unification - Single Source of Truth

## Why
Coverage thresholds are defined in multiple places (`ci.yml`, `code-quality.yml`, `vitest.config.mts`, `quality-gate.js`, `lefthook.yml`) with inconsistent blocking semantics. This causes unpredictable CI behavior and developer confusion about which gate is authoritative.

## What Changes
- **BREAKING**: `scripts/quality-gate.js` becomes the sole coverage/quality authority
- Remove duplicate coverage checks from CI workflows
- Vitest only produces reports, no threshold enforcement
- All hooks and CI jobs delegate to `pnpm quality:gate`

## Impact
- Affected specs: `testing` (existing)
- Affected code:
  - `scripts/quality-gate.js` (single source)
  - `vitest.config.mts` (remove thresholds)
  - `.github/workflows/ci.yml`
  - `.github/workflows/code-quality.yml`
  - `lefthook.yml`
  - `.claude/rules/quality-gates.md` (documentation)

## Success Criteria
- Single `pnpm quality:gate` invocation in CI
- No coverage threshold in vitest.config.mts
- PR required checks reduced to unified set
- `pnpm ci:local` mirrors actual CI behavior

## Dependencies
- None (P0 independent task)

## Rollback Strategy
- Revert workflow files to previous state
- Re-enable Vitest thresholds if needed
- Well-defined git commits for each change
