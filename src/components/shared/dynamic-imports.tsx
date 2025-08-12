'use client';

/**
 * 动态导入组件包装器
 *
 * 为非关键组件提供懒加载功能，优化初始包大小
 * 第五阶段性能优化：代码分割和图片优化
 */
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';

// 加载状态组件
function ComponentLoadingFallback() {
  return (
    <div className='flex items-center justify-center p-8'>
      <LoadingSpinner />
    </div>
  );
}

// 最小化加载状态
function MinimalLoadingFallback() {
  return (
    <div className='animate-pulse'>
      <div className='bg-muted mb-2 h-4 w-3/4 rounded'></div>
      <div className='bg-muted h-4 w-1/2 rounded'></div>
    </div>
  );
}

// ==================== 高优先级动态导入组件 ====================

/**
 * 进度指示器 - 动态导入
 * 原因：非关键组件，客户端渲染，3.69KB
 */
export const DynamicProgressIndicator = dynamic(
  () =>
    import('./progress-indicator').then((mod) => ({
      default: mod.ProgressIndicator,
    })),
  {
    loading: () => <MinimalLoadingFallback />,
    ssr: false, // 非关键组件，禁用SSR
  },
);

/**
 * 动画图标 - 动态导入
 * 原因：非关键组件，客户端渲染，2.65KB
 */
export const DynamicAnimatedIcon = dynamic(
  () =>
    import('./animated-icon').then((mod) => ({ default: mod.AnimatedIcon })),
  {
    loading: () => <MinimalLoadingFallback />,
    ssr: false,
  },
);

// ==================== 性能监控组件 ====================

/**
 * Web Vitals 指示器 - 动态导入
 * 原因：性能监控组件，非关键，7.08KB
 */
export const DynamicWebVitalsIndicator = dynamic(
  () =>
    import('../performance/web-vitals-indicator').then((mod) => ({
      default: mod.WebVitalsIndicator,
    })),
  {
    loading: () => <ComponentLoadingFallback />,
    ssr: false, // 性能监控组件不需要SSR
  },
);

/**
 * 主题性能监控 - 动态导入
 * 原因：开发环境组件，非关键，2.62KB
 */
export const DynamicThemePerformanceMonitor = dynamic(
  () =>
    import('../theme/theme-performance-monitor').then((mod) => ({
      default: mod.ThemePerformanceMonitor,
    })),
  {
    loading: () => null, // 监控组件不显示加载状态
    ssr: false,
  },
);

/**
 * React Scan Provider - 动态导入
 * 原因：开发工具组件，仅开发环境使用，约1KB
 */
export const DynamicReactScanProvider = dynamic(
  () =>
    import('../dev-tools/react-scan-provider').then((mod) => ({
      default: mod.ReactScanProvider,
    })),
  {
    loading: () => null, // 开发工具不显示加载状态
    ssr: false, // 仅客户端运行
  },
);

/**
 * React Scan 指示器 - 动态导入
 * 原因：开发工具UI组件，仅开发环境使用
 */
export const DynamicReactScanIndicator = dynamic(
  () =>
    import('../dev-tools/react-scan-provider').then((mod) => ({
      default: mod.ReactScanIndicator,
    })),
  {
    loading: () => null,
    ssr: false,
  },
);

/**
 * React Scan 控制面板 - 动态导入
 * 原因：开发工具控制组件，仅开发环境使用
 */
export const DynamicReactScanControlPanel = dynamic(
  () =>
    import('../dev-tools/react-scan-provider').then((mod) => ({
      default: mod.ReactScanControlPanel,
    })),
  {
    loading: () => null,
    ssr: false,
  },
);

/**
 * 开发工具控制器 - 动态导入
 * 统一管理所有开发工具的显示和布局
 */
export const DynamicDevToolsController = dynamic(
  () =>
    import('../dev-tools/dev-tools-controller').then((mod) => ({
      default: mod.DevToolsController,
    })),
  {
    loading: () => null,
    ssr: false,
  },
);

/**
 * 开发工具状态指示器 - 动态导入
 * 显示当前活跃的开发工具数量
 */
export const DynamicDevToolsStatusIndicator = dynamic(
  () =>
    import('../dev-tools/dev-tools-controller').then((mod) => ({
      default: mod.DevToolsStatusIndicator,
    })),
  {
    loading: () => null,
    ssr: false,
  },
);

/**
 * React Scan 演示组件 - 动态导入
 * 原因：开发工具演示组件，仅开发环境使用
 */
export const DynamicReactScanDemo = dynamic(
  () =>
    import('../dev-tools/react-scan-demo').then((mod) => ({
      default: mod.ReactScanDemo,
    })),
  {
    loading: () => <ComponentLoadingFallback />,
    ssr: false,
  },
);

/**
 * React Scan 压力测试组件 - 动态导入
 * 原因：开发工具测试组件，仅开发环境使用
 */
export const DynamicReactScanStressTest = dynamic(
  () =>
    import('../dev-tools/react-scan-demo').then((mod) => ({
      default: mod.ReactScanStressTest,
    })),
  {
    loading: () => <ComponentLoadingFallback />,
    ssr: false,
  },
);

// ==================== 国际化组件 ====================

/**
 * 国际化性能仪表板 - 动态导入
 * 原因：开发环境组件，非关键，6.39KB
 */
export const DynamicI18nPerformanceDashboard = dynamic(
  () =>
    import('../i18n/performance-dashboard').then((mod) => ({
      default: mod.I18nPerformanceDashboard,
    })),
  {
    loading: () => <ComponentLoadingFallback />,
    ssr: false,
  },
);

/**
 * 语言检测演示 - 动态导入
 * 原因：演示组件，非关键，6.64KB
 */
export const DynamicLocaleDetectionDemo = dynamic(
  () =>
    import('../i18n/locale-detection-demo').then((mod) => ({
      default: mod.LocaleDetectionDemo,
    })),
  {
    loading: () => <ComponentLoadingFallback />,
    ssr: false,
  },
);

/**
 * 翻译预加载器 - 动态导入
 * 原因：性能优化组件，6.92KB
 */
export const DynamicTranslationPreloader = dynamic(
  () =>
    import('../i18n/translation-preloader').then((mod) => ({
      default: mod.TranslationPreloader,
    })),
  {
    loading: () => null, // 预加载器不显示加载状态
    ssr: false,
  },
);

// ==================== 展示组件 ====================

/**
 * 组件展示区 - 动态导入
 * 原因：展示组件，非首屏关键，2.76KB + showcase子组件
 */
export const DynamicComponentShowcase = dynamic(
  () =>
    import('../home/component-showcase').then((mod) => ({
      default: mod.ComponentShowcase,
    })),
  {
    loading: () => <ComponentLoadingFallback />,
    ssr: true, // 保持SSR以支持SEO
  },
);

// ==================== UI组件 ====================

/**
 * 动画计数器 - 动态导入
 * 原因：动画组件，非关键，5.54KB
 */
export const DynamicAnimatedCounter = dynamic(
  () =>
    import('../ui/animated-counter').then((mod) => ({
      default: mod.AnimatedCounter,
    })),
  {
    loading: () => <MinimalLoadingFallback />,
    ssr: false, // 动画组件不需要SSR
  },
);

/**
 * 下拉菜单 - 动态导入
 * 原因：交互组件，较大，8.27KB
 */
export const DynamicDropdownMenu = dynamic(
  () =>
    import('../ui/dropdown-menu').then((mod) => ({
      default: mod.DropdownMenu,
    })),
  {
    loading: () => <MinimalLoadingFallback />,
    ssr: true, // 保持SSR以支持可访问性
  },
);

// ==================== 高阶组件包装器 ====================

/**
 * 带Suspense的动态组件包装器
 */
export function withDynamicSuspense<T extends object>(
  DynamicComponent: React.ComponentType<T>,
  fallback?: React.ReactNode,
) {
  return function WrappedComponent(props: T) {
    return (
      <Suspense fallback={fallback || <ComponentLoadingFallback />}>
        <DynamicComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * 条件动态加载包装器
 * 只在满足条件时才加载组件
 */
export function withConditionalDynamic<T extends object>(
  DynamicComponent: React.ComponentType<T>,
  condition: () => boolean,
) {
  return function ConditionalComponent(props: T) {
    if (!condition()) {
      return null;
    }

    return (
      <Suspense fallback={<ComponentLoadingFallback />}>
        <DynamicComponent {...props} />
      </Suspense>
    );
  };
}

// ==================== 开发环境专用组件 ====================

/**
 * 开发环境性能监控组件
 * 只在开发环境加载
 */
export const DevelopmentPerformanceMonitor = withConditionalDynamic(
  DynamicI18nPerformanceDashboard,
  () => process.env.NODE_ENV === 'development',
);

/**
 * 开发环境Web Vitals指示器
 * 只在开发环境加载
 */
export const DevelopmentWebVitalsIndicator = withConditionalDynamic(
  DynamicWebVitalsIndicator,
  () => process.env.NODE_ENV === 'development',
);
