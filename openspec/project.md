# Project Context

## Purpose

B2B Foreign Trade Enterprise Website Template - a production-ready Next.js website template for international trade businesses with full i18n support (en/zh), enterprise-grade performance, and comprehensive SEO optimization.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Cache Components enabled)
- **React**: 19 (with Server Components)
- **TypeScript**: 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **i18n**: next-intl
- **Testing**: Vitest + React Testing Library + Playwright
- **Package Manager**: pnpm
- **CI/CD**: GitHub Actions

## Project Conventions

### Code Style

- **TypeScript strict mode**: No `any`, prefer `interface` over `type`
- **Naming**: PascalCase (components), camelCase (utils), SCREAMING_SNAKE (constants)
- **Imports**: Use `@/` path aliases, no deep relative imports
- **No magic numbers**: All constants in `src/constants/`
- **No `console.log` in production**: Only `console.error`, `console.warn` allowed

### Architecture Patterns

- **Server Components first**: Use `"use client"` only when interactivity required
- **Cache Components**: `cacheLife()` for cache duration control
- **Async Request APIs**: `params`, `searchParams`, `cookies()`, `headers()` must be awaited
- **Locale routing**: `/[locale]/page-name` pattern with `en`, `zh` support

### Testing Strategy

- **Coverage target**: 85% global threshold (currently ~38%)
- **Stack**: Vitest + React Testing Library (unit/integration), Playwright (E2E)
- **Patterns**: See `TESTING_STANDARDS.md` for canonical patterns
- **ESM mocks**: Must use `vi.hoisted()` pattern
- **Server Component testing**: Use `Promise.resolve(params)` for async props

### Git Workflow

- **Conventional Commits**: `type(scope): description`
- **Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`
- **Branch strategy**: Feature branches from `main`

## Domain Context

- **Target audience**: B2B foreign trade enterprises
- **Content types**: Products (MDX), Blog posts (MDX), Static pages
- **Locales**: English (en) as default, Chinese (zh) supported
- **Forms**: Contact form with Cloudflare Turnstile CSRF protection

## Important Constraints

- **Complexity limits**: Function ≤120 lines, File ≤500 lines
- **Quality gates**: Zero TypeScript errors, Zero ESLint warnings
- **Performance**: Lighthouse score ≥0.85, TBT ≤200ms, CLS ≤0.15
- **Security**: All user input validated with Zod, no unfiltered `dangerouslySetInnerHTML`

## External Dependencies

- **Airtable**: Form submission storage
- **Resend**: Email notifications
- **Cloudflare Turnstile**: CAPTCHA/CSRF protection
- **Vercel**: Deployment platform (planned)
