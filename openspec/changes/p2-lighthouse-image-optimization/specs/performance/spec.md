## ADDED Requirements

### Requirement: Lighthouse Coverage Expansion
Lighthouse CI SHALL test all key business routes, not just a minimal set.

#### Scenario: Business routes tested
- **WHEN** Lighthouse CI runs
- **THEN** it tests: home, products listing, blog listing, contact
- **AND** at least one dynamic page per content type

### Requirement: Hero Image Optimization
First-screen images SHALL use blur placeholders for improved perceived performance.

#### Scenario: Blur placeholder present
- **WHEN** a hero image loads
- **THEN** a blur placeholder is shown immediately
- **AND** the full image fades in when loaded

#### Scenario: Remote patterns configured
- **WHEN** images from allowed domains are used
- **THEN** they load without errors
- **AND** the remote patterns allowlist is documented
