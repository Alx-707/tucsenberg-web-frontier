# Change: MDX Production Strategy - Draft Control and Validation

## Why
`enableDrafts: true` in production could expose unpublished content. The content validator doesn't recognize `products` type or enforce `slug/locale` fields, and `content.json.validation` settings aren't used.

## What Changes
- Production defaults to `enableDrafts: false`
- Extend validator to support `products` type
- Enforce `slug/locale` in front matter
- Read and apply `content.json.validation` settings

## Impact
- Affected specs: `content-management`
- Affected code:
  - `content/config/content.json`
  - `src/lib/content-validation.ts`
  - `src/lib/content-parser.ts`
  - Content sync scripts

## Success Criteria
- Drafts never appear in production builds
- Products metadata validated like posts/pages
- Missing slug/locale fails validation
- `content.json` validation settings applied

## Dependencies
- **Depends on**: p0-mdx-rsc-rendering (content system foundation)

## Rollback Strategy
- Set `enableDrafts: true` explicitly if needed
- Revert validator changes
