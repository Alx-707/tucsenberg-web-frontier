## 1. Plugin Activation
- [ ] 1.1 Add `@plugin "tailwindcss-animate";` to top of `globals.css`
- [ ] 1.2 Add `@plugin "@tailwindcss/typography";` to `globals.css`
- [ ] 1.3 Verify plugin order doesn't conflict

## 2. shadcn Configuration
- [ ] 2.1 Update `components.json`: set `tailwind.config` to empty string
- [ ] 2.2 Verify `tailwind.css` path is correct
- [ ] 2.3 Test `npx shadcn add` works correctly

## 3. Build Verification
- [ ] 3.1 Run `pnpm build`
- [ ] 3.2 Check `.next/static/css` for `prose` styles
- [ ] 3.3 Check for `animate-in` keyframes

## 4. Visual Verification
- [ ] 4.1 Check blog pages have proper typography
- [ ] 4.2 Check dialog/menu animations work
- [ ] 4.3 Document plugin management in code comments
