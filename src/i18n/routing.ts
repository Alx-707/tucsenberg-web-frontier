import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

// 直接使用 next-intl 官方推荐的简化配置
export const routing = defineRouting({
  // 支持的语言
  locales: ['en', 'zh'],

  // 默认语言
  defaultLocale: 'en',

  // 路径映射配置 - 使用标准路径方案
  pathnames: {
    '/': '/',
    '/products': '/products',
    '/blog': '/blog',
    '/about': '/about',
    '/contact': '/contact',
  },

  // 语言前缀模式
  localePrefix: 'always',

  // 启用hreflang链接
  alternateLinks: true,

  // 启用智能语言检测
  localeDetection: true,
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

// 导出类型，使用统一配置
export type Locale = (typeof routing.locales)[number];

// 导出配置验证函数，供其他模块使用
export { validatePathsConfig } from '@/config/paths';
