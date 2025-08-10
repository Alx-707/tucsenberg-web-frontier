'use client';

import { useEffect } from 'react';
import { sendThemeReport, themeAnalytics } from '@/lib/theme-analytics';

/**
 * 主题性能监控组件
 * 负责定期发送性能报告和处理页面卸载时的数据上报
 */
export function ThemePerformanceMonitor() {
  useEffect(() => {
    // 定期发送性能报告（每5分钟）
    const minutesInterval = 5;
    const secondsInMinute = 60;
    const millisecondsInSecond = 1000;
    const reportIntervalMs =
      minutesInterval * secondsInMinute * millisecondsInSecond;
    const reportInterval = setInterval(() => {
      sendThemeReport();
    }, reportIntervalMs);

    // 页面可见性变化时发送报告
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendThemeReport();
      }
    };

    // 页面卸载前发送最终报告
    const handleBeforeUnload = () => {
      sendThemeReport();
    };

    // 添加事件监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 组件挂载时发送初始报告
    sendThemeReport();

    // 清理函数
    return () => {
      clearInterval(reportInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // 组件卸载时发送最终报告
      sendThemeReport();
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
}

/**
 * 主题性能仪表板组件（开发环境使用）
 * 显示实时的主题切换性能统计
 */
export function ThemePerformanceDashboard() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDevelopment) {
      return undefined;
    }

    // 每秒更新一次统计信息
    const updateIntervalMs = 10000; // 每10秒输出一次
    const updateInterval = setInterval(() => {
      const summary = themeAnalytics.getPerformanceSummary();
      const usage = themeAnalytics.getUsageStatistics();

      // 在控制台输出性能统计
      if (summary.totalSwitches > 0) {
        // eslint-disable-next-line no-console
        console.group('🎨 Theme Performance Stats');
        // eslint-disable-next-line no-console
        console.log('📊 Performance Summary:', summary);
        // eslint-disable-next-line no-console
        console.log('📈 Usage Statistics:', usage);
        // eslint-disable-next-line no-console
        console.groupEnd();
      }
    }, updateIntervalMs);

    return () => clearInterval(updateInterval);
  }, [isDevelopment]);

  return null;
}
