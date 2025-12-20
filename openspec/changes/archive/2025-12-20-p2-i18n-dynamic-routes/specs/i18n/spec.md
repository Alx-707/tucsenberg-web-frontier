## ADDED Requirements

### Requirement: Dynamic Route Pathnames
The routing configuration SHALL include patterns for all dynamic routes.

#### Scenario: Blog slug in pathnames
- **WHEN** `routing.pathnames` is configured
- **THEN** it includes pattern for `/blog/[slug]`
- **AND** language switcher preserves slug on locale change

#### Scenario: Product slug in pathnames
- **WHEN** `routing.pathnames` is configured
- **THEN** it includes pattern for `/products/[slug]`
- **AND** language switcher preserves slug on locale change

### Requirement: Cache Metrics Alignment
Cache monitoring metrics SHALL reflect actual Data Cache behavior.

#### Scenario: Metrics match cache semantics
- **WHEN** cache metrics are reported
- **THEN** TTL values align with `cacheLife()` settings
- **AND** hit/miss rates reflect actual cache behavior
