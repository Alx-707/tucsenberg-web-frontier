## 1. Compatibility Evaluation
- [x] 1.1 Test production build with inlineCss: true
- [x] 1.2 Check for CSP style-src violations
- [x] 1.3 Determine if inline styles get nonce

## 2. Decision and Implementation
- [x] 2.1 If compatible: document the setup
- [x] 2.2 If incompatible: disable inlineCss in production
  - Note: `inlineCss: false` in next.config.ts, documented due to FOUC/CLS issues
- [x] 2.3 Update next.config.ts accordingly

## 3. Nonce Consolidation
- [x] 3.1 Choose single nonce source (`src/config/security.ts`)
- [x] 3.2 Update `src/lib/security-tokens.ts` to re-export
- [x] 3.3 Align `isValidNonce` validation rules

## 4. Header Cleanup
- [x] 4.1 Review `x-csp-nonce` header usage
- [x] 4.2 Remove if no consumers
  - Note: Header was never implemented, no consumers found
- [x] 4.3 Document if keeping

## 5. Validation
- [x] 5.1 Run `pnpm build` in production mode
- [x] 5.2 Check browser console for CSP errors
- [x] 5.3 Run `pnpm security:check`
