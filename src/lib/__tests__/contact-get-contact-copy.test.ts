import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/types/i18n';
import { getContactCopy } from '@/lib/contact/getContactCopy';

// Hoisted mock for getTranslationsCached so that module imports pick it up.
const { mockGetTranslationsCached } = vi.hoisted(() => ({
  mockGetTranslationsCached: vi.fn(),
}));

const { mockCacheLife } = vi.hoisted(() => ({
  mockCacheLife: vi.fn<(profile: unknown) => void>(),
}));

vi.mock('@/lib/i18n/server/getTranslationsCached', () => ({
  getTranslationsCached: mockGetTranslationsCached,
}));

vi.mock('next/cache', () => ({
  cacheLife: (profile: unknown) => {
    mockCacheLife(profile);
  },
}));

describe('getContactCopy', () => {
  const defaultTranslations = {
    'title': 'Contact Us',
    'description': 'Get in touch with our team',
    'panel.contactTitle': 'Contact Methods',
    'panel.email': 'Email',
    'panel.phone': 'Phone',
    'panel.hoursTitle': 'Business Hours',
    'panel.weekdays': 'Mon - Fri',
    'panel.saturday': 'Saturday',
    'panel.sunday': 'Sunday',
    'panel.closed': 'Closed',
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetTranslationsCached.mockResolvedValue(
      (key: string) =>
        defaultTranslations[key as keyof typeof defaultTranslations] || key,
    );
  });

  it('builds a structured copy model for the given locale', async () => {
    const locale: Locale = 'en';

    const copy = await getContactCopy(locale);

    expect(mockCacheLife).toHaveBeenCalledWith('days');

    expect(mockGetTranslationsCached).toHaveBeenCalledWith({
      locale,
      namespace: 'underConstruction.pages.contact',
    });

    expect(copy.header.title).toBe('Contact Us');
    expect(copy.header.description).toBe('Get in touch with our team');

    expect(copy.panel.contact.title).toBe('Contact Methods');
    expect(copy.panel.contact.emailLabel).toBe('Email');
    expect(copy.panel.contact.phoneLabel).toBe('Phone');

    expect(copy.panel.hours.title).toBe('Business Hours');
    expect(copy.panel.hours.weekdaysLabel).toBe('Mon - Fri');
    expect(copy.panel.hours.saturdayLabel).toBe('Saturday');
    expect(copy.panel.hours.sundayLabel).toBe('Sunday');
    expect(copy.panel.hours.closedLabel).toBe('Closed');
  });

  it('propagates missing translation keys as-is from the translation function', async () => {
    mockGetTranslationsCached.mockResolvedValue(
      (key: string) => `missing.${key}`,
    );

    const copy = await getContactCopy('en' as Locale);

    expect(copy.header.title).toBe('missing.title');
    expect(copy.header.description).toBe('missing.description');
    expect(copy.panel.hours.closedLabel).toBe('missing.panel.closed');
  });
});
