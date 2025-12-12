# Change: CSP Fix and Distributed Rate Limiting

## Why
1. CSP `frame-src` contains conflicting `'none'` with allowlist - may be ignored by browsers
2. `report-uri`/`Report-Only` configured but not connected to CSP output
3. Rate limiting uses in-memory Map - ineffective in serverless/multi-instance deployments

## What Changes
- Fix CSP `frame-src` directive semantics
- Connect CSP reporting chain (report-uri, Report-Only mode)
- Implement distributed rate limiting (Upstash/KV) for form APIs
- Consolidate Turnstile verification to single source

## Impact
- Affected specs: `security` (new), `contact-form`
- Affected code:
  - `src/config/security.ts`
  - `proxy.ts`
  - `src/app/api/csp-report/route.ts`
  - New: `src/lib/security/distributed-rate-limit.ts`
  - `src/app/api/contact/contact-api-utils.ts`
  - `src/app/api/verify-turnstile/route.ts`

## Success Criteria
- CSP directives have no semantic conflicts
- CSP violations are reported to `/api/csp-report`
- Rate limiting works across serverless instances
- Turnstile verification from single source

## Dependencies
- None (can start independently)

## Rollback Strategy
- Revert CSP changes; old config still functional
- Fall back to memory rate limiting with warning log
- Feature flag for distributed rate limiting
