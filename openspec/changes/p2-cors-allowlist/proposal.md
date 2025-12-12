# Change: CORS Allowlist Implementation

## Why
Form API endpoints (`/api/contact`, `/api/inquiry`, `/api/subscribe`) return `Access-Control-Allow-Origin: *`, which is unnecessarily permissive if cross-site embedding isn't required.

## What Changes
- Default CORS to allowlist (same-origin + configured domains)
- Document when and how to add allowed origins
- Coordinate with Turnstile hostname validation

## Impact
- Affected specs: `security`, `contact-form`
- Affected code:
  - `src/app/api/contact/route.ts`
  - `src/app/api/inquiry/route.ts`
  - `src/app/api/subscribe/route.ts`

## Success Criteria
- Default CORS rejects unknown origins
- Configured origins work correctly
- Turnstile hostname list aligns with CORS allowlist

## Dependencies
- **Benefits from**: p1-csp-rate-limit (security foundation)

## Rollback Strategy
- Restore `*` CORS if breaking legitimate use cases
- Feature flag for strict vs permissive mode
