import React, { useCallback } from 'react';
import { TEST_COUNT_CONSTANTS } from '@/constants/test-constants';
import type {
  DiagnosticReport,
  WebVitalsDiagnosticsState,
  WebVitalsReportExport,
  ExportFormat,
} from './web-vitals-diagnostics-types';

/**
 * Web Vitals 报告导出功能
 */

/**
 * 导出JSON格式报告
 */
export function exportJsonReport(data: Record<string, unknown>): void {
  const blob = new Blob(
    [JSON.stringify(data, null, TEST_COUNT_CONSTANTS.SMALL)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `web-vitals-report-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 导出CSV格式报告
 */
export function exportCsvReport(historicalReports: DiagnosticReport[]): void {
  const csvHeaders = [
    'Timestamp',
    'URL',
    'CLS',
    'LCP',
    'FID',
    'FCP',
    'TTFB',
    'Performance Score',
  ];

  const csvRows = historicalReports.map(report => [
    new Date(report.timestamp).toISOString(),
    report.url,
    report.cls.toFixed(3),
    report.lcp.toFixed(0),
    report.fid.toFixed(0),
    report.fcp.toFixed(0),
    report.ttfb.toFixed(0),
    report.performanceScore?.toFixed(1) || 'N/A',
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `web-vitals-report-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 报告导出逻辑Hook
 */
export function useReportExport(
  state: WebVitalsDiagnosticsState,
  getPerformanceTrends: () => unknown,
  getPageComparison: () => unknown,
): WebVitalsReportExport {
  const exportReport = useCallback(
    (format: ExportFormat = 'json') => {
      if (format === 'csv') {
        exportCsvReport(state.historicalReports);
      } else {
        const exportData = {
          currentReport: state.currentReport,
          historicalReports: state.historicalReports,
          performanceTrends: getPerformanceTrends(),
          pageComparison: getPageComparison(),
          exportTimestamp: Date.now(),
          exportVersion: '1.0.0',
        };
        exportJsonReport(exportData);
      }
    },
    [state.currentReport, state.historicalReports, getPerformanceTrends, getPageComparison],
  );

  return { exportReport };
}

/**
 * 生成详细的报告数据
 */
export function generateDetailedReport(
  state: WebVitalsDiagnosticsState,
  performanceTrends: unknown,
  pageComparison: unknown,
): Record<string, unknown> {
  return {
    summary: {
      totalReports: state.historicalReports.length,
      latestReport: state.currentReport,
      averageMetrics: calculateAverageMetrics(state.historicalReports),
      exportTimestamp: Date.now(),
    },
    currentReport: state.currentReport,
    historicalReports: state.historicalReports,
    analysis: {
      performanceTrends,
      pageComparison,
      insights: generateInsights(state.historicalReports),
    },
    metadata: {
      version: '1.0.0',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    },
  };
}

/**
 * 计算平均指标
 */
function calculateAverageMetrics(reports: DiagnosticReport[]): Record<string, number> {
  if (reports.length === 0) {
    return {
      cls: 0,
      lcp: 0,
      fid: 0,
      fcp: 0,
      ttfb: 0,
      performanceScore: 0,
    };
  }

  const totals = reports.reduce(
    (acc, report) => ({
      cls: acc.cls + report.cls,
      lcp: acc.lcp + report.lcp,
      fid: acc.fid + report.fid,
      fcp: acc.fcp + report.fcp,
      ttfb: acc.ttfb + report.ttfb,
      performanceScore: acc.performanceScore + (report.performanceScore || 0),
    }),
    { cls: 0, lcp: 0, fid: 0, fcp: 0, ttfb: 0, performanceScore: 0 },
  );

  const count = reports.length;
  return {
    cls: totals.cls / count,
    lcp: totals.lcp / count,
    fid: totals.fid / count,
    fcp: totals.fcp / count,
    ttfb: totals.ttfb / count,
    performanceScore: totals.performanceScore / count,
  };
}

/**
 * 生成性能洞察
 */
function generateInsights(reports: DiagnosticReport[]): string[] {
  const insights: string[] = [];
  
  if (reports.length === 0) {
    return ['No data available for analysis'];
  }

  const averages = calculateAverageMetrics(reports);
  
  // CLS 分析
  if (averages.cls > 0.25) {
    insights.push('High Cumulative Layout Shift detected. Consider optimizing layout stability.');
  } else if (averages.cls > 0.1) {
    insights.push('Moderate Cumulative Layout Shift. Room for improvement in layout stability.');
  }

  // LCP 分析
  if (averages.lcp > 4000) {
    insights.push('Slow Largest Contentful Paint. Consider optimizing loading performance.');
  } else if (averages.lcp > 2500) {
    insights.push('Moderate Largest Contentful Paint. Some optimization opportunities exist.');
  }

  // FID 分析
  if (averages.fid > 300) {
    insights.push('High First Input Delay. Consider optimizing JavaScript execution.');
  } else if (averages.fid > 100) {
    insights.push('Moderate First Input Delay. Some interactivity improvements possible.');
  }

  // 趋势分析
  if (reports.length >= 5) {
    const recent = reports.slice(-5);
    const older = reports.slice(0, -5);
    
    if (older.length > 0) {
      const recentAvg = calculateAverageMetrics(recent);
      const olderAvg = calculateAverageMetrics(older);
      
      if (recentAvg.performanceScore > olderAvg.performanceScore) {
        insights.push('Performance is improving over time.');
      } else if (recentAvg.performanceScore < olderAvg.performanceScore) {
        insights.push('Performance is declining over time. Consider investigating recent changes.');
      }
    }
  }

  if (insights.length === 0) {
    insights.push('Performance metrics are within acceptable ranges.');
  }

  return insights;
}

/**
 * 导出为Excel格式（XLSX）
 */
export function exportExcelReport(historicalReports: DiagnosticReport[]): void {
  // 创建简化的Excel格式（实际上是CSV，但可以被Excel打开）
  const headers = [
    'Date',
    'Time',
    'URL',
    'CLS',
    'LCP (ms)',
    'FID (ms)',
    'FCP (ms)',
    'TTFB (ms)',
    'Performance Score',
    'Status',
  ];

  const rows = historicalReports.map(report => {
    const date = new Date(report.timestamp);
    const status = getPerformanceStatus(report);
    
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      report.url,
      report.cls.toFixed(3),
      report.lcp.toFixed(0),
      report.fid.toFixed(0),
      report.fcp.toFixed(0),
      report.ttfb.toFixed(0),
      report.performanceScore?.toFixed(1) || 'N/A',
      status,
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `web-vitals-report-${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 获取性能状态
 */
function getPerformanceStatus(report: DiagnosticReport): string {
  const score = report.performanceScore || 0;
  
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}
