## 1. Workflow Analysis
- [x] 1.1 Document all jobs in ci.yml, code-quality.yml, vercel-deploy.yml
- [x] 1.2 Identify duplicate steps (type-check, lint, test, coverage)
- [x] 1.3 Define clear responsibility for each workflow

## 2. ci.yml as Primary
- [x] 2.1 Ensure ci.yml has comprehensive quality gates
- [x] 2.2 Single `pnpm quality:gate` invocation
- [x] 2.3 Remove any redundant test runs
- [x] 2.4 Set as required check for PRs (already configured)

## 3. code-quality.yml Reduction
- [x] 3.1 Remove duplicate type-check/lint/test steps
- [x] 3.2 Keep only: Semgrep full scan (removed arch:check/circular:check - handled by ci.yml)
- [x] 3.3 Change trigger to main/nightly only (not PR)
- [x] 3.4 Mark as non-blocking for PRs (workflow no longer runs on PRs)

## 4. vercel-deploy.yml Scoping
- [x] 4.1 Remove duplicate quality gates (pre-deployment-checks job removed)
- [x] 4.2 Keep only: build, MISSING_MESSAGE check, health probe
- [x] 4.3 Ensure it relies on ci.yml passing first (via GitHub branch protection)

## 5. Validation
- [ ] 5.1 Create test PR and verify reduced job count
- [ ] 5.2 Verify all quality gates still function
- [ ] 5.3 Measure CI time improvement
- [ ] 5.4 Update documentation on CI structure
