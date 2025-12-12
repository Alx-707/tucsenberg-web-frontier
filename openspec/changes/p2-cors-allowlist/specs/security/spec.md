## ADDED Requirements

### Requirement: CORS Allowlist
Form API endpoints SHALL use an allowlist for CORS instead of wildcard.

#### Scenario: Same-origin allowed
- **WHEN** request comes from same origin
- **THEN** CORS headers allow the request

#### Scenario: Unknown origin rejected
- **WHEN** request comes from unlisted origin
- **THEN** CORS headers are not sent
- **AND** browser blocks the request

#### Scenario: Configured origin allowed
- **WHEN** request comes from allowlisted origin
- **THEN** CORS headers allow the request
- **AND** allowlist is configurable via environment

### Requirement: CORS-Turnstile Alignment
CORS allowlist SHALL align with Turnstile hostname validation.

#### Scenario: Lists synchronized
- **WHEN** an origin is added to CORS allowlist
- **THEN** it is also valid in Turnstile hostname check
- **AND** configuration is in single source
