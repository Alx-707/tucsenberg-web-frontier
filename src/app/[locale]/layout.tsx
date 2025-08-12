import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import {
  DevelopmentPerformanceMonitor,
  DevelopmentWebVitalsIndicator,
  DynamicDevToolsController,
  DynamicDevToolsStatusIndicator,
  DynamicReactScanControlPanel,
  DynamicReactScanIndicator,
  DynamicReactScanProvider,
  DynamicThemePerformanceMonitor,
  DynamicTranslationPreloader,
} from '@/components/shared/dynamic-imports';
import { ThemeProvider } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import { generateJSONLD } from '@/lib/structured-data';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import '../globals.css';
import { getFontClassNames } from './layout-fonts';
import { generateLocaleMetadata } from './layout-metadata';
import { generatePageStructuredData } from './layout-structured-data';

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

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // 生成结构化数据
  const { organizationData, websiteData } = await generatePageStructuredData(
    locale as 'en' | 'zh',
  );

  return (
    <div
      lang={locale}
      className={`${getFontClassNames()} flex min-h-screen flex-col antialiased`}
    >
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(organizationData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(websiteData),
        }}
      />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
          >
            {/* React Scan 性能监控 - 动态导入（默认禁用） */}
            <DynamicReactScanProvider>
              {/* I18n性能优化组件 - 动态导入 */}
              <DynamicTranslationPreloader />

              {/* 主题性能监控组件 - 动态导入 */}
              <DynamicThemePerformanceMonitor />

              {/* Web Vitals 性能监控 - 动态导入 */}
              <DevelopmentWebVitalsIndicator />

            {/* 导航栏 */}
            <Header />

            {/* 主要内容 */}
            <main className='flex-1'>{children}</main>

            {/* 页脚 */}
            <Footer />

              {/* 开发环境性能指示器 - 动态导入 */}
              <DevelopmentPerformanceMonitor />

              {/* React Scan 状态指示器 - 动态导入 */}
              <DynamicReactScanIndicator />

              {/* React Scan 控制面板 - 动态导入 */}
              <DynamicReactScanControlPanel />

              {/* 开发工具控制器 - 统一管理所有开发工具 */}
              <DynamicDevToolsController />

              {/* 开发工具状态指示器 */}
              <DynamicDevToolsStatusIndicator />
            </DynamicReactScanProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
    </div>
  );
}
