/**
 * 性能监控协调器
 * 
 * 统一管理多个性能监控工具的协调运作：
 * - React Scan: 实时组件性能监控
 * - Web Eval Agent: 端到端用户体验测试
 * - Bundle Analyzer: 构建产物分析
 * - Size Limit: 包大小监控
 */

export interface PerformanceMetrics {
  timestamp: number;
  source: 'react-scan' | 'web-eval-agent' | 'bundle-analyzer' | 'size-limit' | 'custom';
  type: 'component' | 'page' | 'bundle' | 'network' | 'user-interaction';
  data: Record<string, any>;
}

export interface PerformanceConfig {
  reactScan: {
    enabled: boolean;
    showToolbar: boolean;
    trackUnnecessaryRenders: boolean;
  };
  webEvalAgent: {
    enabled: boolean;
    captureNetwork: boolean;
    captureLogs: boolean;
  };
  bundleAnalyzer: {
    enabled: boolean;
    openAnalyzer: boolean;
  };
  sizeLimit: {
    enabled: boolean;
    limits: Record<string, number>;
  };
}

class PerformanceMonitoringCoordinator {
  private metrics: PerformanceMetrics[] = [];
  private config: PerformanceConfig;
  
  constructor() {
    this.config = this.getEnvironmentConfig();
  }

  /**
   * 根据环境获取配置
   */
  private getEnvironmentConfig(): PerformanceConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      reactScan: {
        enabled: isDevelopment && !isTest && process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN !== 'true',
        showToolbar: isDevelopment && !isTest,
        trackUnnecessaryRenders: isDevelopment,
      },
      webEvalAgent: {
        enabled: isTest || process.env.NEXT_PUBLIC_ENABLE_WEB_EVAL_AGENT === 'true',
        captureNetwork: true,
        captureLogs: true,
      },
      bundleAnalyzer: {
        enabled: process.env.ANALYZE === 'true',
        openAnalyzer: !isProduction,
      },
      sizeLimit: {
        enabled: true,
        limits: {
          main: 50 * 1024, // 50KB
          framework: 130 * 1024, // 130KB
          css: 50 * 1024, // 50KB
        },
      },
    };
  }

  /**
   * 记录性能指标
   */
  recordMetric(metric: Omit<PerformanceMetrics, 'timestamp'>) {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: Date.now(),
    };
    
    this.metrics.push(fullMetric);
    
    // 在开发环境中输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric [${metric.source}]:`, metric.data);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): PerformanceConfig {
    return this.config;
  }

  /**
   * 获取指标
   */
  getMetrics(source?: PerformanceMetrics['source']): PerformanceMetrics[] {
    if (source) {
      return this.metrics.filter(m => m.source === source);
    }
    return this.metrics;
  }

  /**
   * 清理旧指标
   */
  cleanupOldMetrics(maxAge = 5 * 60 * 1000) { // 5分钟
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * 生成性能报告
   */
  generateReport(): {
    summary: Record<string, any>;
    details: PerformanceMetrics[];
    recommendations: string[];
  } {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000); // 最近1分钟
    
    const summary = {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      sources: [...new Set(this.metrics.map(m => m.source))],
      types: [...new Set(this.metrics.map(m => m.type))],
      timeRange: {
        start: this.metrics.length > 0 ? Math.min(...this.metrics.map(m => m.timestamp)) : now,
        end: this.metrics.length > 0 ? Math.max(...this.metrics.map(m => m.timestamp)) : now,
      },
    };

    const recommendations: string[] = [];
    
    // 基于指标生成建议
    const componentMetrics = this.metrics.filter(m => m.type === 'component');
    if (componentMetrics.length > 10) {
      recommendations.push('考虑使用 React.memo 优化频繁渲染的组件');
    }
    
    const networkMetrics = this.metrics.filter(m => m.type === 'network');
    if (networkMetrics.some(m => m.data.timing > 1000)) {
      recommendations.push('检查网络请求性能，考虑添加缓存或优化 API');
    }

    return {
      summary,
      details: this.metrics,
      recommendations,
    };
  }

  /**
   * 检查工具冲突
   */
  checkToolConflicts(): {
    hasConflicts: boolean;
    conflicts: string[];
    suggestions: string[];
  } {
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    // 检查 React Scan 和测试环境冲突
    if (this.config.reactScan.enabled && process.env.PLAYWRIGHT_TEST === 'true') {
      conflicts.push('React Scan 在测试环境中启用，可能干扰 Playwright 测试');
      suggestions.push('在测试环境中设置 NEXT_PUBLIC_DISABLE_REACT_SCAN=true');
    }

    // 检查多个性能工具同时运行
    const enabledTools = Object.entries(this.config)
      .filter(([_, config]) => config.enabled)
      .map(([tool]) => tool);

    if (enabledTools.length > 2) {
      suggestions.push('考虑在不同环境中使用不同的性能监控工具组合');
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      suggestions,
    };
  }
}

// 全局实例
export const performanceCoordinator = new PerformanceMonitoringCoordinator();

/**
 * React Scan 集成钩子
 */
export function useReactScanIntegration() {
  const config = performanceCoordinator.getConfig();
  
  return {
    enabled: config.reactScan.enabled,
    recordRender: (componentName: string, renderCount: number) => {
      if (config.reactScan.enabled) {
        performanceCoordinator.recordMetric({
          source: 'react-scan',
          type: 'component',
          data: {
            componentName,
            renderCount,
            timestamp: Date.now(),
          },
        });
      }
    },
  };
}

/**
 * Web Eval Agent 集成钩子
 */
export function useWebEvalAgentIntegration() {
  const config = performanceCoordinator.getConfig();
  
  return {
    enabled: config.webEvalAgent.enabled,
    recordUserInteraction: (action: string, timing: number, success: boolean) => {
      if (config.webEvalAgent.enabled) {
        performanceCoordinator.recordMetric({
          source: 'web-eval-agent',
          type: 'user-interaction',
          data: {
            action,
            timing,
            success,
            timestamp: Date.now(),
          },
        });
      }
    },
    recordNetworkRequest: (url: string, method: string, status: number, timing: number) => {
      if (config.webEvalAgent.enabled && config.webEvalAgent.captureNetwork) {
        performanceCoordinator.recordMetric({
          source: 'web-eval-agent',
          type: 'network',
          data: {
            url,
            method,
            status,
            timing,
            timestamp: Date.now(),
          },
        });
      }
    },
  };
}

/**
 * 环境检查工具
 */
export function checkEnvironmentCompatibility(): {
  isCompatible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // 检查测试环境配置
  if (process.env.PLAYWRIGHT_TEST === 'true') {
    if (process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN !== 'true') {
      issues.push('测试环境中 React Scan 未被禁用');
      recommendations.push('设置 NEXT_PUBLIC_DISABLE_REACT_SCAN=true');
    }
  }
  
  // 检查开发环境配置
  if (process.env.NODE_ENV === 'development') {
    if (process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN === 'true') {
      recommendations.push('开发环境中 React Scan 被禁用，考虑启用以获得性能监控');
    }
  }
  
  return {
    isCompatible: issues.length === 0,
    issues,
    recommendations,
  };
}

export default performanceCoordinator;
