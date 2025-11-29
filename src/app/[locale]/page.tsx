// Auto-deploy verification test: 2025-10-31T12:34:56Z

import { cacheLife } from 'next/cache';
import { extractHeroMessages } from '@/lib/i18n/extract-hero-messages';
import { loadCriticalMessages } from '@/lib/load-messages';
import { BelowTheFoldClient } from '@/components/home/below-the-fold.client';
import { HeroSectionStatic } from '@/components/home/hero-section';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface HomePageProps {
  params: Promise<{ locale: 'en' | 'zh' }>;
}

// Type for nested translation messages (non-recursive to satisfy TS checks)
type TranslationValue = string | Record<string, unknown>;
type TranslationMessages = Record<string, TranslationValue>;

/**
 * Load the `home.hero` namespace for the homepage using Cache Components.
 *
 * Cache semantics:
 * - Data-function level "use cache" + cacheLife('days'), treating hero copy
 *   as marketing content that typically changes at most daily.
 * - Depends only on the explicit `locale` parameter and externalized
 *   translation JSON loaded via `loadCriticalMessages`.
 *
 * Constraints:
 * - MUST NOT call headers(), cookies(), requestLocale() or other
 *   request-scoped APIs, so it remains safe to use as a cached data helper.
 * - Serves as the baseline example for other Cache Components data loaders
 *   (e.g. contact copy, blog/product wrappers).
 */
async function getHomeHeroMessages(
  locale: 'en' | 'zh',
): Promise<TranslationMessages> {
  'use cache';

  // 首页 hero 采用 Cache Components 缓存，视为“每天可能更新一次”的
  // 营销内容：
  // - cacheLife('days') => stale: 5min, revalidate: 1 day, expire: 1 week
  // - 与 loadCriticalMessages 内部基于 unstable_cache 的 1 小时缓存叠加，
  //   仍然保持可接受的新鲜度，同时减少跨 locale 重复解析 JSON 的开销。
  cacheLife('days');

  const messages = await loadCriticalMessages(locale);
  return extractHeroMessages(messages) as TranslationMessages;
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;

  // Load critical messages for the hero namespace via an explicit
  // data-fetch style helper that is implemented as a data-level
  // Cache Component ("use cache" + cacheLife('days')) and does not
  // depend on request-scoped i18n hooks.
  const heroNs = await getHomeHeroMessages(locale);

  // 实验开关：中文首帧系统字体 + 600 权重（A/B）
  const zhFast = process.env.NEXT_PUBLIC_FAST_LCP_ZH === '1' && locale === 'zh';

  return (
    <div
      className='min-h-screen bg-background text-foreground'
      data-fast-lcp-zh={zhFast ? '1' : undefined}
    >
      {/* LCP-critical: render statically from compile-time messages */}
      <HeroSectionStatic messages={heroNs} />

      {/* Below-the-fold: client boundary with scoped i18n to keep vendors slim */}
      <BelowTheFoldClient locale={locale} />
    </div>
  );
}
