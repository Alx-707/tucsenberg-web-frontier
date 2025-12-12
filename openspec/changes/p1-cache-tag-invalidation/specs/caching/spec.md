## ADDED Requirements

### Requirement: Cache Tag System
The system SHALL support tag-based cache invalidation using Next.js `cacheTag()` API.

#### Scenario: i18n messages tagged
- **WHEN** translation messages are loaded with caching
- **THEN** they are tagged with `i18n:{type}:{locale}` format
- **AND** can be invalidated by tag

#### Scenario: Content tagged
- **WHEN** blog/product content is loaded with caching
- **THEN** it is tagged with `content:{type}:{slug}:{locale}` format
- **AND** can be invalidated individually

### Requirement: Tag-Based Invalidation
The system SHALL provide mechanisms to invalidate cached data by tag.

#### Scenario: Content sync triggers invalidation
- **WHEN** `pnpm i18n:full` or content sync runs
- **THEN** relevant cache tags are invalidated via `revalidateTag()`
- **AND** subsequent requests get fresh data

#### Scenario: Tag naming convention
- **WHEN** creating cache tags
- **THEN** they follow pattern: `domain:entity:identifier[:locale]`
- **AND** domain is from fixed set: `i18n`, `content`, `product`, `seo`
