/**
 * Web Vitals 诊断工具 - 统一导出入口
 * Web Vitals diagnostics utilities - unified export entry
 */

// 导出常量和基础类型
export {
  WEB_VITALS_CONSTANTS,
  type DiagnosticReport,
  type PerformanceTrend,
  type PageComparison,
  type ExportData,
  type MetricComparison,
  type PagePerformanceGroup,
  type TrendAnalysisResult,
  type ScoreCalculationConfig,
} from '@/hooks/web-vitals-diagnostics-constants';

// 导出计算器函数
export {
  calculatePerformanceTrends,
  calculatePerformanceScore,
  calculatePercentageChange,
  calculateAverage,
  calculateMedian,
  calculateP95,
  calculateMetricStats,
  calculatePerformanceGrade,
  calculateImprovementPotential,
} from '@/hooks/web-vitals-diagnostics-calculator';

// 导出分析器函数
export {
  generateRecommendations,
  identifyPerformanceIssues,
  comparePagePerformance,
  calculatePageComparison,
  exportReportData,
  generateCSVData,
  analyzeOverallTrend,
} from '@/hooks/web-vitals-diagnostics-analyzer';
