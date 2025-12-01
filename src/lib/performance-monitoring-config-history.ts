/**
 * 性能监控配置历史管理
 * Performance Monitoring Config History Management
 */

import type { PerformanceConfig } from '@/lib/performance-monitoring-types';
import { COUNT_TEN, ONE } from '@/constants';

/**
 * 配置历史条目接口
 */
export interface ConfigHistoryEntry {
  timestamp: number;
  config: PerformanceConfig;
  reason?: string;
}

/**
 * 配置历史管理器
 */
export class ConfigHistoryManager {
  private history: ConfigHistoryEntry[] = [];

  /**
   * 记录配置变更
   */
  recordChange(config: PerformanceConfig, reason?: string): void {
    this.history.push({
      timestamp: Date.now(),
      config: { ...config },
      ...(reason !== undefined && { reason }),
    });

    // 限制历史记录数量
    if (this.history.length > COUNT_TEN) {
      this.history = this.history.slice(-COUNT_TEN);
    }
  }

  /**
   * 获取配置历史
   */
  getHistory(): ConfigHistoryEntry[] {
    return [...this.history];
  }

  /**
   * 回滚到之前的配置
   */
  rollback(steps = ONE): PerformanceConfig | null {
    if (this.history.length < steps + ONE) {
      return null;
    }

    const targetIndex = this.history.length - steps - ONE;
    const targetConfig = this.history.at(targetIndex);

    if (targetConfig?.config) {
      return { ...targetConfig.config };
    }

    return null;
  }

  /**
   * 获取历史记录数量
   */
  get length(): number {
    return this.history.length;
  }
}
