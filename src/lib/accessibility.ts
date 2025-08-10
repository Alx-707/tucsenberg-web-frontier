'use client';

import {
  DELAY_CONSTANTS,
  OPACITY_CONSTANTS,
  PERCENTAGE_CONSTANTS,
} from '@/constants/app-constants';
import { checkContrastCompliance, type OKLCHColor } from './colors';
import { logger } from './logger';

/**
 * 无障碍性支持库
 * 提供主题切换的无障碍性功能，确保WCAG 2.1 AA级合规
 */

/**
 * 屏幕阅读器语音提示配置
 */
export interface ScreenReaderConfig {
  enabled: boolean;
  language: 'zh' | 'en';
  announceDelay: number; // 延迟时间（毫秒）
}

/**
 * 主题切换语音提示文本
 */
export const THEME_ANNOUNCEMENTS = {
  zh: {
    light: '已切换到明亮模式',
    dark: '已切换到暗黑模式',
    system: '已切换到系统模式',
    switching: '正在切换主题...',
  },
  en: {
    light: 'Switched to light mode',
    dark: 'Switched to dark mode',
    system: 'Switched to system mode',
    switching: 'Switching theme...',
  },
} as const;

/**
 * 键盘导航键码
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const;

/**
 * 无障碍性管理器
 */
export class AccessibilityManager {
  private config: ScreenReaderConfig;
  private liveRegion: HTMLElement | null = null;

  constructor(config?: Partial<ScreenReaderConfig>) {
    this.config = {
      enabled: true,
      language: 'zh',
      announceDelay: PERCENTAGE_CONSTANTS.FULL, // 100ms
      ...config,
    };

    this.initializeLiveRegion();
  }

  /**
   * 初始化ARIA live region用于屏幕阅读器公告
   */
  private initializeLiveRegion(): void {
    if (typeof document === 'undefined') return;

    // 创建或获取现有的live region
    this.liveRegion = document.getElementById('theme-announcements');

    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.id = 'theme-announcements';
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('role', 'status');
      this.liveRegion.style.position = 'absolute';
      this.liveRegion.style.left = '-10000px';
      this.liveRegion.style.width = '1px';
      this.liveRegion.style.height = '1px';
      this.liveRegion.style.overflow = 'hidden';

      document.body.appendChild(this.liveRegion);
    }
  }

  /**
   * 播报主题切换消息
   */
  announceThemeChange(theme: string): void {
    if (!this.config.enabled || !this.liveRegion) return;

    const announcements = THEME_ANNOUNCEMENTS[this.config.language];
    const message =
      announcements[theme as keyof typeof announcements] ||
      `已切换到${theme}模式`;

    // 延迟播报以确保屏幕阅读器能够捕获
    setTimeout(() => {
      if (this.liveRegion) {
        try {
          this.liveRegion.textContent = message;
        } catch (error) {
          logger.warn(
            'Failed to set textContent for accessibility announcement',
            {
              message,
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }

        // 清除消息以便下次播报
        const clearDelay = DELAY_CONSTANTS.STANDARD_TIMEOUT;
        setTimeout(() => {
          if (this.liveRegion) {
            try {
              this.liveRegion.textContent = '';
            } catch (error) {
              logger.warn(
                'Failed to clear textContent for accessibility announcement',
                {
                  error: error instanceof Error ? error.message : String(error),
                },
              );
            }
          }
        }, clearDelay);
      }
    }, this.config.announceDelay);
  }

  /**
   * 播报切换过程中的状态
   */
  announceSwitching(): void {
    if (!this.config.enabled || !this.liveRegion) return;

    const announcements = THEME_ANNOUNCEMENTS[this.config.language];
    const message = announcements.switching;

    try {
      this.liveRegion.textContent = message;
    } catch (error) {
      logger.warn('Failed to set textContent for switching announcement', {
        message,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 检查是否启用了减少动画偏好
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      if (!window.matchMedia || typeof window.matchMedia !== 'function') {
        return false;
      }

      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      return mediaQuery?.matches ?? false;
    } catch (error) {
      logger.warn('Failed to check prefers-reduced-motion', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 检查是否启用了高对比度模式
   */
  static prefersHighContrast(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      if (!window.matchMedia || typeof window.matchMedia !== 'function') {
        return false;
      }

      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      return mediaQuery?.matches ?? false;
    } catch (error) {
      logger.warn('Failed to check prefers-contrast', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 检查是否偏好暗色主题
   */
  static prefersDarkColorScheme(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      if (!window.matchMedia || typeof window.matchMedia !== 'function') {
        return false;
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery?.matches ?? false;
    } catch (error) {
      logger.warn('Failed to check prefers-color-scheme dark', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 获取用户的颜色偏好
   */
  static getColorSchemePreference(): 'light' | 'dark' | 'no-preference' {
    if (typeof window === 'undefined') return 'no-preference';

    try {
      if (!window.matchMedia || typeof window.matchMedia !== 'function') {
        return 'no-preference';
      }

      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (darkQuery?.matches) {
        return 'dark';
      }

      const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
      if (lightQuery?.matches) {
        return 'light';
      }

      return 'no-preference';
    } catch (error) {
      logger.warn('Failed to check color scheme preference', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 'no-preference';
    }
  }

  /**
   * 设置焦点管理
   */
  static manageFocus(element: HTMLElement): void {
    // 确保元素可以接收焦点
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }

    // 设置焦点
    element.focus();

    // 添加焦点指示器
    element.style.outline = '2px solid var(--ring)';
    element.style.outlineOffset = '2px';
  }

  /**
   * 移除焦点指示器
   */
  static removeFocusIndicator(element: HTMLElement): void {
    element.style.outline = '';
    element.style.outlineOffset = '';
  }

  /**
   * 键盘事件处理器
   */
  static handleKeyboardNavigation(
    event: KeyboardEvent,
    onActivate: () => void,
    onEscape?: () => void,
  ): void {
    switch (event.key) {
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        event.preventDefault();
        onActivate();
        break;
      case KEYBOARD_KEYS.ESCAPE:
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
      default:
        // 不处理其他键
        break;
    }
  }

  /**
   * 解析OKLCH格式的颜色字符串
   */
  private static parseOKLCHString(trimmed: string): OKLCHColor | null {
    const OKLCH_PREFIX_LENGTH = 6; // 'oklch('.length
    const MIN_OKLCH_PARTS = 3;

    if (!trimmed.startsWith('oklch(') || !trimmed.endsWith(')')) {
      return null;
    }

    const content = trimmed.slice(OKLCH_PREFIX_LENGTH, -1); // 移除 'oklch(' 和 ')'
    // Use safe string splitting instead of regex to avoid ReDoS attacks
    const parts = content.split(' ').filter((part) => part.trim() !== '');

    if (parts.length < MIN_OKLCH_PARTS) {
      return null;
    }

    const [lValue, cValue, hValue] = parts;
    // 安全地获取alpha值，使用at方法避免对象注入
    const alphaPart = parts.at(MIN_OKLCH_PARTS);
    const alphaValue =
      alphaPart && alphaPart.startsWith('/') ? alphaPart.slice(1) : undefined;

    return {
      l: lValue ? parseFloat(lValue) : 0,
      c: cValue ? parseFloat(cValue) : 0,
      h: hValue ? parseFloat(hValue) : 0,
      alpha: alphaValue ? parseFloat(alphaValue) : 1,
    };
  }

  /**
   * 解析CSS颜色字符串为OKLCH颜色对象
   * 支持常见的CSS颜色格式
   */
  private static parseColorString(colorString: string): OKLCHColor {
    // 简化的颜色解析实现
    // 在实际项目中，应该使用专门的颜色解析库

    const trimmed = colorString.trim().toLowerCase();

    // 处理OKLCH格式
    const oklchResult = this.parseOKLCHString(trimmed);
    if (oklchResult) {
      return oklchResult;
    }

    // 处理常见的命名颜色和简单情况
    const colorMap: Record<string, OKLCHColor> = {
      'white': { l: 1, c: 0, h: 0 },
      'black': { l: 0, c: 0, h: 0 },
      '#ffffff': { l: 1, c: 0, h: 0 },
      '#000000': { l: 0, c: 0, h: 0 },
      '#fff': { l: 1, c: 0, h: 0 },
      '#000': { l: 0, c: 0, h: 0 },
    };

    // Safe property access using Object.prototype.hasOwnProperty
    if (Object.prototype.hasOwnProperty.call(colorMap, trimmed)) {
      const color = colorMap[trimmed as keyof typeof colorMap];
      if (color) {
        return color;
      }
    }

    // 默认返回中等灰色
    return { l: OPACITY_CONSTANTS.MEDIUM_OPACITY, c: 0, h: 0 };
  }

  /**
   * 检查颜色对比度是否符合WCAG标准
   */
  static checkColorContrast(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
  ): boolean {
    try {
      const fgColor = AccessibilityManager.parseColorString(foreground);
      const bgColor = AccessibilityManager.parseColorString(background);

      return checkContrastCompliance(fgColor, bgColor, level);
    } catch (error) {
      // 解析失败时返回false，确保安全
      logger.warn('颜色解析失败，返回不合规结果', {
        foreground,
        background,
        level,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 获取ARIA属性配置
   */
  static getAriaAttributes(
    theme: string,
    isExpanded: boolean = false,
  ): Record<string, string> {
    return {
      'aria-label': `主题切换按钮，当前主题：${theme}`,
      'aria-expanded': isExpanded.toString(),
      'aria-haspopup': 'menu',
      'role': 'button',
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }
}

// 全局实例
export const accessibilityManager = new AccessibilityManager();

// 导出便捷函数
export const announceThemeChange =
  accessibilityManager.announceThemeChange.bind(accessibilityManager);
export const announceSwitching =
  accessibilityManager.announceSwitching.bind(accessibilityManager);

/**
 * 无障碍性Hook
 */
export function useAccessibility() {
  return {
    announceThemeChange,
    announceSwitching,
    prefersReducedMotion: AccessibilityManager.prefersReducedMotion(),
    prefersHighContrast: AccessibilityManager.prefersHighContrast(),
    colorSchemePreference: AccessibilityManager.getColorSchemePreference(),
    manageFocus: AccessibilityManager.manageFocus,
    removeFocusIndicator: AccessibilityManager.removeFocusIndicator,
    handleKeyboardNavigation: AccessibilityManager.handleKeyboardNavigation,
    getAriaAttributes: AccessibilityManager.getAriaAttributes,
  };
}
