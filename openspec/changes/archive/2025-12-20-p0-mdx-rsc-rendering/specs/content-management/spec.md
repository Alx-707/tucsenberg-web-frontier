## ADDED Requirements

### Requirement: MDX RSC Rendering Pipeline
The system SHALL render all MDX content through React Server Components using Next.js native `@next/mdx` integration, eliminating direct HTML string injection.

#### Scenario: Blog post renders as RSC
- **WHEN** a user navigates to `/[locale]/blog/[slug]`
- **THEN** the MDX content is compiled to React components at build time
- **AND** rendered as a Server Component without `dangerouslySetInnerHTML`

#### Scenario: Product page renders as RSC
- **WHEN** a user navigates to `/[locale]/products/[slug]`
- **THEN** the MDX content is compiled and rendered as Server Components

#### Scenario: Custom components available in MDX
- **WHEN** MDX content references custom components (e.g., `<Callout>`, `<ProductGallery>`)
- **THEN** the components are resolved via `mdx-components.tsx` injection
- **AND** TypeScript type safety is preserved

### Requirement: Content Manifest System
The system SHALL maintain a content manifest mapping content types, locales, and slugs to file paths.

#### Scenario: Manifest generation during build
- **WHEN** `pnpm content:manifest` or `pnpm build` executes
- **THEN** `reports/content-manifest.json` is generated with all content entries
- **AND** each entry includes `type`, `locale`, `slug`, and `filePath`

#### Scenario: Manifest-driven static params
- **WHEN** `generateStaticParams()` is called for content pages
- **THEN** it reads from the manifest to enumerate all valid routes
- **AND** missing content returns 404 rather than build failure

### Requirement: Zero innerHTML Content Injection
The system SHALL NOT use `dangerouslySetInnerHTML` for any user-facing content rendering.

#### Scenario: Security audit passes
- **WHEN** running `grep -r "dangerouslySetInnerHTML" src/app`
- **THEN** no matches are found for content-related components
- **AND** only legitimate uses (if any) in third-party integrations are documented

## MODIFIED Requirements

### Requirement: Blog Post Display
The blog detail page SHALL render MDX content through the RSC pipeline instead of HTML string injection.

#### Scenario: Existing blog posts render correctly
- **WHEN** navigating to any existing blog post URL
- **THEN** the content displays with proper typography styling
- **AND** code blocks, images, and links function correctly

#### Scenario: Front matter extraction preserved
- **WHEN** an MDX file contains front matter
- **THEN** metadata (title, date, tags) is extracted for SEO and display
- **AND** the body content is rendered separately
