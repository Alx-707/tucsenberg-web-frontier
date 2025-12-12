## 1. Draft Control
- [ ] 1.1 Update `content/config/content.json` default: `enableDrafts: false`
- [ ] 1.2 Add env check: only enable drafts when `NODE_ENV=development` or `CONTENT_ENABLE_DRAFTS=true`
- [ ] 1.3 Add build-time check: warn/fail if drafts would be published

## 2. Validator Enhancement
- [ ] 2.1 Add `products` type recognition to `validateContentMetadata`
- [ ] 2.2 Enforce required fields: `slug`, `locale`
- [ ] 2.3 Read `content.json.validation` section for rules
- [ ] 2.4 Apply validation rules: draft handling, max length, required fields

## 3. Content Parser Integration
- [ ] 3.1 Update `content-parser.ts` to use enhanced validator
- [ ] 3.2 Add strict mode for production builds
- [ ] 3.3 Log clear error messages for validation failures

## 4. Sync Script Updates
- [ ] 4.1 Update `pnpm content:slug-check` to validate products
- [ ] 4.2 Ensure slug/locale consistency across locales
- [ ] 4.3 Add pre-build validation hook

## 5. Validation
- [ ] 5.1 Test: draft posts not in production build
- [ ] 5.2 Test: products validation works like posts
- [ ] 5.3 Test: missing slug/locale fails validation
- [ ] 5.4 Run `pnpm build` in production mode
