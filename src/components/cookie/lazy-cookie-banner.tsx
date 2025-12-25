'use client';

import dynamic from 'next/dynamic';

interface CookieBannerProps {
  className?: string;
}

const DynamicCookieBanner = dynamic<CookieBannerProps>(
  () =>
    import('@/components/cookie/cookie-banner').then((mod) => mod.CookieBanner),
  { ssr: false, loading: () => null },
);

export function LazyCookieBanner(props: CookieBannerProps) {
  return <DynamicCookieBanner {...props} />;
}
