## 1. Requirements Analysis
- [x] 1.1 Determine if cross-origin form submission is needed
- [x] 1.2 List legitimate origins if any
- [x] 1.3 Document decision

## 2. CORS Configuration
- [x] 2.1 Create `src/config/cors.ts` with allowlist
- [x] 2.2 Update `/api/contact` OPTIONS handler
- [x] 2.3 Update `/api/inquiry` OPTIONS handler
- [x] 2.4 Update `/api/subscribe` OPTIONS handler

## 3. Allowlist Management
- [x] 3.1 Define env variable for additional origins
- [x] 3.2 Align with Turnstile hostname validation
- [x] 3.3 Document how to add new origins

## 4. Validation
- [x] 4.1 Test same-origin requests work
- [x] 4.2 Test unknown origin is rejected
- [x] 4.3 Test allowed origins work
- [ ] 4.4 Run form submission e2e tests
