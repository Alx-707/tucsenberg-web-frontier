## 1. Plugin Activation
- [x] 1.1 Add `@plugin "tailwindcss-animate";` to top of `globals.css`
- [x] 1.2 Add `@plugin "@tailwindcss/typography";` to `globals.css`
- [x] 1.3 Verify plugin order doesn't conflict

## 2. shadcn Configuration
- [x] 2.1 Update `components.json`: set `tailwind.config` to empty string
- [x] 2.2 Verify `tailwind.css` path is correct
- [x] 2.3 Test `npx shadcn add` works correctly

## 3. Build Verification
- [x] 3.1 Run `pnpm build`
- [x] 3.2 Check `.next/static/css` for `prose` styles
- [x] 3.3 Check for `animate-in` keyframes

## 4. Visual Verification
- [x] 4.1 Check blog pages have proper typography
- [x] 4.2 Check dialog/menu animations work
- [x] 4.3 Document plugin management in code comments
