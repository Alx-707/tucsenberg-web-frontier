'use client';

import React, { useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  recordThemePreference,
  recordThemeSwitch,
} from '@/lib/theme-analytics';

/**
 * 检测浏览器是否支持 View Transitions API
 */
function supportsViewTransitions(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as Document & { startViewTransition?: unknown })
      .startViewTransition === 'function'
  );
}

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
  const half = 2;
  const centerX = innerWidth / half;
  const centerY = innerHeight / half;
  return { x: centerX, y: centerY };
}

/**
 * 计算圆形展开动画的半径
 */
function calculateEndRadius(x: number, y: number): number {
  return Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
}

/**
 * 执行基础主题切换
 */
function executeBasicThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  currentTheme?: string,
) {
  const startTime = performance.now();
  const fromTheme = currentTheme || 'unknown';

  if (!supportsViewTransitions()) {
    originalSetTheme(newTheme);
    const endTime = performance.now();
    recordThemeSwitch(fromTheme, newTheme, startTime, endTime, false);
    recordThemePreference(newTheme);
    return;
  }

  const documentWithTransition = document as Document & {
    startViewTransition: (_callback: () => void) => { finished: Promise<void> };
  };

  const transition = documentWithTransition.startViewTransition(() => {
    originalSetTheme(newTheme);
  });

  transition.finished
    .then(() => {
      const endTime = performance.now();
      recordThemeSwitch(fromTheme, newTheme, startTime, endTime, true);
      recordThemePreference(newTheme);
    })
    .catch(() => {
      const endTime = performance.now();
      recordThemeSwitch(fromTheme, newTheme, startTime, endTime, true);
      recordThemePreference(newTheme);
    });
}

/**
 * 执行圆形动画主题切换
 */
function executeCircularThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  currentTheme?: string,
  clickEvent?: React.MouseEvent<HTMLElement>,
) {
  const startTime = performance.now();
  const fromTheme = currentTheme || 'unknown';

  if (!supportsViewTransitions()) {
    originalSetTheme(newTheme);
    const endTime = performance.now();
    recordThemeSwitch(fromTheme, newTheme, startTime, endTime, false);
    recordThemePreference(newTheme);
    return;
  }

  const { x, y } = getClickCoordinates(clickEvent);
  const endRadius = calculateEndRadius(x, y);

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${endRadius}px at ${x}px ${y}px)`,
  ];

  const documentWithTransition = document as Document & {
    startViewTransition: (_callback: () => void) => {
      ready: Promise<void>;
      finished: Promise<void>;
    };
  };

  const transition = documentWithTransition.startViewTransition(() => {
    originalSetTheme(newTheme);
  });

  const animationDuration = 400;

  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath },
        {
          duration: animationDuration,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      // 动画设置失败时的处理
    });

  transition.finished
    .then(() => {
      const endTime = performance.now();
      recordThemeSwitch(fromTheme, newTheme, startTime, endTime, true);
      recordThemePreference(newTheme);
    })
    .catch(() => {
      const endTime = performance.now();
      recordThemeSwitch(fromTheme, newTheme, startTime, endTime, true);
      recordThemePreference(newTheme);
    });
}

/**
 * 增强的主题切换hook，集成View Transitions API
 * 提供丝滑的主题切换动画效果，同时保持向后兼容
 */
export function useEnhancedTheme() {
  const { theme, setTheme: originalSetTheme, ...rest } = useTheme();

  const setTheme = useCallback(
    (newTheme: string) =>
      executeBasicThemeTransition(originalSetTheme, newTheme, theme),
    [originalSetTheme, theme],
  );

  const setThemeWithCircularTransition = useCallback(
    (newTheme: string, clickEvent?: React.MouseEvent<HTMLElement>) =>
      executeCircularThemeTransition(
        originalSetTheme,
        newTheme,
        theme,
        clickEvent,
      ),
    [originalSetTheme, theme],
  );

  return {
    theme,
    setTheme,
    setThemeWithCircularTransition,
    supportsViewTransitions: supportsViewTransitions(),
    ...rest,
  };
}

/**
 * 类型定义
 */
export interface EnhancedThemeHook {
  theme: string | undefined;
  setTheme: (_theme: string) => void;
  setThemeWithCircularTransition: (
    _theme: string,
    _clickEvent?: React.MouseEvent<HTMLElement>,
  ) => void;
  supportsViewTransitions: boolean;
  themes: string[] | undefined;
  forcedTheme: string | undefined;
  resolvedTheme: string | undefined;
  systemTheme: string | undefined;
}
