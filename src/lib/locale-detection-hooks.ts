import { useCallback, useMemo } from 'react';
import type { Locale } from '@/types/i18n';
import {
  BROWSER_LOCALE_MAP,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from '@/lib/locale-constants';
import type { LocaleDetectionResult } from '@/lib/locale-detection-types';
import { CONFIDENCE_WEIGHTS } from '@/lib/locale-detector-constants';
import { LocaleStorageManager } from '@/lib/locale-storage';
import { ONE } from '@/constants';
import { MAGIC_0_7 } from '@/constants/decimal';

/**
 * 客户端语言检测 Hook
 *
 * 使用 useCallback 稳定化返回的函数引用，避免依赖此 Hook 的组件重复渲染
 */
export function useClientLocaleDetection() {
  const detectClientLocale = useCallback((): LocaleDetectionResult => {
    // 客户端检测逻辑
    const userOverride = LocaleStorageManager.getUserOverride();
    if (userOverride && SUPPORTED_LOCALES.includes(userOverride)) {
      return {
        locale: userOverride,
        source: 'user',
        confidence: ONE,
        details: { userOverride },
      };
    }

    // 浏览器语言检测
    if (typeof navigator !== 'undefined') {
      const languages =
        navigator.languages || (navigator.language ? [navigator.language] : []);

      for (const lang of languages) {
        if (!lang || typeof lang !== 'string') continue;
        const normalizedLang = lang.toLowerCase();

        const hasLocaleMapping = Object.prototype.hasOwnProperty.call(
          BROWSER_LOCALE_MAP,
          normalizedLang,
        );

        let detectedLocale: Locale | undefined;
        if (hasLocaleMapping) {
          // nosemgrep: object-injection-sink-dynamic-property
          // 安全说明：
          // - BROWSER_LOCALE_MAP 是在 src/lib/locale-constants.ts 中定义的静态常量映射，
          //   仅包含我们明确列出的浏览器 locale 字符串 → Locale（'en' | 'zh'）。
          // - normalizedLang 来源于 navigator.language / navigator.languages，
          //   这里只被用于在受控常量对象上做查找，不写入任何对象属性。
          // - 通过 hasOwnProperty 先判断键是否存在，像 "constructor" 这类原型链注入值
          //   不会通过校验，对应的测试用例在 locale-detection-hooks.test.ts 中覆盖，
          //   最终会回退到 DEFAULT_LOCALE。
          detectedLocale = (BROWSER_LOCALE_MAP as Record<string, Locale>)[
            normalizedLang as keyof typeof BROWSER_LOCALE_MAP
          ]; // nosemgrep: object-injection-sink-dynamic-property
        }

        if (detectedLocale && SUPPORTED_LOCALES.includes(detectedLocale)) {
          return {
            locale: detectedLocale,
            source: 'browser',
            confidence: MAGIC_0_7,
            details: {
              browserLocale: detectedLocale,
              browserLanguages: [...languages],
            },
          };
        }
      }
    }

    return {
      locale: DEFAULT_LOCALE,
      source: 'default',
      confidence: CONFIDENCE_WEIGHTS.DEFAULT_FALLBACK,
      details: { fallbackUsed: true },
    };
  }, []); // 空依赖数组：函数逻辑不依赖外部变量，保持引用稳定

  // 使用 useMemo 稳定化返回对象
  return useMemo(() => ({ detectClientLocale }), [detectClientLocale]);
}
