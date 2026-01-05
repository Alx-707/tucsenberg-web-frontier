import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing-config';

/**
 * Root path handler for Next.js 16 Turbopack compatibility.
 *
 * In Next.js 16 with Turbopack, the middleware matcher may not consistently
 * match the root path `/` even with explicit inclusion. This page ensures
 * reliable redirection to the default locale.
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
