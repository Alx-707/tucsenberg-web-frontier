/**
 * 性能监控配置模块访问器
 * Performance Monitoring Config Module Accessors
 */

import type { PerformanceConfig } from '@/lib/performance-monitoring-types';

/**
 * 获取主要模块配置（reactScan, bundleAnalyzer, sizeLimit）
 */
export function getPrimaryModuleConfig<T extends keyof PerformanceConfig>(
  config: PerformanceConfig,
  module: T,
): PerformanceConfig[T] | undefined {
  switch (module) {
    case 'reactScan':
      return { ...config.reactScan } as PerformanceConfig[T];
    case 'bundleAnalyzer':
      return { ...config.bundleAnalyzer } as PerformanceConfig[T];
    case 'sizeLimit':
      return { ...config.sizeLimit } as PerformanceConfig[T];
    default:
      return undefined;
  }
}

/**
 * 获取可选模块配置（webVitals, component, network, bundle, global, debug）
 */
export function getOptionalModuleConfig<T extends keyof PerformanceConfig>(
  config: PerformanceConfig,
  module: T,
): PerformanceConfig[T] | undefined {
  switch (module) {
    case 'webVitals':
      return config.webVitals
        ? ({ ...config.webVitals } as PerformanceConfig[T])
        : undefined;
    case 'component':
      return config.component
        ? ({ ...config.component } as PerformanceConfig[T])
        : undefined;
    case 'network':
      return config.network
        ? ({ ...config.network } as PerformanceConfig[T])
        : undefined;
    case 'bundle':
      return config.bundle
        ? ({ ...config.bundle } as PerformanceConfig[T])
        : undefined;
    case 'debug':
      return config.debug as PerformanceConfig[T];
    case 'global':
      return config.global
        ? ({ ...config.global } as PerformanceConfig[T])
        : undefined;
    default:
      return undefined;
  }
}

/**
 * 检查是否为必需模块
 */
export function isRequiredModule(module: string): boolean {
  return ['reactScan', 'bundleAnalyzer', 'sizeLimit'].includes(module);
}

/**
 * 检查是否为可选模块
 */
export function isOptionalModule(module: string): boolean {
  return ['webVitals', 'component', 'network', 'bundle', 'global'].includes(
    module,
  );
}

/**
 * 合并配置值
 */
export function mergeConfigValue<T extends keyof PerformanceConfig>(
  current: PerformanceConfig[T],
  config: Partial<PerformanceConfig[T]>,
): PerformanceConfig[T] | undefined {
  const isMergeableObject = (
    value: unknown,
  ): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  if (isMergeableObject(current) && isMergeableObject(config)) {
    return {
      ...(current as Record<string, unknown>),
      ...(config as Record<string, unknown>),
    } as PerformanceConfig[T];
  }
  if (config !== undefined) {
    return config as PerformanceConfig[T];
  }
  return current;
}
