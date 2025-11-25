---
type: "always_apply"
description: "Comprehensive documentation and maintenance guide for Augment rules system, including file organization, usage patterns, and best practices"
---

# Augment Rules Documentation

## 📋 Rule Files Overview

### 🎯 Core Rule Files

| File | Type | Description | Key Content |
|------|------|-------------|-------------|
| `core-coding-standards.md` | `always` | Core coding standards and AI decision framework | Hard constraints, naming conventions, Git commit guidelines |
| `nextjs-architecture.md` | `auto` | Next.js 16 architecture & migration guide | Turbopack default, Async Request APIs, Cache Components |
| `ui-design-system.md` | `auto` | UI design system guide | shadcn/ui, SEO optimization, optional extensions |
| `i18n-content-management.md` | `auto` | Internationalization and content management | next-intl, MDX, multilingual sync |
| `typescript-safety-rules.md` | `auto` | TypeScript safety rules | Strict mode, type safety, interface-first |
| `security-implementation.md` | `auto` | Security implementation guide | Path validation, CSP, dependency scanning |
| `quality-and-complexity.md` | `auto` | Quality and complexity control | Function limits, refactoring strategy, complexity budgets |
| `testing-standards.md` | `auto` | Testing standards | Vitest, mocking, test structure |
| `eslint-cicd-integration.md` | `auto` | ESLint and CI/CD integration | RSC boundaries, pre-commit hooks, pipelines |
| `service-integration.md` | `auto` | Service integration guide | Resend, Analytics, state management |

### 📚 Archived Files

| File | Status | Description |
|------|--------|-------------|
| `coding-standards.md` | `archived` | Original comprehensive coding standards backup |

## 🔄 Rule File Relationships

```
core-coding-standards.md (Core)
├── nextjs-architecture.md (Architecture)
│   ├── eslint-cicd-integration.md (CI/CD)
│   └── service-integration.md (Services)
├── ui-design-system.md (UI)
├── i18n-content-management.md (i18n)
├── typescript-safety-rules.md (Type Safety)
├── security-implementation.md (Security)
├── quality-and-complexity.md (Quality)
└── testing-standards.md (Testing)
```

## 🎯 Rule Types

### `always` Type
- Always loaded, contains core constraints and decision framework
- Highest priority in conflict resolution
- Example: `core-coding-standards.md`

### `auto` Type
- Auto-loaded based on task type
- Provides domain-specific detailed guidance
- Works in conjunction with core rules

### `manual` Type
- Manually referenced rule files
- Used for special cases or backups

## 📖 Usage Guide

### Developer Quick Reference

**Starting new task**: Review `core-coding-standards.md` + task-related rule files

**Common task mappings**:
- React components → `nextjs-architecture.md` + `ui-design-system.md`
- API routes → `nextjs-architecture.md` + `service-integration.md`
- Testing → `testing-standards.md` | i18n → `i18n-content-management.md` | Security → `security-implementation.md`

**Quality checks**: `pnpm run lint:full` (see `eslint-cicd-integration.md`)

### AI Assistant Auto-Loading

- **Architecture** → `nextjs-architecture.md`
- **UI/Design** → `ui-design-system.md`
- **Testing** → `testing-standards.md`
- **Security** → `security-implementation.md`
- **i18n** → `i18n-content-management.md`
