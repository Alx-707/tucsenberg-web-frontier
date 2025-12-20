import { notFound } from 'next/navigation';
import ClientPage from '@/app/[locale]/accessibility-test/ClientPage';
import { generateLocaleStaticParams } from '@/app/[locale]/generate-static-params';

// 为了让 Cache Components 在 "/[locale]/accessibility-test" 路由上
// 将 `params` 视为静态样本（而不是 runtime data），
// 需要为该路由显式提供 `generateStaticParams`。
// 这样上游的 LocaleLayout 在访问 `params` 时不会触发
// "Uncached data was accessed outside of <Suspense>" 错误。
export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export default function AccessibilityTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ClientPage />;
}
