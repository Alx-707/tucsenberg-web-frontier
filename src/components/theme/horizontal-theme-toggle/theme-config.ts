import { Monitor, Moon, Sun } from 'lucide-react';

/**
 * 动画变体类型
 */
export type AnimationVariant = 'circle-blur' | 'framer-motion';

/**
 * 主题选项配置
 */
export const THEME_OPTIONS = [
  {
    value: 'light',
    icon: Sun,
    labelKey: 'theme.light',
    ariaLabelKey: 'theme.switchToLight'
  },
  {
    value: 'dark',
    icon: Moon,
    labelKey: 'theme.dark',
    ariaLabelKey: 'theme.switchToDark'
  },
  {
    value: 'system',
    icon: Monitor,
    labelKey: 'theme.system',
    ariaLabelKey: 'theme.switchToSystem'
  }
] as const;

/**
 * 组件属性接口
 */
export interface HorizontalThemeToggleProps {
  /** 是否显示文字标签 */
  showLabels?: boolean;
  /** 组件尺寸 */
  size?: 'sm' | 'default' | 'lg';
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用动画效果 */
  disableAnimations?: boolean;
  /** 动画变体 */
  animationVariant?: AnimationVariant;
  /** 测试ID */
  'data-testid'?: string;
}

/**
 * 获取尺寸相关的样式类
 */
export const getSizeClasses = (size: 'sm' | 'default' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: 'p-0.5',
        button: 'px-2 py-1 text-xs gap-1.5',
        icon: 'h-3 w-3'
      };
    case 'lg':
      return {
        container: 'p-1',
        button: 'px-4 py-2 text-base gap-2',
        icon: 'h-5 w-5'
      };
    default:
      return {
        container: 'p-0.5',
        button: 'px-3 py-1.5 text-sm gap-2',
        icon: 'h-4 w-4'
      };
  }
};
