'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import type {
  EnhancedThemeHook
} from './theme-transition-types';
import {
  DEFAULT_CONFIG,
  createDebounce
} from './theme-transition-utils';
import {
  executeBasicThemeTransition,
  executeCircularThemeTransition,
} from './theme-transition-core';

/**
 * 增强的主题切换 Hook
 *
 * 提供以下功能：
 * - 基础主题切换（带防抖）
 * - 圆形动画主题切换（基于点击位置）
 * - View Transitions API 支持
 * - 自动降级到普通切换
 * - 防抖机制防止快速连续切换
 * - 缓存 View Transitions API 支持检测结果
 * - 统一的错误处理和性能监控
 * - 类型安全的 API 设计
 */
export function useEnhancedTheme(): EnhancedThemeHook {
  const { theme, setTheme: originalSetTheme, ...rest } = useTheme();

  // 使用 ref 来存储防抖函数，避免重复创建
  const debouncedSetThemeRef = useRef<((_theme: string) => void) | null>(null);
  const debouncedSetCircularThemeRef = useRef<
    ((_theme: string, _clickEvent?: React.MouseEvent<HTMLElement>) => void) | null
  >(null);

  // 创建防抖的基础主题切换函数
  const setTheme = useCallback(
    (newTheme: string) => {
      if (!debouncedSetThemeRef.current) {
        debouncedSetThemeRef.current = createDebounce(
          (themeToSet: string) => {
            executeBasicThemeTransition(originalSetTheme, themeToSet, theme);
          },
          DEFAULT_CONFIG.debounceDelay,
        );
      }
      debouncedSetThemeRef.current(newTheme);
    },
    [originalSetTheme, theme],
  );

  // 创建防抖的圆形动画主题切换函数
  const setCircularTheme = useCallback(
    (newTheme: string, clickEvent?: React.MouseEvent<HTMLElement>) => {
      if (!debouncedSetCircularThemeRef.current) {
        debouncedSetCircularThemeRef.current = createDebounce(
          (themeToSet: string, event?: React.MouseEvent<HTMLElement>) => {
            executeCircularThemeTransition(originalSetTheme, themeToSet, theme, event);
          },
          DEFAULT_CONFIG.debounceDelay,
        );
      }
      debouncedSetCircularThemeRef.current(newTheme, clickEvent);
    },
    [originalSetTheme, theme],
  );

  // 返回增强的主题 Hook
  return useMemo(
    () => ({
      theme,
      setTheme,
      setCircularTheme,
      ...rest,
    }),
    [theme, setTheme, setCircularTheme, rest],
  );
}

/**
 * 导出配置常量供外部使用
 */
export { DEFAULT_CONFIG as THEME_TRANSITION_CONFIG } from './theme-transition-utils';

/**
 * 导出类型定义
 */
export type {
  EnhancedThemeHook,
  ThemeTransitionOptions,
  ThemeTransitionConfig,
  ViewTransition,
  ViewTransitionAPI,
} from './theme-transition-types';
