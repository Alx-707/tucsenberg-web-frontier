# Change: Lighthouse Coverage and Image Optimization

## Why
Lighthouse CI only covers 3 critical URLs, missing potential regressions in other routes. Hero/first-screen images lack blur placeholders, impacting LCP perception.

## What Changes
- Expand `lighthouserc.js` criticalUrls to include key business routes
- Implement blur placeholder strategy for hero images
- Review and update `remotePatterns` allowlist

## Impact
- Affected specs: `performance` (new)
- Affected code:
  - `lighthouserc.js`
  - `next.config.ts` (images.remotePatterns)
  - Hero image components

## Success Criteria
- Lighthouse covers /products, /blog, /contact
- Hero images have blur placeholders
- No broken images from missing remote patterns

## Dependencies
- None (independent task)

## Rollback Strategy
- Reduce criticalUrls back to original set
- Remove blur placeholders if causing issues
