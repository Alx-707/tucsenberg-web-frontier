import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

// SEO优化的next-intl配置
export const routing = defineRouting({
  // 支持的语言
  locales: ['en', 'zh'],

  // 默认语言
  defaultLocale: 'en',

  // SEO优化: 使用as-needed提升默认语言SEO
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      'zh': '/zh'
      // 'en' 不需要前缀，提升默认语言SEO
    }
  },

  // 扩展的路径本地化
  pathnames: {
    '/': '/',
    '/about': {
      en: '/about',
      zh: '/guanyu',
    },
    '/contact': {
      en: '/contact',
      zh: '/lianxi',
    },
    '/products': {
      en: '/products',
      zh: '/chanpin',
    },
    '/blog': {
      en: '/blog',
      zh: '/blog',
    },
    '/services': {
      en: '/services',
      zh: '/fuwu',
    },
    '/pricing': {
      en: '/pricing',
      zh: '/jiage',
    },
    '/support': {
      en: '/support',
      zh: '/zhichi',
    },
    '/privacy': {
      en: '/privacy',
      zh: '/yinsi',
    },
    '/terms': {
      en: '/terms',
      zh: '/tiaokuan',
    }
  },

  // 启用hreflang链接
  alternateLinks: true,

  // 启用智能语言检测
  localeDetection: true
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

// 导出类型，使用统一配置
export type Locale = (typeof routing.locales)[number];

// 导出配置验证函数，供其他模块使用
export { validatePathsConfig } from '@/config/paths';
