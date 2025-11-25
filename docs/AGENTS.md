# Repository Guidelines

## Project Overview
- Modern B2B enterprise website template built with Next.js 16 + React 19 + TypeScript 5.9 + Tailwind CSS 4.
- Supports English/Chinese internationalization, theme switching, and responsive design.

## Project Structure & Module Organization
- `src/app` holds the Next.js App Router entrypoints, layouts, routes, and global styles; `src/components` for shared UI; `src/features` for vertical slices; `src/lib`/`src/shared` for utilities; `src/config` for feature flags and theme config; `content` and `messages` store MDX/content and i18n JSON (critical/deferred split); `public` for static assets; `tests` for Vitest/Playwright suites; `scripts` for automation and quality gates.
- Prefer the `@/` alias (see `tsconfig.json`) instead of deep relative imports; avoid `export *` re-exports (pre-commit architecture guard blocks them).

## Internationalization
- Uses next-intl with layered translations: `messages/{locale}/critical.json` for首屏, `messages/{locale}/deferred.json` for懒加载片段。
- 验证翻译：`pnpm validate:translations`。

## Build, Test, and Development Commands
- Install: `pnpm install` (Node 20.x, pnpm 10.13.x required).
- Develop: `pnpm dev` or `pnpm dev:turbopack` (faster HMR).
- Type safety & lint: `pnpm type-check`, `pnpm lint:check`, `pnpm lint:fix`.
- Formatting: `pnpm format:write` (Prettier 3 + Tailwind plugin) or `pnpm format:check`.
- Tests: `pnpm test` (Vitest), `pnpm test:coverage`, `pnpm test:e2e` (Playwright, headless), `pnpm test:e2e:no-reuse` for clean contexts.
- Quality gates: `pnpm ci:local` (build+lint+tests), `pnpm quality:gate`, `pnpm security:check`, `pnpm i18n:full` (scan/sync/validate translations), `pnpm validate:translations`。
- Build & serve: `pnpm build` (Next 16), `pnpm start` for production server.

## Coding Style & Naming Conventions
- Language: TypeScript/React 19 + Next.js 16; follow ESLint flat config in `eslint.config.mjs` (strict: no `console` in app code, max 3 params, prefer const, security rules). ESLint forbids Jest imports; use Vitest APIs.
- Formatting: Prettier defaults (2-space, single quotes where configured) with import sorting and Tailwind class ordering.
- Naming: Components in `PascalCase`, hooks/functions/vars in `camelCase`, files/kebab-case. Tests mirror source path with `.test.ts(x)` or `.spec.ts(x)`.
- Imports: use `@/` aliases; avoid relative traversals and star exports per hooks.

## Key Configuration Files
- `next.config.ts` (MDX, next-intl, bundle analyzer)。
- `vitest.config.mts` (jsdom env、coverage 门槛)。
- `playwright.config.ts` (E2E 生产构建运行)。
- `src/config/contact-form-config.ts`、`src/config/security.ts`。

## Testing Guidelines
- Unit/component tests via Vitest + Testing Library (`tests/**` or `**/__tests__/**`). Prefer RTL queries by role/text; avoid brittle selectors.
- E2E via Playwright (`pnpm test:e2e`); keep fixtures in `tests/e2e` and record videos only when needed.
- Run `pnpm test:coverage` when touching critical logic; include new edge cases (i18n fallbacks, feature flags, SSR/CSR boundaries).

## Commit & Pull Request Guidelines
- Commits follow Conventional Commits enforced by commitlint (`feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert(scope): summary`, lower-case, subject ≤72 chars).
- Hooks (Lefthook) run format/type/lint/architecture/i18n checks on commit; build, translations, quality gate, and security run on push (set `RUN_FAST_PUSH=1` only for emergencies).
- PRs: include issue link, scope of change, test evidence (`pnpm test`/`pnpm test:e2e`/`pnpm ci:local` output), and UI diffs/screenshots for visual updates. Keep PRs small and focused.

## Security & Configuration
- Environment: keep secrets in `.env.local`; required keys include `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` for Turnstile, plus optional WhatsApp/feature-flag envs (see `next.config.ts` and `src/config`).
- Run `pnpm security:check` and `pnpm config:check` before releases; avoid committing real credentials or adding new `export *` entrypoints that bypass security linting.
- Conductor 暂不启用：当前 Next.js 16 下 next-intl 支持不完善，等待官方完善后再评估开启，期间请勿启用。

## Agent-Specific Instructions
- 所有思考过程与回复需使用中文，专业术语保持英语（如 lint、hook、coverage、alias）。
- 当进行代码/样式/配置的新增或修改时，必须先用 context7 查询官方文档，对齐最新最佳实践后再实施变更。
- 仅做信息记录、现状梳理且不涉及实现决策的文档更新时，可视情况跳过 context7。
- 禁止硬编码：内容、语言、颜色、间距等均须使用配置/翻译/设计 tokens；新增文案必须走 i18n（messages），新增颜色/尺寸须走主题/Token 或 Tailwind 配置，避免直接写死值或文本。
