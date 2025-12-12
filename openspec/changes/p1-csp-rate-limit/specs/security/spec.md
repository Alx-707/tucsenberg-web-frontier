## ADDED Requirements

### Requirement: CSP Directive Consistency
The Content Security Policy SHALL have semantically consistent directives without conflicts.

#### Scenario: frame-src valid
- **WHEN** `frame-src` directive is generated
- **THEN** it does not contain both `'none'` and allowlist domains
- **AND** browsers interpret it correctly

#### Scenario: CSP reporting active
- **WHEN** CSP is applied to responses
- **THEN** `report-uri` directive points to `/api/csp-report`
- **AND** violations are logged and can be monitored

### Requirement: Distributed Rate Limiting
The system SHALL enforce rate limits that work across serverless instances.

#### Scenario: Rate limit persists across instances
- **WHEN** a client hits rate limit on instance A
- **THEN** subsequent request to instance B also returns 429
- **AND** the limit state is shared via distributed store

#### Scenario: Rate limit response format
- **WHEN** rate limit is exceeded
- **THEN** response is 429 with `Retry-After` header
- **AND** body contains structured error message

### Requirement: Turnstile Verification Single Source
All Turnstile verification SHALL use a single shared implementation.

#### Scenario: API routes use shared verifier
- **WHEN** `/api/contact`, `/api/inquiry`, `/api/subscribe` verify Turnstile
- **THEN** they all call the same verification function
- **AND** hostname/action validation rules are consistent
