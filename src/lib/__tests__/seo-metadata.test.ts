import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageType } from '@/config/paths';
// Import after mocks
import {
  createPageSEOConfig,
  generateLocalizedMetadata,
} from '../seo-metadata';

// Use vi.hoisted to ensure proper mock setup
const {
  mockGetTranslations,
  mockGenerateCanonicalURL,
  mockGenerateLanguageAlternates,
} = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
  mockGenerateCanonicalURL: vi.fn(),
  mockGenerateLanguageAlternates: vi.fn(),
}));

// Mock dependencies
vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
}));

vi.mock('@/config/paths', () => ({
  SITE_CONFIG: {
    name: 'Test Site',
    seo: {
      defaultTitle: 'Default Title',
      defaultDescription: 'Default Description',
      keywords: ['test', 'site'],
    },
  },
}));

vi.mock('@/services/url-generator', () => ({
  generateCanonicalURL: mockGenerateCanonicalURL,
  generateLanguageAlternates: mockGenerateLanguageAlternates,
}));

describe('SEO Metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock translation function
    const mockT = vi.fn((key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        title: options?.defaultValue || 'Translated Title',
        description: options?.defaultValue || 'Translated Description',
        siteName: options?.defaultValue || 'Translated Site Name',
      };
      const safeTranslations = new Map(Object.entries(translations));
      return safeTranslations.get(key) || options?.defaultValue || key;
    });

    mockGetTranslations.mockResolvedValue(mockT);
    mockGenerateCanonicalURL.mockReturnValue('https://example.com/canonical');
    mockGenerateLanguageAlternates.mockReturnValue({
      en: 'https://example.com/en',
      zh: 'https://example.com/zh',
    });

    // Mock environment variables
    process.env.GOOGLE_SITE_VERIFICATION = 'google-verification-code';
    process.env.YANDEX_VERIFICATION = 'yandex-verification-code';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_SITE_VERIFICATION;
    delete process.env.YANDEX_VERIFICATION;
  });

  describe('generateLocalizedMetadata', () => {
    it('should generate basic metadata with default values', async () => {
      const metadata = await generateLocalizedMetadata('en', 'home');

      expect(metadata).toEqual({
        title: 'Default Title',
        description: 'Default Description',
        keywords: undefined,
        openGraph: {
          title: 'Default Title',
          description: 'Default Description',
          siteName: 'Test Site',
          locale: 'en',
          type: 'website',
          images: undefined,
          publishedTime: undefined,
          modifiedTime: undefined,
          authors: undefined,
          section: undefined,
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Default Title',
          description: 'Default Description',
          images: undefined,
        },
        alternates: {
          canonical: 'https://example.com/canonical',
          languages: {
            en: 'https://example.com/en',
            zh: 'https://example.com/zh',
          },
        },
        robots: {
          index: true,
          follow: true,
          googleBot: {
            'index': true,
            'follow': true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
        verification: {
          google: 'google-verification-code',
          yandex: 'yandex-verification-code',
        },
      });
    });

    it('should generate metadata with custom config', async () => {
      const config = {
        title: 'Custom Title',
        description: 'Custom Description',
        keywords: ['custom', 'keywords'],
        image: '/custom-image.jpg',
        type: 'article' as const,
        publishedTime: '2023-01-01',
        modifiedTime: '2023-01-02',
        authors: ['Author 1', 'Author 2'],
        section: 'Technology',
      };

      const metadata = await generateLocalizedMetadata('zh', 'blog', config);

      expect(metadata.title).toBe('Custom Title');
      expect(metadata.description).toBe('Custom Description');
      expect(metadata.keywords).toEqual(['custom', 'keywords']);
      expect((metadata.openGraph as any)?.type).toBe('article');
      expect(metadata.openGraph?.images).toEqual([
        { url: '/custom-image.jpg' },
      ]);
      expect((metadata.openGraph as any)?.publishedTime).toBe('2023-01-01');
      expect((metadata.openGraph as any)?.modifiedTime).toBe('2023-01-02');
      expect((metadata.openGraph as any)?.authors).toEqual([
        'Author 1',
        'Author 2',
      ]);
      expect((metadata.openGraph as any)?.section).toBe('Technology');
      expect(metadata.twitter?.images).toEqual(['/custom-image.jpg']);
    });

    it('should handle product type correctly', async () => {
      const config = {
        type: 'product' as const,
      };

      const metadata = await generateLocalizedMetadata(
        'en',
        'products',
        config,
      );

      // Product type should be converted to website for OpenGraph
      expect((metadata.openGraph as any)?.type).toBe('website');
    });

    it('should handle different locales', async () => {
      const metadata = await generateLocalizedMetadata('zh', 'about');

      expect(metadata.openGraph?.locale).toBe('zh');
      expect(mockGetTranslations).toHaveBeenCalledWith({
        locale: 'zh',
        namespace: 'seo',
      });
    });

    it('should handle missing environment variables', async () => {
      delete process.env.GOOGLE_SITE_VERIFICATION;
      delete process.env.YANDEX_VERIFICATION;

      const metadata = await generateLocalizedMetadata('en', 'home');

      expect(metadata.verification).toEqual({
        google: undefined,
        yandex: undefined,
      });
    });

    it('should call URL generation functions with correct parameters', async () => {
      await generateLocalizedMetadata('en', 'contact');

      expect(mockGenerateCanonicalURL).toHaveBeenCalledWith('contact', 'en');
      expect(mockGenerateLanguageAlternates).toHaveBeenCalledWith('contact');
    });

    it('should handle translation function errors gracefully', async () => {
      const mockT = vi.fn(
        (key: string, options?: { defaultValue?: string }) => {
          if (key === 'title') {
            throw new Error('Translation error');
          }
          return options?.defaultValue || key;
        },
      );

      mockGetTranslations.mockResolvedValue(mockT);

      await expect(generateLocalizedMetadata('en', 'home')).rejects.toThrow(
        'Translation error',
      );
    });
  });

  describe('createPageSEOConfig', () => {
    it('should return home page config by default', () => {
      const config = createPageSEOConfig('home');

      expect(config).toEqual({
        type: 'website',
        keywords: [
          'test',
          'site',
          'shadcn/ui',
          'Radix UI',
          'Modern Web',
          'Enterprise Platform',
          'B2B Solution',
        ],
        image: '/images/og-image.jpg',
      });
    });

    it('should return specific page config', () => {
      const config = createPageSEOConfig('blog');

      expect(config).toEqual({
        type: 'article',
        keywords: ['Blog', 'Articles', 'Technology', 'Insights'],
      });
    });

    it('should merge custom config with base config', () => {
      const customConfig = {
        title: 'Custom Title',
        description: 'Custom Description',
        keywords: ['custom', 'keywords'],
      };

      const config = createPageSEOConfig('about', customConfig);

      expect(config).toEqual({
        type: 'website',
        keywords: ['custom', 'keywords'], // Custom keywords override base
        title: 'Custom Title',
        description: 'Custom Description',
      });
    });

    it('should handle unknown page types', () => {
      const config = createPageSEOConfig('unknown' as PageType);

      // Should fallback to home config
      expect(config.type).toBe('website');
      expect(config.keywords).toContain('shadcn/ui');
    });

    it('should return correct config for all page types', () => {
      const pageTypes: PageType[] = [
        'home',
        'about',
        'contact',
        'blog',
        'products',
        'services',
        'pricing',
        'support',
        'privacy',
        'terms',
      ];

      pageTypes.forEach((pageType) => {
        const config = createPageSEOConfig(pageType);

        expect(config).toBeDefined();
        expect(config.type).toBeDefined();
        expect(config.keywords).toBeDefined();
        expect(Array.isArray(config.keywords)).toBe(true);
      });
    });

    it('should handle partial custom config', () => {
      const customConfig = {
        title: 'Custom Title',
        // Only title provided, other fields should come from base config
      };

      const config = createPageSEOConfig('pricing', customConfig);

      expect(config.title).toBe('Custom Title');
      expect(config.type).toBe('website'); // From base config
      expect(config.keywords).toEqual([
        'Pricing',
        'Plans',
        'Enterprise',
        'B2B',
      ]); // From base config
    });

    it('should handle empty custom config', () => {
      const config = createPageSEOConfig('services', {});

      expect(config).toEqual({
        type: 'website',
        keywords: ['Services', 'Solutions', 'Enterprise', 'B2B'],
      });
    });

    it('should preserve all custom config properties', () => {
      const customConfig = {
        title: 'Custom Title',
        description: 'Custom Description',
        keywords: ['custom'],
        image: '/custom.jpg',
        type: 'article' as const,
        publishedTime: '2023-01-01',
        modifiedTime: '2023-01-02',
        authors: ['Author'],
        section: 'Tech',
      };

      const config = createPageSEOConfig('support', customConfig);

      expect(config).toEqual(customConfig);
    });

    it('should handle null and undefined custom config', () => {
      const config1 = createPageSEOConfig('privacy');
      const config2 = createPageSEOConfig('privacy', undefined);

      expect(config1).toEqual(config2);
      expect(config1.type).toBe('website');
      expect(config1.keywords).toEqual([
        'Privacy',
        'Policy',
        'Data Protection',
      ]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle getTranslations rejection', async () => {
      mockGetTranslations.mockRejectedValue(
        new Error('Translation service error'),
      );

      await expect(generateLocalizedMetadata('en', 'home')).rejects.toThrow(
        'Translation service error',
      );
    });

    it('should handle URL generation errors', async () => {
      mockGenerateCanonicalURL.mockImplementation(() => {
        throw new Error('URL generation error');
      });

      await expect(generateLocalizedMetadata('en', 'home')).rejects.toThrow(
        'URL generation error',
      );
    });

    it('should handle complex custom config merging', () => {
      const customConfig = {
        image: null as any, // Null value
        type: 'website' as const,
      };

      const config = createPageSEOConfig('terms', customConfig);

      // Terms page has default keywords, custom config doesn't override them
      expect(config.keywords).toEqual(['Terms', 'Conditions', 'Legal']);
      expect(config.image).toBeNull();
      expect(config.type).toBe('website');
    });
  });
});
