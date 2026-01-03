'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useCookieConsentOptional } from '@/lib/cookie-consent';
import { storeAttributionData } from '@/lib/utm';

const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((mod) => mod.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: false },
);

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function EnterpriseAnalyticsIsland() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProd = process.env.NODE_ENV === 'production';
  const cookieConsent = useCookieConsentOptional();

  const analyticsAllowed = cookieConsent
    ? cookieConsent.ready
      ? cookieConsent.consent.analytics
      : false
    : true;

  const gaEnabled = Boolean(GA_MEASUREMENT_ID) && analyticsAllowed && isProd;

  useEffect(() => {
    storeAttributionData();
  }, []);

  useEffect(() => {
    if (!gaEnabled || typeof window.gtag !== 'function') return;
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', GA_MEASUREMENT_ID!, {
      page_path: url,
      page_location: window.location.href,
    });
  }, [pathname, searchParams, gaEnabled]);

  if (!analyticsAllowed) return null;

  return (
    <>
      {gaEnabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy='afterInteractive'
          />
          <Script
            id='ga4-init'
            strategy='afterInteractive'
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  send_page_view: false
                });
              `,
            }}
          />
        </>
      )}
      {isProd && <Analytics />}
      {isProd && <SpeedInsights />}
    </>
  );
}
