# Change: Local CI Script Fix - Align with Actual CI

## Why
`scripts/ci-local.sh` references non-existent `pnpm size:check` command and other outdated steps, making local CI simulation unreliable and divergent from actual GitHub Actions behavior.

## What Changes
- Remove `size:check` reference (project uses Lighthouse instead)
- Align all steps with actual `ci.yml` workflow
- Use same `quality-gate.js` as CI
- Match environment variable handling

## Impact
- Affected specs: `testing`
- Affected code:
  - `scripts/ci-local.sh`
  - `package.json` (verify scripts exist)

## Success Criteria
- `pnpm ci:local` completes without "command not found" errors
- Local CI result matches GitHub CI result
- All referenced npm scripts exist

## Dependencies
- **Depends on**: p0-quality-gate-unification

## Rollback Strategy
- Simple git revert of script changes
