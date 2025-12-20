/**
 * 测试目标组件 - 显示主导航组件
 */
import { VercelNavigationI18n } from '@/components/layout/vercel-navigation-i18n.client';

export function TestTargetSection() {
  return (
    <div className='mb-8 rounded-lg border bg-white p-6 shadow-sm'>
      <h2 className='mb-4 text-xl font-semibold text-gray-900'>
        测试目标：主导航组件
      </h2>
      <div className='rounded-lg border bg-gray-50 p-4'>
        <VercelNavigationI18n />
      </div>
    </div>
  );
}
