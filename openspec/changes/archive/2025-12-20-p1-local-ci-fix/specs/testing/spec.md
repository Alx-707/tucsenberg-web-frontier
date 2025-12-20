## MODIFIED Requirements

### Requirement: Local CI Simulation
The `scripts/ci-local.sh` script SHALL accurately mirror GitHub Actions CI behavior.

#### Scenario: All commands exist
- **WHEN** `pnpm ci:local` executes
- **THEN** all referenced npm scripts exist in package.json
- **AND** no "command not found" errors occur

#### Scenario: Results match remote CI
- **WHEN** running `pnpm ci:local` on clean code
- **THEN** the pass/fail result matches what GitHub Actions would produce
- **AND** the same quality gates are applied
