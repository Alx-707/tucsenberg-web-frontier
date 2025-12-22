## MODIFIED Requirements

### Requirement: Node.js Runtime Compatibility

The project SHALL support Node.js versions 20.x through 22.x for development and production environments.

The `engines.node` field in `package.json` SHALL be set to `>=20 <23` to allow flexibility in development environments while maintaining LTS compatibility.

#### Scenario: Development environment with Node.js 22

- **WHEN** a developer uses Node.js 22.x
- **THEN** all pnpm commands execute successfully
- **AND** the development server starts without engine compatibility errors

#### Scenario: CI environment with Node.js 20

- **WHEN** CI pipeline runs with Node.js 20.x (LTS)
- **THEN** all build and test commands complete successfully
- **AND** production builds are generated correctly

### Requirement: Dependency Version Alignment

The project SHALL maintain compatible versions across related package ecosystems to ensure stability.

When upgrading core dependencies (React, Next.js, TypeScript), related packages (types, plugins, configs) SHALL be upgraded together to matching versions.

#### Scenario: Next.js ecosystem upgrade

- **WHEN** `next` is upgraded to a new minor version
- **THEN** `@next/mdx`, `@next/bundle-analyzer`, `@next/eslint-plugin-next`, and `eslint-config-next` SHALL be upgraded to the same version
- **AND** all type-check, lint, and build commands pass

#### Scenario: React ecosystem upgrade

- **WHEN** `react` and `react-dom` are upgraded
- **THEN** `@types/react` and `@testing-library/react` SHALL be upgraded to compatible versions
- **AND** all unit tests pass without hydration or type errors
