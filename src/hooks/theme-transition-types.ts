import React from 'react';

/**
 * View Transitions API 类型定义
 */
export interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
}

export interface ViewTransitionAPI {
  startViewTransition: (_callback: () => void) => ViewTransition;
}

/**
 * 主题切换配置
 */
export interface ThemeTransitionConfig {
  animationDuration: number;
  easing: string;
  debounceDelay: number;
}

/**
 * 主题切换记录参数接口
 */
export interface ThemeTransitionRecord {
  fromTheme: string;
  toTheme: string;
  startTime: number;
  endTime: number;
  hasViewTransition: boolean;
  error?: Error;
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
  setCircularTheme: (_theme: string, _clickEvent?: React.MouseEvent<HTMLElement>) => void;
  /** 原始的 next-themes 返回值 */
  themes: string[] | undefined;
  forcedTheme: string | undefined;
  resolvedTheme: string | undefined;
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
