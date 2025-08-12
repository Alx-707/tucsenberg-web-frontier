import { Locale } from '@/types/i18n';
import { TEST_APP_CONSTANTS } from '@/constants/test-constants';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locale-constants';
import { LocaleDetectionResult } from './locale-detection-types';
import { LocaleStorageManager } from './locale-storage';

// 语言映射常量
const CHINESE_LANGUAGE_CODES = new Set([
  'zh',
  'zh-cn',
  'zh-tw',
  'zh-hk',
  'zh-sg',
  'zh-hans',
  'zh-hant',
]);

const ENGLISH_LANGUAGE_CODES = new Set([
  'en',
  'en-us',
  'en-gb',
  'en-ca',
  'en-au',
  'en-nz',
  'en-ie',
  'en-za',
  'en-in',
]);

// 地理位置映射常量
const CHINESE_COUNTRY_CODES = new Set(['CN', 'TW', 'HK', 'MO', 'SG']);
const ENGLISH_COUNTRY_CODES = new Set([
  'US',
  'GB',
  'CA',
  'AU',
  'NZ',
  'IE',
  'ZA',
  'IN',
]);

/**
 * 智能语言检测器
 */
export class SmartLocaleDetector {
  /**
   * 安全地从浏览器语言映射中获取语言
   * 使用白名单验证，避免 Object Injection Sink
   */
  private getLocaleFromMap(normalizedLang: string): Locale | undefined {
    if (CHINESE_LANGUAGE_CODES.has(normalizedLang)) {
      return 'zh';
    }

    if (ENGLISH_LANGUAGE_CODES.has(normalizedLang)) {
      return 'en';
    }

    return undefined;
  }

  /**
   * 安全地从地理位置映射中获取语言
   * 使用白名单验证，避免 Object Injection Sink
   */
  private getLocaleFromGeoMap(
    countryCode: string | undefined,
  ): Locale | undefined {
    if (!countryCode || typeof countryCode !== 'string') {
      return undefined;
    }

    if (CHINESE_COUNTRY_CODES.has(countryCode)) {
      return 'zh';
    }

    if (ENGLISH_COUNTRY_CODES.has(countryCode)) {
      return 'en';
    }

    return undefined;
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
    } catch {
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
              const detectedLocale = this.getLocaleFromGeoMap(
                country?.toUpperCase(),
              );
              resolve(
                detectedLocale && SUPPORTED_LOCALES.includes(detectedLocale)
                  ? detectedLocale
                  : DEFAULT_LOCALE,
              );
            } catch {
              resolve(DEFAULT_LOCALE);
            }
          },
          () => resolve(DEFAULT_LOCALE),
          { timeout: 5000 },
        );
      });
    } catch {
      return DEFAULT_LOCALE;
    }
  }

  /**
   * 实例方法：从时区检测语言
   */
  detectFromTimeZone(): Locale {
    try {
      if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
        return DEFAULT_LOCALE;
      }

      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

      // 中文时区映射
      const chineseTimeZones = new Set([
        'Asia/Shanghai',
        'Asia/Hong_Kong',
        'Asia/Taipei',
        'Asia/Macau',
        'Asia/Singapore',
      ]);

      // 英文时区映射
      const englishTimeZones = new Set([
        'America/New_York',
        'America/Los_Angeles',
        'America/Chicago',
        'America/Denver',
        'Europe/London',
        'Australia/Sydney',
        'Australia/Melbourne',
      ]);

      if (chineseTimeZones.has(timeZone)) {
        return 'zh';
      }

      if (englishTimeZones.has(timeZone)) {
        return 'en';
      }

      return DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  }

  /**
   * 检测最佳语言偏好（兼容方法名）
   */
  async detectBestLocale(): Promise<LocaleDetectionResult> {
    // 1. 检查存储的用户偏好
    const userPreference = LocaleStorageManager.getUserPreference();
    if (userPreference && SUPPORTED_LOCALES.includes(userPreference.locale)) {
      return {
        locale: userPreference.locale,
        source: 'stored',
        confidence: userPreference.confidence || 1.0,
        details: { userOverride: userPreference.locale },
      };
    }

    // 2. 检查用户手动设置
    const userOverride = LocaleStorageManager.getUserOverride();
    if (userOverride && SUPPORTED_LOCALES.includes(userOverride)) {
      return {
        locale: userOverride,
        source: 'user',
        confidence: 1.0,
        details: { userOverride },
      };
    }

    // 3. 检查地理位置
    const geoLocale = await this.detectFromGeolocation();
    if (geoLocale !== DEFAULT_LOCALE) {
      return {
        locale: geoLocale,
        source: 'geo',
        confidence: 0.8,
        details: { geoLocale },
      };
    }

    // 4. 检查浏览器语言
    const browserLocale = this.detectFromBrowser();
    if (browserLocale !== DEFAULT_LOCALE) {
      return {
        locale: browserLocale,
        source: 'browser',
        confidence: 0.6,
        details: { browserLocale },
      };
    }

    // 5. 使用默认语言
    return {
      locale: DEFAULT_LOCALE,
      source: 'default',
      confidence: 0.3,
      details: { fallbackUsed: true },
    };
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

    // 2. 收集所有检测结果
    const geoLocale = await this.detectFromGeolocation();
    const browserLocale = this.detectFromBrowser();
    const timeZoneLocale = this.detectFromTimeZone();

    // 3. 分析检测结果一致性
    const detectionResults = [
      { locale: geoLocale, source: 'geo', weight: 0.8 },
      { locale: browserLocale, source: 'browser', weight: 0.7 },
      { locale: timeZoneLocale, source: 'timezone', weight: 0.6 },
    ].filter((result) => result.locale !== DEFAULT_LOCALE);

    if (detectionResults.length === 0) {
      return {
        locale: DEFAULT_LOCALE,
        source: 'default',
        confidence: 0.3,
        details: { fallbackUsed: true },
      };
    }

    // 4. 找到最常见的语言
    const localeCount = new Map<
      string,
      { count: number; totalWeight: number; sources: string[] }
    >();

    for (const result of detectionResults) {
      const current = localeCount.get(result.locale) || {
        count: 0,
        totalWeight: 0,
        sources: [],
      };
      current.count += 1;
      current.totalWeight += result.weight;
      current.sources.push(result.source);
      localeCount.set(result.locale, current);
    }

    // 5. 选择最佳结果
    let bestLocale = DEFAULT_LOCALE;
    let bestScore = 0;
    let bestSources: string[] = [];

    for (const [locale, data] of localeCount.entries()) {
      const score =
        data.count * TEST_APP_CONSTANTS.CONFIDENCE_THRESHOLD +
        data.totalWeight * TEST_APP_CONSTANTS.CONFIDENCE_THRESHOLD;
      if (score > bestScore) {
        bestScore = score;
        bestLocale = locale as Locale;
        bestSources = data.sources;
      }
    }

    // 6. 计算置信度
    const consistencyBonus =
      localeCount.get(bestLocale)!.count > 1
        ? TEST_APP_CONSTANTS.LOW_CONFIDENCE_THRESHOLD
        : 0;
    const baseConfidence = Math.min(
      localeCount.get(bestLocale)!.totalWeight / detectionResults.length,
      TEST_APP_CONSTANTS.HEALTH_THRESHOLD,
    );
    const finalConfidence = Math.min(baseConfidence + consistencyBonus, 1.0);

    return {
      locale: bestLocale,
      source:
        bestSources.length > 1
          ? 'combined'
          : (bestSources[0] as 'geo' | 'browser'),
      confidence: finalConfidence,
      details: {
        ...(geoLocale !== DEFAULT_LOCALE && { geoLocale }),
        ...(browserLocale !== DEFAULT_LOCALE && { browserLocale }),
        ...(timeZoneLocale !== DEFAULT_LOCALE && { timeZoneLocale }),
      },
    };
  }
}
