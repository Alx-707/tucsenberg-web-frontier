/**
 * 预加载器工具函数
 * Preloader Utility Functions
 */

import type { Locale, Messages } from '@/types/i18n';
import type {
  IPreloader,
  PreloaderConfig,
  PreloadResult,
  PreloaderMetrics
} from '../i18n-preloader-types';

/**
 * 预加载器工具函数
 * Preloader utility functions
 */
export const PreloaderUtils = {
  /**
   * 验证预加载配置
   * Validate preload configuration
   */
  validateConfig(config: Partial<PreloaderConfig>): boolean {
    if (config.batchSize && config.batchSize <= 0) {
      return false;
    }
    if (config.timeout && config.timeout <= 0) {
      return false;
    }
    if (config.retryCount && config.retryCount < 0) {
      return false;
    }
    return true;
  },

  /**
   * 合并配置
   * Merge configurations
   */
  mergeConfigs(
    base: PreloaderConfig,
    override: Partial<PreloaderConfig>
  ): PreloaderConfig {
    return {
      ...base,
      ...override,
      smartPreload: {
        ...base.smartPreload,
        ...override.smartPreload,
      },
      events: {
        ...base.events,
        ...override.events,
      },
    };
  },

  /**
   * 计算预加载优先级
   * Calculate preload priority
   */
  calculatePriority(locale: Locale, metrics: PreloaderMetrics): number {
    // 基础优先级
    const basePriority = locale === 'en' ? 10 : 5;
    
    // 根据使用频率调整
    const usageBonus = Math.min(metrics.successfulPreloads * 0.1, 5);
    
    // 根据错误率调整
    const errorPenalty = metrics.failedPreloads * 0.2;
    
    return Math.max(basePriority + usageBonus - errorPenalty, 1);
  },

  /**
   * 格式化预加载结果
   * Format preload result
   */
  formatResult(result: PreloadResult): string {
    const status = result.success ? '✅' : '❌';
    const time = `${result.loadTime}ms`;
    const source = result.fromCache ? '(cached)' : '(network)';
    
    return `${status} ${result.locale} ${time} ${source}`;
  },

  /**
   * 生成预加载报告
   * Generate preload report
   */
  generateReport(results: PreloadResult[]): {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
    cacheHitRate: number;
    details: string[];
  } {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;
    const cacheHits = results.filter(r => r.fromCache).length;
    
    const totalTime = results.reduce((sum, r) => sum + r.loadTime, 0);
    const averageTime = total > 0 ? totalTime / total : 0;
    const cacheHitRate = total > 0 ? cacheHits / total : 0;
    
    const details = results.map(result => PreloaderUtils.formatResult(result));
    
    return {
      total,
      successful,
      failed,
      averageTime,
      cacheHitRate,
      details,
    };
  },

  /**
   * 检查预加载器健康状态
   * Check preloader health
   */
  checkHealth(preloader: IPreloader): {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
  } {
    const stats = preloader.getPreloadStats();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // 检查成功率
    if (stats.successRate < 0.8) {
      issues.push(`Low success rate: ${(stats.successRate * 100).toFixed(1)}%`);
      recommendations.push('Check network connectivity and API endpoints');
    }
    
    // 检查平均加载时间
    if (stats.averageLoadTime > 5000) {
      issues.push(`High average load time: ${stats.averageLoadTime}ms`);
      recommendations.push('Consider optimizing network requests or reducing payload size');
    }
    
    // 检查错误数量
    if (stats.errorCount > 5) {
      issues.push(`High error count: ${stats.errorCount}`);
      recommendations.push('Review error logs and implement better error handling');
    }
    
    const status = issues.length === 0 ? 'healthy' : 
                  issues.length <= 2 ? 'warning' : 'error';
    
    return { status, issues, recommendations };
  },

  /**
   * 创建默认配置
   * Create default configuration
   */
  createDefaultConfig(): PreloaderConfig {
    return {
      enablePreload: true,
      preloadLocales: ['en', 'zh'],
      batchSize: 3,
      delayBetweenBatches: 100,
      maxConcurrency: 5,
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
      smartPreload: {
        enabled: true,
        maxLocales: 5,
        minUsageThreshold: 0.1,
        usageWindow: 24,
        preloadTrigger: 'idle',
        scheduleInterval: 60,
      },
      memoryLimit: 50 * 1024 * 1024, // 50MB
      networkThrottling: false,
      priorityQueue: true,
      cacheStrategy: 'adaptive',
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxCacheSize: 100,
      enableMetrics: true,
      metricsInterval: 60000, // 1 minute
      enableLogging: true,
      logLevel: 'info',
    };
  },

  /**
   * 估算内存使用量
   * Estimate memory usage
   */
  estimateMemoryUsage(messages: Messages): number {
    const jsonString = JSON.stringify(messages);
    return new Blob([jsonString]).size;
  },

  /**
   * 检查浏览器支持
   * Check browser support
   */
  checkBrowserSupport(): {
    fetch: boolean;
    abortController: boolean;
    intersectionObserver: boolean;
    serviceWorker: boolean;
  } {
    return {
      fetch: typeof fetch !== 'undefined',
      abortController: typeof AbortController !== 'undefined',
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
    };
  },
};
