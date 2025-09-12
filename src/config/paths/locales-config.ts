/**
 * 语言配置
 */

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

export type LocalesConfig = typeof LOCALES_CONFIG;
