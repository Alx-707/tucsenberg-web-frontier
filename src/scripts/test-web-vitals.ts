/**
 * Web Vitals 测试脚本
 * 用于模拟和测试性能数据收集
 */

import {
  enhancedWebVitalsCollector,
  type DetailedWebVitals,
} from '@/lib/web-vitals';
import { WEB_VITALS_CONSTANTS } from '@/constants/test-constants';

// 模拟性能数据已移除，使用实际的Web Vitals收集器进行测试

/**
 * 输出性能指标信息
 */
function logPerformanceMetrics(report: DiagnosticReport): void {
  console.log('📊 当前页面性能数据:');
  console.log('URL:', report.metrics.page.url);
  console.log(
    'CLS:',
    report.metrics.cls.toFixed(WEB_VITALS_CONSTANTS.DECIMAL_PLACES_THREE),
  );
  console.log('LCP:', Math.round(report.metrics.lcp), 'ms');
  console.log('FID:', Math.round(report.metrics.fid), 'ms');
  console.log('FCP:', Math.round(report.metrics.fcp), 'ms');
  console.log('TTFB:', Math.round(report.metrics.ttfb), 'ms');
  console.log('总体评分:', report.analysis.score);
}

/**
 * 输出问题和建议
 */
function logIssuesAndRecommendations(report: DiagnosticReport): void {
  if (report.analysis.issues.length > 0) {
    console.log('⚠️ 发现的问题:');
    report.analysis.issues.forEach((issue: string, index: number) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  if (report.analysis.recommendations.length > 0) {
    console.log('💡 优化建议:');
    report.analysis.recommendations.forEach((rec: string, index: number) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

/**
 * 输出设备信息
 */
function logDeviceInfo(report: DiagnosticReport): void {
  console.log('📱 设备信息:');
  console.log('内存:', report.metrics.device.memory || 'N/A', 'GB');
  console.log('CPU 核心:', report.metrics.device.cores || 'N/A');
  console.log(
    '视口:',
    `${report.metrics.device.viewport.width}x${report.metrics.device.viewport.height}`,
  );
}

/**
 * 输出网络信息
 */
function logNetworkInfo(report: DiagnosticReport): void {
  if (report.metrics.connection) {
    console.log('🌐 网络信息:');
    console.log('连接类型:', report.metrics.connection.effectiveType);
    console.log('下行速度:', report.metrics.connection.downlink, 'Mbps');
    console.log('RTT:', report.metrics.connection.rtt, 'ms');
    console.log(
      '省流模式:',
      report.metrics.connection.saveData ? '开启' : '关闭',
    );
  }
}

/**
 * 输出资源加载信息
 */
function logResourceInfo(report: DiagnosticReport): void {
  console.log('📦 资源加载信息:');
  console.log('总资源数:', report.metrics.resourceTiming.totalResources);
  console.log(
    '总大小:',
    Math.round(
      report.metrics.resourceTiming.totalSize /
        WEB_VITALS_CONSTANTS.BYTES_TO_KB_DIVISOR,
    ),
    'KB',
  );
  console.log(
    '慢速资源数:',
    report.metrics.resourceTiming.slowResources.length,
  );

  if (report.metrics.resourceTiming.slowResources.length > 0) {
    console.log('🐌 慢速资源:');
    report.metrics.resourceTiming.slowResources.forEach(
      (resource, index: number) => {
        // 安全的对象属性访问
        const name = Object.prototype.hasOwnProperty.call(resource, 'name')
          ? resource.name
          : 'unknown';
        const duration = Object.prototype.hasOwnProperty.call(
          resource,
          'duration',
        )
          ? resource.duration
          : 0;
        const type = Object.prototype.hasOwnProperty.call(resource, 'type')
          ? resource.type
          : 'unknown';
        console.log(`${index + 1}. ${name} (${duration}ms, ${type})`);
      },
    );
  }
}

// 测试函数
export function testWebVitalsCollection() {
  console.log('🔍 开始 Web Vitals 诊断测试...');

  try {
    // 获取当前性能数据
    const report = enhancedWebVitalsCollector.generateDiagnosticReport();

    // 输出各种信息
    logPerformanceMetrics(report);
    logIssuesAndRecommendations(report);
    logDeviceInfo(report);
    logNetworkInfo(report);
    logResourceInfo(report);

    return report;
  } catch (error) {
    console.error('❌ Web Vitals 测试失败:', error);
    return null;
  }
}

// 诊断报告类型定义
interface DiagnosticReport {
  metrics: DetailedWebVitals;
  analysis: {
    issues: string[];
    recommendations: string[];
    score: number;
  };
}

// 性能分析函数
export function analyzePerformance(report: DiagnosticReport | null) {
  if (!report) return;

  console.log('\n🔬 性能分析结果:');

  // CLS 分析
  if (
    report.metrics.cls > WEB_VITALS_CONSTANTS.CLS_NEEDS_IMPROVEMENT_THRESHOLD
  ) {
    console.log('🔴 CLS 严重问题: 布局偏移过大，用户体验差');
  } else if (report.metrics.cls > WEB_VITALS_CONSTANTS.CLS_GOOD_THRESHOLD) {
    console.log('🟡 CLS 轻微问题: 有一些布局偏移');
  } else {
    console.log('🟢 CLS 良好: 布局稳定');
  }

  // LCP 分析
  if (
    report.metrics.lcp > WEB_VITALS_CONSTANTS.LCP_NEEDS_IMPROVEMENT_THRESHOLD
  ) {
    console.log('🔴 LCP 严重问题: 主要内容加载过慢');
  } else if (report.metrics.lcp > WEB_VITALS_CONSTANTS.LCP_GOOD_THRESHOLD) {
    console.log('🟡 LCP 需要改进: 主要内容加载较慢');
  } else {
    console.log('🟢 LCP 良好: 主要内容加载快速');
  }

  // FID 分析
  if (
    report.metrics.fid > WEB_VITALS_CONSTANTS.FID_NEEDS_IMPROVEMENT_THRESHOLD
  ) {
    console.log('🔴 FID 严重问题: 交互响应延迟严重');
  } else if (report.metrics.fid > 100) {
    console.log('🟡 FID 需要改进: 交互响应有延迟');
  } else {
    console.log('🟢 FID 良好: 交互响应迅速');
  }

  // 总体评分分析
  if (report.analysis.score >= WEB_VITALS_CONSTANTS.SCORE_EXCELLENT_THRESHOLD) {
    console.log('🏆 性能评级: 优秀');
  } else if (
    report.analysis.score >= WEB_VITALS_CONSTANTS.TEST_SCORE_THRESHOLD_GOOD
  ) {
    console.log('🥇 性能评级: 良好');
  } else if (
    report.analysis.score >= WEB_VITALS_CONSTANTS.SCORE_AVERAGE_THRESHOLD
  ) {
    console.log('🥈 性能评级: 一般');
  } else {
    console.log('🥉 性能评级: 需要改进');
  }
}

// 生成性能报告
export function generatePerformanceReport() {
  const report = testWebVitalsCollection();
  if (report) {
    analyzePerformance(report);

    // 保存到 localStorage 用于测试
    try {
      const existingReports = JSON.parse(
        localStorage.getItem('webVitalsDiagnostics') || '[]',
      );
      const updatedReports = [
        report,
        ...existingReports.slice(0, WEB_VITALS_CONSTANTS.REPORT_HISTORY_LIMIT),
      ];
      localStorage.setItem(
        'webVitalsDiagnostics',
        JSON.stringify(updatedReports),
      );
      console.log('✅ 报告已保存到本地存储');
    } catch (error) {
      console.warn('⚠️ 保存报告失败:', error);
    }
  }

  return report;
}

// 在浏览器环境中自动运行
if (typeof window !== 'undefined') {
  // 页面加载完成后运行测试
  if (document.readyState === 'complete') {
    setTimeout(generatePerformanceReport, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(generatePerformanceReport, 1000);
    });
  }
}
