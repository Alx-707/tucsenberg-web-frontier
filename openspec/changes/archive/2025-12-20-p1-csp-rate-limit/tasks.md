## 1. CSP Directive Fix
- [x] 1.1 Review `src/config/security.ts` `generateCSP` function
- [x] 1.2 Remove `'none'` from `frame-src` if allowlist exists
- [x] 1.3 Ensure all directives have valid, non-conflicting values
- [x] 1.4 Add `report-uri` directive pointing to `/api/csp-report`

## 2. CSP Reporting Chain
- [x] 2.1 Enable `Report-Only` mode for testing
- [x] 2.2 Verify `/api/csp-report` endpoint handles violations
- [x] 2.3 Add logging/metrics for CSP violations
- [x] 2.4 Switch to enforcement mode after validation

## 3. Distributed Rate Limiting
- [x] 3.1 Create `src/lib/security/distributed-rate-limit.ts`
- [x] 3.2 Implement Upstash Redis or Vercel KV backend
- [x] 3.3 Define rate limits: contact 5/min, inquiry 10/min, subscribe 3/min
- [x] 3.4 Add fallback to memory limiter with warning

## 4. Turnstile Consolidation
- [x] 4.1 Make `contact-api-utils.ts#verifyTurnstile` the single source
- [x] 4.2 Update `/api/verify-turnstile` to use shared function
- [x] 4.3 Unify hostname/action validation logic

## 5. API Integration
- [x] 5.1 Update `/api/contact` to use distributed rate limit
- [x] 5.2 Update `/api/inquiry` similarly
- [x] 5.3 Update `/api/subscribe` similarly
- [x] 5.4 Return proper 429 responses with Retry-After header

## 6. Validation
- [x] 6.1 Run `pnpm security:check`
- [x] 6.2 Test rate limiting across multiple requests
- [x] 6.3 Verify CSP doesn't block legitimate resources
- [x] 6.4 Check CSP report endpoint receives violations
