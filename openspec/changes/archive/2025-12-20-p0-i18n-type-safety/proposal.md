# Change: i18n Type Safety - Enable strictMessageTypeSafety

## Why
Translation keys and ICU message parameters lack compile-time type checking. Errors only surface at runtime, violating the project's strict TypeScript safety goals. The `strictMessageTypeSafety` feature of next-intl is not properly configured.

## What Changes
- Implement `AppConfig.Messages` module augmentation for next-intl
- Enable `strictMessageTypeSafety` across all translation usage
- Create CI gate for i18n shape validation
- Remove `as unknown as` type assertions from translation calls

## Impact
- Affected specs: `i18n` (new)
- Affected code:
  - New: `src/types/next-intl.d.ts`
  - `src/i18n/request.ts`
  - `messages/en/critical.json`, `messages/en/deferred.json`
  - `scripts/validate-translations.js`
  - `scripts/i18n-shape-check.js`
  - All components using `useTranslations()` / `t()`

## Success Criteria
- Invalid translation keys fail `pnpm type-check`
- Missing ICU parameters fail type checking
- `pnpm i18n:shape:check` blocks CI on structure mismatch
- Zero `unknown as` assertions for i18n calls

## Dependencies
- None (P0 independent task)

## Rollback Strategy
- Remove `src/types/next-intl.d.ts` augmentation file
- Remove related CI shape gate
- Restore permissive typing (not recommended)
