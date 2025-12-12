## MODIFIED Requirements

### Requirement: Coverage Threshold Enforcement
The system SHALL enforce coverage thresholds through a single authoritative source: `scripts/quality-gate.js`.

#### Scenario: Quality gate enforces coverage
- **WHEN** `pnpm quality:gate` is executed
- **THEN** it reads coverage from `reports/coverage/coverage-summary.json`
- **AND** compares against thresholds defined only in `quality-gate.js`
- **AND** exits with non-zero code if below threshold

#### Scenario: Vitest produces data only
- **WHEN** `pnpm test:coverage` runs
- **THEN** it generates coverage reports (JSON, HTML)
- **AND** does NOT enforce any thresholds (no `coverage.thresholds` in config)
- **AND** always exits successfully if tests pass

#### Scenario: CI uses single gate
- **WHEN** GitHub Actions CI runs
- **THEN** only one invocation of `pnpm quality:gate` is made
- **AND** no duplicate coverage threshold checks exist in workflow files

### Requirement: Quality Gate Single Source of Truth
The `scripts/quality-gate.js` script SHALL be the sole location for all quality thresholds and blocking logic.

#### Scenario: Threshold modification
- **WHEN** a developer needs to adjust coverage thresholds
- **THEN** they modify only `scripts/quality-gate.js`
- **AND** no other file requires changes for threshold updates

#### Scenario: Local CI mirrors remote
- **WHEN** `pnpm ci:local` is executed
- **THEN** it produces the same pass/fail result as GitHub Actions CI
- **AND** uses the same `quality-gate.js` for enforcement

### Requirement: Reduced PR Required Checks
The system SHALL minimize duplicate CI checks for pull requests.

#### Scenario: No conflicting coverage checks
- **WHEN** a PR is opened
- **THEN** only one coverage-related check appears in required checks
- **AND** developers can clearly identify which gate failed

## REMOVED Requirements

### Requirement: Vitest Coverage Thresholds
Direct threshold enforcement in `vitest.config.mts` SHALL be removed.

**Reason**: Creates duplicate enforcement with conflicting semantics.
**Migration**: All threshold logic moves to `quality-gate.js`.

### Requirement: Duplicate CI Coverage Gates
Separate coverage threshold checks in individual workflow files SHALL be consolidated.

**Reason**: Multiple sources of truth cause unpredictable behavior.
**Migration**: Single `quality:gate` call per workflow.
