'use client';

import { logger } from '@/lib/logger';
import {
    recordThemePreference,
    recordThemeSwitch,
} from '@/lib/theme-analytics';
import { useTheme } from 'next-themes';
import React, { useCallback, useMemo, useRef } from 'react';

/**
 * View Transitions API 类型定义
 */
interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
}

interface ViewTransitionAPI {
  startViewTransition: (_callback: () => void) => ViewTransition;
}

/**
 * 主题切换配置
 */
interface ThemeTransitionConfig {
  animationDuration: number;
  easing: string;
  debounceDelay: number;
}

/**
 * 默认屏幕尺寸常量（用于 SSR 环境）
 */
const DEFAULT_SCREEN_DIMENSIONS = {
  WIDTH: 1024,
  HEIGHT: 768,
  CENTER_DIVISOR: 2,
} as const;

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ThemeTransitionConfig = {
  animationDuration: 400,
  easing: 'ease-in-out',
  debounceDelay: 100,
} as const;

/**
 * 检测浏览器是否支持 View Transitions API（缓存结果）
 */
const supportsViewTransitions = (() => {
  let cachedResult: boolean | null = null;

  return (): boolean => {
    if (cachedResult !== null) {
      return cachedResult;
    }

    cachedResult = (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as Document & { startViewTransition?: unknown })
        .startViewTransition === 'function'
    );

    return cachedResult;
  };
})();

/**
 * 获取点击位置坐标
 */
function getClickCoordinates(clickEvent?: React.MouseEvent<HTMLElement>): {
  x: number;
  y: number;
} {
  if (clickEvent) {
    return { x: clickEvent.clientX, y: clickEvent.clientY };
  }

  // 如果没有点击事件，使用屏幕中心
  const centerX = (typeof window !== 'undefined' ? window.innerWidth : DEFAULT_SCREEN_DIMENSIONS.WIDTH) / DEFAULT_SCREEN_DIMENSIONS.CENTER_DIVISOR;
  const centerY = (typeof window !== 'undefined' ? window.innerHeight : DEFAULT_SCREEN_DIMENSIONS.HEIGHT) / DEFAULT_SCREEN_DIMENSIONS.CENTER_DIVISOR;
  return { x: centerX, y: centerY };
}

/**
 * 计算圆形展开动画的半径
 */
function calculateEndRadius(x: number, y: number): number {
  const width = typeof window !== 'undefined' ? window.innerWidth : DEFAULT_SCREEN_DIMENSIONS.WIDTH;
  const height = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_SCREEN_DIMENSIONS.HEIGHT;
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}

/**
 * 创建防抖函数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDebounce<T extends (..._args: any[]) => void>(
  func: T,
  delay: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * 主题切换记录参数接口
 */
interface ThemeTransitionRecord {
  fromTheme: string;
  toTheme: string;
  startTime: number;
  endTime: number;
  hasViewTransition: boolean;
  error?: Error;
}

/**
 * 统一的性能监控和分析记录函数
 */
function recordThemeTransition(record: ThemeTransitionRecord): void {
  const { fromTheme, toTheme, startTime, endTime, hasViewTransition, error } = record;

  try {
    recordThemeSwitch(fromTheme, toTheme, startTime, endTime, hasViewTransition);
    recordThemePreference(toTheme);

    // 记录性能指标
    const duration = endTime - startTime;
    const PERFORMANCE_THRESHOLD = 200; // 超过200ms记录警告
    if (duration > PERFORMANCE_THRESHOLD) {
      logger.warn('Theme transition took longer than expected', {
        fromTheme,
        toTheme,
        duration,
        hasViewTransition,
      });
    }

    if (error) {
      logger.error('Theme transition error', {
        fromTheme,
        toTheme,
        error: error.message,
        hasViewTransition,
      });
    }
  } catch (recordError) {
    logger.error('Failed to record theme transition', {
      fromTheme,
      toTheme,
      recordError: recordError instanceof Error ? recordError.message : 'Unknown error',
    });
  }
}

/**
 * 执行主题切换的核心逻辑
 */
function executeThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  _currentTheme: string = 'unknown',
  _config: ThemeTransitionConfig = DEFAULT_CONFIG,
  _animationSetup?: (_transition: ViewTransition) => void,
): void {
  const startTime = performance.now();
  const fromTheme = _currentTheme;

  // 如果不支持 View Transitions API，直接切换
  if (!supportsViewTransitions()) {
    try {
      originalSetTheme(newTheme);
      const endTime = performance.now();
      recordThemeTransition({
        fromTheme,
        toTheme: newTheme,
        startTime,
        endTime,
        hasViewTransition: false,
      });
    } catch (error) {
      const endTime = performance.now();
      recordThemeTransition({
        fromTheme,
        toTheme: newTheme,
        startTime,
        endTime,
        hasViewTransition: false,
        error: error instanceof Error ? error : new Error('Unknown theme switch error'),
      });
    }
    return;
  }

  try {
    const documentWithTransition = document as Document & ViewTransitionAPI;
    const transition = documentWithTransition.startViewTransition(() => {
      originalSetTheme(newTheme);
    });

    // 如果有动画设置函数，执行它
    if (_animationSetup) {
      _animationSetup(transition);
    }

    // 处理转换完成
    transition.finished
      .then(() => {
        const endTime = performance.now();
        recordThemeTransition({
          fromTheme,
          toTheme: newTheme,
          startTime,
          endTime,
          hasViewTransition: true,
        });
      })
      .catch((error) => {
        const endTime = performance.now();
        recordThemeTransition({
          fromTheme,
          toTheme: newTheme,
          startTime,
          endTime,
          hasViewTransition: true,
          error: error instanceof Error ? error : new Error('View transition failed'),
        });
      });
  } catch (error) {
    // View Transitions API 调用失败，回退到直接切换
    logger.warn('View Transitions API failed, falling back to direct theme switch', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    try {
      originalSetTheme(newTheme);
      const endTime = performance.now();
      recordThemeTransition({
        fromTheme,
        toTheme: newTheme,
        startTime,
        endTime,
        hasViewTransition: false,
      });
    } catch (fallbackError) {
      const endTime = performance.now();
      recordThemeTransition({
        fromTheme,
        toTheme: newTheme,
        startTime,
        endTime,
        hasViewTransition: false,
        error: fallbackError instanceof Error ? fallbackError : new Error('Theme switch failed'),
      });
    }
  }
}

/**
 * 执行基础主题切换
 */
function executeBasicThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  _currentTheme?: string,
): void {
  executeThemeTransition(originalSetTheme, newTheme, _currentTheme);
}

/**
 * 执行圆形动画主题切换
 */
function executeCircularThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  _currentTheme?: string,
  _clickEvent?: React.MouseEvent<HTMLElement>,
): void {
  const { x, y } = getClickCoordinates(_clickEvent);
  const endRadius = calculateEndRadius(x, y);

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${endRadius}px at ${x}px ${y}px)`,
  ];

  // 创建动画设置函数
  const setupCircularAnimation = (transition: ViewTransition) => {
    transition.ready
      .then(() => {
        try {
          document.documentElement.animate(
            { clipPath },
            {
              duration: DEFAULT_CONFIG.animationDuration,
              easing: DEFAULT_CONFIG.easing,
              pseudoElement: '::view-transition-new(root)',
            },
          );
        } catch (animationError) {
          logger.warn('Failed to setup circular animation', {
            error: animationError instanceof Error ? animationError.message : 'Unknown error',
            coordinates: { x, y },
            endRadius,
          });
        }
      })
      .catch((readyError: unknown) => {
        logger.warn('View transition ready promise rejected', {
          error: readyError instanceof Error ? readyError.message : 'Unknown error',
        });
      });
  };

  executeThemeTransition(
    originalSetTheme,
    newTheme,
    _currentTheme,
    DEFAULT_CONFIG,
    setupCircularAnimation,
  );
}

/**
 * 增强的主题切换hook，集成View Transitions API
 * 提供丝滑的主题切换动画效果，同时保持向后兼容
 *
 * 优化特性：
 * - 防抖机制防止快速连续切换
 * - 缓存 View Transitions API 支持检测结果
 * - 统一的错误处理和性能监控
 * - 类型安全的 API 设计
 */
export function useEnhancedTheme() {
  const { theme, setTheme: originalSetTheme, ...rest } = useTheme();

  // 使用 ref 来存储防抖函数，避免重复创建
  const debouncedSetThemeRef = useRef<((_theme: string) => void) | null>(null);
  const debouncedSetCircularThemeRef = useRef<((_theme: string, _event?: React.MouseEvent<HTMLElement>) => void) | null>(null);

  // 缓存 View Transitions API 支持状态
  const viewTransitionsSupported = useMemo(() => supportsViewTransitions(), []);

  // 创建防抖的基础主题切换函数
  const setTheme = useCallback(
    (newTheme: string) => {
      if (!debouncedSetThemeRef.current) {
        debouncedSetThemeRef.current = createDebounce(
          (_targetTheme: string) => executeBasicThemeTransition(originalSetTheme, _targetTheme, theme),
          DEFAULT_CONFIG.debounceDelay,
        ) as (_theme: string) => void;
      }
      debouncedSetThemeRef.current(newTheme);
    },
    [originalSetTheme, theme],
  );

  // 创建防抖的圆形动画主题切换函数
  const setThemeWithCircularTransition = useCallback(
    (newTheme: string, clickEvent?: React.MouseEvent<HTMLElement>) => {
      if (!debouncedSetCircularThemeRef.current) {
        debouncedSetCircularThemeRef.current = createDebounce(
          (_targetTheme: string, _event?: React.MouseEvent<HTMLElement>) =>
            executeCircularThemeTransition(originalSetTheme, _targetTheme, theme, _event),
          DEFAULT_CONFIG.debounceDelay,
        ) as (_theme: string, _event?: React.MouseEvent<HTMLElement>) => void;
      }
      debouncedSetCircularThemeRef.current(newTheme, clickEvent);
    },
    [originalSetTheme, theme],
  );

  // 清理函数
  React.useEffect(() => {
    return () => {
      // 组件卸载时清理防抖定时器
      debouncedSetThemeRef.current = null;
      debouncedSetCircularThemeRef.current = null;
    };
  }, []);

  return {
    theme,
    setTheme,
    setThemeWithCircularTransition,
    supportsViewTransitions: viewTransitionsSupported,
    ...rest,
  };
}

/**
 * 增强主题 Hook 的返回类型定义
 */
export interface EnhancedThemeHook {
  /** 当前主题 */
  theme: string | undefined;
  /** 基础主题切换函数（带防抖） */
  setTheme: (_theme: string) => void;
  /** 圆形动画主题切换函数（带防抖） */
  setThemeWithCircularTransition: (
    _theme: string,
    _clickEvent?: React.MouseEvent<HTMLElement>,
  ) => void;
  /** 是否支持 View Transitions API */
  supportsViewTransitions: boolean;
  /** 可用主题列表 */
  themes: string[] | undefined;
  /** 强制主题 */
  forcedTheme: string | undefined;
  /** 解析后的主题 */
  resolvedTheme: string | undefined;
  /** 系统主题 */
  systemTheme: string | undefined;
}

/**
 * 主题切换选项
 */
export interface ThemeTransitionOptions {
  /** 是否使用圆形动画 */
  useCircularTransition?: boolean;
  /** 点击事件（用于圆形动画定位） */
  clickEvent?: React.MouseEvent<HTMLElement>;
  /** 自定义配置 */
  config?: Partial<ThemeTransitionConfig>;
}

/**
 * 导出配置常量供外部使用
 */
export { DEFAULT_CONFIG as THEME_TRANSITION_CONFIG };
