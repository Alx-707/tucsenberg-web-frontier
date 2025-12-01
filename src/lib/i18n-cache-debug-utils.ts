/**
 * 缓存调试工具函数
 * Cache Debug Utility Functions
 */

import { COUNT_PAIR, ONE, ZERO } from '@/constants';

/**
 * 缓存调试工具函数
 */
export const CacheDebugUtils = {
  /**
   * 生成调试信息
   */
  generateDebugInfo(cache: unknown): Record<string, unknown> {
    return {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
      memoryUsage: process.memoryUsage?.(),
      cacheInfo: cache,
    };
  },

  /**
   * 格式化调试输出
   */
  formatDebugOutput(info: Record<string, unknown>): string {
    return JSON.stringify(info, null, COUNT_PAIR);
  },

  /**
   * 创建性能标记
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  /**
   * 测量性能
   */
  measure(name: string, startMark: string, endMark?: string): number {
    if (typeof performance !== 'undefined' && performance.measure) {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      if (entries.length === ZERO) {
        return ZERO;
      }

      const [lastEntry] = entries.slice(-ONE);
      return lastEntry?.duration ?? ZERO;
    }
    return ZERO;
  },
} as const;
