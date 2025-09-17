/**
 * URL生成器单元测试
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SEO_CONSTANTS } from '@/constants/seo-constants';
import {
  generateCanonicalURL,
  generatePageURL,
  isValidURL,
  URLGenerator,
  urlGenerator,
} from '@/services/url-generator';

describe('URLGenerator', () => {
  let generator: URLGenerator;

  beforeEach(() => {
    generator = new URLGenerator();
  });

  describe('generatePageURL', () => {
    it('should generate correct URL for home page in English', () => {
      const url = generator.generatePageURL('home', 'en');
      expect(url).toBe('/');
    });

    it('should generate correct URL for home page in Chinese', () => {
      const url = generator.generatePageURL('home', 'zh');
      expect(url).toBe('/zh');
    });

    it('should generate correct URL for about page in English', () => {
      const url = generator.generatePageURL('about', 'en');
      expect(url).toBe('/about');
    });

    it('should generate correct URL for about page in Chinese', () => {
      const url = generator.generatePageURL('about', 'zh');
      expect(url).toBe('/zh/about');
    });

    it('should generate absolute URL when requested', () => {
      const url = generator.generatePageURL('about', 'en', { absolute: true });
      expect(url).toBe('https://tucsenberg.com/about');
    });

    it('should add trailing slash when requested', () => {
      const url = generator.generatePageURL('about', 'en', {
        trailingSlash: true,
      });
      expect(url).toBe('/about/');
    });

    it('should exclude locale when requested', () => {
      const url = generator.generatePageURL('about', 'zh', {
        includeLocale: false,
      });
      expect(url).toBe('/about');
    });
  });

  describe('generateCanonicalURL', () => {
    it('should generate correct canonical URL for English pages', () => {
      const url = generator.generateCanonicalURL('about', 'en');
      expect(url).toBe('https://tucsenberg.com/about');
    });

    it('should generate correct canonical URL for Chinese pages', () => {
      const url = generator.generateCanonicalURL('about', 'zh');
      expect(url).toBe('https://tucsenberg.com/zh/about');
    });

    it('should generate correct canonical URL for home page', () => {
      const url = generator.generateCanonicalURL('home', 'en');
      expect(url).toBe('https://tucsenberg.com/');
    });
  });

  describe('generateLanguageAlternates', () => {
    it('should generate alternates for all supported languages', () => {
      const alternates = generator.generateLanguageAlternates('about');

      expect(alternates).toEqual({
        en: 'https://tucsenberg.com/about',
        zh: 'https://tucsenberg.com/zh/about',
      });
    });
  });

  describe('generateHreflangLinks', () => {
    it('should generate hreflang links including x-default', () => {
      const links = generator.generateHreflangLinks('about');

      expect(links).toHaveLength(3); // en, zh, x-default
      expect(links).toContainEqual({
        href: 'https://tucsenberg.com/about',
        hreflang: 'en',
      });
      expect(links).toContainEqual({
        href: 'https://tucsenberg.com/zh/about',
        hreflang: 'zh',
      });
      expect(links).toContainEqual({
        href: 'https://tucsenberg.com/about',
        hreflang: 'x-default',
      });
    });
  });

  describe('generateSitemapEntry', () => {
    it('should generate complete sitemap entry', () => {
      const entry = generator.generateSitemapEntry('about', 'en');

      expect(entry).toMatchObject({
        loc: 'https://tucsenberg.com/about',
        changefreq: 'weekly',
        priority: SEO_CONSTANTS.URL_GENERATION.DEFAULT_PAGE_PRIORITY,
        alternateRefs: expect.arrayContaining([
          expect.objectContaining({
            href: 'https://tucsenberg.com/about',
            hreflang: 'en',
          }),
        ]),
      });
      expect(entry.lastmod).toBeDefined();
    });

    it('should accept custom options', () => {
      const entry = generator.generateSitemapEntry('home', 'en', {
        changefreq: 'daily',
        priority: 1.0,
        lastmod: '2023-01-01T00:00:00.000Z',
      });

      expect(entry).toMatchObject({
        changefreq: 'daily',
        priority: 1.0,
        lastmod: '2023-01-01T00:00:00.000Z',
      });
    });
  });

  describe('generateAllSitemapEntries', () => {
    it('should generate entries for all pages and languages', () => {
      const entries = generator.generateAllSitemapEntries();

      // 应该有 11个页面类型 × 2种语言 = 22个条目
      expect(entries).toHaveLength(22);

      // 检查是否包含主页条目
      const homeEntries = entries.filter(
        (entry) =>
          entry.loc === 'https://tucsenberg.com/' ||
          entry.loc === 'https://tucsenberg.com/zh',
      );
      expect(homeEntries).toHaveLength(2);

      // 检查主页优先级
      homeEntries.forEach((entry) => {
        expect(entry.priority).toBe(1.0);
        expect(entry.changefreq).toBe('daily');
      });
    });
  });

  describe('parseURLToPageInfo', () => {
    it('should parse English URLs correctly', () => {
      const info = generator.parseURLToPageInfo('https://tucsenberg.com/about');

      expect(info).toEqual({
        pageType: 'about',
        locale: 'en',
        isValid: true,
      });
    });

    it('should parse Chinese URLs correctly', () => {
      const info = generator.parseURLToPageInfo(
        'https://tucsenberg.com/zh/about',
      );

      expect(info).toEqual({
        pageType: 'about',
        locale: 'zh',
        isValid: true,
      });
    });

    it('should parse home page URLs correctly', () => {
      const info = generator.parseURLToPageInfo('https://tucsenberg.com/');

      expect(info).toEqual({
        pageType: 'home',
        locale: 'en',
        isValid: true,
      });
    });

    it('should handle invalid URLs', () => {
      const info = generator.parseURLToPageInfo(
        'https://tucsenberg.com/invalid',
      );

      expect(info).toEqual({
        pageType: null,
        locale: 'en',
        isValid: false,
      });
    });

    it('should handle URLs with query parameters', () => {
      const info = generator.parseURLToPageInfo(
        'https://tucsenberg.com/about?param=value#anchor',
      );

      expect(info).toEqual({
        pageType: 'about',
        locale: 'en',
        isValid: true,
      });
    });
  });

  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(generator.isValidURL('https://tucsenberg.com/')).toBe(true);
      expect(generator.isValidURL('https://tucsenberg.com/about')).toBe(true);
      expect(generator.isValidURL('https://tucsenberg.com/zh/about')).toBe(
        true,
      );
    });

    it('should reject invalid URLs', () => {
      expect(generator.isValidURL('https://tucsenberg.com/invalid')).toBe(
        false,
      );
      expect(generator.isValidURL('https://tucsenberg.com/zh/invalid')).toBe(
        false,
      );
    });
  });

  describe('utility methods', () => {
    it('should return correct base URL', () => {
      expect(generator.getBaseURL()).toBe('https://tucsenberg.com');
    });

    it('should return supported locales', () => {
      const locales = generator.getSupportedLocales();
      expect(locales).toEqual(['en', 'zh']);
    });

    it('should return default locale', () => {
      expect(generator.getDefaultLocale()).toBe('en');
    });
  });
});

describe('Exported functions', () => {
  it('should work as standalone functions', () => {
    expect(generatePageURL('about', 'en')).toBe('/about');
    expect(generateCanonicalURL('about', 'en')).toBe(
      'https://tucsenberg.com/about',
    );
    expect(isValidURL('https://tucsenberg.com/about')).toBe(true);
  });
});

describe('Singleton instance', () => {
  it('should provide a singleton instance', () => {
    expect(urlGenerator).toBeInstanceOf(URLGenerator);
    expect(urlGenerator.getBaseURL()).toBe('https://tucsenberg.com');
  });
});

describe('URLGeneratorOptions edge cases', () => {
  let generator: URLGenerator;

  beforeEach(() => {
    generator = new URLGenerator();
  });

  it('should handle custom protocol and host', () => {
    const url = generator.generatePageURL('about', 'en', {
      absolute: true,
      protocol: 'http',
      host: 'localhost:3000',
    });
    expect(url).toBe('http://localhost:3000/about');
  });

  it('should handle empty path with trailing slash', () => {
    const url = generator.generatePageURL('home', 'en', {
      trailingSlash: true,
    });
    expect(url).toBe('/');
  });

  it('should handle Chinese home page with trailing slash', () => {
    const url = generator.generatePageURL('home', 'zh', {
      trailingSlash: true,
    });
    expect(url).toBe('/zh/');
  });

  it('should handle absolute URL without custom host', () => {
    const url = generator.generatePageURL('about', 'zh', {
      absolute: true,
    });
    expect(url).toBe('https://tucsenberg.com/zh/about');
  });

  it('should handle all options combined', () => {
    const url = generator.generatePageURL('about', 'zh', {
      absolute: true,
      includeLocale: true,
      trailingSlash: true,
      protocol: 'https',
      host: 'example.com',
    });
    expect(url).toBe('https://example.com/zh/about/');
  });
});

describe('Error handling and edge cases', () => {
  let generator: URLGenerator;

  beforeEach(() => {
    generator = new URLGenerator();
  });

  it('should handle URLs with multiple slashes', () => {
    const info = generator.parseURLToPageInfo('https://tucsenberg.com//about');
    expect(info.pageType).toBe(null);
    expect(info.isValid).toBe(false);
  });

  it('should handle URLs with only domain', () => {
    const info = generator.parseURLToPageInfo('https://tucsenberg.com');
    expect(info.pageType).toBe('home');
    expect(info.locale).toBe('en');
    expect(info.isValid).toBe(true);
  });

  it('should handle relative URLs in parseURLToPageInfo', () => {
    const info = generator.parseURLToPageInfo('/about');
    expect(info.pageType).toBe('about');
    expect(info.locale).toBe('en');
    expect(info.isValid).toBe(true);
  });

  it('should handle URLs with unsupported locale', () => {
    const info = generator.parseURLToPageInfo('/fr/about');
    expect(info.pageType).toBe(null);
    expect(info.locale).toBe('en');
    expect(info.isValid).toBe(false);
  });

  it('should handle empty URL', () => {
    const info = generator.parseURLToPageInfo('');
    expect(info.pageType).toBe('home');
    expect(info.locale).toBe('en');
    expect(info.isValid).toBe(true);
  });

  it('should handle URL with only locale', () => {
    const info = generator.parseURLToPageInfo('/zh');
    expect(info.pageType).toBe('home');
    expect(info.locale).toBe('zh');
    expect(info.isValid).toBe(true);
  });
});

describe('Comprehensive sitemap generation', () => {
  let generator: URLGenerator;

  beforeEach(() => {
    generator = new URLGenerator();
  });

  it('should generate sitemap entries with correct structure', () => {
    const entries = generator.generateAllSitemapEntries();

    entries.forEach((entry) => {
      expect(entry).toHaveProperty('loc');
      expect(entry).toHaveProperty('changefreq');
      expect(entry).toHaveProperty('priority');
      expect(entry).toHaveProperty('lastmod');
      expect(entry).toHaveProperty('alternateRefs');

      expect(typeof entry.loc).toBe('string');
      expect(entry.loc).toMatch(/^https:\/\//);
      expect(typeof entry.priority).toBe('number');
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
      expect(Array.isArray(entry.alternateRefs)).toBe(true);
    });
  });

  it('should have correct priorities for different page types', () => {
    const entries = generator.generateAllSitemapEntries();

    const homeEntries = entries.filter(
      (entry) => entry.loc.endsWith('/') || entry.loc.endsWith('/zh'),
    );
    const otherEntries = entries.filter(
      (entry) => !entry.loc.endsWith('/') && !entry.loc.endsWith('/zh'),
    );

    homeEntries.forEach((entry) => {
      expect(entry.priority).toBe(1.0);
      expect(entry.changefreq).toBe('daily');
    });

    otherEntries.forEach((entry) => {
      expect(entry.priority).toBe(
        SEO_CONSTANTS.URL_GENERATION.DEFAULT_PAGE_PRIORITY,
      );
      expect(entry.changefreq).toBe('weekly');
    });
  });
});
