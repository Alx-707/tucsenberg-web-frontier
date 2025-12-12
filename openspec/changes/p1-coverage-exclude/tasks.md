## 1. Exclude List Analysis
- [x] 1.1 Review current `vitest.config.mts` exclude patterns
- [x] 1.2 Categorize each: runtime vs non-runtime code
- [x] 1.3 Identify which excluded paths need coverage

## 2. Exclude List Refinement
- [x] 2.1 Keep excluded: `**/*.d.ts`, `**/test/**`, generated files
- [x] 2.2 Remove from exclude: `src/config/**` (runtime config)
- [x] 2.3 Remove from exclude: `src/services/**` (if runtime)
- [x] 2.4 Iteratively narrow - one category at a time

## 3. Test Gap Filling
- [x] 3.1 Add tests for `src/config/security.ts` (already exists at src/config/__tests__/security.test.ts)
- [x] 3.2 Add tests for other newly-included config files (tests exist for app-config, contact-form-config, cors, paths)
- [x] 3.3 Ensure coverage stays above threshold

## 4. Fetch Mock Fix
- [x] 4.1 Review `src/test/setup.ts` global fetch mock
- [x] 4.2 Make fetch mock opt-in per test file, not global
  - Note: Already implemented via VITEST_USE_REAL_MESSAGES env var bypass
- [x] 4.3 Add i18n loading test without fetch mock (uses fs fallback)
  - Note: Mock only affects /messages/ paths, other requests pass through

## 5. Validation
- [x] 5.1 Run `pnpm test:coverage`
- [x] 5.2 Verify coverage meets threshold
- [x] 5.3 Run `pnpm quality:gate`
- [x] 5.4 Check i18n tests pass without mock
