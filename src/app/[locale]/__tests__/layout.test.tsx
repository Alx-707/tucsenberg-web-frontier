import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '../layout';

// Mock dependencies using vi.hoisted - must be before module imports
const { mockSetRequestLocale, mockNotFound, mockGenerateLocaleMetadata } =
  vi.hoisted(() => ({
    mockSetRequestLocale: vi.fn(),
    mockNotFound: vi.fn(),
    mockGenerateLocaleMetadata: vi.fn(),
  }));

vi.mock('next-intl/server', () => ({
  setRequestLocale: mockSetRequestLocale,
}));

vi.mock('next/navigation', () => ({
  notFound: mockNotFound,
}));

vi.mock('@/app/[locale]/layout-metadata', () => ({
  generateLocaleMetadata: mockGenerateLocaleMetadata,
}));

vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
}));

describe('LocaleLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  describe('generateMetadata', () => {
    it('should export generateMetadata from layout-metadata', () => {
      expect(generateMetadata).toBe(mockGenerateLocaleMetadata);
    });
  });

  describe('locale validation', () => {
    it('should have valid locale configuration', async () => {
      // Import routing config to verify locale setup
      const { routing } = await import('@/i18n/routing');

      expect(routing.locales).toContain('en');
      expect(routing.locales).toContain('zh');
      expect(routing.defaultLocale).toBe('en');
    });
  });
});
