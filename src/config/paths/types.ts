/**
 * 路径配置相关类型定义
 */

export type Locale = 'en' | 'zh';

// 路径映射接口定义
export interface LocalizedPath {
  en: string;
  zh: string;
}

// 页面类型定义
export type PageType =
  | 'home'
  | 'about'
  | 'contact'
  | 'blog'
  | 'products'
  | 'diagnostics'
  | 'services'
  | 'pricing'
  | 'support'
  | 'privacy'
  | 'terms';
