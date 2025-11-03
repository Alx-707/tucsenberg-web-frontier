import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UnderConstruction } from '@/components/shared/under-construction';
import { generateLocaleStaticParams } from '@/app/[locale]/generate-static-params';
import { ZERO } from '@/constants';

export const revalidate = 86400;

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface BlogPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'underConstruction.pages.blog',
  });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function BlogPage() {
  return (
    <UnderConstruction
      pageType='blog'
      currentStep={ZERO}
      expectedDateKey='dates.q3_2024'
      showProgress={true}
    />
  );
}
