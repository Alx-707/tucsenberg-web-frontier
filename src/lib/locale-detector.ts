import { Locale } from '@/types/i18n';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locale-constants';
import { LocaleDetectionResult } from './locale-detection-types';
import { LocaleStorageManager } from './locale-storage';

/**
 * 智能语言检测器
 */
export class SmartLocaleDetector {
  /**
   * 安全地从浏览器语言映射中获取语言
   * 使用白名单验证，避免 Object Injection Sink
   */
  private getLocaleFromMap(normalizedLang: string): Locale | undefined {
    // 使用 switch 语句替代动态属性访问，确保安全性
    switch (normalizedLang) {
      // 中文变体
      case 'zh':
      case 'zh-cn':
      case 'zh-tw':
      case 'zh-hk':
      case 'zh-sg':
      case 'zh-hans':
      case 'zh-hant':
        return 'zh';

      // 英文变体
      case 'en':
      case 'en-us':
      case 'en-gb':
      case 'en-ca':
      case 'en-au':
      case 'en-nz':
      case 'en-ie':
      case 'en-za':
      case 'en-in':
        return 'en';

      default:
        return undefined;
    }
  }

  /**
   * 安全地从地理位置映射中获取语言
   * 使用白名单验证，避免 Object Injection Sink
   */
  private getLocaleFromGeoMap(countryCode: string | undefined): Locale | undefined {
    if (!countryCode || typeof countryCode !== 'string') {
      return undefined;
    }

    // 使用 switch 语句替代动态属性访问，确保安全性
    switch (countryCode) {
      // 中文地区
      case 'CN': // 中国大陆
      case 'TW': // 台湾
      case 'HK': // 香港
      case 'MO': // 澳门
      case 'SG': // 新加坡
        return 'zh';

      // 英文地区
      case 'US': // 美国
      case 'GB': // 英国
      case 'CA': // 加拿大
      case 'AU': // 澳大利亚
      case 'NZ': // 新西兰
      case 'IE': // 爱尔兰
      case 'ZA': // 南非
      case 'IN': // 印度
        return 'en';

      default:
        return undefined;
    }
  }
  /**
   * 实例方法：从浏览器检测语言
   */
  detectFromBrowser(): Locale {
    try {
      if (typeof navigator === 'undefined') {
        return DEFAULT_LOCALE;
      }

      const languages = navigator.languages || [navigator.language];

      for (const lang of languages) {
        const normalizedLang = lang.toLowerCase();

        // 使用安全的属性访问方式，避免 Object Injection Sink
        const detectedLocale = this.getLocaleFromMap(normalizedLang);

        if (detectedLocale && SUPPORTED_LOCALES.includes(detectedLocale)) {
          return detectedLocale;
        }
      }

      return DEFAULT_LOCALE;
    } catch (_error) {
      return DEFAULT_LOCALE;
    }
  }

  /**
   * 实例方法：从地理位置检测语言
   */
  async detectFromGeolocation(): Promise<Locale> {
    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return DEFAULT_LOCALE;
      }

      return await new Promise<Locale>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // 模拟地理位置API调用
              const response = await fetch(
                `https://api.example.com/geo?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
              );
              const data = await response.json();
              const country = data.country || data.country_code;

              // 使用安全的地理位置映射访问
              const detectedLocale = this.getLocaleFromGeoMap(country?.toUpperCase());
              resolve(
                detectedLocale && SUPPORTED_LOCALES.includes(detectedLocale)
                  ? detectedLocale
                  : DEFAULT_LOCALE,
              );
            } catch (_error) {
              resolve(DEFAULT_LOCALE);
            }
          },
          () => resolve(DEFAULT_LOCALE),
          { timeout: 5000 },
        );
      });
    } catch (_error) {
      return DEFAULT_LOCALE;
    }
  }

  /**
   * 智能检测用户语言偏好
   */
  async detectSmartLocale(): Promise<LocaleDetectionResult> {
    // 1. 检查用户手动设置
    const userOverride = LocaleStorageManager.getUserOverride();
    if (userOverride && SUPPORTED_LOCALES.includes(userOverride)) {
      return {
        locale: userOverride,
        source: 'user',
        confidence: 1.0,
        details: { userOverride },
      };
    }

    // 2. 检查地理位置
    const geoLocale = await this.detectFromGeolocation();
    if (geoLocale !== DEFAULT_LOCALE) {
      return {
        locale: geoLocale,
        source: 'geo',
        confidence: 0.8,
        details: { geoLocale },
      };
    }

    // 3. 检查浏览器语言
    const browserLocale = this.detectFromBrowser();
    if (browserLocale !== DEFAULT_LOCALE) {
      return {
        locale: browserLocale,
        source: 'browser',
        confidence: 0.6,
        details: { browserLocale },
      };
    }

    // 4. 使用默认语言
    return {
      locale: DEFAULT_LOCALE,
      source: 'default',
      confidence: 0.3,
      details: { fallbackUsed: true },
    };
  }
}
