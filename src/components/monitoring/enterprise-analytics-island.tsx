'use client';

import { logger } from '@/lib/logger';
import { track } from '@vercel/analytics';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((mod) => mod.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: false },
);

export function EnterpriseAnalyticsIsland() {
  const locale = useLocale();
  const isProd = process.env.NODE_ENV === 'production';

  useEffect(() => {
    const RUM_ENABLED =
      process.env.NEXT_PUBLIC_RUM === '1' ||
      process.env.NEXT_PUBLIC_RUM === 'true';
    const ROOT_MARGIN =
      process.env.NEXT_PUBLIC_IDLE_ROOTMARGIN ?? '400px 0px 400px 0px';
    const ZH_FAST =
      process.env.NEXT_PUBLIC_FAST_LCP_ZH === '1' ||
      process.env.NEXT_PUBLIC_FAST_LCP_ZH === 'true';

    // Lazy import web-vitals after hydration
    import('web-vitals')
      .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        const baseDims = () => {
          const nav =
            (performance.getEntriesByType('navigation')[0] as
              | PerformanceNavigationTiming
              | undefined);
          const navType = nav?.type ?? 'navigate';
          type NetworkInformation = { effectiveType?: string };
          type NavigatorWithConnection = Navigator & {
            connection?: NetworkInformation;
          };
          const conn =
            (navigator as NavigatorWithConnection).connection?.effectiveType ??
            'unknown';
          const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
          return {
            locale,
            navType,
            conn,
            device,
            rootMargin: ROOT_MARGIN,
            zhFastLcp: ZH_FAST ? '1' : '0',
          } as const;
        };

        const report = (m: { name: string; value: number; rating: string }) => {
          logger.warn(
            `[Web Vitals] ${m.name}: ${m.value} (${m.rating}) - ${locale}`,
          );
          if (RUM_ENABLED && process.env.NODE_ENV === 'production') {
            try {
              track('web-vital', {
                name: m.name,
                value: Math.round(m.value),
                rating: m.rating,
                ...baseDims(),
              });
            } catch {
              // ignore any analytics error
            }
          }
        };

        onCLS(report);
        onFCP(report);
        onLCP(report);
        onTTFB(report);
        onINP(report);
      })
      .catch((e) => logger.error('Failed to load web-vitals', e));
  }, [locale]);

  return (
    <>
      {isProd && <Analytics />}
      {isProd && <SpeedInsights />}
    </>
  );
}
