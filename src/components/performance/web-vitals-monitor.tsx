'use client';

import { useEffect } from 'react';
import { webVitalsMonitor } from '@/lib/web-vitals-monitor';
import { MONITORING_INTERVALS } from '@/constants/performance-constants';

/**
 * Web Vitals 性能监控组件（无UI版本）
 *
 * 用于生产环境的静默监控，不显示任何UI，只负责数据收集和上报。
 */
export function WebVitalsMonitor() {
  useEffect(() => {
    // 定期发送性能报告（每5分钟）
    const reportInterval = setInterval(() => {
      webVitalsMonitor.sendReport();
    }, MONITORING_INTERVALS.REPORT_SEND);

    // 页面可见性变化时发送报告
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        webVitalsMonitor.sendReport();
      }
    };

    // 页面卸载前发送最终报告
    const handleBeforeUnload = () => {
      webVitalsMonitor.sendReport();
    };

    // 添加事件监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 组件挂载时发送初始报告
    webVitalsMonitor.sendReport();

    // 清理函数
    return () => {
      clearInterval(reportInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      webVitalsMonitor.sendReport();
    };
  }, []);

  return null;
}
