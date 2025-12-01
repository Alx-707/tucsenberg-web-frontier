/**
 * 性能监控配置工厂函数
 * Performance Monitoring Config Factory
 */

import { PerformanceConfigManager } from '@/lib/performance-monitoring-core-config';
import {
  generateEnvironmentConfig,
  validateConfig,
  type PerformanceConfig,
} from '@/lib/performance-monitoring-types';

/**
 * 创建配置管理器实例
 */
export function createConfigManager(
  customConfig?: Partial<PerformanceConfig>,
): PerformanceConfigManager {
  return new PerformanceConfigManager(customConfig);
}

/**
 * 获取默认配置
 */
export function getDefaultConfig(): PerformanceConfig {
  return generateEnvironmentConfig();
}

/**
 * 验证配置对象
 */
export function validatePerformanceConfig(
  config: unknown,
): ReturnType<typeof validateConfig> {
  return validateConfig(config as PerformanceConfig);
}
