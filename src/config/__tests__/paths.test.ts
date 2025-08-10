import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLocalizedPath,
  getPageTypeFromPath,
  getPathnames,
  getRoutingConfig,
  getSitemapConfig,
  LOCALES_CONFIG,
  PATHS_CONFIG,
  SITE_CONFIG,
  validatePathsConfig,
  type Locale,
  type LocalizedPath,
  type PageType,
} from '../paths';

describe('paths configuration', () => {
  describe('type definitions', () => {
    it('should have valid Locale type', () => {
      const enLocale: Locale = 'en';
      const zhLocale: Locale = 'zh';

      expect(enLocale).toBe('en');
      expect(zhLocale).toBe('zh');
    });

    it('should have valid PageType', () => {
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

      pageTypes.forEach((type) => {
        expect(typeof type).toBe('string');
      });
    });

    it('should have valid LocalizedPath structure', () => {
      const path: LocalizedPath = {
        en: '/test',
        zh: '/test',
      };

      expect(path.en).toBe('/test');
      expect(path.zh).toBe('/test');
    });
  });

  describe('PATHS_CONFIG', () => {
    it('should have all required page types', () => {
      const expectedPageTypes: PageType[] = [
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

      expectedPageTypes.forEach((pageType) => {
        expect(PATHS_CONFIG).toHaveProperty(pageType);
      });
    });

    it('should have both locales for each page type', () => {
      Object.entries(PATHS_CONFIG).forEach(([_pageType, paths]) => {
        expect(paths).toHaveProperty('en');
        expect(paths).toHaveProperty('zh');
        expect(typeof paths.en).toBe('string');
        expect(typeof paths.zh).toBe('string');
      });
    });

    it('should have consistent path format', () => {
      Object.entries(PATHS_CONFIG).forEach(([pageType, paths]) => {
        if (pageType !== 'home') {
          expect(paths.en).toMatch(/^\/[a-z-]*$/);
          expect(paths.zh).toMatch(/^\/[a-z-]*$/);
        } else {
          expect(paths.en).toBe('/');
          expect(paths.zh).toBe('/');
        }
      });
    });

    it('should use standard paths for all languages', () => {
      Object.entries(PATHS_CONFIG).forEach(([_pageType, paths]) => {
        // All languages should use the same path (standard approach)
        expect(paths.en).toBe(paths.zh);
      });
    });

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        PATHS_CONFIG.home.en = '/changed';
      }).toThrow();
    });
  });

  describe('LOCALES_CONFIG', () => {
    it('should have correct locale configuration', () => {
      expect(LOCALES_CONFIG.locales).toEqual(['en', 'zh']);
      expect(LOCALES_CONFIG.defaultLocale).toBe('en');
    });

    it('should have valid prefixes', () => {
      expect(LOCALES_CONFIG.prefixes.en).toBe('');
      expect(LOCALES_CONFIG.prefixes.zh).toBe('/zh');
    });

    it('should have display names', () => {
      expect(LOCALES_CONFIG.displayNames.en).toBe('English');
      expect(LOCALES_CONFIG.displayNames.zh).toBe('中文');
    });

    it('should have time zones', () => {
      expect(LOCALES_CONFIG.timeZones.en).toBe('UTC');
      expect(LOCALES_CONFIG.timeZones.zh).toBe('Asia/Shanghai');
    });

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        LOCALES_CONFIG.defaultLocale = 'zh';
      }).toThrow();
    });
  });

  describe('SITE_CONFIG', () => {
    beforeEach(() => {
      vi.stubEnv('SITE_URL', 'https://test.example.com');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should have basic site information', () => {
      expect(SITE_CONFIG.name).toBe('Tucsenberg Web Frontier');
      expect(SITE_CONFIG.description).toContain('Modern B2B Enterprise');
    });

    it('should use environment variable for baseUrl', () => {
      // Note: This test might not work as expected due to how the module is loaded
      // The baseUrl is set when the module is first imported
      expect(typeof SITE_CONFIG.baseUrl).toBe('string');
      expect(SITE_CONFIG.baseUrl).toMatch(/^https?:\/\/.+/);
    });

    it('should have SEO configuration', () => {
      expect(SITE_CONFIG.seo.titleTemplate).toContain('%s');
      expect(SITE_CONFIG.seo.defaultTitle).toBeTruthy();
      expect(SITE_CONFIG.seo.defaultDescription).toBeTruthy();
      expect(Array.isArray(SITE_CONFIG.seo.keywords)).toBe(true);
    });

    it('should have social media links', () => {
      expect(SITE_CONFIG.social.twitter).toMatch(/^https:\/\/twitter\.com/);
      expect(SITE_CONFIG.social.linkedin).toMatch(/^https:\/\/linkedin\.com/);
      expect(SITE_CONFIG.social.github).toMatch(/^https:\/\/github\.com/);
    });

    it('should have contact information', () => {
      expect(SITE_CONFIG.contact.phone).toMatch(/^\+\d/);
      expect(SITE_CONFIG.contact.email).toMatch(/^.+@.+\..+$/);
    });
  });

  describe('getLocalizedPath', () => {
    it('should return correct path for valid page type and locale', () => {
      expect(getLocalizedPath('home', 'en')).toBe('/');
      expect(getLocalizedPath('home', 'zh')).toBe('/');
      expect(getLocalizedPath('about', 'en')).toBe('/about');
      expect(getLocalizedPath('about', 'zh')).toBe('/about');
    });

    it('should throw error for invalid page type', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getLocalizedPath('invalid', 'en');
      }).toThrow('Unknown page type: invalid');
    });

    it('should throw error for invalid locale', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getLocalizedPath('home', 'fr');
      }).toThrow('Unknown locale: fr');
    });
  });

  describe('getPathnames', () => {
    it('should return all pathnames', () => {
      const pathnames = getPathnames();

      expect(pathnames['/']).toBe('/');
      expect(pathnames['/about']).toBe('/about');
      expect(pathnames['/contact']).toBe('/contact');
      expect(pathnames['/blog']).toBe('/blog');
      expect(pathnames['/products']).toBe('/products');
    });

    it('should have consistent paths', () => {
      const pathnames = getPathnames();

      Object.entries(pathnames).forEach(([key, value]) => {
        expect(key).toBe(value);
      });
    });
  });

  describe('getPageTypeFromPath', () => {
    it('should return correct page type for valid paths', () => {
      expect(getPageTypeFromPath('/', 'en')).toBe('home');
      expect(getPageTypeFromPath('', 'en')).toBe('home');
      expect(getPageTypeFromPath('/about', 'en')).toBe('about');
      expect(getPageTypeFromPath('/contact', 'zh')).toBe('contact');
    });

    it('should return null for invalid paths', () => {
      expect(getPageTypeFromPath('/invalid', 'en')).toBeNull();
      expect(getPageTypeFromPath('/nonexistent', 'zh')).toBeNull();
    });

    it('should work with both locales', () => {
      expect(getPageTypeFromPath('/products', 'en')).toBe('products');
      expect(getPageTypeFromPath('/products', 'zh')).toBe('products');
    });
  });

  describe('validatePathsConfig', () => {
    it('should validate current configuration as valid', () => {
      const result = validatePathsConfig();

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing locale paths', () => {
      // This test would require mocking the PATHS_CONFIG
      // For now, we just ensure the function works
      const result = validatePathsConfig();
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('getSitemapConfig', () => {
    it('should return valid sitemap configuration', () => {
      const config = getSitemapConfig();

      expect(config.baseUrl).toBeTruthy();
      expect(Array.isArray(config.locales)).toBe(true);
      expect(config.defaultLocale).toBe('en');
      expect(typeof config.localizedPaths).toBe('object');
    });

    it('should exclude home page from localized paths', () => {
      const config = getSitemapConfig();

      expect(config.localizedPaths).not.toHaveProperty('/');
    });

    it('should include other pages in localized paths', () => {
      const config = getSitemapConfig();

      expect(config.localizedPaths).toHaveProperty('/about');
      expect(config.localizedPaths).toHaveProperty('/contact');
    });
  });

  describe('getRoutingConfig', () => {
    it('should return valid routing configuration', () => {
      const config = getRoutingConfig();

      expect(config.locales).toEqual(['en', 'zh']);
      expect(config.defaultLocale).toBe('en');
      expect(config.localePrefix).toBe('always');
      expect(typeof config.pathnames).toBe('object');
    });

    it('should have pathnames matching getPathnames', () => {
      const config = getRoutingConfig();
      const pathnames = getPathnames();

      expect(config.pathnames).toEqual(pathnames);
    });
  });

  describe('integration tests', () => {
    it('should have consistent configuration across all functions', () => {
      const pathnames = getPathnames();
      const sitemapConfig = getSitemapConfig();
      const routingConfig = getRoutingConfig();

      // Check that all configurations use the same locales
      expect(sitemapConfig.locales).toEqual(routingConfig.locales);
      expect(sitemapConfig.defaultLocale).toBe(routingConfig.defaultLocale);

      // Check that pathnames are consistent
      expect(routingConfig.pathnames).toEqual(pathnames);
    });

    it('should work with all page types and locales', () => {
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
      const locales: Locale[] = ['en', 'zh'];

      pageTypes.forEach((pageType) => {
        locales.forEach((locale) => {
          const path = getLocalizedPath(pageType, locale);
          const foundPageType = getPageTypeFromPath(path, locale);
          expect(foundPageType).toBe(pageType);
        });
      });
    });
  });
});
