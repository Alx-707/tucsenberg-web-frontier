'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface LazyWebVitalsReporterProps {
  /**
   * 是否启用（默认仅在生产环境启用）
   */
  enabled?: boolean;

  /**
   * 是否在控制台输出（开发环境）
   */
  debug?: boolean;

  /**
   * 采样率（0-1），默认 1.0（100%）
   * 生产环境建议设置为 0.1（10%）以减少请求量
   */
  sampleRate?: number;
}

/**
 * 延迟加载的 Web Vitals Reporter
 *
 * 在首屏渲染完成后才加载 WebVitalsReporter 组件，
 * 避免阻塞首屏 hydration 和 LCP。
 *
 * 优化策略：
 * 1. 使用 useEffect 延迟加载，不阻塞首屏
 * 2. 使用 dynamic import 减少初始 bundle 大小
 * 3. 仅在需要时才加载 web-vitals 库
 *
 * @example
 * ```tsx
 * <LazyWebVitalsReporter
 *   enabled={process.env.NODE_ENV === 'production'}
 *   debug={process.env.NODE_ENV === 'development'}
 *   sampleRate={0.1}
 * />
 * ```
 */
export function LazyWebVitalsReporter({
  enabled = false,
  debug = false,
  sampleRate = 1.0,
}: LazyWebVitalsReporterProps) {
  const [Reporter, setReporter] = useState<React.ComponentType<{
    enabled?: boolean;
    debug?: boolean;
    sampleRate?: number;
  }> | null>(null);

  useEffect(() => {
    // 延迟加载 WebVitalsReporter 组件
    // 使用 requestIdleCallback 在浏览器空闲时加载
    const loadReporter = async () => {
      try {
        const mod =
          await import('@/components/performance/web-vitals-reporter');
        setReporter(() => mod.WebVitalsReporter);
      } catch {
        // 静默失败，不影响用户体验
      }
    };

    if ('requestIdleCallback' in window) {
      const idleCallbackId = requestIdleCallback(
        () => {
          loadReporter().catch((err) => {
            if (debug) {
              logger.error('Failed to load WebVitalsReporter', { error: err });
            }
          });
        },
        { timeout: 2000 },
      );
      return () => cancelIdleCallback(idleCallbackId);
    }

    const timeoutId = setTimeout(() => {
      loadReporter().catch((err) => {
        if (debug) {
          logger.error('Failed to load WebVitalsReporter', { error: err });
        }
      });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [debug]);

  // 在组件加载前不渲染任何内容
  if (!Reporter) {
    return null;
  }

  return (
    <Reporter
      enabled={enabled}
      debug={debug}
      sampleRate={sampleRate}
    />
  );
}
