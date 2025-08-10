import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

// Global test setup for integration tests
beforeAll(() => {
  // Setup global test environment
  // 测试环境初始化（静默模式）
});

afterAll(() => {
  // Cleanup global test environment
  // 测试环境清理（静默模式）
});

beforeEach(() => {
  // Setup for each test
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
});

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  useMessages: () => ({}),
}));

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('SITE_URL', 'https://test.example.com');

export { mockRouter };
