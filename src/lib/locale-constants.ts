import { Locale } from '@/types/i18n';

// 支持的语言列表
export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh'];
export const DEFAULT_LOCALE: Locale = 'en';

// 地理位置到语言的映射
export const GEO_LOCALE_MAP: Record<string, Locale> = {
  // 中文地区
  CN: 'zh', // 中国大陆
  TW: 'zh', // 台湾
  HK: 'zh', // 香港
  MO: 'zh', // 澳门
  SG: 'zh', // 新加坡 (部分中文用户)

  // 英文地区 (默认)
  US: 'en', // 美国
  GB: 'en', // 英国
  CA: 'en', // 加拿大
  AU: 'en', // 澳大利亚
  NZ: 'en', // 新西兰
  IE: 'en', // 爱尔兰
  ZA: 'en', // 南非
  IN: 'en', // 印度
};

// 浏览器语言到支持语言的映射
export const BROWSER_LOCALE_MAP: Record<string, Locale> = {
  // 中文变体 (大写)
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'zh-HK': 'zh',
  'zh-SG': 'zh',
  'zh-Hans': 'zh',
  'zh-Hant': 'zh',

  // 中文变体 (小写)
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  'zh-hk': 'zh',
  'zh-sg': 'zh',
  'zh-hans': 'zh',
  'zh-hant': 'zh',

  // 英文变体 (大写)
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
  'en-NZ': 'en',
  'en-IE': 'en',
  'en-ZA': 'en',
  'en-IN': 'en',

  // 英文变体 (小写)
  'en-us': 'en',
  'en-gb': 'en',
  'en-ca': 'en',
  'en-au': 'en',
  'en-nz': 'en',
  'en-ie': 'en',
  'en-za': 'en',
  'en-in': 'en',
};
