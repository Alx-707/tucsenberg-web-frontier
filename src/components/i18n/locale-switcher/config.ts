import { Globe, MapPin, Monitor } from 'lucide-react';
import type { Locale } from '@/types/i18n';
;

export const TRANSITION_TIMEOUT = 1000;

// 语言配置
export const LANGUAGE_CONFIG = {
  en: {
    code: 'EN',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    region: 'Global',
  },
  zh: {
    code: 'ZH',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    region: 'China',
  },
} as const;

// 检测源图标映射
export const SOURCE_ICONS = {
  user: Monitor,
  geo: MapPin,
  browser: Globe,
} as const;

// 语言项渲染组件
export interface LanguageItemProps {
  targetLocale: Locale;
  currentLocale: Locale;
  switchingTo: Locale | null;
  switchSuccess: boolean;
  onSwitch: (_locale: Locale) => void;
  t: (_key: string) => string;
}

export interface EnhancedLocaleSwitcherProps {
  /**
   * 是否显示检测信息
   */
  showDetectionInfo?: boolean;
  /**
   * 紧凑模式
   */
  compact?: boolean;
  /**
   * 自定义样式类名
   */
  className?: string;
}
