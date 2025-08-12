/**
 * Web Vitals 相关的类型定义
 */

export interface DetailedWebVitals {
  // 核心 Web Vitals
  cls: number;
  fid: number;
  lcp: number;
  fcp: number;
  ttfb: number;
  inp?: number;

  // 额外的性能指标
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;

  // 资源加载性能
  resourceTiming: {
    totalResources: number;
    slowResources: Array<{
      name: string;
      duration: number;
      size?: number;
      type: string;
    }>;
    totalSize: number;
    totalDuration: number;
  };

  // 网络信息
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };

  // 设备信息
  device: {
    memory?: number;
    cores?: number;
    userAgent: string;
    viewport: {
      width: number;
      height: number;
    };
  };

  // 页面信息
  page: {
    url: string;
    referrer: string;
    title: string;
    timestamp: number;
  };
}

/**
 * 性能基准数据接口
 */
export interface PerformanceBaseline {
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: {
    effectiveType: string;
    downlink: number;
  };
  metrics: {
    cls: number;
    lcp: number;
    fid: number;
    fcp: number;
    ttfb: number;
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
  };
  score: number;
  environment: {
    viewport: { width: number; height: number };
    memory?: number;
    cores?: number;
  };
  buildInfo?: {
    version: string;
    commit: string;
    branch: string;
    timestamp: number;
  };
}

/**
 * 性能回归检测结果接口
 */
export interface RegressionDetectionResult {
  hasRegression: boolean;
  regressions: Array<{
    metric: string;
    current: number;
    baseline: number;
    change: number;
    changePercent: number;
    severity: 'warning' | 'critical';
    threshold: number;
  }>;
  summary: {
    totalRegressions: number;
    criticalRegressions: number;
    warningRegressions: number;
    overallSeverity: 'none' | 'warning' | 'critical';
  };
  baseline: PerformanceBaseline;
  current: DetailedWebVitals;
}

/**
 * 性能预警配置接口
 */
export interface PerformanceAlertConfig {
  enabled: boolean;
  thresholds: {
    cls: { warning: number; critical: number };
    lcp: { warning: number; critical: number };
    fid: { warning: number; critical: number };
    fcp: { warning: number; critical: number };
    ttfb: { warning: number; critical: number };
    score: { warning: number; critical: number };
  };
  channels: {
    console: boolean;
    storage: boolean;
    webhook?: string;
    callback?: (_alert: PerformanceAlert) => void;
  };
}

/**
 * 性能预警接口
 */
export interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  url: string;
  userAgent: string;
  context: {
    baseline?: PerformanceBaseline;
    regression?: RegressionDetectionResult;
  };
}

/**
 * 性能监控配置接口
 */
export interface PerformanceMonitoringConfig {
  enableBaseline: boolean;
  enableRegression: boolean;
  enableAlerts: boolean;
  baselineConfig: {
    autoSave: boolean;
    saveInterval: number; // 毫秒
    maxBaselines: number;
  };
  regressionConfig: {
    autoDetect: boolean;
    detectInterval: number; // 毫秒
    baselineSelection: 'latest' | 'average' | 'best';
  };
  alertConfig: PerformanceAlertConfig;
}

/**
 * 性能监控状态接口
 */
export interface PerformanceMonitoringStatus {
  isActive: boolean;
  lastUpdate: number;
  totalBaselines: number;
  lastRegression?: RegressionDetectionResult;
  recentAlerts: PerformanceAlert[];
  config: PerformanceMonitoringConfig;
}
