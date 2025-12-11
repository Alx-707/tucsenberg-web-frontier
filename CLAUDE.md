<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

## Project: B2B Foreign Trade Enterprise Website Template

**Stack**: Next.js 16 (App Router, Cache Components) + React 19 + TypeScript 5 + Tailwind CSS 4 + next-intl

**Philosophy**: Adopt latest stable tech stack versions, maximize new features for performance.

**Purpose**: Enterprise website template with i18n (en/zh), SSR/SSG, and enterprise-grade quality gates.

---

## Project Structure

```
src/
├── app/[locale]/          # App Router pages (async Server Components)
├── components/            # UI components (shadcn/ui based)
├── lib/                   # Utilities, content loaders, services
├── i18n/                  # next-intl config (request.ts, routing.ts)
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
content/{posts,pages,products}/{locale}/ # MDX content files
messages/[locale]/         # i18n JSON (critical.json + deferred.json)
```

---

## Essential Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm type-check   # TypeScript validation
pnpm lint         # ESLint check
pnpm test         # Vitest unit tests
```

---

## Hard Constraints

1. **TypeScript strict** - No `any`, prefer `interface`
2. **Server Components first** - Use `"use client"` only for interactivity
3. **i18n required** - All user-facing text must use translation keys
4. **Complexity limits** - Function ≤120 lines, File ≤500 lines

---

## Codebase Exploration

Use **ace `search_context`** for semantic/exploratory queries before attempting multiple Grep searches. Built-in tools (Grep, Glob, Read) suffice for precise symbol lookups.

For Next.js specifics: `nextjs_docs` MCP tool.

---

## Communication

Reply in Chinese. Technical terms (e.g., `Server Component`, `useEffect`) stay in English.
