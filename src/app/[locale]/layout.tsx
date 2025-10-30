import { getFontClassNames } from '@/app/[locale]/layout-fonts';
import { generateLocaleMetadata } from '@/app/[locale]/layout-metadata';
import { generatePageStructuredData } from '@/app/[locale]/layout-structured-data';
import '@/app/globals.css';
import { Suspense, type ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import enMessages from '@messages/en.json';
import zhMessages from '@messages/zh.json';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { generateJSONLD } from '@/lib/structured-data';
import { ErrorBoundary } from '@/components/error-boundary';
import { TranslationPreloader } from '@/components/i18n/translation-preloader';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { LazyToaster } from '@/components/lazy/lazy-toaster';
import { LazyTopLoader } from '@/components/lazy/lazy-top-loader';
import { EnterpriseAnalyticsIsland } from '@/components/monitoring/enterprise-analytics-island';
import { WebVitalsIndicator } from '@/components/performance/web-vitals-indicator';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemePerformanceMonitor } from '@/components/theme/theme-performance-monitor';
import { routing } from '@/i18n/routing';

// Client analytics are rendered as an island to avoid impacting LCP

export const dynamic = 'force-static';
export const revalidate = 3600;

// 重新导出元数据生成函数
export const generateMetadata = generateLocaleMetadata;

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as 'en' | 'zh')) {
    notFound();
  }

  // Set request locale for the current subtree so that navigation wrappers
  // (Link/usePathname/useRouter from next-intl) can correctly infer the locale
  setRequestLocale(locale);

  const isDevelopment = process.env.NODE_ENV === 'development';

  const headerList = await headers();
  const nonce = headerList.get('x-csp-nonce') ?? undefined;

  // Use static imports for messages to avoid runtime translation IO on the
  // critical path. The homepage will independently render LCP-critical content
  // from compile-time messages and wrap below-the-fold content in a nested
  // provider; keeping this here preserves compatibility for other pages.
  const messages = (locale === 'zh' ? zhMessages : enMessages) as Record<
    string,
    unknown
  >;

  // 生成结构化数据
  const { organizationData, websiteData } = await generatePageStructuredData(
    locale as 'en' | 'zh',
  );

  return (
    <html
      lang={locale}
      className={getFontClassNames()}
      suppressHydrationWarning
    >
      <body
        className='flex min-h-screen flex-col antialiased'
        suppressHydrationWarning
      >
        {/* JSON-LD 结构化数据 */}
        <script
          nonce={nonce}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(organizationData),
          }}
        />
        <script
          nonce={nonce}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(websiteData),
          }}
        />
        <NextIntlClientProvider
          locale={locale as 'en' | 'zh'}
          messages={messages}
        >
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
          >
            {/* 页面导航进度条 - P1 优化：懒加载，减少 vendors chunk */}
            <LazyTopLoader nonce={nonce} />

            {isDevelopment && (
              <Suspense fallback={null}>
                <ErrorBoundary
                  fallback={
                    <div className='bg-destructive/80 fixed right-4 bottom-4 z-[1100] rounded-md px-3 py-2 text-xs text-white shadow-lg'>
                      监控组件加载失败
                    </div>
                  }
                >
                  <TranslationPreloader strategy='idle' />
                  <ThemePerformanceMonitor />
                  <WebVitalsIndicator />
                </ErrorBoundary>
              </Suspense>
            )}

            {/* 导航栏 */}
            <Header />

            {/* 主要内容 */}
            <main className='flex-1'>{children}</main>

            {/* 页脚 */}
            <Footer />

            {/* Toast 消息容器 - P1 优化：懒加载，减少 vendors chunk */}
            <LazyToaster />

            {/* 企业级监控组件：延迟加载的客户端岛，避免阻塞首屏 */}
            {process.env.NODE_ENV === 'production' && (
              <EnterpriseAnalyticsIsland />
            )}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
