import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/types/content.types';
import {
  getAllProductsCached,
  getProductCategoriesCached,
} from '@/lib/content/products';
import {
  generateMetadataForPath,
  type Locale as SeoLocale,
} from '@/lib/seo-metadata';
import { ProductGrid } from '@/components/products';
import { ProductCategoryFilter } from '@/app/[locale]/products/product-category-filter';

// Note: generateStaticParams removed - this page uses searchParams (dynamic)
// which is incompatible with static generation under Cache Components mode

interface ProductsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    category?: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'products',
  });

  return generateMetadataForPath({
    locale: locale as SeoLocale,
    pageType: 'products',
    path: '/products',
    config: {
      title: t('pageTitle'),
      description: t('pageDescription'),
    },
  });
}

function ProductsLoadingSkeleton() {
  return (
    <div className='animate-pulse'>
      <div className='mb-8 flex gap-2'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-10 w-24 rounded-md bg-muted'
          />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className='h-64 rounded-lg bg-muted'
          />
        ))}
      </div>
    </div>
  );
}

async function ProductsContent({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const t = await getTranslations({
    locale,
    namespace: 'products',
  });

  const productOptions = category !== undefined ? { category } : {};
  const [products, categories] = await Promise.all([
    getAllProductsCached(locale as Locale, productOptions),
    getProductCategoriesCached(locale as Locale),
  ]);

  const linkPrefix = `/${locale}/products`;

  const cardLabels = {
    moq: t('card.moq'),
    leadTime: t('card.leadTime'),
    supplyCapacity: t('card.supplyCapacity'),
    featured: t('featured'),
  };

  return (
    <>
      {categories.length > 0 && (
        <ProductCategoryFilter
          categories={categories}
          currentCategory={category}
          allCategoriesLabel={t('allCategories')}
          className='mb-8'
        />
      )}

      {products.length > 0 ? (
        <ProductGrid
          products={products}
          linkPrefix={linkPrefix}
          labels={cardLabels}
          lg={3}
          md={2}
          sm={1}
          gap={6}
        />
      ) : (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{t('emptyState')}</p>
        </div>
      )}
    </>
  );
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({
    locale,
    namespace: 'products',
  });

  return (
    <main className='container mx-auto px-4 py-8 md:py-12'>
      {/* Page Header */}
      <header className='mb-8 md:mb-12'>
        <h1 className='text-heading mb-4'>{t('pageTitle')}</h1>
        <p className='text-body max-w-2xl text-muted-foreground'>
          {t('pageDescription')}
        </p>
      </header>

      {/* Dynamic Content - wrapped in Suspense for Cache Components */}
      <Suspense fallback={<ProductsLoadingSkeleton />}>
        <ProductsContent
          locale={locale}
          searchParams={searchParams}
        />
      </Suspense>
    </main>
  );
}
