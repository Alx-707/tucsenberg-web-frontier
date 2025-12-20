## 1. Type Augmentation Setup
- [x] 1.1 Create `src/types/next-intl.d.ts` with `AppConfig.Messages` augmentation
- [x] 1.2 Define message structure types from `messages/en/critical.json` and `messages/en/deferred.json`
- [x] 1.3 Ensure `tsconfig.json` includes the new type file

## 2. next-intl Configuration
- [x] 2.1 Update `src/i18n/request.ts` to enable `strictMessageTypeSafety: true`
- [x] 2.2 Verify Provider configuration passes type-safe messages
- [x] 2.3 Update any `getTranslations()` server-side calls

## 3. CI Shape Validation
- [x] 3.1 Enhance `scripts/i18n-shape-check.js` to output structured report
- [x] 3.2 Add CI step to run shape check as blocking gate
- [x] 3.3 Ensure en/zh message structures stay synchronized

## 4. Codebase Migration
- [x] 4.1 Audit all `useTranslations()` usages for invalid keys
- [x] 4.2 Fix type errors from strict checking
- [x] 4.3 Remove `as unknown as` assertions for translation calls
- [x] 4.4 Update any dynamic key access patterns to type-safe alternatives

## 5. Validation
- [x] 5.1 Run `pnpm type-check` - all translation usages must pass
- [x] 5.2 Run `pnpm i18n:shape:check` - en/zh structures must match
- [x] 5.3 Run `pnpm validate:translations` - all keys must be valid
- [x] 5.4 Run `pnpm test` - i18n-related tests pass
