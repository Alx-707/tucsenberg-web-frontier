# Quality Gates & CI/CD

## Complexity Limits

| File Type | max-lines | max-lines-per-function | complexity |
|-----------|-----------|------------------------|------------|
| **Production** | 500 | 120 | 15 |
| **Config** | 800 | 250 | 18 |
| **Test** | 800 | 700 | 20 |

### Exemptions
- Config files: `*.config.{js,ts,mjs}`
- Dev tools: `src/components/dev-tools/**`, `src/app/**/dev-tools/**`

## Magic Numbers

No bare numbers allowed. Use constants from `src/constants/`.

**ESLint allowlist**: `0, 1, -1, 100, 200, 201, 400, 401, 403, 404, 500, 502, 503, 24, 60, 1000`

Constants organization:
- `src/constants/performance.ts` — Performance thresholds
- `src/constants/time.ts` — Time values

## CI/CD Pipeline

```bash
pnpm ci:local  # One-command local CI
```

Flow: type-check → lint → format → test → security → build → size-check

## Zero Tolerance

- TypeScript: Zero errors
- ESLint: Zero warnings
- Build: No errors
- Bundle: Within budget

## Test Coverage

| Phase | Target |
|-------|--------|
| Phase 1 | ≥65% (current) |
| Phase 2 | ≥75% |
| Phase 3 | ≥80% |

## Failure Policy

- Any gate failure stops pipeline immediately
- No bypasses allowed
- Must fix before proceeding
