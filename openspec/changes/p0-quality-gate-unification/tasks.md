## 1. Quality Gate Script Enhancement
- [x] 1.1 Review `scripts/quality-gate.js` current thresholds and modes
- [x] 1.2 Document all quality dimensions (coverage, lint, perf, security)
- [x] 1.3 Ensure script outputs clear pass/fail for each dimension
- [x] 1.4 Add JSON output mode for CI consumption (`--output=json` or `--json`)

## 2. Vitest Configuration Cleanup
- [x] 2.1 Remove any `coverage.thresholds` from `vitest.config.mts` (already commented out)
- [x] 2.2 Ensure coverage reports are still generated (JSON, HTML) - via `reporter: ['text', 'html', 'json-summary']`
- [x] 2.3 Vitest only produces data, quality-gate.js enforces thresholds

## 3. CI Workflow Consolidation
- [x] 3.1 Update `.github/workflows/ci.yml`:
  - Removed duplicate test run (now only `pnpm test:coverage`)
  - Architecture job uses `pnpm quality:gate` for quality dimensions
  - Architecture job now depends on `tests` job and downloads coverage artifact
- [x] 3.2 Update `.github/workflows/code-quality.yml`:
  - Removed `test-quality` job (duplicate coverage check)
  - Uses `quality:gate:fast` to avoid duplicate coverage/perf checks
  - Simplified `quality-summary` to only depend on code-quality + security-audit
- [x] 3.3 Verify `.github/workflows/vercel-deploy.yml` doesn't duplicate gates (no quality gates there)
- [x] 3.4 quality-gate.js `checkCoverage()` now skips test execution in CI mode (reads existing report only)

## 4. Local CI Alignment
- [x] 4.1 Update `scripts/ci-local.sh` to mirror actual CI steps
- [x] 4.2 Remove `pnpm size:check` reference (use Lighthouse instead)
- [x] 4.3 Ensure `pnpm ci:local` produces same result as GitHub CI
- [x] 4.4 Quality gate uses `--mode=fast` in quick mode, full mode otherwise
- [x] 4.5 ci-local.sh now passes `--skip-test-run` to avoid duplicate coverage test execution

## 5. Git Hooks Consolidation
- [x] 5.1 Update `lefthook.yml` pre-push to use `pnpm quality:gate`
- [x] 5.2 Remove any duplicate coverage checks in hooks (none existed)
- [x] 5.3 Ensure hooks delegate to same source as CI

## 6. Documentation Update
- [x] 6.1 Updated comments in all config files to reference `scripts/quality-gate.js`
- [ ] 6.2 Document threshold values and how to modify them (optional, thresholds self-documented in script)
- [ ] 6.3 Add troubleshooting guide for gate failures (optional, script provides clear error messages)

## 7. Validation
- [x] 7.1 Run `pnpm quality:gate` locally - runs successfully
- [x] 7.2 JSON output mode works (`--output=json`)
- [ ] 7.3 Verify PR required checks list is reduced (requires PR creation)
- [ ] 7.4 Test a failing scenario blocks correctly (quality gate properly reports failures)
