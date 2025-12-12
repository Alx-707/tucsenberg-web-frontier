# Change: style-src and Nonce Tool Consolidation

## Why
Production `style-src` may conflict with Next.js `inlineCss: true` if inline styles lack nonce. Two separate nonce generation implementations exist with inconsistent validation rules.

## What Changes
- Evaluate style-src + inlineCss compatibility
- Consolidate nonce generation to single source
- Remove or document `x-csp-nonce` header if unused

## Impact
- Affected specs: `security`
- Affected code:
  - `next.config.ts` (inlineCss setting)
  - `src/config/security.ts`
  - `src/lib/security-tokens.ts`

## Success Criteria
- No CSP style-src violations in production
- Single nonce implementation
- Unused headers removed

## Dependencies
- **Depends on**: p1-csp-rate-limit (CSP foundation)

## Rollback Strategy
- Disable inlineCss if incompatible
- Keep both nonce implementations temporarily
