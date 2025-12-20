# Change: CSS-First Responsive System

## Why
`useBreakpoint` and `ResponsiveLayout` require client hydration for layout decisions, adding JS overhead and causing layout shifts. Default breakpoint constant reuses unrelated `BYTES_PER_KB`.

## What Changes
- Migrate layout-level responsive logic to Tailwind CSS
- Create semantic breakpoint constants
- Limit `useBreakpoint` to interaction-only use cases
- Add ESLint rule to discourage new global breakpoint hooks

## Impact
- Affected specs: `ui-components`
- Affected code:
  - `src/hooks/use-breakpoint.ts`
  - `src/components/**Responsive*`
  - Breakpoint constants

## Success Criteria
- Layout responsive via CSS, not hydration
- No `BYTES_PER_KB` used for breakpoints
- New breakpoint hooks discouraged by lint

## Dependencies
- **Benefits from**: p1-tailwind-plugins (CSS utilities)

## Rollback Strategy
- Revert to JS-based responsive
- Constants change is backwards compatible
