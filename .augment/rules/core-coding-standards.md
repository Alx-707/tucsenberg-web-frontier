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
  - **i18n/Content**: `i18n-content-management.md` (next-intl, TinaCMS, MDX)
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
- **Internationalization**: See `i18n-content-management.md` for next-intl and TinaCMS setup
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

## 规则适应与实际配置差距处理

### 当前已知差距与解决方案

#### **组件结构差距**
- **规则要求**: `src/components/{server,client,shared}/` 三层结构
- **实际实现**: `src/components/{layout,ui,theme}/` 功能分组结构
- **适应策略**:
  - 短期：保持现有结构，在组件内部明确标注Server/Client性质
  - 长期：新组件按理想结构创建，现有组件逐步迁移

#### **路径别名差距**
- **规则要求**: 单一 `@/*` 别名
- **历史实现**: 多个细分别名 (`@/components/*`, `@/lib/*` 等)
- **当前状态**: ✅ 已统一为 `@/*` 别名
- **维护要求**: 避免重新引入多个别名

#### **测试配置差距**
- **规则要求**: 完整的Mock配置和环境变量处理
- **历史问题**: Mock配置不完整，环境变量处理错误
- **当前状态**: ✅ 已修复Mock配置，使用vi.stubEnv处理环境变量
- **维护要求**: 新增测试时遵循完善的Mock模板

### 规则文件更新策略

1. **技术错误修复**: 立即修正规则文件中的技术错误（如错误的ESLint规则名）
2. **配置同步**: 定期同步规则文件与实际工作配置
3. **渐进式改进**: 允许实际项目结构与理想规则存在差距，但要有明确的迁移路径
4. **文档化差距**: 在规则文件中明确记录当前差距和适应策略

## 日志记录规范

### 生产环境日志策略

**核心原则**：
- **禁止console.log**: 生产代码中不允许使用console.log进行调试输出
- **结构化日志**: 使用统一的日志格式和结构化数据
- **上下文信息**: 错误日志必须包含足够的上下文信息用于问题诊断
- **环境区分**: 开发环境允许console.error/warn，生产环境使用专业日志服务

### 推荐的日志实现

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
      // 发送到监控服务 (Vercel Analytics, Sentry等)
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

// 使用示例
logger.error('User authentication failed', {
  userId: user.id,
  attemptCount: 3,
  ipAddress: request.ip
});
```

### ESLint配置

```javascript
// eslint.config.mjs - 日志记录规则配置
{
  rules: {
    'no-console': ['error', {
      allow: ['error', 'warn'] // 仅允许错误和警告级别
    }],
  }
},

// 脚本文件例外配置
{
  name: 'scripts-config',
  files: ['scripts/**/*.{js,ts}', 'config/**/*.{js,ts}'],
  rules: {
    'no-console': 'off', // 构建脚本允许console输出
  }
}
```

### 使用指导

**✅ 正确做法**：
```typescript
import { logger } from '@/lib/logger';

// 错误处理
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

// 警告信息
if (user.subscriptionExpired) {
  logger.warn('User subscription expired', {
    userId: user.id,
    expiredAt: user.subscriptionExpiredAt,
  });
}
```

**❌ 错误做法**：
```typescript
// 不要在生产代码中使用
console.log('Debug info:', data); // 违反no-console规则
console.info('User logged in');   // 违反no-console规则

// 不要缺少上下文信息
logger.error('Something went wrong'); // 缺少上下文
```

### 监控集成

**Vercel Analytics集成**：
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

