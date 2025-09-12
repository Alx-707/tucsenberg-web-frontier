/**
 * 测试目标组件 - 显示主导航组件
 */
import { MainNavigation } from '@/components/layout/main-navigation';

export function TestTargetSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        测试目标：主导航组件
      </h2>
      <div className="border rounded-lg p-4 bg-gray-50">
        <MainNavigation />
      </div>
    </div>
  );
}
