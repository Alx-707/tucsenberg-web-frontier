import React from 'react';
import { logger } from '@/lib/logger';
import { themeAnalytics } from '@/lib/theme-analytics';
import type {
  ThemeTransitionConfig,
  ViewTransition,
  ViewTransitionAPI,
} from '@/hooks/theme-transition-types';
import {
  calculateEndRadius,
  DEFAULT_CONFIG,
  getClickCoordinates,
  recordThemeTransition,
  supportsViewTransitions,
} from '@/hooks/theme-transition-utils';

/**
 * 执行主题切换的核心逻辑
 */
export function executeThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  _currentTheme: string = 'unknown',
  _config: ThemeTransitionConfig = DEFAULT_CONFIG,
  _animationSetup?: (_transition: ViewTransition) => void,
): void {
  const startTime = performance.now();

  try {
    // 记录主题偏好
    themeAnalytics.recordThemePreference(newTheme);

    // 标记性能开始点
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`theme-transition-${_currentTheme}-start`);
    }

    // 检查是否支持 View Transitions API
    if (!supportsViewTransitions()) {
      logger.debug('View Transitions API not supported, using fallback');
      originalSetTheme(newTheme);

      recordThemeTransition({
        fromTheme: _currentTheme,
        toTheme: newTheme,
        startTime,
        endTime: performance.now(),
        hasViewTransition: false,
      });
      return;
    }

    // 使用 View Transitions API
    try {
      const documentWithTransition = document as Document & ViewTransitionAPI;
      const transition = documentWithTransition.startViewTransition(() => {
        originalSetTheme(newTheme);
      });

      // 如果提供了动画设置函数，则调用它
      if (_animationSetup) {
        _animationSetup(transition);
      }

      // 监听转换完成
      transition.finished
        .then(() => {
          recordThemeTransition({
            fromTheme: _currentTheme,
            toTheme: newTheme,
            startTime,
            endTime: performance.now(),
            hasViewTransition: true,
          });
        })
        .catch((error: Error) => {
          logger.error('View transition failed', { error, newTheme });
          recordThemeTransition({
            fromTheme: _currentTheme,
            toTheme: newTheme,
            startTime,
            endTime: performance.now(),
            hasViewTransition: true,
            error,
          });
        });
    } catch (transitionError) {
      logger.error('Failed to start view transition', {
        error: transitionError,
        newTheme,
      });

      // 降级到普通切换
      originalSetTheme(newTheme);
      recordThemeTransition({
        fromTheme: _currentTheme,
        toTheme: newTheme,
        startTime,
        endTime: performance.now(),
        hasViewTransition: false,
        error: transitionError as Error,
      });
    }
  } catch (error) {
    logger.error('Theme transition failed', { error, newTheme });

    // 确保主题仍然被设置，即使出现错误
    try {
      originalSetTheme(newTheme);
    } catch (setThemeError) {
      logger.error('Failed to set theme as fallback', {
        error: setThemeError,
        newTheme,
      });
    }

    recordThemeTransition({
      fromTheme: _currentTheme,
      toTheme: newTheme,
      startTime,
      endTime: performance.now(),
      hasViewTransition: false,
      error: error as Error,
    });
  }
}

/**
 * 执行基础主题切换
 */
export function executeBasicThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  _currentTheme?: string,
): void {
  executeThemeTransition(originalSetTheme, newTheme, _currentTheme);
}

/**
 * 执行圆形动画主题切换
 */
export function executeCircularThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  _currentTheme?: string,
  _clickEvent?: React.MouseEvent<HTMLElement>,
): void {
  const { x, y } = getClickCoordinates(_clickEvent);
  const endRadius = calculateEndRadius(x, y);

  const animationSetup = (transition: ViewTransition) => {
    // 设置圆形展开动画
    transition.ready
      .then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration: DEFAULT_CONFIG.animationDuration,
            easing: DEFAULT_CONFIG.easing,
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch((error: Error) => {
        logger.warn('Failed to setup circular animation', { error });
      });
  };

  executeThemeTransition(
    originalSetTheme,
    newTheme,
    _currentTheme,
    DEFAULT_CONFIG,
    animationSetup,
  );
}
