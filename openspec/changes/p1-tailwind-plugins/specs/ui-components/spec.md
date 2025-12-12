## MODIFIED Requirements

### Requirement: Tailwind Plugin Configuration
The UI system SHALL activate Tailwind CSS plugins via CSS-first `@plugin` directives.

#### Scenario: Typography plugin active
- **WHEN** building the application
- **THEN** `@tailwindcss/typography` styles are included
- **AND** `prose` classes render properly styled content

#### Scenario: Animation plugin active
- **WHEN** building the application
- **THEN** `tailwindcss-animate` keyframes are included
- **AND** `animate-in`, `fade-in`, `slide-in-*` classes function

#### Scenario: shadcn CLI compatibility
- **WHEN** running `npx shadcn add [component]`
- **THEN** components are generated correctly
- **AND** `components.json` does not reference non-existent tailwind.config
