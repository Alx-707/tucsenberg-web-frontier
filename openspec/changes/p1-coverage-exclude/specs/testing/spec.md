## MODIFIED Requirements

### Requirement: Coverage Exclude Scope
The coverage exclude list SHALL only omit truly non-runtime code.

#### Scenario: Runtime config included
- **WHEN** measuring coverage
- **THEN** `src/config/**` files are included in metrics
- **AND** tests exist for security config and other runtime config

#### Scenario: Type definitions excluded
- **WHEN** measuring coverage
- **THEN** `**/*.d.ts` files are excluded
- **AND** test utilities and mocks are excluded

### Requirement: Fetch Mock Scoping
Global fetch mocks SHALL not hide real behavior in critical paths.

#### Scenario: i18n loading without mock
- **WHEN** running i18n-related tests
- **THEN** at least some tests verify real fs fallback behavior
- **AND** fetch mock is opt-in, not global default
