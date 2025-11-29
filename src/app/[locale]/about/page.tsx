import type { Metadata } from 'next';
import { getTranslationsCached } from '@/lib/i18n/server/getTranslationsCached';
import { UnderConstruction } from '@/components/shared/under-construction';
import { generateLocaleStaticParams } from '@/app/[locale]/generate-static-params';
import { COUNT_PAIR } from '@/constants';

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface AboutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslationsCached({
    locale,
    namespace: 'underConstruction.pages.about',
  });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function AboutPage() {
  return (
    <UnderConstruction
      pageType='about'
      currentStep={COUNT_PAIR}
      expectedDateKey='dates.q2_2024'
      showProgress={true}
    />
  );
}
