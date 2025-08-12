---
type: "auto"
description: "Next.js 15 App Router, React Server Components (RSC) vs Client Components, Vercel deployment, Turbopack dev, SWC build, @next/bundle-analyzer, CSP & security headers, Sentry, CI/CD with pnpm"
---

# Next.js 15 Architecture

## React Hooks 规范

- **调用顺序**: Hooks 必须在组件顶层、相同顺序调用，禁止条件性调用
- **依赖完整**: useEffect/useMemo/useCallback 依赖数组必须包含所有使用的变量
- **修复策略**: 条件逻辑移入 Hook 内部；复杂场景拆分独立组件
- **ESLint**: `react-hooks/rules-of-hooks: error`, `react-hooks/exhaustive-deps: error` Guidelines

## Project Structure Constraints

- **Source code directory**: All source code must be in `src/` directory only
- **App Router structure**: Use `src/app/[locale]/` for internationalized routing
- **Component layering**: Follow strict component organization:
  - `src/components/ui/` - shadcn/ui base components
  - `src/components/layout/` - layout and navigation components
  - `src/components/home/` - homepage-specific components
  - `src/components/i18n/` - internationalization components
  - `src/components/performance/` - performance monitoring components
  - `src/components/theme/` - theme-related components
- **Content management**: Store MDX content in `content/` with language separation
- **Static assets**: All static files must be in `public/` directory

## Path Alias Configuration

- Use `@/` alias for all project imports; ensure consistency across `tsconfig.json`, `next.config.ts`, and ESLint configuration

## React 19 Server Components Guidelines

- All pages default to **React Server Components**; opt into **Client Components** only for interactivity
- For performance-sensitive components, explicitly optimize with `React.memo`, `useMemo`, and `useCallback`
- Do not use relative paths that traverse outside `src`; always import modules via the `@/` alias

### File Organization for Server/Client Components

#### 理想结构 (目标架构)

```
src/
├── components/
│   ├── server/          # Server Components (data fetching, async operations)
│   │   ├── ProductList.tsx
│   │   ├── BlogPosts.tsx
│   │   └── UserProfile.tsx
│   ├── client/          # Client Components (interactivity, hooks, events)
│   │   ├── ContactForm.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Navigation.tsx
│   │   └── SearchInput.tsx
│   └── shared/          # Pure presentational components (no state/events)
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Typography.tsx
```

#### 当前项目结构 (实际实现)

```
src/
├── components/
│   ├── layout/          # 布局相关组件 (导航、页眉、页脚等)
│   │   ├── MainNavigation.tsx
│   │   ├── MobileNavigation.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── ThemeToggle.tsx
│   ├── ui/              # shadcn/ui 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Sheet.tsx
│   │   └── ...
│   └── theme/           # 主题相关组件
│       ├── ThemeProvider.tsx
│       └── ThemeToggle.tsx
```

#### 结构适应策略

**短期适应** (保持当前结构，逐步优化)：
- `layout/` 目录：混合Server/Client组件，按功能分组
- `ui/` 目录：主要为纯展示组件，符合shared组件理念
- `theme/` 目录：主要为Client组件，处理交互逻辑

**长期迁移** (逐步向理想结构靠拢)：
1. 将 `layout/` 中的Server组件移至 `server/`
2. 将 `layout/` 和 `theme/` 中的Client组件移至 `client/`
3. 保持 `ui/` 作为 `shared/` 组件的实现

**迁移指导原则**：
- 优先保持功能稳定性，避免大规模重构
- 新组件按理想结构创建
- 重构时逐步调整现有组件位置

### Server Components Development Patterns

```typescript
// ✅ Server Component (default) - Data fetching and async operations
async function ProductContainer() {
  const products = await fetchProducts(); // Direct database/API access
  const user = await getCurrentUser();

  return (
    <div>
      <ProductList products={products} />
      <UserWelcome user={user} />
    </div>
  );
}

// ✅ Server Component with error handling
async function BlogPostsContainer() {
  try {
    const posts = await fetchBlogPosts();
    return <BlogPostList posts={posts} />;
  } catch (error) {
    return <ErrorMessage message="Failed to load blog posts" />;
  }
}
```

### Client Components Development Patterns

```typescript
// ✅ Client Component - Interactive features
'use client';
import { useState } from 'react';

function ContactForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button disabled={isSubmitting}>Submit</button>
    </form>
  );
}

// ✅ Client Component - Browser APIs
'use client';
import { useEffect, useState } from 'react';

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored) setTheme(stored as 'light' | 'dark');
  }, []);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Common Anti-patterns to Avoid

```typescript
// ❌ Server Component with hooks (will cause error)
function BadServerComponent() {
  const [state, setState] = useState(0); // Error: hooks not allowed
  return <div>{state}</div>;
}

// ❌ Server Component with event handlers (will cause error)
function BadServerComponent() {
  return <button onClick={() => console.log('click')}>Click</button>; // Error: events not allowed
}

// ❌ Server Component with browser APIs (will cause error)
function BadServerComponent() {
  const width = window.innerWidth; // Error: window not available
  return <div>Width: {width}</div>;
}
```

### Data Serialization Rules

```typescript
// ✅ Serializable props (safe to pass from Server to Client)
interface SerializableProps {
  title: string;
  count: number;
  isActive: boolean;
  data: { id: number; name: string }[];
  config: Record<string, string>;
  date: string; // ISO string, not Date object
}

// ❌ Non-serializable props (will cause runtime errors)
interface NonSerializableProps {
  onClick: () => void;           // Functions cannot be serialized
  instance: MyClass;             // Class instances cannot be serialized
  element: HTMLElement;          // DOM nodes cannot be serialized
  date: Date;                    // Date objects cannot be serialized
  symbol: Symbol;                // Symbols cannot be serialized
}

// ✅ Correct pattern: Server fetches data, Client handles interaction
// Server Component
async function ProductPageContainer({ productId }: { productId: string }) {
  const product = await fetchProduct(productId);
  return <ProductPageClient product={product} />;
}

// Client Component
'use client';
function ProductPageClient({ product }: { product: SerializableProduct }) {
  const [quantity, setQuantity] = useState(1);
  const handleAddToCart = () => { /* handle interaction */ };

  return (
    <div>
      <h1>{product.name}</h1>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

### React Server / Client Boundary Guidelines

To prevent serialization errors and ensure a clean separation between Server and Client Components:

- **No non-serializable props**: Server Components must not pass functions, class instances, Symbols, or DOM nodes via props.
- **Client directive**: Any component that contains event handlers (`onClick`, `onSubmit`, etc.) or uses React hooks such as `useState` or `useEffect` **must** begin with `'use client';`.
- **Container-presentational split**: Fetch data in a Server Component _container_ and render interactivity in a Client Component _presentational_ child.
- **Lint enforcement**: Enable `eslint-plugin-react-server` (or the RSC rule set from `@next/eslint-plugin-react`) and add the CI command `pnpm run lint:rsc`; the build must fail on `react-server/no-server-function-props` violations.

### Component Development Guidelines

- **Server Components**: Use for data fetching and async operations (default)
- **Client Components**: Use `'use client'` directive only for interactivity
- **Error Handling**: Implement proper try-catch blocks in server components
- **State Management**: Use React hooks in client components for local state

## Build & Package Management

- Use **pnpm ≥ 8** as the package manager
- Development: `next dev --turbo` (Turbopack hot reload)
- Production build: `next build` (SWC)
- Monitor bundle size with **@next/bundle-analyzer**; split dynamic imports when needed
- Ensure `.npmrc` sets `shamefully-hoist=false` and `shared-workspace-lockfile=true`

### Package Manager Configuration

```bash
# .npmrc
shamefully-hoist=false
shared-workspace-lockfile=true
auto-install-peers=true
strict-peer-dependencies=false
```

### Bundle Analysis Setup

```javascript
// next.config.ts
import { withBundleAnalyzer } from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer({
  // Your Next.js config
});
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "analyze": "ANALYZE=true next build",
    "size:check": "bundlesize"
  }
}
```

### Path Alias Constraints (Build Configuration)

Maintain a single, canonical alias for project imports:

- The alias `@/` **must** always resolve to `./src/`.
- This mapping **must** be identical in `tsconfig.json`, `next.config.ts`, and ESLint's import resolver.
- When moving files or restructuring directories, update the alias configuration **first**, then move code.
- A custom script `pnpm run alias:check` should assert alias consistency during CI.

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// next.config.ts
export default {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};
```

## Environment Variables & Config Validation

- Define and validate env vars in `env.mjs` using **@t3-oss/env-nextjs**
- Fail CI if required variables are missing
- **Never** commit any `.env.*` files to the repository

### Environment Configuration

- Use **@t3-oss/env-nextjs** for environment variable validation
- Define server and client variables with Zod schemas
- Fail CI builds if required variables are missing

## Monitoring & Logging

- Enable **@vercel/analytics** and initialize in `src/app/layout.tsx`
- Report Core Web Vitals via **web-vitals**
- Use **Vercel function logs** for server-side monitoring and API route performance tracking
- Implement **basic error logging** with console.error collection, suitable for enterprise websites
- Provide a custom **Error Boundary** for user-friendly error pages
- Track key business events with **Vercel Analytics** custom events

### Analytics Integration

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Boundary Implementation

```typescript
// src/components/error-boundary.tsx
'use client';
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    // Optional: Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Performance Monitoring

```typescript
// src/lib/performance-monitor.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function initPerformanceMonitoring() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// Usage in layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initPerformanceMonitoring();
    }
  }, []);

  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
```

## CI/CD Guidelines

- Use **Lefthook** pre-commit hooks to run lint, tests, and type checks
- Validate commit messages with **commitlint**
- GitHub Actions workflow: install → lint → typecheck → test → build → deploy
- Use **Dependabot** for dependency upgrades and security patches
- Deploy to **Vercel** (Preview and Production environments)
- Add an **architecture validation** job: `pnpm arch:validate`
- Add a **security scanning** job: `pnpm security:check`

### CI/CD Pipeline Commands

```bash
pnpm install
pnpm type-check:strict
pnpm lint:strict
pnpm format:check
pnpm test
pnpm build
pnpm arch:validate
pnpm security:check
pnpm size:check
```

## Enhanced ESLint Configuration

- **React Server Components**: Enforce RSC boundary rules with `eslint-plugin-react-server`
- **Security rules**: 29 automated security rules (19 ESLint + 10 Semgrep)
- **ESLint**: Use recommended plugins and rules for React, Next.js, and import organization
- **Import organization**: Automatic import sorting and path alias validation

**📋 See `eslint-cicd-integration.md` for complete ESLint configuration and CI/CD setup**

## Security Guidelines

- Enable **strict CSP** site-wide via `headers()` in `next.config.ts`
- Set security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`
- Use **botid** for form protection and bot detection on contact forms and key interactions
- Implement **basic rate limiting** via Next.js Middleware for API routes when needed
- Run `pnpm audit` in CI and enable **GitHub Dependabot** for automatic security updates

### Security Headers

- Configure security headers in `next.config.ts`
- Include: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`
- Enable CSP and referrer policy for enhanced security

## Service Integration Guidelines

- **@sentry/nextjs** - Error monitoring and performance tracking
- Optional: Integrate analytics or third-party services as needed by business requirements
