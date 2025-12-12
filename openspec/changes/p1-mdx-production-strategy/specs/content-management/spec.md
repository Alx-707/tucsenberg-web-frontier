## ADDED Requirements

### Requirement: Production Draft Control
The system SHALL prevent draft content from appearing in production builds by default.

#### Scenario: Drafts hidden in production
- **WHEN** `NODE_ENV=production` and no explicit override
- **THEN** content with `draft: true` is excluded from builds
- **AND** not accessible via URLs

#### Scenario: Drafts enabled for development
- **WHEN** `NODE_ENV=development` or `CONTENT_ENABLE_DRAFTS=true`
- **THEN** draft content is visible for preview

### Requirement: Products Metadata Validation
The content validator SHALL recognize and validate `products` content type.

#### Scenario: Products validated like posts
- **WHEN** a product MDX file is processed
- **THEN** its front matter is validated against products schema
- **AND** required fields (slug, locale, title) are enforced

#### Scenario: Validation config applied
- **WHEN** `content.json.validation` specifies rules
- **THEN** those rules are applied during validation
- **AND** violations cause clear error messages
