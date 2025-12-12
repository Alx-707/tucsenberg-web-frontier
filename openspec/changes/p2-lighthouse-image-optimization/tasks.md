## 1. Lighthouse URL Expansion
- [x] 1.1 Add `/[locale]/products` to criticalUrls
- [x] 1.2 Add `/[locale]/blog` to criticalUrls
- [x] 1.3 Add `/[locale]/contact` to criticalUrls
- [x] 1.4 Consider adding one dynamic page (e.g., first product)

## 2. Image Remote Patterns
- [x] 2.1 Review current `remotePatterns` in next.config.ts
- [x] 2.2 Add any missing image domains
- [x] 2.3 Document pattern management process

## 3. Blur Placeholder Implementation
- [x] 3.1 Identify hero/first-screen images
- [x] 3.2 Generate blurDataURL for static images
- [x] 3.3 Add `placeholder="blur"` to critical images
- [x] 3.4 For remote images, implement blur strategy

## 4. Validation
- [ ] 4.1 Run `pnpm perf:lighthouse`
- [ ] 4.2 Verify all criticalUrls pass thresholds
- [ ] 4.3 Check LCP improvement with blur placeholders
- [ ] 4.4 Verify no broken images
