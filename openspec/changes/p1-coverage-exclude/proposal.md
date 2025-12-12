# Change: Coverage Exclude Refinement

## Why
`vitest.config.mts` excludes too many directories (`src/services/**`, `src/types/**`, `src/config/**`) from coverage, making metrics overly optimistic and hiding risk in runtime code.

## What Changes
- Narrow coverage exclude list to truly non-runtime code
- Add tests for previously excluded runtime code
- Fix global fetch mock that may hide i18n loading issues

## Impact
- Affected specs: `testing`
- Affected code:
  - `vitest.config.mts` (coverage.exclude)
  - `src/test/setup.ts` (fetch mock)
  - New tests for `src/config/**`, `src/services/**`

## Success Criteria
- Exclude only: generated code, type definitions, test utilities
- Runtime config code has test coverage
- i18n loading tests don't rely on global fetch mock

## Dependencies
- **Depends on**: p0-quality-gate-unification (threshold baseline)

## Rollback Strategy
- Restore broader exclude list
- Coverage may dip temporarily during transition
