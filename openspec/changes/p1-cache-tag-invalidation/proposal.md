# Change: Cache Tag Invalidation System

## Why
Current caching relies solely on time-based TTL (`cacheLife`). There's no mechanism for immediate invalidation when content or translations change, potentially causing up to 1-day staleness after updates.

## What Changes
- Implement `cacheTag()` for i18n and content data functions
- Add `revalidateTag()` / `revalidatePath()` trigger points
- Define stable tag naming convention
- Create invalidation hooks in sync scripts

## Impact
- Affected specs: `i18n`, `content-management`
- Affected code:
  - `src/lib/load-messages.ts`
  - `src/lib/content/**`
  - `src/lib/content-query/**`
  - Sync scripts (`pnpm i18n:full`, content slug sync)

## Success Criteria
- Content updates reflect immediately after invalidation
- Tags follow `domain:entity:identifier[:locale]` convention
- Invalidation can be triggered via script or webhook

## Dependencies
- None (can start independently)

## Rollback Strategy
- Remove `cacheTag()` calls, revert to time-only TTL
- Feature flag for invalidation behavior
