/**
 * 翻译预加载策略工具函数
 * Translation Preloader Strategy Utility Functions
 */

import type { PreloaderMetrics } from '../i18n-preloader-types';
import { strategyConfigs } from './configs';

/**
 * 策略工具函数
 * Strategy utility functions
 */
export const StrategyUtils = {
  /**
   * 检查网络状况
   * Check network condition
   */
  getNetworkCondition(): 'fast' | 'slow' | 'offline' {
    if (!navigator.onLine) {
      return 'offline';
    }

    const connection = (navigator as { connection?: { effectiveType?: string; downlink?: number } }).connection;
    if (connection) {
      const { effectiveType, downlink } = connection;
      if (effectiveType === '4g' && downlink > 2) {
        return 'fast';
      }
    }

    return 'slow';
  },

  /**
   * 检查内存使用情况
   * Check memory usage
   */
  getMemoryUsage(): number {
    const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    if (memory) {
      const { usedJSHeapSize, totalJSHeapSize } = memory;
      return usedJSHeapSize / totalJSHeapSize;
    }
    return 0.5; // 默认值
  },

  /**
   * 获取当前时间段
   * Get current time period
   */
  getTimePeriod(): 'work' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      return 'work';
    }
    if (hour >= 18 && hour <= 22) {
      return 'evening';
    }
    return 'night';
  },

  /**
   * 计算策略优先级
   * Calculate strategy priority
   */
  calculateStrategyPriority(
    strategy: string,
    metrics: PreloaderMetrics,
    conditions: { network: string; memory: number; time: string }
  ): number {
    const config = strategyConfigs[strategy];
    if (!config) return 0;

    let score = config.priority;

    // 根据条件调整分数
    if (conditions.network === 'fast' && strategy === 'immediate') {
      score += 2;
    }
    if (conditions.memory < 0.5 && strategy === 'lazy') {
      score += 1;
    }
    if (metrics.successRate > 0.9 && strategy === 'smart') {
      score += 1;
    }

    return score;
  },
};
