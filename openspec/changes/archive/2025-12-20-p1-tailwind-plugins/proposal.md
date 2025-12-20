# Change: Tailwind Plugins Activation

## Why
`tailwindcss-animate` and `@tailwindcss/typography` are installed but not activated in Tailwind v4 CSS-first setup. This breaks `animate-in`, `prose`, and other utility classes used throughout the codebase.

## What Changes
- Add `@plugin` directives to `globals.css` for both plugins
- Fix `components.json` tailwind.config reference (should be empty for v4)
- Document plugin management convention

## Impact
- Affected specs: `ui-components`
- Affected code:
  - `src/app/globals.css`
  - `components.json`

## Success Criteria
- `prose` classes render typography styles
- `animate-*` classes produce animations
- Build output includes plugin styles
- shadcn CLI works correctly

## Dependencies
- None (independent task)

## Rollback Strategy
- Remove `@plugin` directives
- Simple git revert
