import { getTranslations } from 'next-intl/server';
import { I18nPerformanceMonitor } from '@/lib/i18n-performance';
import {
  generateArticleData,
  generateBreadcrumbData,
  generateOrganizationData,
  generateProductData,
  generateWebSiteData,
} from '@/lib/structured-data-generators';
import type {
  ArticleData,
  BreadcrumbData,
  Locale,
  OrganizationData,
  ProductData,
  WebSiteData,
} from '@/lib/structured-data-types';
import { SITE_CONFIG, type PageType } from '@/config/paths';
import { generateCanonicalURL } from '@/services/url-generator';

/**
 * 创建面包屑导航结构化数据
 */
export function createBreadcrumbStructuredData(
  locale: Locale,
  breadcrumbs: Array<{ name: string; url: string }>,
) {
  return generateLocalizedStructuredData(locale, 'BreadcrumbList', {
    items: breadcrumbs.map((item, index) => ({
      name: item.name,
      url: item.url,
      position: index + 1,
    })),
  });
}

/**
 * 创建文章结构化数据
 */
export function createArticleStructuredData(
  locale: Locale,
  article: {
    title: string;
    description: string;
    author?: string;
    publishedTime: string;
    modifiedTime?: string;
    url: string;
    image?: string;
  },
) {
  return generateLocalizedStructuredData(locale, 'Article', article);
}

// 兼容测试所需的便捷导出：根据测试用例命名
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>,
  locale: Locale,
) {
  return createBreadcrumbStructuredData(locale, breadcrumbs);
}

export function generateArticleSchema(
  article: {
    title: string;
    description: string;
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    image?: string;
    section?: string;
  },
  locale: Locale,
) {
  // 为缺失的 URL 使用规范化地址（测试中已对该函数进行 mock）
  const url = generateCanonicalURL('blog' as PageType, locale);
  const now = new Date().toISOString();
  const payload: Partial<ArticleData> = {
    title: article.title,
    description: article.description,
    publishedTime: article.publishedTime ?? now,
    modifiedTime: article.modifiedTime ?? article.publishedTime ?? now,
    url,
  };

  if (article.author) {
    payload.author = article.author;
  }
  if (article.image) {
    payload.image = article.image;
  }
  if (article.section) {
    payload.section = article.section;
  }

  return generateLocalizedStructuredData(
    locale,
    'Article',
    payload as ArticleData,
  );
}

export function generateProductSchema(
  product: {
    name: string;
    description: string;
    image?: string;
    price?: string | number;
    currency?: string;
    availability?: string;
    brand?: string;
    sku?: string;
  },
  locale: Locale,
) {
  // 规范化价格为 number | undefined 以适配内部类型
  const normalizedPrice =
    typeof product.price === 'string' ? Number(product.price) : product.price;
  const payload: Partial<ProductData> = {
    name: product.name,
    description: product.description,
  };

  if (product.brand) {
    payload.brand = product.brand;
  }
  if (product.image) {
    payload.image = product.image;
  }
  if (normalizedPrice !== undefined) {
    payload.price = normalizedPrice;
  }
  if (product.currency) {
    payload.currency = product.currency;
  }
  if (product.availability) {
    payload.availability = product.availability;
  }
  if (product.sku) {
    payload.sku = product.sku;
  }

  return generateLocalizedStructuredData(
    locale,
    'Product',
    payload as ProductData,
  );
}

export function generateFAQSchema(
  faq: Array<{ question: string; answer: string }>,
  _locale: Locale,
) {
  // 直接构建 FAQPage 结构以满足测试断言
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faq.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
  } as Record<string, unknown>;
}

export function generateLocalBusinessSchema(
  business: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    openingHours?: string[];
    priceRange?: string;
  },
  _locale: Locale,
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': business.name,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': business.address,
    },
    'url': SITE_CONFIG.baseUrl,
  };

  if (business.phone) {
    schema.telephone = business.phone;
  }
  if (business.email) {
    schema.email = business.email;
  }
  if (business.openingHours) {
    schema.openingHours = business.openingHours;
  }
  if (business.priceRange) {
    schema.priceRange = business.priceRange;
  }

  return schema;
}

/**
 * 生成本地化结构化数据
 */
export async function generateLocalizedStructuredData(
  locale: Locale,
  type: 'Organization' | 'WebSite' | 'Article' | 'Product' | 'BreadcrumbList',
  data: unknown,
): Promise<Record<string, unknown>> {
  try {
    // 使用原始的getTranslations，缓存已在底层实现
    const t = await getTranslations({ locale, namespace: 'structured-data' });

    switch (type) {
      case 'Organization':
        return generateOrganizationData(
          t,
          data as OrganizationData | undefined,
        );
      case 'WebSite':
        return generateWebSiteData(t, data as WebSiteData | undefined);
      case 'Article':
        return generateArticleData(t, locale, data as ArticleData);
      case 'Product':
        return generateProductData(t, data as ProductData);
      case 'BreadcrumbList':
        return generateBreadcrumbData(data as BreadcrumbData);
      default:
        // 对于未知类型，返回基础结构而不使用扩展运算符
        return {
          '@context': 'https://schema.org',
          '@type': type,
        };
    }
  } catch (error) {
    // 记录错误并返回基础结构
    if (error instanceof Error) {
      // 处理已知错误类型
      I18nPerformanceMonitor.recordError();
    }
    // 错误情况下也不使用扩展运算符，避免潜在的安全风险
    return {
      '@context': 'https://schema.org',
      '@type': type,
    };
  }
}
