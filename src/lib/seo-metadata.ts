import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SITE_CONFIG, type Locale, type PageType } from '@/config/paths';
import { ONE } from '@/constants';
import {
  generateCanonicalURL,
  generateLanguageAlternates,
} from '@/services/url-generator';

// 重新导出类型以保持向后兼容
export type { Locale, PageType } from '@/config/paths';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
}

/**
 * Apply base fields to merged config
 */
function applyBaseFields(target: SEOConfig, base: SEOConfig): void {
  if (base.type !== undefined) target.type = base.type;
  if (base.keywords !== undefined) target.keywords = base.keywords;
  if (base.image !== undefined) target.image = base.image;
}

/**
 * Apply custom fields to merged config
 */
function applyCustomFields(
  target: SEOConfig,
  custom: Partial<SEOConfig>,
): void {
  if (custom.type !== undefined) target.type = custom.type;
  if (custom.keywords !== undefined) target.keywords = custom.keywords;
  if (custom.image !== undefined) target.image = custom.image;
  if (custom.title !== undefined) target.title = custom.title;
  if (custom.description !== undefined) target.description = custom.description;
  if (custom.publishedTime !== undefined)
    target.publishedTime = custom.publishedTime;
  if (custom.modifiedTime !== undefined)
    target.modifiedTime = custom.modifiedTime;
  if (custom.authors !== undefined) target.authors = custom.authors;
  if (custom.section !== undefined) target.section = custom.section;
}

function mergeSEOConfig(
  baseConfig: SEOConfig,
  customConfig?: Partial<SEOConfig> | null,
): SEOConfig {
  const mergedConfig: SEOConfig = {};

  applyBaseFields(mergedConfig, baseConfig);

  if (customConfig === null || customConfig === undefined) {
    return mergedConfig;
  }

  applyCustomFields(mergedConfig, customConfig);

  return mergedConfig;
}

/**
 * 生成本地化元数据
 */
export async function generateLocalizedMetadata(
  locale: Locale,
  pageType: PageType,
  config: SEOConfig = {},
): Promise<Metadata> {
  // 使用原始的getTranslations，缓存已在底层实现
  const t = await getTranslations({ locale, namespace: 'seo' });

  const title =
    config.title || t('title', { defaultValue: SITE_CONFIG.seo.defaultTitle });
  const description =
    config.description ||
    t('description', {
      defaultValue: SITE_CONFIG.seo.defaultDescription,
    });
  const siteName = t('siteName', { defaultValue: SITE_CONFIG.name });

  const metadata: Metadata = {
    title,
    description,
    keywords: config.keywords,

    // Open Graph本地化
    openGraph: {
      title,
      description,
      siteName,
      locale,
      type: (config.type === 'product' ? 'website' : config.type) || 'website',
      images: config.image ? [{ url: config.image }] : undefined,
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime,
      authors: config.authors,
      section: config.section,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: config.image ? [config.image] : undefined,
    },

    // hreflang和canonical链接
    alternates: {
      canonical: generateCanonicalURL(pageType, locale),
      languages: generateLanguageAlternates(pageType),
    },

    // 其他元数据
    robots: {
      index: true,
      follow: true,
      googleBot: {
        'index': true,
        'follow': true,
        'max-video-preview': -ONE,
        'max-image-preview': 'large',
        'max-snippet': -ONE,
      },
    },

    // 验证标签
    verification: {
      google: process.env['GOOGLE_SITE_VERIFICATION'],
      yandex: process.env['YANDEX_VERIFICATION'],
    },
  };

  return metadata;
}

/**
 * 生成页面特定的SEO配置
 */
export function createPageSEOConfig(
  pageType: PageType,
  customConfig: Partial<SEOConfig> = {},
): SEOConfig {
  const baseConfigs: Record<PageType, SEOConfig> = {
    home: {
      type: 'website' as const,
      keywords: [
        ...SITE_CONFIG.seo.keywords,
        'shadcn/ui',
        'Radix UI',
        'Modern Web',
        'Enterprise Platform',
        'B2B Solution',
      ],
      image: '/images/og-image.jpg',
    },
    about: {
      type: 'website' as const,
      keywords: ['About', 'Company', 'Team', 'Enterprise'],
    },
    contact: {
      type: 'website' as const,
      keywords: ['Contact', 'Support', 'Business'],
    },
    blog: {
      type: 'article' as const,
      keywords: ['Blog', 'Articles', 'Technology', 'Insights'],
    },
    products: {
      type: 'website' as const,
      keywords: ['Products', 'Solutions', 'Enterprise', 'B2B'],
    },
    services: {
      type: 'website' as const,
      keywords: ['Services', 'Solutions', 'Enterprise', 'B2B'],
    },
    pricing: {
      type: 'website' as const,
      keywords: ['Pricing', 'Plans', 'Enterprise', 'B2B'],
    },
    support: {
      type: 'website' as const,
      keywords: ['Support', 'Help', 'Documentation', 'Service'],
    },
    privacy: {
      type: 'website' as const,
      keywords: ['Privacy', 'Policy', 'Data Protection'],
    },
    terms: {
      type: 'website' as const,
      keywords: ['Terms', 'Conditions', 'Legal'],
    },
  };

  let baseConfig = baseConfigs.home;
  switch (pageType) {
    case 'home':
      baseConfig = baseConfigs.home;
      break;
    case 'about':
      baseConfig = baseConfigs.about;
      break;
    case 'contact':
      baseConfig = baseConfigs.contact;
      break;
    case 'blog':
      baseConfig = baseConfigs.blog;
      break;
    case 'products':
      baseConfig = baseConfigs.products;
      break;
    case 'services':
      baseConfig = baseConfigs.services;
      break;
    case 'pricing':
      baseConfig = baseConfigs.pricing;
      break;
    case 'support':
      baseConfig = baseConfigs.support;
      break;
    case 'privacy':
      baseConfig = baseConfigs.privacy;
      break;
    case 'terms':
      baseConfig = baseConfigs.terms;
      break;
    default:
      baseConfig = baseConfigs.home;
  }

  return mergeSEOConfig(baseConfig, customConfig);
}
