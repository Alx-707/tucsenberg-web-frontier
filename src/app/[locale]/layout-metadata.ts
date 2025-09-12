import type { Metadata } from 'next';
import type { Locale } from '@/lib/seo-metadata';
import { generateLocalizedMetadata } from '@/lib/seo-metadata';
import { createPageSEOConfig,  } from '@/lib/seo-metadata';
import { routing } from '@/i18n/routing';

/**
 * 生成本地化页面元数据
 * 用于动态生成每个locale的metadata
 */
export async function generateLocaleMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // 确保locale有效
  if (!routing.locales.includes(locale as Locale)) {
    return {
      title: 'Tucsenberg Web Frontier',
      description: 'Modern B2B Enterprise Web Platform with Next.js 15',
    };
  }

  const seoConfig = createPageSEOConfig('home');
  return generateLocalizedMetadata(locale as Locale, 'home', seoConfig);
}
