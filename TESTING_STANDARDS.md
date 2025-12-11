# Testing Standards

This document defines the canonical testing patterns for this project. All new tests must follow these standards for consistency.

## Stack

- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Coverage Target**: 85% global threshold

## ESM Mock Pattern (vi.hoisted)

All module mocks must use `vi.hoisted()` to ensure variables exist before module loading:

```typescript
// ✅ Correct: vi.hoisted for mock declarations
const { mockGetTranslations, mockFunction } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
  mockFunction: vi.fn(),
}));

vi.mock('module-name', () => ({
  exportedFunction: mockFunction,
}));
```

**Key rule**: `vi.hoisted` callback cannot reference external imports, only inline literals.

## next-intl/server Mock

Standard mock for internationalization:

```typescript
const { mockGetTranslations } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
  setRequestLocale: vi.fn(),
}));

// In beforeEach:
mockGetTranslations.mockResolvedValue((key: string) => {
  const map: Record<string, string> = {
    'pageTitle': 'Page Title',
    'description': 'Description text',
  };
  return map[key] ?? key;
});
```

## Async Server Component Testing

Server Components with async params must be tested with Promise.resolve:

```typescript
interface PageProps {
  params: Promise<{ locale: string; slug?: string }>;
}

// Test pattern:
const defaultParams = { locale: 'en', slug: 'test-slug' };

it('should render correctly', async () => {
  const PageComponent = await ServerComponentPage({
    params: Promise.resolve(defaultParams),
  });

  render(PageComponent);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

## Component Mock Pattern

Mock child components to isolate unit under test:

```typescript
vi.mock('@/components/feature', () => ({
  ChildComponent: ({ title }: { title: string }) => (
    <div data-testid="child-component">{title}</div>
  ),
}));
```

## next/cache Mock (Cache Components)

For pages using `cacheLife()`:

```typescript
vi.mock('next/cache', () => ({
  cacheLife: () => {
    // no-op in tests; real cache behavior validated via build/e2e
  },
}));
```

## JSON-LD Schema Testing

Validate structured data injection:

```typescript
it('should inject correct JSON-LD schema', async () => {
  const { container } = render(PageComponent);

  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).not.toBeNull();

  const parsed = JSON.parse(script?.textContent ?? '');
  expect(parsed['@type']).toBe('ExpectedType');
  expect(parsed.name).toBe('Expected Name');
});
```

## Test File Structure

```typescript
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1. vi.hoisted declarations
const { mocks } = vi.hoisted(() => ({ ... }));

// 2. vi.mock calls
vi.mock('module', () => ({ ... }));

// 3. Test data/fixtures
const mockData = { ... };

// 4. Describe blocks
describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  it('should [behavior] when [condition]', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Coverage Priority Matrix

| Priority | Category | Target | Rationale |
|----------|----------|--------|-----------|
| P0 | Core Business Logic | 90%+ | Critical paths |
| P1 | API Routes/Actions | 90%+ | Security boundary |
| P2 | Page Components | 85%+ | User-facing |
| P3 | UI Components | 70%+ | Visual, lower risk |
| P4 | Utilities | 92%+ | Shared code, high impact |

## Centralized Test Resources

| Resource | Path |
|----------|------|
| i18n mock messages | `src/test/constants/mock-messages.ts` |
| Test utilities | `@/test/utils` |
| Mock utilities | `src/test/mock-utils.ts` |

## API Route Testing Pattern

Mock Next.js request/response objects for API route handlers:

```typescript
import { NextRequest } from 'next/server';

const { mockCookies, mockHeaders } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

// Create mock request
function createMockRequest(options: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): NextRequest {
  const { method = 'GET', body, headers = {} } = options;
  return new NextRequest('http://localhost:3000/api/endpoint', {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Test example
it('should return 200 on valid request', async () => {
  const request = createMockRequest({
    method: 'POST',
    body: { name: 'Test' },
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await POST(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
});
```

## External HTTP Mock Pattern

Mock global fetch for external API calls (e.g., WhatsApp):

```typescript
const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// Success response mock
mockFetch.mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ success: true, messageId: '123' }),
});

// Error response mock
mockFetch.mockResolvedValue({
  ok: false,
  status: 401,
  json: async () => ({ error: 'Unauthorized' }),
});

// Network error mock
mockFetch.mockRejectedValue(new Error('Network error'));

// Verify request payload
expect(mockFetch).toHaveBeenCalledWith(
  'https://api.whatsapp.com/send',
  expect.objectContaining({
    method: 'POST',
    body: expect.stringContaining('"to":"1234567890"'),
  })
);
```

## Storage API Mock Pattern

Mock browser storage APIs for localStorage/cookie modules:

```typescript
// localStorage mock
const mockLocalStorage = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
});

vi.stubGlobal('localStorage', mockLocalStorage);

// Cookie mock
let cookieValue = '';
Object.defineProperty(document, 'cookie', {
  get: () => cookieValue,
  set: (value: string) => {
    cookieValue = value;
  },
  configurable: true,
});

// Test storage unavailable scenario
mockLocalStorage.getItem.mockImplementation(() => {
  throw new Error('localStorage is not available');
});
```

## Performance API Mock Pattern

Mock browser Performance API for timing/metrics modules:

```typescript
const mockPerformanceNow = vi.hoisted(() => vi.fn());
const mockPerformanceObserver = vi.hoisted(() => vi.fn());

vi.stubGlobal('performance', {
  now: mockPerformanceNow,
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
});

// Mock PerformanceObserver
vi.stubGlobal(
  'PerformanceObserver',
  class MockPerformanceObserver {
    callback: PerformanceObserverCallback;
    constructor(callback: PerformanceObserverCallback) {
      this.callback = callback;
      mockPerformanceObserver(callback);
    }
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
);

// Simulate performance entry
const mockEntry = {
  name: 'LCP',
  entryType: 'largest-contentful-paint',
  startTime: 1234,
  duration: 0,
};
mockPerformanceObserver.mock.calls[0][0]({
  getEntries: () => [mockEntry],
});
```

## Timer Testing Pattern

Use Vitest fake timers for time-dependent tests:

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should debounce calls', async () => {
  const callback = vi.fn();
  const debouncedFn = debounce(callback, 100);

  debouncedFn();
  debouncedFn();
  debouncedFn();

  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(100);

  expect(callback).toHaveBeenCalledTimes(1);
});

it('should timeout after delay', async () => {
  const promise = timeoutPromise(1000);

  vi.advanceTimersByTime(999);
  expect(promise).not.toBeResolved();

  vi.advanceTimersByTime(1);
  await expect(promise).rejects.toThrow('Timeout');
});
```

## lucide-react Icon Mock Pattern

When testing components using lucide-react icons, use partial mocking to preserve actual exports:

```typescript
const MockIcon = vi.hoisted(
  () =>
    ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    ),
);

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ArrowRight: MockIcon,
    CheckCircle: MockIcon,
    Clock: MockIcon,
    // Add other icons as needed
  };
});
```

## React Component Testing with userEvent

For interactive component tests, prefer `userEvent` over `fireEvent`:

```typescript
import userEvent from '@testing-library/user-event';

it('should handle form submission', async () => {
  const user = userEvent.setup();
  render(<FormComponent />);

  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button');

  await user.type(input, 'test@example.com');
  await user.click(button);

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith('test@example.com');
  });
});
```

## Coverage Threshold Exceptions

Some files may have reduced thresholds due to:

1. **Polyfill functions** - Conditional code that only runs in specific environments
2. **Static import branches** - JSON imports with fallback logic
3. **Browser-only APIs** - Code paths that can't be triggered in JSDOM

Document threshold reductions in `vitest.config.mts` with comments:

```typescript
// content-parser.ts functions 阈值降低到 80%，因为 yaml safeLoad polyfill
// 是在模块加载时按条件执行的兼容性代码，无法通过正常测试路径触发
'src/lib/content-parser.ts': {
  branches: 90,
  functions: 80,  // Reduced from 92%
  lines: 92,
  statements: 92,
},
```

## Forbidden Patterns

- ❌ Duplicate mock message creation (use centralized mocks)
- ❌ `any` type in test files (limited exceptions with comment)
- ❌ Testing implementation details over behavior
- ❌ Snapshot tests for dynamic content
- ❌ Calling real external APIs in unit tests
- ❌ Leaving fake timers enabled across tests
- ❌ Using `vi.mock` without `vi.hoisted` for shared mock variables
