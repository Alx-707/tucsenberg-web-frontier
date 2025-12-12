## ADDED Requirements

### Requirement: Single Primary CI Workflow
The system SHALL use `ci.yml` as the sole required workflow for pull request validation.

#### Scenario: PR triggers single comprehensive check
- **WHEN** a pull request is opened or updated
- **THEN** only `ci.yml` runs quality gates (type-check, lint, test, coverage)
- **AND** other workflows do not duplicate these checks

#### Scenario: Deep scans run separately
- **WHEN** code is pushed to main or on schedule
- **THEN** `code-quality.yml` runs deep scans (Semgrep full, architecture)
- **AND** these are informational, not blocking PRs

### Requirement: Clear Workflow Responsibilities
Each CI workflow SHALL have a distinct, non-overlapping purpose.

#### Scenario: ci.yml responsibility
- **WHEN** reviewing ci.yml
- **THEN** it contains: type-check, lint, unit tests, coverage gate, e2e, lighthouse
- **AND** all gates delegate to `quality-gate.js`

#### Scenario: code-quality.yml responsibility
- **WHEN** reviewing code-quality.yml
- **THEN** it contains only: Semgrep full scan, architecture audit, trend reports
- **AND** no duplicate type-check/lint/test steps

#### Scenario: vercel-deploy.yml responsibility
- **WHEN** reviewing vercel-deploy.yml
- **THEN** it contains only: build, MISSING_MESSAGE check, health probe
- **AND** relies on ci.yml passing first
