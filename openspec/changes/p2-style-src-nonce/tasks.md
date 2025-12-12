## 1. Compatibility Evaluation
- [ ] 1.1 Test production build with inlineCss: true
- [ ] 1.2 Check for CSP style-src violations
- [ ] 1.3 Determine if inline styles get nonce

## 2. Decision and Implementation
- [ ] 2.1 If compatible: document the setup
- [ ] 2.2 If incompatible: disable inlineCss in production
- [ ] 2.3 Update next.config.ts accordingly

## 3. Nonce Consolidation
- [ ] 3.1 Choose single nonce source (`src/config/security.ts`)
- [ ] 3.2 Update `src/lib/security-tokens.ts` to re-export
- [ ] 3.3 Align `isValidNonce` validation rules

## 4. Header Cleanup
- [ ] 4.1 Review `x-csp-nonce` header usage
- [ ] 4.2 Remove if no consumers
- [ ] 4.3 Document if keeping

## 5. Validation
- [ ] 5.1 Run `pnpm build` in production mode
- [ ] 5.2 Check browser console for CSP errors
- [ ] 5.3 Run `pnpm security:check`
