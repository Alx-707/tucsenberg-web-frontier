## MODIFIED Requirements

### Requirement: CSS-First Responsive Design
Layout-level responsive behavior SHALL use CSS, not JavaScript hydration.

#### Scenario: Layout responsive via CSS
- **WHEN** page loads without JavaScript
- **THEN** layout responds correctly to viewport width
- **AND** no layout shift occurs during hydration

#### Scenario: Breakpoint constants semantic
- **WHEN** breakpoint values are referenced in code
- **THEN** they use semantic constants (BREAKPOINT_LG, etc.)
- **AND** unrelated constants (BYTES_PER_KB) are not reused

### Requirement: Limited JS Breakpoint Usage
JavaScript breakpoint hooks SHALL only be used for interaction logic.

#### Scenario: Lint discourages new usage
- **WHEN** a developer imports `useBreakpoint`
- **THEN** ESLint warns about the import
- **AND** documentation explains approved use cases
