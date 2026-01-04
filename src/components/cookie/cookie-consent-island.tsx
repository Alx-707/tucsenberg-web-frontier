'use client';

import { Suspense } from 'react';
import { CookieConsentProvider } from '@/lib/cookie-consent';
import { LazyCookieBanner } from '@/components/cookie/lazy-cookie-banner';
import { EnterpriseAnalyticsIsland } from '@/components/monitoring/enterprise-analytics-island';

/**
 * Cookie Consent Island
 *
 * P0-3 Fix: Wraps only the components that consume CookieConsentContext,
 * avoiding unnecessary context propagation through the entire tree.
 *
 * Consumers:
 * - LazyCookieBanner: displays consent UI
 * - EnterpriseAnalyticsIsland: conditionally loads analytics based on consent
 */
export function CookieConsentIsland() {
  const isProd = process.env.NODE_ENV === 'production';

  return (
    <CookieConsentProvider>
      <Suspense fallback={null}>
        <LazyCookieBanner />
      </Suspense>
      {isProd && <EnterpriseAnalyticsIsland />}
    </CookieConsentProvider>
  );
}
