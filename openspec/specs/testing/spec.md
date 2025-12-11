# Testing Capability

## Purpose

Comprehensive testing infrastructure for ensuring code quality, coverage targets, and regression prevention across the Next.js 16 application.
## Requirements
### Requirement: Coverage Threshold Enforcement

The testing system SHALL enforce a minimum 85% global code coverage threshold. Build SHALL fail if coverage drops below this threshold.

#### Scenario: Coverage meets threshold
- **WHEN** test suite runs with coverage
- **THEN** build passes if lines, statements, functions, and branches all meet 85%

#### Scenario: Coverage below threshold
- **WHEN** coverage for any metric falls below 85%
- **THEN** build fails with clear indication of which metric failed

### Requirement: ESM Mock Pattern

All module mocks SHALL use the `vi.hoisted()` pattern to ensure ESM compatibility with Vitest.

#### Scenario: Module mock declaration
- **WHEN** a test file needs to mock a module
- **THEN** mock variables are declared inside `vi.hoisted()` callback
- **AND** `vi.mock()` references those hoisted variables

#### Scenario: Invalid mock pattern
- **WHEN** mock variables are declared outside `vi.hoisted()`
- **THEN** tests may fail due to ESM module loading order

### Requirement: Server Component Testing

Async Server Components with Promise-based params SHALL be tested using `Promise.resolve()` for parameter props.

#### Scenario: Page component with async params
- **WHEN** testing a page component that accepts `params: Promise<{ locale: string }>`
- **THEN** test passes params as `Promise.resolve({ locale: 'en' })`
- **AND** awaits the component before rendering

#### Scenario: Rendering awaited component
- **WHEN** Server Component is awaited in test
- **THEN** result is passed to `render()` from React Testing Library

### Requirement: i18n Mock Configuration

Tests SHALL mock `next-intl/server` with `getTranslations` and `setRequestLocale` functions.

#### Scenario: Translation mock setup
- **WHEN** test requires i18n support
- **THEN** `mockGetTranslations` returns a function that maps keys to translated strings
- **AND** `setRequestLocale` is mocked as `vi.fn()`

#### Scenario: Missing translation key
- **WHEN** translation key is not in mock map
- **THEN** mock returns the key itself as fallback

### Requirement: JSON-LD Schema Testing

Pages with structured data SHALL have tests validating JSON-LD script injection.

#### Scenario: JSON-LD script presence
- **WHEN** page renders with structured data
- **THEN** container has `script[type="application/ld+json"]` element

#### Scenario: Schema validation
- **WHEN** JSON-LD script content is parsed
- **THEN** `@type` property matches expected schema type
- **AND** required properties are present and valid

### Requirement: Component Isolation

Unit tests SHALL mock child components to isolate the unit under test.

#### Scenario: Child component mocking
- **WHEN** parent component imports child components
- **THEN** child components are mocked with minimal implementations
- **AND** mock renders identifiable test elements (e.g., data-testid)

#### Scenario: Mock factory pattern
- **WHEN** mock needs to accept props
- **THEN** mock is defined as a function component returning simplified JSX

### Requirement: Progressive Coverage Threshold Enforcement

The testing system SHALL implement progressive coverage thresholds that increase as each phase completes, preventing sudden coverage jumps at the end.

#### Scenario: Phase 0 completion (Security)
- **WHEN** Phase 0 is completed
- **THEN** global coverage SHALL reach at least 45%
- **AND** all security modules SHALL have ≥90% coverage
- **AND** CI SHALL emit warning if below threshold (non-blocking)

#### Scenario: Phase 1 completion (External Integrations)
- **WHEN** Phase 1 is completed
- **THEN** global coverage SHALL reach at least 50%
- **AND** WhatsApp modules SHALL have ≥85% coverage
- **AND** CI SHALL emit warning if below threshold (non-blocking)

#### Scenario: Phase 2 completion (Core Libraries)
- **WHEN** Phase 2 is completed
- **THEN** global coverage SHALL reach at least 60%
- **AND** i18n/locale/performance modules SHALL have ≥85% coverage
- **AND** CI SHALL emit warning if below threshold (non-blocking)

#### Scenario: Phase 3 completion (API Routes)
- **WHEN** Phase 3 is completed
- **THEN** global coverage SHALL reach at least 70%
- **AND** all API routes SHALL have ≥90% coverage
- **AND** CI threshold SHALL be updated to 70% (blocking)

#### Scenario: Phase 4 completion (Pages)
- **WHEN** Phase 4 is completed
- **THEN** global coverage SHALL reach at least 80%
- **AND** all page components SHALL have ≥85% coverage
- **AND** CI threshold SHALL be updated to 80% (blocking)

#### Scenario: Phase 5 completion (UI/Hooks)
- **WHEN** Phase 5 is completed
- **THEN** global coverage SHALL reach at least 85%
- **AND** UI components SHALL have ≥70% coverage
- **AND** hooks SHALL have ≥85% coverage
- **AND** CI threshold SHALL be updated to 85% (blocking, final)

### Requirement: API Route Testing Pattern

All API route tests SHALL mock Next.js request/response objects and validate HTTP semantics.

#### Scenario: NextRequest mock setup
- **WHEN** testing an API route handler
- **THEN** NextRequest SHALL be mocked with appropriate method, headers, and body
- **AND** cookies() and headers() SHALL be mocked if used

#### Scenario: Response validation
- **WHEN** API route returns a response
- **THEN** test SHALL verify status code
- **AND** test SHALL verify response body structure
- **AND** test SHALL verify error handling for invalid inputs

### Requirement: External HTTP Service Testing Pattern

Tests for modules that call external APIs SHALL mock the HTTP layer without hitting real endpoints.

#### Scenario: WhatsApp API mock
- **WHEN** testing WhatsApp integration modules
- **THEN** global fetch SHALL be mocked
- **AND** mock SHALL return appropriate success/error responses
- **AND** test SHALL verify request payload structure

#### Scenario: Network error handling
- **WHEN** external API call fails
- **THEN** test SHALL verify error is caught and handled
- **AND** test SHALL verify appropriate error response/logging

### Requirement: Storage API Testing Pattern

Tests for localStorage/cookie modules SHALL mock browser storage APIs in Node.js environment.

#### Scenario: localStorage mock
- **WHEN** testing locale-storage-local modules
- **THEN** global localStorage SHALL be mocked with getItem/setItem/removeItem
- **AND** mock SHALL track stored values for assertions

#### Scenario: Cookie storage mock
- **WHEN** testing locale-storage-cookie modules
- **THEN** document.cookie setter/getter SHALL be mocked
- **AND** mock SHALL handle cookie parsing and serialization

#### Scenario: Storage fallback testing
- **WHEN** storage API is unavailable (throws)
- **THEN** test SHALL verify graceful degradation
- **AND** test SHALL verify fallback behavior

### Requirement: Performance API Testing Pattern

Tests for performance monitoring modules SHALL mock browser Performance API.

#### Scenario: Performance.now mock
- **WHEN** testing timing-related code
- **THEN** performance.now SHALL be mocked with controlled values
- **AND** test SHALL verify timing calculations

#### Scenario: PerformanceObserver mock
- **WHEN** testing web vitals collection
- **THEN** PerformanceObserver SHALL be mocked
- **AND** mock SHALL simulate entry callbacks
- **AND** test SHALL verify metric processing

### Requirement: Timer Testing Pattern

Tests involving setTimeout/setInterval SHALL use Vitest fake timers.

#### Scenario: Fake timer setup
- **WHEN** test involves time-dependent behavior
- **THEN** vi.useFakeTimers() SHALL be called in beforeEach
- **AND** vi.useRealTimers() SHALL be called in afterEach

#### Scenario: Timer advancement
- **WHEN** test needs to trigger timer callbacks
- **THEN** vi.advanceTimersByTime() SHALL be used
- **AND** test SHALL verify callback execution

### Requirement: Test Pattern Consistency

All new tests SHALL follow the patterns defined in `TESTING_STANDARDS.md` to ensure consistency and maintainability.

#### Scenario: ESM mock pattern usage
- **WHEN** a new test file is created
- **THEN** module mocks SHALL use `vi.hoisted()` pattern
- **AND** mock variables SHALL be declared inside the hoisted callback

#### Scenario: Server Component test pattern
- **WHEN** testing an async Server Component
- **THEN** params SHALL be passed as `Promise.resolve()`
- **AND** component SHALL be awaited before rendering

#### Scenario: i18n mock consistency
- **WHEN** test requires translation support
- **THEN** `next-intl/server` mock SHALL include both `getTranslations` and `setRequestLocale`
- **AND** mock implementation SHALL follow centralized pattern

### Requirement: Coverage Regression Prevention

The CI pipeline SHALL prevent coverage regressions by enforcing minimum thresholds on new code.

#### Scenario: New code coverage check
- **WHEN** new code is added to a PR
- **THEN** the new code SHALL have ≥90% test coverage
- **AND** global coverage SHALL not decrease

#### Scenario: Coverage gate failure
- **WHEN** coverage drops below current phase threshold
- **THEN** CI build SHALL fail (if blocking phase)
- **AND** clear error message SHALL indicate which metric failed

## Coverage Priority Matrix

| Priority | Category | Target |
|----------|----------|--------|
| P0 | Core Business Logic | 90%+ |
| P1 | API Routes/Actions | 90%+ |
| P2 | Page Components | 85%+ |
| P3 | UI Components | 70%+ |
| P4 | Utilities | 92%+ |
