'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

/**
 * 主题选项配置
 */
const THEME_OPTIONS = [
  {
    value: 'light',
    icon: Sun,
    labelKey: 'theme.light',
    ariaLabelKey: 'theme.switchToLight',
  },
  {
    value: 'dark',
    icon: Moon,
    labelKey: 'theme.dark',
    ariaLabelKey: 'theme.switchToDark',
  },
  {
    value: 'system',
    icon: Monitor,
    labelKey: 'theme.system',
    ariaLabelKey: 'theme.switchToSystem',
  },
] as const;

/**
 * 动画变体类型
 */
export type AnimationVariant = 'circle-blur' | 'framer-motion';

/**
 * 组件属性接口
 */
export interface HorizontalThemeToggleProps {
  /** 是否显示文字标签 */
  'showLabels'?: boolean;
  /** 组件尺寸 */
  'size'?: 'sm' | 'default' | 'lg';
  /** 自定义样式类名 */
  'className'?: string;
  /** 是否禁用动画效果 */
  'disableAnimations'?: boolean;
  /** 动画变体 */
  'animationVariant'?: AnimationVariant;
  /** 测试ID */
  'data-testid'?: string;
}

/**
 * 获取尺寸相关的样式类
 */
const getSizeClasses = (size: 'sm' | 'default' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: 'p-0.5',
        button: 'px-2 py-1 text-xs gap-1.5',
        icon: 'h-3 w-3',
      };
    case 'lg':
      return {
        container: 'p-1',
        button: 'px-4 py-2 text-base gap-2',
        icon: 'h-5 w-5',
      };
    default:
      return {
        container: 'p-0.5',
        button: 'px-3 py-1.5 text-sm gap-2',
        icon: 'h-4 w-4',
      };
  }
};

/**
 * 水平主题切换组件 - 简化版
 */
export function HorizontalThemeToggle({
  showLabels = false,
  size = 'default',
  className,
  'disableAnimations': _disableAnimations, // 忽略，简化版不支持动画
  'animationVariant': _animationVariant, // 忽略，简化版不支持动画变体
  'data-testid': testId = 'horizontal-theme-toggle',
}: HorizontalThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();

  const sizeClasses = getSizeClasses(size);
  const isReady = typeof resolvedTheme !== 'undefined';
  const activeTheme = resolvedTheme ?? theme;

  // 加载状态的骨架屏
  if (!isReady) {
    return (
      <div
        className={cn(
          'bg-background inline-flex items-center rounded-lg border',
          sizeClasses.container,
          className,
        )}
        data-testid={testId}
      >
        {THEME_OPTIONS.map((option) => (
          <div
            key={option.value}
            className={cn(
              'flex items-center justify-center rounded-md transition-colors',
              sizeClasses.button,
              'bg-muted animate-pulse',
            )}
          >
            <div
              className={cn(
                'rounded',
                sizeClasses.icon,
                'bg-muted-foreground/20',
              )}
            />
            {showLabels && (
              <div className='bg-muted-foreground/20 h-4 w-12 rounded' />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background inline-flex items-center rounded-lg border',
        sizeClasses.container,
        className,
      )}
      role='radiogroup'
      aria-label={t('theme.toggleLabel')}
      data-testid={testId}
    >
      {THEME_OPTIONS.map((themeOption) => {
        const Icon = themeOption.icon;
        const isActive = activeTheme === themeOption.value;
        const label = t(themeOption.labelKey);
        const ariaLabel = t(themeOption.ariaLabelKey);

        return (
          <button
            key={themeOption.value}
            className={cn(
              'flex items-center justify-center rounded-md transition-colors',
              'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              sizeClasses.button,
              isActive &&
                'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            onClick={() => setTheme(themeOption.value)}
            aria-label={ariaLabel}
            role='radio'
            aria-checked={isActive}
            type='button'
          >
            <Icon className={cn(sizeClasses.icon)} />
            {showLabels && <span className='font-medium'>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
