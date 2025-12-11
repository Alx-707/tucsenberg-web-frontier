---
paths: "**/*.{test,spec}.{ts,tsx}, tests/**/*"
---

# Testing Standards

## Framework

- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Config**: `vitest.config.mts`

## Commands

```bash
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
pnpm test:e2e          # Playwright E2E tests
pnpm type-check:tests  # Type-check test files
```

## Test File Organization

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── __tests__/
│           └── button.test.tsx
└── lib/
    ├── utils.ts
    └── __tests__/
        └── utils.test.ts

tests/
├── e2e/           # Playwright tests
├── integration/   # Cross-module tests
└── unit/          # Isolated unit tests
```

## Test Quality Budgets

| Metric | Limit |
|--------|-------|
| Test function length | ≤ 160 lines (recommended ≤ 100) |
| Cyclomatic complexity | ≤ 20 |
| Parameters | ≤ 5 (relaxed for tests) |

Extract helpers to `__tests__/utils` or `src/test/` when exceeding limits.

## vi.hoisted Usage

**ESM Mock core technique**: `vi.hoisted` declares variables that must exist before module loading.

**Key rule**: `vi.hoisted` callback **cannot reference external imports**, only inline literals.

```typescript
// ❌ Error: referencing external import
import { someHelper } from './helpers';
const mockFn = vi.hoisted(() => {
  return someHelper(); // ESM initialization order error!
});

// ✅ Correct: use inline literals
const mockFn = vi.hoisted(() => vi.fn());
const mockData = vi.hoisted(() => ({
  id: 'test-id',
  name: 'Test Name'
}));

vi.mock('@/lib/api', () => ({
  fetchData: mockFn
}));
```

## Centralized Mock System

**Must use centralized mocks**, no duplicate creation:

| Resource | Path |
|----------|------|
| i18n mock messages | `src/test/constants/mock-messages.ts` |
| Test utilities | `@/test/utils` (`renderWithIntl`, `createMockTranslations`) |
| Mock utilities | `src/test/mock-utils.ts` |

```typescript
// ✅ Correct: use centralized mocks
import { renderWithIntl } from '@/test/utils';
import { mockMessages } from '@/test/constants/mock-messages';

// ❌ Error: duplicate creation
const mockMessages = { ... }; // Forbidden!
function renderWithIntl() { ... } // Forbidden!
```

**Exception**: Local mocks allowed only when testing i18n core config. Must comment reason.

## Writing Tests

### Naming Convention
```typescript
describe('ComponentName', () => {
  it('should [expected behavior] when [condition]', () => {
    // ...
  });
});
```

### Testing Async Server Components
Server Components cannot be rendered directly in Vitest. Test their logic separately:
```typescript
// Test the data fetching function, not the component
import { getAllProductsCached } from '@/lib/content/products';

describe('getAllProductsCached', () => {
  it('should return product list', async () => {
    const products = await getAllProductsCached('en');
    expect(products).toBeDefined();
  });
});
```

### Mocking
- Mock external services (Airtable, Resend) in tests
- Use `vi.mock()` for module mocking
- Translation mocks available in test setup

## Coverage Requirements

- Aim for meaningful coverage, not 100%
- Critical paths: authentication, payment, data validation
- UI components: test user interactions, not implementation details
