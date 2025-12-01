/**
 * 缓存事件工具函数
 * Cache Event Utility Functions
 */

import type { CacheEvent, CacheEventType } from '@/lib/i18n-cache-types-base';
import { ONE, ZERO } from '@/constants';

/**
 * 计算每种事件类型的数量
 */
function countEventsByType<T>(
  events: CacheEvent<T>[],
): Record<CacheEventType, number> {
  const counts: Record<CacheEventType, number> = {
    hit: ZERO,
    miss: ZERO,
    set: ZERO,
    delete: ZERO,
    clear: ZERO,
    expire: ZERO,
    preload_start: ZERO,
    preload_complete: ZERO,
    preload_error: ZERO,
  };
  events.forEach(({ type }) => {
    incrementCount(counts, type);
  });
  return counts;
}

/**
 * 增加指定类型的计数
 */
function incrementCount(
  counts: Record<CacheEventType, number>,
  type: CacheEventType,
): void {
  switch (type) {
    case 'hit':
      counts.hit += ONE;
      break;
    case 'miss':
      counts.miss += ONE;
      break;
    case 'set':
      counts.set += ONE;
      break;
    case 'delete':
      counts.delete += ONE;
      break;
    case 'clear':
      counts.clear += ONE;
      break;
    case 'expire':
      counts.expire += ONE;
      break;
    case 'preload_start':
      counts.preload_start += ONE;
      break;
    case 'preload_complete':
      counts.preload_complete += ONE;
      break;
    case 'preload_error':
      counts.preload_error += ONE;
      break;
    default:
      break;
  }
}

/**
 * 构建非零统计对象
 */
function buildNonZeroStats(
  counts: Record<CacheEventType, number>,
): Record<string, number> {
  const stats: Record<string, number> = {};
  if (counts.hit > ZERO) stats.hit = counts.hit;
  if (counts.miss > ZERO) stats.miss = counts.miss;
  if (counts.set > ZERO) stats.set = counts.set;
  if (counts.delete > ZERO) stats.delete = counts.delete;
  if (counts.clear > ZERO) stats.clear = counts.clear;
  if (counts.expire > ZERO) stats.expire = counts.expire;
  if (counts.preload_start > ZERO) stats.preload_start = counts.preload_start;
  if (counts.preload_complete > ZERO)
    stats.preload_complete = counts.preload_complete;
  if (counts.preload_error > ZERO) stats.preload_error = counts.preload_error;
  return stats;
}

/**
 * 缓存事件工具函数
 */
export const CacheEventUtils = {
  /**
   * 创建缓存事件
   */
  createEvent<T>(type: string, data?: T, key?: string): CacheEvent<T> {
    const event: CacheEvent<T> = {
      type: type as CacheEventType,
      timestamp: Date.now(),
    };

    if (key) {
      event.key = key;
    }

    if (data) {
      event.data = data;
    }

    return event;
  },

  /**
   * 过滤事件
   */
  filterEvents<T>(
    events: CacheEvent<T>[],
    type?: string,
    timeRange?: { start: number; end: number },
  ): CacheEvent<T>[] {
    return events.filter((event) => {
      if (type && event.type !== type) return false;
      if (
        timeRange &&
        (event.timestamp < timeRange.start || event.timestamp > timeRange.end)
      )
        return false;
      return true;
    });
  },

  /**
   * 聚合事件统计
   */
  aggregateEvents<T>(events: CacheEvent<T>[]): Record<string, number> {
    const counts = countEventsByType(events);
    return buildNonZeroStats(counts);
  },
} as const;
