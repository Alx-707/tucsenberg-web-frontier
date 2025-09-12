/**
 * 翻译预加载策略工厂和集合
 * Translation Preloader Strategy Factory and Collections
 */

import type { PreloaderMetrics } from '../i18n-preloader-types';
import { PreloadStrategyManager } from './manager';
import { strategyConfigs } from './configs';

// 导入所有策略
import {
  immediateStrategy,
  smartStrategy,
  progressiveStrategy,
  priorityStrategy,
  lazyStrategy,
} from './basic-strategies';

import {
  batchStrategy,
  adaptiveStrategy,
  networkAwareStrategy,
  timeAwareStrategy,
  memoryAwareStrategy,
} from './advanced-strategies';

/**
 * 预加载策略集合
 * Preload strategies collection
 */
export const PreloadStrategies = {
  immediate: immediateStrategy,
  smart: smartStrategy,
  progressive: progressiveStrategy,
  priority: priorityStrategy,
  lazy: lazyStrategy,
  batch: batchStrategy,
  adaptive: adaptiveStrategy,
  networkAware: networkAwareStrategy,
  timeAware: timeAwareStrategy,
  memoryAware: memoryAwareStrategy,
};

/**
 * 创建策略管理器
 * Create strategy manager
 */
export function createStrategyManager(): PreloadStrategyManager {
  const manager = new PreloadStrategyManager();
  
  // 注册所有策略
  Object.entries(PreloadStrategies).forEach(([name, strategy]) => {
    const config = strategyConfigs[name];
    manager.registerStrategy(name, strategy, config);
  });
  
  return manager;
}

/**
 * 获取推荐策略
 * Get recommended strategy
 */
export function getRecommendedStrategy(
  metrics: PreloaderMetrics,
  networkCondition: 'fast' | 'slow' | 'offline' = 'fast'
): string {
  const manager = createStrategyManager();
  return manager.selectBestStrategy(metrics, networkCondition);
}
