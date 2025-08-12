import { Locale } from '@/types/i18n';

/**
 * 检测结果接口
 */
export interface LocaleDetectionResult {
  locale: Locale;
  source:
    | 'user'
    | 'stored'
    | 'geo'
    | 'browser'
    | 'default'
    | 'combined'
    | 'timezone';
  confidence: number; // 0-1
  details: {
    userOverride?: Locale;
    geoLocale?: Locale;
    browserLocale?: Locale;
    timeZoneLocale?: Locale;
    fallbackUsed?: boolean;
    browserLanguages?: string[];
  };
}
