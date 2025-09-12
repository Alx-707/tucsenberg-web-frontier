import { UnderConstructionV2 } from '@/components/shared/under-construction-v2';
import type { Metadata } from 'next';
;

export const metadata: Metadata = {
  title: '建设中页面演示 | Tucsenberg',
  description: '现代化建设中页面组件演示',
};

export default function DemoConstructionPage() {
  return (
    <UnderConstructionV2
      pageType="products"
      currentStep={2}
      expectedDate="2024年第三季度"
      showProgress={true}
      showEmailSubscription={true}
      showSocialLinks={true}
      showFeaturePreview={true}
    />
  );
}
