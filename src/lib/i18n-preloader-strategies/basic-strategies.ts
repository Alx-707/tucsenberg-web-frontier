/**
 * 基础翻译预加载策略实现
 * Basic Translation Preloader Strategy Implementations
 */

import type { Locale } from '@/types/i18n';
import type { 
  IPreloader,
  PreloadStrategy,
  PreloadOptions,
} from '../i18n-preloader-types';

/**
 * 立即预加载策略
 * Immediate preload strategy
 */
export const immediateStrategy: PreloadStrategy = async (
  preloader: IPreloader,
  locales: Locale[],
  options?: PreloadOptions
) => {
  await preloader.preloadMultipleLocales(locales, options);
};

/**
 * 智能预加载策略
 * Smart preload strategy
 */
export const smartStrategy: PreloadStrategy = async (
  preloader: IPreloader,
  locales: Locale[],
  options?: PreloadOptions
) => {
  await preloader.smartPreload();
};

/**
 * 渐进式预加载策略
 * Progressive preload strategy
 */
export const progressiveStrategy: PreloadStrategy = async (
  preloader: IPreloader,
  locales: Locale[],
  options?: PreloadOptions
) => {
  for (const locale of locales) {
    if (preloader.isPreloading()) {
      await preloader.preloadLocale(locale, options);
      // 添加延迟以避免阻塞主线程
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};

/**
 * 优先级预加载策略
 * Priority preload strategy
 */
export const priorityStrategy: PreloadStrategy = async (
  preloader: IPreloader,
  locales: Locale[],
  options?: PreloadOptions
) => {
  // 定义语言优先级
  const priorityMap: Record<Locale, number> = {
    'en': 1,
    'zh': 2,
  };

  // 按优先级排序
  const sortedLocales = locales.sort((a, b) => {
    const priorityA = priorityMap[a] || 999;
    const priorityB = priorityMap[b] || 999;
    return priorityA - priorityB;
  });

  // 高优先级的语言先预加载
  for (const locale of sortedLocales) {
    await preloader.preloadLocale(locale, {
      ...options,
      priority: priorityMap[locale] <= 2 ? 'high' : 'normal',
    });
  }
};

/**
 * 懒加载策略
 * Lazy preload strategy
 */
export const lazyStrategy: PreloadStrategy = async (
  preloader: IPreloader,
  locales: Locale[],
  options?: PreloadOptions
) => {
  // 只预加载当前最需要的语言
  if (locales.length > 0) {
    await preloader.preloadLocale(locales[0], options);
  }
};
