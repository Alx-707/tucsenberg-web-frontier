## MODIFIED Requirements

### Requirement: Footer Navigation Configuration
The system SHALL provide a configurable footer with navigation links pointing only to existing routes.

#### Scenario: Template footer structure
- **WHEN** the footer is rendered
- **THEN** it displays three columns: Navigation, Support, and Social
- **AND** Navigation contains links to: home, about, products, blog, contact
- **AND** Support contains links to: faq, privacy, terms
- **AND** Social contains placeholder links for github, twitter, linkedin

#### Scenario: No dead links
- **WHEN** footer links are configured
- **THEN** all internal links point to routes that exist in the application
- **AND** no links point to non-existent routes like /enterprise, /pricing, /ai-policy

### Requirement: Placeholder Content Convention
The system SHALL use a consistent placeholder format for template customization.

#### Scenario: Placeholder format
- **WHEN** template content requires customization
- **THEN** placeholders use square bracket format: `[PLACEHOLDER_NAME]`
- **AND** placeholders are searchable with standard text tools

#### Scenario: Required placeholders
- **WHEN** setting up a new project from template
- **THEN** the following placeholders must be replaced:
  - `[PROJECT_NAME]` - Company/project name
  - `[BASE_URL]` - Site base URL
  - `[EMAIL]` - Contact email
  - `[GITHUB_URL]`, `[TWITTER_URL]`, `[LINKEDIN_URL]` - Social links

## REMOVED Requirements

### Requirement: Product Content
**Reason**: Products are business-specific and not suitable for a generic template.
**Migration**: Delete all product MDX files, keep directory structure with .gitkeep.

### Requirement: Business-Specific Blog Posts
**Reason**: Existing blog posts contain Tucsenberg-specific content.
**Migration**: Replace with 1-2 sample posts demonstrating content structure.

### Requirement: Vercel Footer Links
**Reason**: External Vercel links are reference design artifacts, not template features.
**Migration**: Remove all vercel.com, nextjs.org, turbo.build external links from footer.
