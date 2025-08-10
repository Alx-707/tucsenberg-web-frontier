'use client';

import {
    TEST_APP_CONSTANTS,
    TEST_COUNT_CONSTANTS,
} from '@/constants/test-constants';
import {
    enhancedWebVitalsCollector,
    type DetailedWebVitals,
} from '@/lib/enhanced-web-vitals';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Web Vitals诊断常量
const WEB_VITALS_CONSTANTS = {
  MAX_REPORTS_HISTORY: 50,
  SCORE_DIVISOR: 2,
  SCORE_MULTIPLIER_10: 10,
  SCORE_MULTIPLIER_20: 20,
} as const;

// 辅助函数：计算性能趋势
const calculatePerformanceTrends = (historicalReports: DiagnosticReport[]) => {
  if (historicalReports.length < WEB_VITALS_CONSTANTS.SCORE_DIVISOR)
    return null;

  const recent = historicalReports.slice(
    0,
    WEB_VITALS_CONSTANTS.SCORE_MULTIPLIER_10,
  ); // 最近10次
  const older = historicalReports.slice(
    WEB_VITALS_CONSTANTS.SCORE_MULTIPLIER_10,
    WEB_VITALS_CONSTANTS.SCORE_MULTIPLIER_20,
  ); // 之前10次

  const getAverage = (
    reports: DiagnosticReport[],
    metric: keyof DetailedWebVitals,
  ) => {
    // 安全的属性访问，避免对象注入
    const validMetrics: (keyof DetailedWebVitals)[] = [
      'lcp',
      'fid',
      'cls',
      'fcp',
      'ttfb',
    ];
    if (!validMetrics.includes(metric)) {
      return 0;
    }

    const values = reports
      .map((r) => {
        // 使用安全的属性访问方式
        switch (metric) {
          case 'lcp':
            return typeof r.metrics.lcp === 'number' ? r.metrics.lcp : 0;
          case 'fid':
            return typeof r.metrics.fid === 'number' ? r.metrics.fid : 0;
          case 'cls':
            return typeof r.metrics.cls === 'number' ? r.metrics.cls : 0;
          case 'fcp':
            return typeof r.metrics.fcp === 'number' ? r.metrics.fcp : 0;
          case 'ttfb':
            return typeof r.metrics.ttfb === 'number' ? r.metrics.ttfb : 0;
          default:
            return 0;
        }
      })
      .filter((v) => v > 0);

    return values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : 0;
  };

  const recentAvg = {
    lcp: getAverage(recent, 'lcp'),
    fid: getAverage(recent, 'fid'),
    cls: getAverage(recent, 'cls'),
  };

  const olderAvg = {
    lcp: getAverage(older, 'lcp'),
    fid: getAverage(older, 'fid'),
    cls: getAverage(older, 'cls'),
  };

  return {
    lcp: recentAvg.lcp - olderAvg.lcp,
    fid: recentAvg.fid - olderAvg.fid,
    cls: recentAvg.cls - olderAvg.cls,
  };
};

// 辅助函数：计算页面对比数据
const calculatePageComparison = (historicalReports: DiagnosticReport[]) => {
  // 使用Map避免对象注入安全问题
  const pageGroups = new Map<string, DiagnosticReport[]>();

  historicalReports.forEach((report) => {
    const url = new URL(report.metrics.page.url);
    const path = url.pathname;

    // 验证路径格式，避免恶意路径
    if (typeof path === 'string' && path.length > 0 && path.length < 1000) {
      if (!pageGroups.has(path)) {
        pageGroups.set(path, []);
      }
      pageGroups.get(path)!.push(report);
    }
  });

  return Array.from(pageGroups.entries())
    .map(([path, reports]) => {
      const avgMetrics = {
        lcp:
          reports.reduce((sum, r) => sum + (r.metrics.lcp || 0), 0) /
          reports.length,
        fid:
          reports.reduce((sum, r) => sum + (r.metrics.fid || 0), 0) /
          reports.length,
        cls:
          reports.reduce((sum, r) => sum + (r.metrics.cls || 0), 0) /
          reports.length,
        score:
          reports.reduce((sum, r) => sum + r.analysis.score, 0) /
          reports.length,
      };

      return {
        path,
        count: reports.length,
        metrics: avgMetrics,
      };
    })
    .sort((a, b) => b.count - a.count);
};

interface DiagnosticReport {
  metrics: DetailedWebVitals;
  analysis: {
    issues: string[];
    recommendations: string[];
    score: number;
  };
  timestamp: number;
}

// 性能趋势数据类型
interface PerformanceTrends {
  lcp: number;
  fid: number;
  cls: number;
}

// 页面对比数据类型
interface PageComparison {
  path: string;
  count: number;
  metrics: {
    lcp: number;
    fid: number;
    cls: number;
    score: number;
  };
}

interface WebVitalsDiagnosticsState {
  currentReport: DiagnosticReport | null;
  historicalReports: DiagnosticReport[];
  isLoading: boolean;
  error: string | null;
}

// 辅助函数：创建诊断Hook的返回对象
interface DiagnosticsReturnParams {
  state: WebVitalsDiagnosticsState;
  refreshDiagnostics: () => Promise<void>;
  getPerformanceTrends: () => PerformanceTrends | null;
  getPageComparison: () => PageComparison[];
  exportReport: (_format?: 'json' | 'csv') => void;
  clearHistory: () => void;
}

const createDiagnosticsReturn = (params: DiagnosticsReturnParams) => {
  const {
    state,
    refreshDiagnostics,
    getPerformanceTrends,
    getPageComparison,
    exportReport,
    clearHistory,
  } = params;
  return {
    ...state,
    refreshDiagnostics,
    getPerformanceTrends,
    getPageComparison,
    exportReport,
    clearHistory,
  };
};

// 辅助Hook：处理初始化逻辑
const useWebVitalsInitialization = (
  loadHistoricalData: () => DiagnosticReport[],
  refreshDiagnostics: () => Promise<void>,
) => {
  // 返回初始化数据，让调用者决定如何使用
  const initialData = useMemo(() => {
    return loadHistoricalData();
  }, [loadHistoricalData]);

  useEffect(() => {
    // 延迟生成初始报告
    const timer = setTimeout(() => {
      refreshDiagnostics();
    }, TEST_APP_CONSTANTS.TIMEOUT_BASE);

    return () => clearTimeout(timer);
  }, [refreshDiagnostics]);

  return { initialData };
};

// 辅助Hook：处理数据持久化
const useWebVitalsDataPersistence = () => {
  const loadHistoricalData = useCallback(() => {
    try {
      const stored = localStorage.getItem('webVitalsDiagnostics');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load diagnostics data:', error);
      return [];
    }
  }, []);

  const saveToStorage = useCallback((reports: DiagnosticReport[]) => {
    try {
      // 只保留最近50条记录
      const limitedReports = reports.slice(
        0,
        WEB_VITALS_CONSTANTS.MAX_REPORTS_HISTORY,
      );
      localStorage.setItem(
        'webVitalsDiagnostics',
        JSON.stringify(limitedReports),
      );
    } catch (error) {
      console.warn('Failed to save diagnostics data:', error);
    }
  }, []);

  return { loadHistoricalData, saveToStorage };
};

// 辅助Hook：处理诊断刷新逻辑
const useWebVitalsRefresh = (
  setState: React.Dispatch<React.SetStateAction<WebVitalsDiagnosticsState>>,
  loadHistoricalData: () => DiagnosticReport[],
  saveToStorage: (_reports: DiagnosticReport[]) => void,
) => {
  const generateReport = useCallback((): DiagnosticReport => {
    const report = enhancedWebVitalsCollector.generateDiagnosticReport();
    return {
      ...report,
      timestamp: Date.now(),
    };
  }, []);

  const refreshDiagnostics = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 等待一小段时间确保性能数据被收集
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newReport = generateReport();
      const historicalReports = loadHistoricalData();

      // 添加新报告到历史记录
      const updatedReports = [newReport, ...historicalReports];

      setState({
        currentReport: newReport,
        historicalReports: updatedReports,
        isLoading: false,
        error: null,
      });

      // 保存到 localStorage
      saveToStorage(updatedReports);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [generateReport, loadHistoricalData, saveToStorage, setState]);

  return { refreshDiagnostics };
};

/**
 * 导出JSON格式报告
 */
function exportJsonReport(data: Record<string, unknown>): void {
  const blob = new Blob(
    [JSON.stringify(data, null, TEST_COUNT_CONSTANTS.SMALL)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `web-vitals-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 导出CSV格式报告
 */
function exportCsvReport(historicalReports: DiagnosticReport[]): void {
  const csvHeaders = [
    'Timestamp',
    'URL',
    'CLS',
    'LCP',
    'FID',
    'FCP',
    'TTFB',
    'Score',
    'Issues',
    'Recommendations',
  ];

  const csvRows = historicalReports.map((report) => [
    new Date(report.timestamp).toISOString(),
    report.metrics.page.url,
    report.metrics.cls.toFixed(TEST_COUNT_CONSTANTS.TINY),
    Math.round(report.metrics.lcp),
    Math.round(report.metrics.fid),
    Math.round(report.metrics.fcp),
    Math.round(report.metrics.ttfb),
    report.analysis.score,
    report.analysis.issues.join('; '),
    report.analysis.recommendations.join('; '),
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `web-vitals-diagnostics-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 报告导出逻辑
 */
function useReportExport(
  state: WebVitalsDiagnosticsState,
  getPerformanceTrends: () => unknown,
  getPageComparison: () => unknown,
) {
  const exportReport = useCallback(
    (format: 'json' | 'csv' = 'json') => {
      if (!state.currentReport) return;

      const data = {
        timestamp: new Date().toISOString(),
        currentReport: state.currentReport,
        historicalReports: state.historicalReports.slice(
          0,
          TEST_COUNT_CONSTANTS.VERY_LARGE,
        ), // 最近20条
        trends: getPerformanceTrends(),
        pageComparison: getPageComparison(),
      };

      if (format === 'json') {
        exportJsonReport(data);
      } else if (format === 'csv') {
        exportCsvReport(state.historicalReports);
      }
    },
    [
      state.currentReport,
      state.historicalReports,
      getPerformanceTrends,
      getPageComparison,
    ],
  );

  return { exportReport };
}

/**
 * 分析功能
 */
function useAnalysisFunctions(state: WebVitalsDiagnosticsState) {
  const getPerformanceTrends = useCallback(() => {
    return calculatePerformanceTrends(state.historicalReports);
  }, [state.historicalReports]);

  const getPageComparison = useCallback(() => {
    return calculatePageComparison(state.historicalReports);
  }, [state.historicalReports]);

  return {
    getPerformanceTrends,
    getPageComparison,
  };
}

/**
 * 数据管理功能
 */
function useDataManagement(setState: React.Dispatch<React.SetStateAction<WebVitalsDiagnosticsState>>) {
  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      historicalReports: [],
    }));
    localStorage.removeItem('webVitalsDiagnostics');
  }, [setState]);

  return { clearHistory };
}

export function useWebVitalsDiagnostics() {
  // 数据持久化hooks
  const { loadHistoricalData, saveToStorage } = useWebVitalsDataPersistence();

  // 获取初始数据
  const initialHistoricalReports = useMemo(
    () => loadHistoricalData(),
    [loadHistoricalData],
  );

  const [state, setState] = useState<WebVitalsDiagnosticsState>({
    currentReport: null,
    historicalReports: initialHistoricalReports,
    isLoading: true,
    error: null,
  });

  // 刷新诊断数据
  const { refreshDiagnostics } = useWebVitalsRefresh(
    setState,
    loadHistoricalData,
    saveToStorage,
  );

  // 分析功能
  const { getPerformanceTrends, getPageComparison } = useAnalysisFunctions(state);

  // 报告导出功能
  const { exportReport } = useReportExport(state, getPerformanceTrends, getPageComparison);

  // 数据管理功能
  const { clearHistory } = useDataManagement(setState);

  // 初始化和自动刷新
  useWebVitalsInitialization(loadHistoricalData, refreshDiagnostics);

  return createDiagnosticsReturn({
    state,
    refreshDiagnostics,
    getPerformanceTrends,
    getPageComparison,
    exportReport,
    clearHistory,
  });
}
