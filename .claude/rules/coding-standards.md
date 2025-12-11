# Coding Standards

## TypeScript

### Strict Mode
- `strict: true`, `noImplicitAny: true`
- **No `any`** (tests have limited exceptions)
- Prefer `interface` over `type`
- Use `satisfies` for type-safe object literals
- Avoid `enum`, use `const` objects

### exactOptionalPropertyTypes

Cannot pass explicit `undefined` to optional properties:

```typescript
// ❌ Error
const config: Config = { name: 'test', description: undefined };

// ✅ Correct: conditional spread
const config: Config = { name: 'test', ...(desc ? { description: desc } : {}) };
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | `use` prefix | `useBreakpoint.ts` |
| Utilities | camelCase | `formatPrice.ts` |
| Constants | SCREAMING_SNAKE | `MAX_ITEMS` |
| Directories | kebab-case | `user-profile/` |
| Booleans | `is/has/can/should` | `isLoading` |
| Event handlers | `handle` prefix | `handleSubmit` |

## Imports

### Path Aliases
Always use `@/` alias. No deep relative imports.

### Import Order (Prettier enforced)

Configured in `.prettierrc.json` via `@ianvs/prettier-plugin-sort-imports`:

1. `react`, `react/*`
2. `next`, `next/*`
3. Third-party modules
4. `@/types/*`
5. `@/lib/*`
6. `@/components/*`
7. `@/app/*`
8. Other `@/*` aliases
9. Relative imports (`./`, `../`)

## Constants

- No magic numbers
- Organize by domain in `src/constants/`
- Use `as const`
- User-facing text must use i18n keys

## Logging

- **No `console.log` in production**
- Only `console.error`, `console.warn` allowed
- Use `src/lib/logger.ts` for structured logging

## Git Commits

Conventional Commits: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`
