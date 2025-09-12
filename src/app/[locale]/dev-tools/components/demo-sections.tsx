/**
 * 演示组件区域
 */
import {
  DynamicReactScanDemo,
  DynamicReactScanStressTest,
} from '@/components/shared/dynamic-imports';

export function DemoSections() {
  return (
    <>
      {/* React Scan 演示 */}
      <div>
        <h2 className='mb-4 text-xl font-semibold'>Performance Demo</h2>
        <DynamicReactScanDemo />
      </div>

      {/* React Scan 压力测试 */}
      <div>
        <h2 className='mb-4 text-xl font-semibold'>Stress Test</h2>
        <DynamicReactScanStressTest />
      </div>
    </>
  );
}
