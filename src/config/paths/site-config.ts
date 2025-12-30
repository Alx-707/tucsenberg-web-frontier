/**
 * 站点配置
 */

// 站点配置
export const SITE_CONFIG = {
  baseUrl:
    process.env['NEXT_PUBLIC_BASE_URL'] ||
    process.env['NEXT_PUBLIC_SITE_URL'] ||
    'https://example.com',
  name: '[PROJECT_NAME]',
  description: 'Modern B2B Enterprise Web Platform with Next.js 15',

  // SEO配置
  seo: {
    titleTemplate: '%s | [PROJECT_NAME]',
    defaultTitle: '[PROJECT_NAME]',
    defaultDescription: 'Modern B2B Enterprise Web Platform with Next.js 15',
    keywords: ['Next.js', 'React', 'TypeScript', 'B2B', 'Enterprise'],
  },

  // 社交媒体链接
  social: {
    twitter: '[TWITTER_URL]',
    linkedin: '[LINKEDIN_URL]',
    github: '[GITHUB_URL]',
  },

  // 联系信息
  contact: {
    phone: '+1-555-0123',
    email: '[CONTACT_EMAIL]',
    whatsappNumber: process.env['NEXT_PUBLIC_WHATSAPP_NUMBER'] ?? '+1-555-0123',
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
