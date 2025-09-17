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
    value: 'system',
    icon: Monitor,
    labelKey: 'theme.system',
    ariaLabelKey: 'theme.switchToSystem',
  },
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
] as const;

/**
 * 组件属性接口
 */
export interface VercelThemeToggleProps {
  /** 自定义样式类名 */
  'className'?: string;
  /** 是否显示标题 */
  'showTitle'?: boolean;
  /** 自定义测试ID */
  'data-testid'?: string;
}

/**
 * Vercel 风格主题切换组件 - 简化版
 */
export function VercelThemeToggle({
  className,
  showTitle = true,
  'data-testid': testId = 'vercel-theme-toggle',
}: VercelThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();

  const isReady = typeof resolvedTheme !== 'undefined';
  const activeTheme = resolvedTheme ?? theme;

  // 加载状态的骨架屏
  if (!isReady) {
    return (
      <div
        className={cn('space-y-3', className)}
        data-testid={`${testId}-skeleton`}
      >
        {showTitle && (
          <div className='bg-muted h-5 w-16 animate-pulse rounded' />
        )}
        <div className='flex gap-2'>
          {THEME_OPTIONS.map((_, index) => (
            <div
              key={index}
              className='flex animate-pulse items-center gap-2 rounded-md border p-2'
            >
              <div className='bg-muted h-4 w-4 rounded' />
              <div className='bg-muted h-4 w-12 rounded' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid={testId}
    >
      {showTitle && (
        <h3 className='text-foreground text-sm font-medium'>
          {t('theme.title')}
        </h3>
      )}

      <div
        className='flex gap-2'
        role='radiogroup'
        aria-label={t('theme.selectTheme')}
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
                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground',
              )}
              onClick={() => setTheme(themeOption.value)}
              aria-label={ariaLabel}
              role='radio'
              aria-checked={isActive}
              type='button'
              data-testid={`${testId}-${themeOption.value}`}
            >
              <Icon className='h-4 w-4' />
              <span className='font-medium'>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
