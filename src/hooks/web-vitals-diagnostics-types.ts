import type {
  DiagnosticReport,
  PageComparison,
  PerformanceTrend,
} from './web-vitals-diagnostics-utils';

/**
 * Web Vitals 诊断相关类型定义
 */

/**
 * Web Vitals 诊断状态接口
 */
export interface WebVitalsDiagnosticsState {
  currentReport: DiagnosticReport | null;
  historicalReports: DiagnosticReport[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 诊断Hook返回参数接口
 */
export interface DiagnosticsReturnParams {
  state: WebVitalsDiagnosticsState;
  refreshDiagnostics: () => Promise<void>;
  getPerformanceTrends: () => PerformanceTrend[] | null;
  getPageComparison: () => PageComparison[];
  exportReport: (_format?: 'json' | 'csv') => void;
  clearHistory: () => void;
}

/**
 * Web Vitals 诊断Hook返回值类型
 */
export interface UseWebVitalsDiagnosticsReturn {
  currentReport: DiagnosticReport | null;
  historicalReports: DiagnosticReport[];
  isLoading: boolean;
  error: string | null;
  refreshDiagnostics: () => Promise<void>;
  getPerformanceTrends: () => PerformanceTrend[] | null;
  getPageComparison: () => PageComparison[];
  exportReport: (_format?: 'json' | 'csv') => void;
  clearHistory: () => void;
}

/**
 * 数据持久化接口
 */
export interface WebVitalsDataPersistence {
  loadHistoricalData: () => DiagnosticReport[];
  saveToStorage: (_reports: DiagnosticReport[]) => void;
}

/**
 * 分析功能接口
 */
export interface WebVitalsAnalysisFunctions {
  getPerformanceTrends: () => PerformanceTrend[] | null;
  getPageComparison: () => PageComparison[];
}

/**
 * 报告导出功能接口
 */
export interface WebVitalsReportExport {
  exportReport: (_format?: 'json' | 'csv') => void;
}

/**
 * 数据管理功能接口
 */
export interface WebVitalsDataManagement {
  clearHistory: () => void;
}

/**
 * 诊断刷新功能接口
 */
export interface WebVitalsRefresh {
  refreshDiagnostics: () => Promise<void>;
}

/**
 * 初始化数据接口
 */
export interface WebVitalsInitializationData {
  initialData: {
    historicalReports: DiagnosticReport[];
    shouldRefresh: boolean;
  };
}

/**
 * 测试环境诊断返回值接口
 */
export interface TestWebVitalsDiagnosticsReturn {
  refreshDiagnostics: () => Promise<void>;
  getPerformanceTrends: () => PerformanceTrend[] | null;
  getPageComparison: () => PageComparison[];
  exportReport: (_format?: 'json' | 'csv') => void;
  clearHistory: () => void;
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'json' | 'csv';

/**
 * 诊断配置选项接口
 */
export interface WebVitalsDiagnosticsOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  maxHistorySize?: number;
  enablePersistence?: boolean;
  enableExport?: boolean;
}

/**
 * 诊断错误类型
 */
export interface WebVitalsDiagnosticsError {
  code: string;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * 诊断事件类型
 */
export type WebVitalsDiagnosticsEventType = 
  | 'report-generated'
  | 'data-loaded'
  | 'data-saved'
  | 'export-completed'
  | 'history-cleared'
  | 'error-occurred';

/**
 * 诊断事件接口
 */
export interface WebVitalsDiagnosticsEvent {
  type: WebVitalsDiagnosticsEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * 诊断监听器类型
 */
export type WebVitalsDiagnosticsListener = (event: WebVitalsDiagnosticsEvent) => void;
