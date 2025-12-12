## 1. Script Audit
- [x] 1.1 Read current `scripts/ci-local.sh` content
- [x] 1.2 List all `pnpm` commands referenced
- [x] 1.3 Verify each command exists in `package.json`
- [x] 1.4 Compare with actual `ci.yml` steps

## 2. Fix Missing Commands
- [x] 2.1 Remove or replace `pnpm size:check` reference
- [x] 2.2 Replace with Lighthouse gate if needed
- [x] 2.3 Fix any other missing command references

## 3. Alignment with CI
- [x] 3.1 Match step order with `ci.yml`
- [x] 3.2 Use same environment variables
- [x] 3.3 Use `pnpm quality:gate` consistently

## 4. Validation
- [x] 4.1 Run `pnpm ci:local` - should complete
- [x] 4.2 Intentionally break something, verify it catches
- [x] 4.3 Compare output with actual CI run
