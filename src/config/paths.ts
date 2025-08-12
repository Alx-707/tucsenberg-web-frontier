/**
 * 统一路径配置管理系统
 * 作为所有路径映射的单一数据源，确保配置一致性
 */

/* eslint-disable security/detect-object-injection */

export type Locale = 'en' | 'zh';

// 路径映射接口定义
export interface LocalizedPath {
  en: string;
  zh: string;
}

// 页面类型定义
export type PageType =
  | 'home'
  | 'about'
  | 'contact'
  | 'blog'
  | 'products'
  | 'services'
  | 'pricing'
  | 'support'
  | 'privacy'
  | 'terms';

// 核心路径配置 - 使用标准路径方案
export const PATHS_CONFIG = Object.freeze({
  // 基础路径
  home: Object.freeze({
    en: '/',
    zh: '/',
  }),

  // 主要页面路径 - 统一使用标准路径
  about: Object.freeze({
    en: '/about',
    zh: '/about',
  }),

  contact: Object.freeze({
    en: '/contact',
    zh: '/contact',
  }),

  blog: Object.freeze({
    en: '/blog',
    zh: '/blog',
  }),

  products: Object.freeze({
    en: '/products',
    zh: '/products',
  }),

  services: Object.freeze({
    en: '/services',
    zh: '/services',
  }),

  pricing: Object.freeze({
    en: '/pricing',
    zh: '/pricing',
  }),

  support: Object.freeze({
    en: '/support',
    zh: '/support',
  }),

  // 法律页面 - 统一使用标准路径
  privacy: Object.freeze({
    en: '/privacy',
    zh: '/privacy',
  }),

  terms: Object.freeze({
    en: '/terms',
    zh: '/terms',
  }),
} as const satisfies Record<PageType, LocalizedPath>);

// 语言配置
export const LOCALES_CONFIG = Object.freeze({
  locales: Object.freeze(['en', 'zh'] as const),
  defaultLocale: 'en' as const,

  // 语言前缀配置
  prefixes: Object.freeze({
    en: '', // 默认语言不需要前缀
    zh: '/zh',
  }),

  // 语言显示名称
  displayNames: Object.freeze({
    en: 'English',
    zh: '中文',
  }),

  // 时区配置
  timeZones: Object.freeze({
    en: 'UTC',
    zh: 'Asia/Shanghai',
  }),
} as const);

// 站点配置
export const SITE_CONFIG = {
  baseUrl: process.env['SITE_URL'] || 'https://tucsenberg.com',
  name: 'Tucsenberg Web Frontier',
  description: 'Modern B2B Enterprise Web Platform with Next.js 15',

  // SEO配置
  seo: {
    titleTemplate: '%s | Tucsenberg Web Frontier',
    defaultTitle: 'Tucsenberg Web Frontier',
    defaultDescription: 'Modern B2B Enterprise Web Platform with Next.js 15',
    keywords: ['Next.js', 'React', 'TypeScript', 'B2B', 'Enterprise'],
  },

  // 社交媒体链接
  social: {
    twitter: 'https://twitter.com/tucsenberg',
    linkedin: 'https://linkedin.com/company/tucsenberg',
    github: 'https://github.com/tucsenberg',
  },

  // 联系信息
  contact: {
    phone: '+1-555-0123',
    email: 'contact@tucsenberg.com',
  },
} as const;

/**
 * 获取本地化路径
 */
export function getLocalizedPath(pageType: PageType, locale: Locale): string {
  if (!Object.prototype.hasOwnProperty.call(PATHS_CONFIG, pageType)) {
    throw new Error(`Unknown page type: ${pageType}`);
  }
  const pathConfig = PATHS_CONFIG[pageType];
  if (!Object.prototype.hasOwnProperty.call(pathConfig, locale)) {
    throw new Error(`Unknown locale: ${locale}`);
  }
  return pathConfig[locale];
}

/**
 * 获取所有页面的路径映射（用于next-intl routing）
 *
 * 使用标准路径方案，所有语言使用相同路径
 */
export function getPathnames(): Record<string, string> {
  return {
    '/': '/',
    '/about': '/about',
    '/contact': '/contact',
    '/blog': '/blog',
    '/products': '/products',
    '/services': '/services',
    '/pricing': '/pricing',
    '/support': '/support',
    '/privacy': '/privacy',
    '/terms': '/terms',
  };
}

/**
 * 获取页面类型（根据路径反向查找）
 */
export function getPageTypeFromPath(
  path: string,
  locale: Locale,
): PageType | null {
  // 处理根路径
  if (path === '/' || path === '') {
    return 'home';
  }

  // 查找匹配的页面类型
  for (const [pageType, paths] of Object.entries(PATHS_CONFIG)) {
    if (
      Object.prototype.hasOwnProperty.call(paths, locale) &&
      paths[locale] === path
    ) {
      return pageType as PageType;
    }
  }

  return null;
}

/**
 * 验证路径配置的一致性
 */
export function validatePathsConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查所有页面类型是否都有完整的路径配置
  Object.entries(PATHS_CONFIG).forEach(([pageType, paths]) => {
    LOCALES_CONFIG.locales.forEach((locale) => {
      if (!Object.prototype.hasOwnProperty.call(paths, locale)) {
        errors.push(`Missing ${locale} path for page type: ${pageType}`);
      }
    });
  });

  // 检查路径是否有重复
  const pathsByLocale: Record<Locale, Set<string>> = {
    en: new Set(),
    zh: new Set(),
  };

  Object.entries(PATHS_CONFIG).forEach(([pageType, paths]) => {
    LOCALES_CONFIG.locales.forEach((locale) => {
      if (Object.prototype.hasOwnProperty.call(paths, locale)) {
        const path = paths[locale];
        if (
          Object.prototype.hasOwnProperty.call(pathsByLocale, locale) &&
          pathsByLocale[locale].has(path)
        ) {
          errors.push(
            `Duplicate ${locale} path: ${path} (page type: ${pageType})`,
          );
        }
        if (Object.prototype.hasOwnProperty.call(pathsByLocale, locale)) {
          pathsByLocale[locale].add(path);
        }
      }
    });
  });

  // 检查路径格式
  Object.entries(PATHS_CONFIG).forEach(([pageType, paths]) => {
    LOCALES_CONFIG.locales.forEach((locale) => {
      if (Object.prototype.hasOwnProperty.call(paths, locale)) {
        const path = paths[locale];
        if (pageType !== 'home' && !path.startsWith('/')) {
          errors.push(
            `Invalid path format for ${pageType}.${locale}: ${path} (should start with /)`,
          );
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 获取sitemap配置（用于next-sitemap）
 */
export function getSitemapConfig() {
  const localizedPaths: Record<string, LocalizedPath> = {};

  Object.entries(PATHS_CONFIG).forEach(([pageType, paths]) => {
    if (pageType !== 'home') {
      localizedPaths[paths.en] = paths;
    }
  });

  return {
    baseUrl: SITE_CONFIG.baseUrl,
    localizedPaths,
    locales: LOCALES_CONFIG.locales,
    defaultLocale: LOCALES_CONFIG.defaultLocale,
  };
}

/**
 * 获取路由配置（用于next-intl）
 */
export function getRoutingConfig() {
  return {
    locales: LOCALES_CONFIG.locales,
    defaultLocale: LOCALES_CONFIG.defaultLocale,
    pathnames: getPathnames(),
    // 使用 'always' 模式确保所有语言都有前缀，这是使用 pathnames 时的最佳实践
    localePrefix: 'always' as const,
  };
}

// 导出类型
export type PathsConfig = typeof PATHS_CONFIG;
export type LocalesConfig = typeof LOCALES_CONFIG;
export type SiteConfig = typeof SITE_CONFIG;
