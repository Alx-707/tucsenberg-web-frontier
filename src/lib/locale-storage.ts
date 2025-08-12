'use client';

import { CACHE_DURATIONS, CACHE_LIMITS } from '@/constants/i18n-constants';
import { Locale } from '@/types/i18n';

// 存储键名常量
const STORAGE_KEYS = {
  LOCALE_PREFERENCE: 'locale_preference',
  LOCALE_DETECTION_HISTORY: 'locale_detection_history',
  USER_LOCALE_OVERRIDE: 'user_locale_override',
} as const;

// Cookie 配置
const COOKIE_CONFIG = {
  maxAge: CACHE_DURATIONS.COOKIE_MAX_AGE / 1000, // 转换为秒
  sameSite: 'lax' as const,
  secure:
    typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

// 用户偏好数据结构
export interface UserLocalePreference {
  locale: Locale;
  source: 'user' | 'geo' | 'browser' | 'default';
  timestamp: number;
  confidence: number; // 0-1, 检测置信度
}

// 检测历史记录
export interface LocaleDetectionHistory {
  detections: Array<{
    locale: Locale;
    source: string;
    timestamp: number;
    confidence: number;
  }>;
  lastUpdated: number;
}

/**
 * Cookie 操作工具类
 */
class CookieManager {
  static set(name: string, value: string, options = COOKIE_CONFIG): void {
    if (typeof document === 'undefined') return;

    const optionsStr = Object.entries(options)
      .map(([key, val]) => {
        if (key === 'maxAge') return `max-age=${val}`;
        if (key === 'sameSite') return `SameSite=${val}`;
        if (key === 'secure' && val) return 'Secure';
        if (key === 'path') return `Path=${val}`;
        return '';
      })
      .filter(Boolean)
      .join('; ');

    document.cookie = `${name}=${encodeURIComponent(value)}; ${optionsStr}`;
  }

  static get(name: string): string | null {
    if (typeof document === 'undefined') return null;

    // 使用更安全的cookie解析方法
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
      if (cookieName !== name) continue;

      const cookieValue = cookieValueParts.join('=');
      if (!cookieValue) return null;

      try {
        return decodeURIComponent(cookieValue);
      } catch {
        // 静默处理URI解码错误
        if (process.env.NODE_ENV === 'development') {
          // console.warn('Failed to decode cookie value:', error);
        }
        return null;
      }
    }
    return null;
  }

  static remove(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

/**
 * LocalStorage 操作工具类
 */
class LocalStorageManager {
  static set(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 静默处理localStorage错误，避免在生产环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        // 在开发环境中可以使用调试器或其他日志方案
        // console.warn('Failed to save to localStorage:', error);
      }
    }
  }

  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      // 静默处理localStorage错误，避免在生产环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        // 在开发环境中可以使用调试器或其他日志方案
        // console.warn('Failed to read from localStorage:', error);
      }
      return null;
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // 静默处理localStorage错误，避免在生产环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        // 在开发环境中可以使用调试器或其他日志方案
        // console.warn('Failed to remove from localStorage:', error);
      }
    }
  }
}

/**
 * 用户偏好存储管理器
 */
export class LocaleStorageManager {
  /**
   * 保存用户语言偏好
   */
  static saveUserPreference(preference: UserLocalePreference): void {
    // 保存到 Cookie (用于 SSR)
    try {
      CookieManager.set(
        STORAGE_KEYS.LOCALE_PREFERENCE,
        JSON.stringify(preference),
      );
    } catch {
      // 静默处理cookie错误，避免在生产环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        // 在开发环境中可以使用调试器或其他日志方案
        // console.warn('Failed to save locale preference to cookie:', error);
      }
    }

    // 保存到 localStorage (用于客户端持久化)
    LocalStorageManager.set(STORAGE_KEYS.LOCALE_PREFERENCE, preference);

    // 更新检测历史
    this.updateDetectionHistory({
      locale: preference.locale,
      source: preference.source,
      timestamp: preference.timestamp,
      confidence: preference.confidence,
    });
  }

  /**
   * 获取用户语言偏好
   */
  static getUserPreference(): UserLocalePreference | null {
    // 优先从 localStorage 读取
    let preference = LocalStorageManager.get<UserLocalePreference>(
      STORAGE_KEYS.LOCALE_PREFERENCE,
    );

    // 如果 localStorage 没有，尝试从 Cookie 读取
    if (!preference) {
      const cookieValue = CookieManager.get(STORAGE_KEYS.LOCALE_PREFERENCE);
      if (cookieValue) {
        try {
          preference = JSON.parse(cookieValue);
        } catch {
          // 静默处理cookie解析错误，避免在生产环境中输出日志
          if (process.env.NODE_ENV === 'development') {
            // 在开发环境中可以使用调试器或其他日志方案
            // console.warn('Failed to parse locale preference from cookie:', error);
          }
        }
      }
    }

    return preference;
  }

  /**
   * 设置用户手动选择的语言
   */
  static setUserOverride(locale: Locale): void {
    const preference: UserLocalePreference = {
      locale,
      source: 'user',
      timestamp: Date.now(),
      confidence: 1.0, // 用户手动选择，置信度最高
    };

    this.saveUserPreference(preference);

    // 单独保存用户覆盖标记
    CookieManager.set(STORAGE_KEYS.USER_LOCALE_OVERRIDE, locale);
    LocalStorageManager.set(STORAGE_KEYS.USER_LOCALE_OVERRIDE, locale);
  }

  /**
   * 获取用户手动选择的语言
   */
  static getUserOverride(): Locale | null {
    // 优先从 localStorage 读取
    let override = LocalStorageManager.get<Locale>(
      STORAGE_KEYS.USER_LOCALE_OVERRIDE,
    );

    // 如果 localStorage 没有，尝试从 Cookie 读取
    if (!override) {
      override = CookieManager.get(STORAGE_KEYS.USER_LOCALE_OVERRIDE) as Locale;
    }

    return override;
  }

  /**
   * 清除用户手动选择
   */
  static clearUserOverride(): void {
    CookieManager.remove(STORAGE_KEYS.USER_LOCALE_OVERRIDE);
    LocalStorageManager.remove(STORAGE_KEYS.USER_LOCALE_OVERRIDE);
  }

  /**
   * 更新检测历史
   */
  private static updateDetectionHistory(detection: {
    locale: Locale;
    source: string;
    timestamp: number;
    confidence: number;
  }): void {
    const existingHistory = this.getDetectionHistory();

    // 如果没有历史记录，创建新的
    const history: LocaleDetectionHistory = existingHistory || {
      detections: [],
      lastUpdated: Date.now(),
    };

    // 添加新的检测记录
    history.detections.push(detection);

    // 保持最近记录数量限制
    if (history.detections.length > CACHE_LIMITS.MAX_DETECTION_HISTORY) {
      history.detections = history.detections.slice(
        -CACHE_LIMITS.MAX_DETECTION_HISTORY,
      );
    }

    history.lastUpdated = Date.now();

    LocalStorageManager.set(STORAGE_KEYS.LOCALE_DETECTION_HISTORY, history);
  }

  /**
   * 获取检测历史
   */
  static getDetectionHistory(): LocaleDetectionHistory | null {
    const history = LocalStorageManager.get<LocaleDetectionHistory>(
      STORAGE_KEYS.LOCALE_DETECTION_HISTORY,
    );

    return history;
  }

  /**
   * 添加检测记录
   */
  static addDetectionRecord(detection: {
    locale: Locale;
    source: string;
    timestamp: number;
    confidence: number;
  }): void {
    this.updateDetectionHistory(detection);
  }

  /**
   * 清除所有存储数据
   */
  static clearAll(): void {
    // 清除 Cookies
    Object.values(STORAGE_KEYS).forEach((key) => {
      CookieManager.remove(key);
    });

    // 清除 localStorage
    Object.values(STORAGE_KEYS).forEach((key) => {
      LocalStorageManager.remove(key);
    });
  }

  /**
   * 获取存储统计信息
   */
  static getStorageStats() {
    const preference = this.getUserPreference();
    const override = this.getUserOverride();
    const history = this.getDetectionHistory();

    return {
      hasPreference: Boolean(preference),
      hasOverride: Boolean(override),
      currentLocale: override || preference?.locale || null,
      detectionCount: history?.detections.length || 0,
      lastDetection: history?.detections[history.detections.length - 1] || null,
      storageSize: {
        preference: preference ? JSON.stringify(preference).length : 0,
        history: history ? JSON.stringify(history).length : 0,
      },
    };
  }
}

/**
 * React Hook: 使用语言偏好存储
 */
export function useLocaleStorage() {
  const savePreference = (preference: UserLocalePreference) => {
    LocaleStorageManager.saveUserPreference(preference);
  };

  const getUserPreference = () => {
    return LocaleStorageManager.getUserPreference();
  };

  const setUserOverride = (locale: Locale) => {
    LocaleStorageManager.setUserOverride(locale);
  };

  const getUserOverride = () => {
    return LocaleStorageManager.getUserOverride();
  };

  const clearUserOverride = () => {
    LocaleStorageManager.clearUserOverride();
  };

  const getStats = () => {
    return LocaleStorageManager.getStorageStats();
  };

  return {
    savePreference,
    getUserPreference,
    setUserOverride,
    getUserOverride,
    clearUserOverride,
    getStats,
  };
}
