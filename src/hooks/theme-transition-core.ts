import React from 'react';
import { logger } from '@/lib/logger';
import { themeAnalytics } from '@/lib/theme-analytics';
import type {
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
function performViewTransition(args: {
  originalSetTheme: (_theme: string) => void;
  newTheme: string;
  currentTheme: string;
  startTime: number;
  animationSetup?: (_transition: ViewTransition) => void;
}) {
  const {
    originalSetTheme,
    newTheme,
    currentTheme,
    startTime,
    animationSetup,
  } = args;
  const documentWithTransition = document as Document & ViewTransitionAPI;
  const transition = documentWithTransition.startViewTransition(() => {
    originalSetTheme(newTheme);
  });

  if (animationSetup) {
    animationSetup(transition);
  }

  transition.finished
    .then(() => {
      recordThemeTransition({
        fromTheme: currentTheme,
        toTheme: newTheme,
        startTime,
        endTime: performance.now(),
        hasViewTransition: true,
      });
    })
    .catch((error: Error) => {
      logger.error('View transition failed', { error, newTheme });
      recordThemeTransition({
        fromTheme: currentTheme,
        toTheme: newTheme,
        startTime,
        endTime: performance.now(),
        hasViewTransition: true,
        error,
      });
    });
}

/**
 * 初始化主题切换的性能监控
 */
function initializeThemeTransitionMetrics(
  newTheme: string,
  currentTheme: string,
): void {
  themeAnalytics.recordThemePreference(newTheme);
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`theme-transition-${currentTheme}-start`);
  }
}

/**
 * 执行主题切换的核心逻辑
 */
function executeTransitionLogic(args: {
  originalSetTheme: (_theme: string) => void;
  newTheme: string;
  currentTheme: string;
  startTime: number;
  animationSetup?: (_transition: ViewTransition) => void;
}): void {
  const {
    originalSetTheme,
    newTheme,
    currentTheme,
    startTime,
    animationSetup,
  } = args;

  if (!supportsViewTransitions()) {
    logger.debug('View Transitions API not supported, using fallback');
    fallbackThemeChange({
      originalSetTheme,
      newTheme,
      currentTheme,
      startTime,
    });
    return;
  }

  try {
    if (animationSetup) {
      performViewTransition({
        originalSetTheme,
        newTheme,
        currentTheme,
        startTime,
        animationSetup,
      });
    } else {
      performViewTransition({
        originalSetTheme,
        newTheme,
        currentTheme,
        startTime,
      });
    }
  } catch (transitionError) {
    logger.error('Failed to start view transition', {
      error: transitionError,
      newTheme,
    });
    fallbackThemeChange({
      originalSetTheme,
      newTheme,
      currentTheme,
      startTime,
      error: transitionError as Error,
    });
  }
}

/**
 * 安全地设置主题作为最终降级方案
 */
function safeSetTheme(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
): void {
  try {
    originalSetTheme(newTheme);
  } catch (setThemeError) {
    logger.error('Failed to set theme as fallback', {
      error: setThemeError,
      newTheme,
    });
  }
}

export function executeThemeTransition(args: {
  originalSetTheme: (_theme: string) => void;
  newTheme: string;
  currentTheme?: string;
  animationSetup?: (_transition: ViewTransition) => void;
}): void {
  const {
    originalSetTheme,
    newTheme,
    currentTheme = 'unknown',
    animationSetup,
  } = args;
  const startTime = performance.now();

  try {
    initializeThemeTransitionMetrics(newTheme, currentTheme);
    if (animationSetup) {
      executeTransitionLogic({
        originalSetTheme,
        newTheme,
        currentTheme,
        startTime,
        animationSetup,
      });
    } else {
      executeTransitionLogic({
        originalSetTheme,
        newTheme,
        currentTheme,
        startTime,
      });
    }
  } catch (error) {
    logger.error('Theme transition failed', { error, newTheme });
    safeSetTheme(originalSetTheme, newTheme);
  }
}

function fallbackThemeChange(args: {
  originalSetTheme: (_theme: string) => void;
  newTheme: string;
  currentTheme: string;
  startTime: number;
  error?: Error;
}) {
  const { originalSetTheme, newTheme, currentTheme, startTime, error } = args;
  originalSetTheme(newTheme);
  const transitionRecord: {
    fromTheme: string;
    toTheme: string;
    startTime: number;
    endTime: number;
    hasViewTransition: boolean;
    error?: Error;
  } = {
    fromTheme: currentTheme,
    toTheme: newTheme,
    startTime,
    endTime: performance.now(),
    hasViewTransition: false,
  };

  if (error) {
    transitionRecord.error = error;
  }

  recordThemeTransition(transitionRecord);
}

/**
 * 执行基础主题切换
 */
export function executeBasicThemeTransition(
  originalSetTheme: (_theme: string) => void,
  newTheme: string,
  currentTheme?: string,
): void {
  const base = { originalSetTheme, newTheme } as {
    originalSetTheme: (_theme: string) => void;
    newTheme: string;
    currentTheme?: string;
  };
  if (currentTheme) base.currentTheme = currentTheme;
  executeThemeTransition(base);
}

/**
 * 执行圆形动画主题切换
 */
export function executeCircularThemeTransition(args: {
  originalSetTheme: (_theme: string) => void;
  newTheme: string;
  currentTheme?: string;
  clickEvent?: React.MouseEvent<HTMLElement>;
}): void {
  const { originalSetTheme, newTheme, currentTheme, clickEvent } = args;
  const { x, y } = getClickCoordinates(clickEvent);
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

  const base = { originalSetTheme, newTheme } as {
    originalSetTheme: (_theme: string) => void;
    newTheme: string;
    currentTheme?: string;
    animationSetup?: (_transition: ViewTransition) => void;
  };
  if (currentTheme) base.currentTheme = currentTheme;
  if (animationSetup) base.animationSetup = animationSetup;
  executeThemeTransition(base);
}
