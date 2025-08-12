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

// 页面比较类型
export interface PageComparison {
  currentPage: string;
  comparedPage: string;
  metrics: Partial<
    Record<
      keyof DetailedWebVitals,
      {
        current: number;
        compared: number;
        difference: number;
        better: boolean;
      }
    >
  >;
}

// 辅助函数：计算性能趋势
export const calculatePerformanceTrends = (
  historicalReports: DiagnosticReport[],
): PerformanceTrend[] | null => {
  if (historicalReports.length < WEB_VITALS_CONSTANTS.SCORE_DIVISOR)
    return null;

  const recent = historicalReports.slice(
    0,
    WEB_VITALS_CONSTANTS.SCORE_MULTIPLIER_10,
  );
  const older = historicalReports.slice(
    WEB_VITALS_CONSTANTS.SCORE_MULTIPLIER_10,
    WEB_VITALS_CONSTANTS.SCORE_MULTIPLIER_20,
  );

  const getAverage = (
    reports: DiagnosticReport[],
    metric: keyof DetailedWebVitals,
  ) => {
    const validMetrics: (keyof DetailedWebVitals)[] = [
      'lcp',
      'fid',
      'cls',
      'fcp',
      'ttfb',
    ];
    if (!validMetrics.includes(metric)) return 0;

    const values = reports
      .map((report) => {
        // eslint-disable-next-line security/detect-object-injection
        return report.vitals[metric];
      })
      .filter(
        (value): value is number =>
          typeof value === 'number' && !Number.isNaN(value),
      );

    return values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0;
  };

  const metrics: (keyof DetailedWebVitals)[] = [
    'lcp',
    'fid',
    'cls',
    'fcp',
    'ttfb',
  ];

  return metrics.map((metric) => {
    const recentAvg = getAverage(recent, metric);
    const olderAvg = getAverage(older, metric);
    const change = recentAvg - olderAvg;
    const changePercent = olderAvg > 0 ? (change / olderAvg) * 100 : 0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(changePercent) > WEB_VITALS_CONSTANTS.TREND_THRESHOLD) {
      trend = change < 0 ? 'improving' : 'declining';
    }

    return {
      metric,
      trend,
      change: changePercent,
      recent: recentAvg,
      previous: olderAvg,
    };
  });
};

// 辅助函数：生成诊断建议
export const generateRecommendations = (
  vitals: DetailedWebVitals,
): string[] => {
  const recommendations: string[] = [];

  if (vitals.lcp && vitals.lcp > WEB_VITALS_CONSTANTS.LCP_GOOD) {
    recommendations.push('优化LCP：考虑图片压缩、CDN使用或服务器响应时间优化');
  }

  if (vitals.fid && vitals.fid > WEB_VITALS_CONSTANTS.FID_GOOD) {
    recommendations.push('优化FID：减少JavaScript执行时间，考虑代码分割');
  }

  if (vitals.cls && vitals.cls > WEB_VITALS_CONSTANTS.CLS_GOOD) {
    recommendations.push('优化CLS：为图片和广告设置尺寸，避免动态内容插入');
  }

  if (vitals.fcp && vitals.fcp > WEB_VITALS_CONSTANTS.FCP_GOOD) {
    recommendations.push('优化FCP：优化关键渲染路径，减少阻塞资源');
  }

  if (vitals.ttfb && vitals.ttfb > WEB_VITALS_CONSTANTS.TTFB_GOOD) {
    recommendations.push('优化TTFB：优化服务器响应时间，考虑缓存策略');
  }

  return recommendations;
};

// 辅助函数：计算性能分数
export const calculatePerformanceScore = (
  vitals: DetailedWebVitals,
): number => {
  const PERFECT_SCORE = 100;
  const LCP_THRESHOLD_GOOD = 1200;
  const FID_THRESHOLD_GOOD = 50;
  const CLS_THRESHOLD_GOOD = 0.05;

  let score = PERFECT_SCORE;

  // LCP评分 (0-40分)
  if (vitals.lcp) {
    if (vitals.lcp > WEB_VITALS_CONSTANTS.LCP_POOR)
      score -= WEB_VITALS_CONSTANTS.SCORE_WEIGHT_LCP;
    else if (vitals.lcp > WEB_VITALS_CONSTANTS.LCP_GOOD)
      score -= WEB_VITALS_CONSTANTS.SCORE_DEDUCTION_MINOR;
    else if (vitals.lcp > LCP_THRESHOLD_GOOD)
      score -= WEB_VITALS_CONSTANTS.SCORE_DEDUCTION_SMALL;
  }

  // FID评分 (0-30分)
  if (vitals.fid) {
    if (vitals.fid > WEB_VITALS_CONSTANTS.FID_POOR)
      score -= WEB_VITALS_CONSTANTS.SCORE_WEIGHT_FID;
    else if (vitals.fid > WEB_VITALS_CONSTANTS.FID_GOOD)
      score -= WEB_VITALS_CONSTANTS.SCORE_DEDUCTION_MINOR;
    else if (vitals.fid > FID_THRESHOLD_GOOD)
      score -= WEB_VITALS_CONSTANTS.SCORE_DEDUCTION_TINY;
  }

  // CLS评分 (0-30分)
  if (vitals.cls) {
    if (vitals.cls > WEB_VITALS_CONSTANTS.CLS_POOR)
      score -= WEB_VITALS_CONSTANTS.SCORE_WEIGHT_CLS;
    else if (vitals.cls > WEB_VITALS_CONSTANTS.CLS_GOOD)
      score -= WEB_VITALS_CONSTANTS.SCORE_DEDUCTION_MINOR;
    else if (vitals.cls > CLS_THRESHOLD_GOOD)
      score -= WEB_VITALS_CONSTANTS.SCORE_DEDUCTION_TINY;
  }

  return Math.max(0, score);
};

// 辅助函数：识别性能问题
export const identifyPerformanceIssues = (
  vitals: DetailedWebVitals,
): string[] => {
  const issues: string[] = [];

  if (vitals.lcp && vitals.lcp > WEB_VITALS_CONSTANTS.LCP_GOOD) {
    issues.push(`LCP过慢 (${vitals.lcp.toFixed(0)}ms)`);
  }

  if (vitals.fid && vitals.fid > WEB_VITALS_CONSTANTS.FID_GOOD) {
    issues.push(`FID过高 (${vitals.fid.toFixed(0)}ms)`);
  }

  if (vitals.cls && vitals.cls > WEB_VITALS_CONSTANTS.CLS_GOOD) {
    issues.push(
      `CLS过高 (${vitals.cls.toFixed(WEB_VITALS_CONSTANTS.DECIMAL_PLACES)})`,
    );
  }

  if (vitals.fcp && vitals.fcp > WEB_VITALS_CONSTANTS.FCP_GOOD) {
    issues.push(`FCP过慢 (${vitals.fcp.toFixed(0)}ms)`);
  }

  if (vitals.ttfb && vitals.ttfb > WEB_VITALS_CONSTANTS.TTFB_GOOD) {
    issues.push(`TTFB过慢 (${vitals.ttfb.toFixed(0)}ms)`);
  }

  return issues;
};

// 辅助函数：比较页面性能
export const comparePagePerformance = (
  currentReport: DiagnosticReport,
  comparedReport: DiagnosticReport,
): PageComparison => {
  const metrics: (keyof DetailedWebVitals)[] = [
    'lcp',
    'fid',
    'cls',
    'fcp',
    'ttfb',
  ];

  const metricsComparison = {} as PageComparison['metrics'];

  for (const metric of metrics) {
    // eslint-disable-next-line security/detect-object-injection
    const current = Number(currentReport.vitals[metric]) || 0;
    // eslint-disable-next-line security/detect-object-injection
    const compared = Number(comparedReport.vitals[metric]) || 0;
    const difference = current - compared;
    const better = difference < 0; // 数值越小越好

    // eslint-disable-next-line security/detect-object-injection
    metricsComparison[metric] = {
      current,
      compared,
      difference,
      better,
    };
  }

  return {
    currentPage: currentReport.pageUrl,
    comparedPage: comparedReport.pageUrl,
    metrics: metricsComparison,
  };
};

// 辅助函数：计算页面对比数据
export const calculatePageComparison = (
  historicalReports: DiagnosticReport[],
) => {
  // 使用Map避免对象注入安全问题
  const pageGroups = new Map<string, DiagnosticReport[]>();

  historicalReports.forEach((report) => {
    const path = report.pageUrl;

    // 验证路径格式，避免恶意路径
    if (
      typeof path === 'string' &&
      path.length > 0 &&
      path.length < WEB_VITALS_CONSTANTS.MAX_PATH_LENGTH
    ) {
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
          reports.reduce((sum, r) => sum + (r.vitals.lcp || 0), 0) /
          reports.length,
        fid:
          reports.reduce((sum, r) => sum + (r.vitals.fid || 0), 0) /
          reports.length,
        cls:
          reports.reduce((sum, r) => sum + (r.vitals.cls || 0), 0) /
          reports.length,
        fcp:
          reports.reduce((sum, r) => sum + (r.vitals.fcp || 0), 0) /
          reports.length,
        ttfb:
          reports.reduce((sum, r) => sum + (r.vitals.ttfb || 0), 0) /
          reports.length,
      };

      return {
        currentPage: path,
        comparedPage: '',
        metrics: {
          lcp: {
            current: avgMetrics.lcp,
            compared: 0,
            difference: 0,
            better: false,
          },
          fid: {
            current: avgMetrics.fid,
            compared: 0,
            difference: 0,
            better: false,
          },
          cls: {
            current: avgMetrics.cls,
            compared: 0,
            difference: 0,
            better: false,
          },
          fcp: {
            current: avgMetrics.fcp,
            compared: 0,
            difference: 0,
            better: false,
          },
          ttfb: {
            current: avgMetrics.ttfb,
            compared: 0,
            difference: 0,
            better: false,
          },
        },
      };
    })
    .sort((_a, _b) => 0); // 保持原始顺序
};

// 辅助函数：导出报告数据
export const exportReportData = (reports: DiagnosticReport[]) => {
  const data = {
    exportDate: new Date().toISOString(),
    totalReports: reports.length,
    reports: reports.map((report) => ({
      timestamp: report.timestamp,
      date: new Date(report.timestamp).toISOString(),
      pageUrl: report.pageUrl,
      score: report.score,
      vitals: report.vitals,
      issues: report.issues,
      recommendations: report.recommendations,
    })),
  };

  const blob = new Blob(
    [JSON.stringify(data, null, WEB_VITALS_CONSTANTS.JSON_INDENT)],
    {
      type: 'application/json',
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `web-vitals-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
