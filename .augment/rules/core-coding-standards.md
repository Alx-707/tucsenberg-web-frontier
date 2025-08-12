---
type: "always_apply"
description: "Foundational coding standards and AI decision framework for Tucsenberg B2B website"
---
# Tucsenberg Core Coding Standards

## AI Decision Framework (Enforced)

- Auto-load focused rules based on task type:
  - **Testing**: `testing-standards.md` (Vitest only, vi.hoisted patterns)
  - **Security**: `security-implementation.md` + `eslint-cicd-integration.md` (29 automated rules)
  - **TypeScript**: `typescript-safety-rules.md` (strict mode, interface-first)
  - **Quality/Complexity**: `quality-and-complexity.md` (function limits, refactor-first)
  - **Next.js/React**: `nextjs-architecture.md` (RSC patterns, App Router)
  - **UI/Design**: `ui-design-system.md` (shadcn/ui, SEO, Tailwind)
  - **i18n/Content**: `i18n-content-management.md` (next-intl, MDX content management)
  - **Services**: `service-integration.md` (Resend, Analytics, State)
  - **CI/CD**: `eslint-cicd-integration.md` (ESLint, pre-commit, GitHub Actions)
- Conflict resolution priority: 1) Core constraints (this file), 2) Satellite rules (topic-specific)
- Package manager: pnpm only

## Global Hard Constraints (Zero tolerance)

- TypeScript strict mode, no any, prefer interface over type, avoid enum, use satisfies
- exactOptionalPropertyTypes must be handled (no explicit undefined for optionals; use conditional spreading)
- Complexity: function length ≤ 120 lines; cyclomatic complexity ≤ 15; nesting depth ≤ 4; parameters ≤ 5
- Security: validate/normalize file system paths; avoid unsafe rendering of user-provided HTML; validate external inputs according to context
- Testing: Vitest only; no Jest APIs
- Architecture: Next.js 15 App Router with RSC by default; 'use client' only for interactivity
- Path alias: '@/'' resolves to './src/' consistently (tsconfig, next.config, ESLint)
- Bundle budgets: main ≤ 50KB, framework ≤ 130KB, CSS ≤ 50KB (enforce split/dynamic import if exceeded)
- CI quality gates: type-check, lint, tests, build must all pass with 0 warnings/errors

## Project-specific Stack

- **Next.js 15** + App Router, **React 19** Server Components first
- **next-intl** with strictMessageTypeSafety and Providers composition
- **shadcn/ui** + **Tailwind CSS** with clsx/tailwind-merge
- **Resend** for email delivery, **Vercel Analytics** for monitoring
- **@next/bundle-analyzer** for size analysis; **Vercel** deployment
- **Vitest** for testing, **Lefthook** for pre-commit hooks

### Cross-Reference Guide

- **Architecture patterns**: See `nextjs-architecture.md` for RSC/Client boundaries
- **UI components**: See `ui-design-system.md` for shadcn/ui and SEO patterns
- **Internationalization**: See `i18n-content-management.md` for next-intl and MDX content management setup
- **Service integrations**: See `service-integration.md` for Resend and Analytics
- **CI/CD setup**: See `eslint-cicd-integration.md` for complete pipeline

## Naming Conventions

- Boolean values prefixed with `is`, `has`, `can`, `should`, etc.
- Event handlers prefixed with `handle` (e.g., `handleSubmit`, `handleClick`)
- Directory names use **kebab-case** (e.g., `user-profile`, `contact-form`)
- Database models and Sanity schemas use **PascalCase** singular nouns (e.g., `User`, `BlogPost`)
- File and route paths use **kebab-case** aligned with URLs (e.g., `about-us.tsx`, `contact-form.tsx`)
- Prefer **named exports** over default exports for better tree-shaking and refactoring

### Naming Examples

```typescript
// ✅ Boolean naming
const isLoading = true;
const hasPermission = false;
const canEdit = user.role === 'admin';
const shouldShowModal = isAuthenticated && hasNotification;

// ✅ Event handler naming
const handleFormSubmit = (e: FormEvent) => { /* ... */ };
const handleButtonClick = () => { /* ... */ };
const handleInputChange = (value: string) => { /* ... */ };

// ✅ Component and file naming
// File: src/components/user-profile/UserProfile.tsx
export function UserProfile() { /* ... */ }

// File: src/lib/api-client.ts
export const apiClient = { /* ... */ };
export const fetchUserData = async () => { /* ... */ };

// ✅ Database model naming
interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: User;
}
```

## Git Commit Guidelines

- Follow **Conventional Commits** specification
- Format: `<type>[optional scope]: <description>`
- Main types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Breaking changes: prefix with `BREAKING CHANGE:` or append `!` after the type

### Commit Message Examples

```bash
# Feature commits
feat: add user authentication system
feat(auth): implement OAuth2 login flow
feat!: migrate to Next.js 15 App Router

# Bug fixes
fix: resolve memory leak in image optimization
fix(ui): correct button alignment in mobile view
fix(api): handle null response in user endpoint

# Documentation
docs: update API documentation for v2.0
docs(readme): add installation instructions

# Refactoring
refactor: extract common validation logic
refactor(components): simplify form state management

# Performance improvements
perf: optimize image loading with next/image
perf(db): add database query caching

# Tests
test: add unit tests for user service
test(e2e): add checkout flow integration tests

# Chores
chore: update dependencies to latest versions
chore(ci): configure GitHub Actions workflow
```

### Breaking Changes Format

```bash
# With ! notation
feat!: remove deprecated user API endpoints

# With BREAKING CHANGE footer
feat: update user authentication flow

BREAKING CHANGE: The authentication flow now requires OAuth2.
Previous session-based auth is no longer supported.
```

## Rule Adaptation and Configuration Gap Management

### Current Known Gaps and Solutions

#### **Component Structure Gap**
- **Rule Requirement**: `src/components/{server,client,shared}/` three-tier structure
- **Actual Implementation**: `src/components/{layout,ui,theme,contact,i18n,performance}/` functional grouping structure
- **Adaptation Strategy**:
  - Short-term: Maintain existing structure, clearly annotate Server/Client nature within components
  - Long-term: Create new components following ideal structure, gradually migrate existing components

#### **Path Alias Configuration**
- **Rule Requirement**: Single `@/*` alias
- **Historical Implementation**: Multiple granular aliases (`@/components/*`, `@/lib/*`, etc.)
- **Current Status**: ✅ Unified to `@/*` alias
- **Maintenance Requirement**: Avoid reintroducing multiple aliases

#### **Testing Configuration**
- **Rule Requirement**: Complete Mock configuration and environment variable handling
- **Historical Issues**: Incomplete Mock configuration, incorrect environment variable handling
- **Current Status**: ✅ Fixed Mock configuration, using vi.stubEnv for environment variables
- **Maintenance Requirement**: Follow comprehensive Mock templates when adding new tests

### Rule File Update Strategy

1. **Technical Error Fixes**: Immediately correct technical errors in rule files (e.g., incorrect ESLint rule names)
2. **Configuration Sync**: Regularly synchronize rule files with actual working configurations
3. **Progressive Improvement**: Allow gaps between actual project structure and ideal rules, but maintain clear migration paths
4. **Document Gaps**: Clearly record current gaps and adaptation strategies in rule files

## Logging Standards

### Production Environment Logging Strategy

**Core Principles**:
- **Prohibit console.log**: Production code must not use console.log for debug output
- **Structured logging**: Use unified log format and structured data
- **Context information**: Error logs must contain sufficient context for problem diagnosis
- **Environment distinction**: Development environment allows console.error/warn, production uses professional logging services

### Recommended Logging Implementation

```typescript
// src/lib/logger.ts
interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: number;
  [key: string]: string | number | boolean | undefined;
}

interface Logger {
  error: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
}

export const logger: Logger = {
  error: (message: string, context: LogContext = {}) => {
    const logEntry = {
      level: 'error',
      message,
      timestamp: Date.now(),
      ...context,
    };

    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service (Vercel Analytics, Sentry, etc.)
      console.error(JSON.stringify(logEntry));
    } else {
      console.error(message, context);
    }
  },

  warn: (message: string, context: LogContext = {}) => {
    const logEntry = {
      level: 'warn',
      message,
      timestamp: Date.now(),
      ...context,
    };

    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn(message, context);
    }
  },

  info: (message: string, context: LogContext = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(message, context);
    }
  },

  debug: (message: string, context: LogContext = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, context);
    }
  },
};

// Usage example
logger.error('User authentication failed', {
  userId: user.id,
  attemptCount: 3,
  ipAddress: request.ip
});
```

### ESLint Configuration

```javascript
// eslint.config.mjs - Logging rules configuration
{
  rules: {
    'no-console': ['error', {
      allow: ['error', 'warn'] // Only allow error and warning levels
    }],
  }
},

// Script files exception configuration
{
  name: 'scripts-config',
  files: ['scripts/**/*.{js,ts}', 'config/**/*.{js,ts}'],
  rules: {
    'no-console': 'off', // Build scripts allow console output
  }
}
```

### Usage Guidelines

**✅ Correct Usage**:
```typescript
import { logger } from '@/lib/logger';

// Error handling
try {
  await processPayment(paymentData);
} catch (error) {
  logger.error('Payment processing failed', {
    userId: user.id,
    paymentId: payment.id,
    errorCode: error.code,
  });
  throw error;
}

// Warning information
if (user.subscriptionExpired) {
  logger.warn('User subscription expired', {
    userId: user.id,
    expiredAt: user.subscriptionExpiredAt,
  });
}
```

**❌ Incorrect Usage**:
```typescript
// Don't use in production code
console.log('Debug info:', data); // Violates no-console rule
console.info('User logged in');   // Violates no-console rule

// Don't lack context information
logger.error('Something went wrong'); // Missing context
```

### Monitoring Integration

**Vercel Analytics Integration**:
```typescript
// src/lib/analytics-logger.ts
import { track } from '@vercel/analytics';

export function logUserAction(action: string, properties: Record<string, any>) {
  track(action, properties);

  if (process.env.NODE_ENV === 'development') {
    logger.info(`User action: ${action}`, properties);
  }
}
```

## Quick Checklist

- Before coding: confirm task type and applicable rules; TS config strict; Vitest in use
- During coding: obey function/complexity limits; validate inputs; use '@/'; avoid client components unless needed; follow naming conventions
- After coding: run type-check, lint, test, build; check bundle budgets; ensure i18n support; write conventional commit messages

