## ADDED Requirements

### Requirement: Compile-Time Translation Key Validation
The system SHALL validate translation keys at TypeScript compile time, rejecting invalid or missing keys before runtime.

#### Scenario: Invalid key fails type check
- **WHEN** a developer uses `t('nonexistent.key')` in code
- **THEN** `pnpm type-check` fails with a type error
- **AND** the error message indicates the invalid key

#### Scenario: Valid key passes type check
- **WHEN** a developer uses `t('common.buttons.submit')` (a valid key)
- **THEN** `pnpm type-check` passes
- **AND** the return type is inferred as `string`

### Requirement: ICU Message Parameter Type Safety
The system SHALL enforce correct parameter types for ICU message format strings at compile time.

#### Scenario: Missing required parameter fails
- **WHEN** a message requires `{count}` parameter but `t('items.count')` is called without it
- **THEN** TypeScript reports a type error for missing parameter

#### Scenario: Correct parameters pass
- **WHEN** `t('items.count', { count: 5 })` is called with all required parameters
- **THEN** the call compiles successfully

### Requirement: Message Structure Synchronization Gate
The system SHALL block CI when translation file structures diverge between locales.

#### Scenario: Shape mismatch blocks CI
- **WHEN** `messages/en/critical.json` has keys not present in `messages/zh/critical.json`
- **THEN** `pnpm i18n:shape:check` fails
- **AND** CI pipeline is blocked

#### Scenario: Synchronized structures pass
- **WHEN** all locale message files have identical key structures
- **THEN** shape check passes

### Requirement: AppConfig.Messages Type Augmentation
The system SHALL use next-intl's `AppConfig.Messages` module augmentation to derive translation types from the source JSON files.

#### Scenario: Type augmentation active
- **WHEN** `src/types/next-intl.d.ts` is included in the project
- **THEN** `useTranslations()` and `getTranslations()` return type-safe accessor functions
- **AND** autocomplete suggests valid keys in IDE

## REMOVED Requirements

### Requirement: Permissive Translation Type Assertions
The practice of using `as unknown as string` or similar assertions for translation calls SHALL be removed.

**Reason**: With proper type augmentation, assertions are unnecessary and hide errors.
**Migration**: Replace all assertions with properly typed calls; fix any resulting type errors.
