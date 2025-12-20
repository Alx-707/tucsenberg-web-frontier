## 1. Breakpoint Constants
- [x] 1.1 Create `src/constants/breakpoints.ts`
- [x] 1.2 Define `BREAKPOINT_SM`, `BREAKPOINT_MD`, `BREAKPOINT_LG`, etc.
- [x] 1.3 Remove `BYTES_PER_KB` usage for breakpoints

## 2. Component Migration
- [x] 2.1 Audit `useBreakpoint` usage across codebase
- [x] 2.2 Identify layout-level usages (to migrate)
- [x] 2.3 Identify interaction usages (to keep)
- [x] 2.4 Migrate layout usages to Tailwind responsive

## 3. ResponsiveLayout Update
- [x] 3.1 Review `ResponsiveLayout` component
- [x] 3.2 Replace with CSS-based approach where possible
- [x] 3.3 Document remaining JS-required cases

## 4. Lint Rule
- [x] 4.1 Add eslint rule to warn on new `useBreakpoint` imports
- [x] 4.2 Document approved use cases

## 5. Validation
- [x] 5.1 Test responsive behavior without JS
- [x] 5.2 Verify no layout shift on hydration
- [x] 5.3 Run visual regression tests
