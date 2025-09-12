/**
 * Web Vitals 诊断常量和基础类型定义
 * Web Vitals diagnostics constants and basic types
 */

import type { DetailedWebVitals } from '@/lib/enhanced-web-vitals';

// Web Vitals诊断常量
export const WEB_VITALS_CONSTANTS = {
  MAX_REPORTS_HISTORY: 50,
  SCORE_DIVISOR: 2,
  SCORE_MULTIPLIER_10: 10,
  SCORE_MULTIPLIER_20: 20,
  // 性能阈值常量
  LCP_GOOD: 2500,
  LCP_POOR: 4000,
  FID_GOOD: 100,
  FID_POOR: 300,
  CLS_GOOD: 0.1,
  CLS_POOR: 0.25,
  FCP_GOOD: 1800,
  TTFB_GOOD: 800,
  // 分数权重
  SCORE_WEIGHT_LCP: 40,
  SCORE_WEIGHT_FID: 30,
  SCORE_WEIGHT_CLS: 30,
  SCORE_DEDUCTION_MAJOR: 30,
  SCORE_DEDUCTION_MINOR: 15,
  SCORE_DEDUCTION_SMALL: 10,
  SCORE_DEDUCTION_TINY: 5,
  // 其他常量
  TREND_THRESHOLD: 5,
  MAX_PATH_LENGTH: 1000,
  DECIMAL_PLACES: 3,
  JSON_INDENT: 2,
} as const;

// 诊断报告类型
export interface DiagnosticReport {
  timestamp: number;
  vitals: DetailedWebVitals;
  score: number;
  issues: string[];
  recommendations: string[];
  pageUrl: string;
  userAgent: string;
}

// 性能趋势类型
export interface PerformanceTrend {
  metric: keyof DetailedWebVitals;
  trend: 'improving' | 'declining' | 'stable';
  change: number;
  recent: number;
  previous: number;
}

// 页面比较结果类型
export interface PageComparison {
  currentPage: string;
  comparedPage: string;
  scoreDifference: number;
  betterMetrics: string[];
  worseMetrics: string[];
  metrics: Record<
    keyof DetailedWebVitals,
    {
      current: number | undefined;
      compared: number | undefined;
      difference: number;
      percentageChange: number;
    }
  >;
}

// 导出数据格式类型
export interface ExportData {
  exportDate: string;
  totalReports: number;
  reports: Array<{
    timestamp: number;
    pageUrl: string;
    score: number;
    vitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
      fcp?: number;
      ttfb?: number;
    };
    issues: string[];
    recommendations: string[];
  }>;
}

// 性能指标比较类型
export interface MetricComparison {
  current: number | undefined;
  compared: number | undefined;
  difference: number;
  percentageChange: number;
}

// 页面性能分组类型
export interface PagePerformanceGroup {
  url: string;
  reports: DiagnosticReport[];
  averageScore: number;
  latestReport: DiagnosticReport;
}

// 趋势分析结果类型
export interface TrendAnalysisResult {
  trends: PerformanceTrend[];
  overallTrend: 'improving' | 'declining' | 'stable';
  significantChanges: Array<{
    metric: keyof DetailedWebVitals;
    change: number;
    impact: 'positive' | 'negative';
  }>;
}

// 性能分数计算配置类型
export interface ScoreCalculationConfig {
  lcpWeight: number;
  fidWeight: number;
  clsWeight: number;
  perfectScore: number;
  thresholds: {
    lcp: { good: number; poor: number };
    fid: { good: number; poor: number };
    cls: { good: number; poor: number };
  };
}
