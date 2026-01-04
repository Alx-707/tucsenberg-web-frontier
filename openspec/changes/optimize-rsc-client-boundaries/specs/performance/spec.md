## ADDED Requirements

### Requirement: Dynamic Import Module Scope
Dynamic imports using `next/dynamic` SHALL be declared at module scope, not inside component render functions.

#### Scenario: Dynamic import at module scope
- **WHEN** a component uses `next/dynamic` for code splitting
- **THEN** the `dynamic()` call MUST be at module scope (top-level)
- **AND** the import is created once per module load, not per render

### Requirement: Server Component Default
Components without interactivity (no hooks, event handlers, or browser APIs) SHALL be Server Components by default.

#### Scenario: Static Link component as Server
- **WHEN** a component only renders static content with Link and Image
- **THEN** it SHALL NOT have `'use client'` directive
- **AND** it receives any dynamic data (like locale) via props

### Requirement: Context Provider Minimal Scope
React Context Providers SHALL wrap only the components that consume the context.

#### Scenario: Provider scope matches consumers
- **WHEN** a Context Provider is used in the component tree
- **THEN** it SHALL wrap only the subtree containing actual consumers
- **AND** unrelated components SHALL NOT be descendants of the Provider

### Requirement: Single Attribution Initialization
UTM attribution data SHALL be stored exactly once per page load, not in multiple components.

#### Scenario: Attribution stored once
- **WHEN** a user visits any page
- **THEN** `storeAttributionData()` SHALL be called exactly once in a dedicated bootstrap component
- **AND** form components SHALL only read/append attribution data, not store it
