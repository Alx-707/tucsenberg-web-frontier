'use client';

import { WEB_VITALS_CONSTANTS } from '@/constants/test-constants';
import { DEVICE_DEFAULTS, PERFORMANCE_THRESHOLDS } from './constants';
import { WebVitalsObservers } from './observers';
import type { DetailedWebVitals } from './types';

/**
 * 增强的 Web Vitals 数据收集器
 * 提供详细的性能分析和诊断信息
 */
export class EnhancedWebVitalsCollector {
  private metrics: Partial<DetailedWebVitals> = {};
  private webVitalsObservers: WebVitalsObservers;
  private isCollecting = false;

  constructor() {
    this.webVitalsObservers = new WebVitalsObservers(this.metrics);
    this.initializeCollection();
  }

  private initializeCollection() {
    if (typeof window === 'undefined' || this.isCollecting) return;

    this.isCollecting = true;
    this.collectBasicPageInfo();
    this.collectDeviceInfo();
    this.collectNetworkInfo();
    this.collectNavigationTiming();
    this.collectResourceTiming();
    this.collectWebVitals();
  }

  private collectBasicPageInfo() {
    this.metrics.page = {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      timestamp: Date.now(),
    };
  }

  private collectDeviceInfo() {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
    };
    this.metrics.device = {
      ...(nav.deviceMemory !== undefined && { memory: nav.deviceMemory }),
      ...(nav.hardwareConcurrency !== undefined && {
        cores: nav.hardwareConcurrency,
      }),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  private collectNetworkInfo() {
    const nav = navigator as Navigator & {
      connection?: {
        effectiveType: string;
        downlink: number;
        rtt: number;
        saveData: boolean;
      };
    };
    if (nav.connection) {
      this.metrics.connection = {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
        saveData: nav.connection.saveData,
      };
    }
  }

  private collectNavigationTiming() {
    const navigation = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      // 使用 startTime 作为基准时间点（相当于 navigationStart）
      this.metrics.domContentLoaded =
        navigation.domContentLoadedEventEnd - navigation.startTime;
      this.metrics.loadComplete =
        navigation.loadEventEnd - navigation.startTime;
      this.metrics.ttfb = navigation.responseStart - navigation.startTime;
    }
  }

  private collectResourceTiming() {
    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];

    const slowResources = resources
      .filter(
        (resource) =>
          resource.duration > PERFORMANCE_THRESHOLDS.SLOW_RESOURCE_THRESHOLD,
      )
      .map((resource) => ({
        name: resource.name,
        duration: Math.round(resource.duration),
        size: resource.transferSize,
        type: this.getResourceType(resource.name),
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, PERFORMANCE_THRESHOLDS.MAX_SLOW_RESOURCES);

    this.metrics.resourceTiming = {
      totalResources: resources.length,
      slowResources,
      totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalDuration: resources.reduce((sum, r) => sum + r.duration, 0),
    };
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'JavaScript';
    if (url.includes('.css')) return 'CSS';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'Image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'Font';
    if (url.includes('api/') || url.includes('/api/')) return 'API';
    return 'Other';
  }

  private collectWebVitals() {
    // 启动所有 Web Vitals 观察器
    this.webVitalsObservers.startAllObservers();
  }

  /**
   * 获取默认的资源时间信息
   */
  private getDefaultResourceTiming() {
    return {
      totalResources: 0,
      slowResources: [],
      totalSize: 0,
      totalDuration: 0,
    };
  }

  /**
   * 获取默认的连接信息
   */
  private getDefaultConnection() {
    return {
      effectiveType: 'unknown' as const,
      downlink: 0,
      rtt: 0,
      saveData: false,
    };
  }

  /**
   * 获取默认的设备信息
   */
  private getDefaultDevice() {
    return {
      memory:
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ||
        DEVICE_DEFAULTS.MEMORY_GB,
      cores: navigator.hardwareConcurrency || DEVICE_DEFAULTS.CPU_CORES,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth || DEVICE_DEFAULTS.VIEWPORT_WIDTH,
        height: window.innerHeight || DEVICE_DEFAULTS.VIEWPORT_HEIGHT,
      },
    };
  }

  /**
   * 获取默认的页面信息
   */
  private getDefaultPage() {
    return {
      url: '',
      referrer: '',
      title: '',
      timestamp: Date.now(),
    };
  }

  public getDetailedMetrics(): DetailedWebVitals {
    // 确保所有必需的字段都有默认值
    return {
      cls: this.metrics.cls || 0,
      fid: this.metrics.fid || 0,
      lcp: this.metrics.lcp || 0,
      fcp: this.metrics.fcp || 0,
      ttfb: this.metrics.ttfb || 0,
      inp: this.metrics.inp || 0,
      domContentLoaded: this.metrics.domContentLoaded || 0,
      loadComplete: this.metrics.loadComplete || 0,
      firstPaint: this.metrics.firstPaint || 0,
      resourceTiming:
        this.metrics.resourceTiming || this.getDefaultResourceTiming(),
      connection: this.metrics.connection || this.getDefaultConnection(),
      device: this.metrics.device || this.getDefaultDevice(),
      page: this.metrics.page || this.getDefaultPage(),
    };
  }

  /**
   * 分析 CLS 指标并生成问题和建议
   */
  private analyzeCLS(
    cls: number,
    issues: string[],
    recommendations: string[],
  ): void {
    if (cls > PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT) {
      issues.push(
        `严重的布局偏移问题 (CLS: ${cls.toFixed(PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.POOR)})`,
      );
      recommendations.push(
        '检查图片尺寸设置，避免动态内容插入，使用 CSS aspect-ratio',
      );
    } else if (cls > PERFORMANCE_THRESHOLDS.CLS_GOOD) {
      issues.push(
        `轻微的布局偏移 (CLS: ${cls.toFixed(PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.POOR)})`,
      );
      recommendations.push('优化字体加载，确保图片有明确的尺寸');
    }
  }

  /**
   * 分析 LCP 指标并生成问题和建议
   */
  private analyzeLCP(
    lcp: number,
    issues: string[],
    recommendations: string[],
  ): void {
    if (lcp > PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT) {
      issues.push(`主要内容加载过慢 (LCP: ${Math.round(lcp)}ms)`);
      recommendations.push('优化图片压缩，使用 CDN，预加载关键资源');
    } else if (lcp > PERFORMANCE_THRESHOLDS.LCP_GOOD) {
      issues.push(`主要内容加载较慢 (LCP: ${Math.round(lcp)}ms)`);
      recommendations.push('考虑图片优化和资源预加载');
    }
  }

  /**
   * 分析 FID 指标并生成问题和建议
   */
  private analyzeFID(
    fid: number,
    issues: string[],
    recommendations: string[],
  ): void {
    if (fid > PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT) {
      issues.push(`交互响应严重延迟 (FID: ${Math.round(fid)}ms)`);
      recommendations.push(
        '减少 JavaScript 执行时间，使用 Web Workers，优化事件处理',
      );
    } else if (fid > PERFORMANCE_THRESHOLDS.FID_GOOD) {
      issues.push(`交互响应有延迟 (FID: ${Math.round(fid)}ms)`);
      recommendations.push('优化 JavaScript 代码，减少主线程阻塞');
    }
  }

  /**
   * 分析资源加载性能并生成问题和建议
   */
  private analyzeResourceTiming(
    resourceTiming: DetailedWebVitals['resourceTiming'],
    issues: string[],
    recommendations: string[],
  ): void {
    if (
      resourceTiming?.slowResources &&
      resourceTiming.slowResources.length > 0
    ) {
      issues.push(
        `发现 ${resourceTiming.slowResources.length} 个加载缓慢的资源`,
      );
      const slowResourcesText = resourceTiming.slowResources
        .slice(0, PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.POOR)
        .map((r) => `${r.type} (${r.duration}ms)`)
        .join(', ');
      recommendations.push(`优化慢速资源：${slowResourcesText}`);
    }
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(metrics: DetailedWebVitals): number {
    const { PERFECT_SCORE } = WEB_VITALS_CONSTANTS;
    let score = PERFECT_SCORE;

    // CLS 评分
    if (metrics.cls > PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT) {
      score -= PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.GOOD;
    } else if (metrics.cls > PERFORMANCE_THRESHOLDS.CLS_GOOD) {
      score -= PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.NEEDS_IMPROVEMENT;
    }

    // LCP 评分
    if (metrics.lcp > PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT) {
      score -= PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.GOOD;
    } else if (metrics.lcp > PERFORMANCE_THRESHOLDS.LCP_GOOD) {
      score -= PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.NEEDS_IMPROVEMENT;
    }

    // FID 评分
    if (metrics.fid > PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT) {
      score -= PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.GOOD;
    } else if (metrics.fid > PERFORMANCE_THRESHOLDS.FID_GOOD) {
      score -= PERFORMANCE_THRESHOLDS.SCORE_MULTIPLIERS.NEEDS_IMPROVEMENT;
    }

    // 慢速资源评分
    const {
      MAX_SLOW_RESOURCES_PENALTY: MAX_SLOW_RESOURCES,
      SLOW_RESOURCE_PENALTY,
    } = WEB_VITALS_CONSTANTS;
    if (
      metrics.resourceTiming?.slowResources &&
      metrics.resourceTiming.slowResources.length > MAX_SLOW_RESOURCES
    ) {
      score -= SLOW_RESOURCE_PENALTY;
    }

    return Math.max(0, score);
  }

  /**
   * 执行所有性能指标分析
   */
  private performMetricsAnalysis(
    metrics: DetailedWebVitals,
    issues: string[],
    recommendations: string[],
  ): void {
    this.analyzeCLS(metrics.cls, issues, recommendations);
    this.analyzeLCP(metrics.lcp, issues, recommendations);
    this.analyzeFID(metrics.fid, issues, recommendations);
    this.analyzeResourceTiming(metrics.resourceTiming, issues, recommendations);
  }

  /**
   * 构建诊断报告结果对象
   */
  private buildDiagnosticResult(
    metrics: DetailedWebVitals,
    issues: string[],
    recommendations: string[],
    score: number,
  ): {
    metrics: DetailedWebVitals;
    analysis: {
      issues: string[];
      recommendations: string[];
      score: number;
    };
  } {
    return {
      metrics,
      analysis: {
        issues,
        recommendations,
        score,
      },
    };
  }

  public generateDiagnosticReport(): {
    metrics: DetailedWebVitals;
    analysis: {
      issues: string[];
      recommendations: string[];
      score: number;
    };
  } {
    const metrics = this.getDetailedMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 执行性能分析
    this.performMetricsAnalysis(metrics, issues, recommendations);

    // 计算总体评分
    const score = this.calculatePerformanceScore(metrics);

    // 构建并返回结果
    return this.buildDiagnosticResult(metrics, issues, recommendations, score);
  }

  public cleanup() {
    this.webVitalsObservers.cleanup();
    this.isCollecting = false;
  }
}
