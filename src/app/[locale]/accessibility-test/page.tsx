import { notFound } from 'next/navigation';
import ClientPage from '@/app/[locale]/accessibility-test/ClientPage';
import { generateLocaleStaticParams } from '@/app/[locale]/generate-static-params';

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export default function AccessibilityTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ClientPage />;
}
