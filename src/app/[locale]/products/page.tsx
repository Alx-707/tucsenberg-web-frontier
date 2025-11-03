import type { Metadata } from 'next';
import { getTranslationsCached } from '@/lib/i18n/server/getTranslationsCached';
import { UnderConstruction } from '@/components/shared/under-construction';
import { generateLocaleStaticParams } from '@/app/[locale]/generate-static-params';
import { ONE } from '@/constants';

export const revalidate = 86400;

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface ProductsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslationsCached({
    locale,
    namespace: 'underConstruction.pages.products',
  });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ProductsPage() {
  return (
    <UnderConstruction
      pageType='products'
      currentStep={ONE}
      expectedDateKey='dates.q2_2024'
      showProgress={true}
    />
  );
}
