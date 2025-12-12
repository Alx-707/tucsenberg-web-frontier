# Change: CI Workflow Convergence - Single Main Pipeline

## Why
Three workflows (`ci.yml`, `code-quality.yml`, `vercel-deploy.yml`) run duplicate type-check/lint/coverage checks on the same triggers, wasting CI minutes, increasing flaky test probability, and confusing developers about which check is authoritative.

## What Changes
- `ci.yml` becomes the sole required workflow for PRs
- `code-quality.yml` reduced to deep scans only (Semgrep full, architecture audit)
- `vercel-deploy.yml` limited to deploy-specific gates (MISSING_MESSAGE, health check)
- Remove all duplicate type-check/lint/test invocations

## Impact
- Affected specs: `testing`, `ci-cd` (new)
- Affected code:
  - `.github/workflows/ci.yml`
  - `.github/workflows/code-quality.yml`
  - `.github/workflows/vercel-deploy.yml`

## Success Criteria
- PR has ~50% fewer CI jobs
- No duplicate coverage checks
- Clear separation of concerns per workflow
- CI completion time reduced

## Dependencies
- **Depends on**: p0-quality-gate-unification (quality gate must be single source first)

## Rollback Strategy
- Git revert of workflow file changes
- Each workflow change in separate commit
