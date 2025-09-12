/**
 * 布局策略说明组件
 */
import { Card } from '@/components/ui/card';

export function LayoutStrategy() {
  return (
    <Card className='p-6'>
      <h2 className='mb-4 text-xl font-semibold'>📍 布局策略</h2>
      <div className='space-y-3 text-sm'>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-blue-500'></div>
          <span>
            <strong>React Scan Indicator</strong> - 左下角 (优先级 9)
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-green-500'></div>
          <span>
            <strong>React Scan Controls</strong> - 右下角 (优先级 8)
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-yellow-500'></div>
          <span>
            <strong>I18n Performance</strong> - 右上角 (优先级 7)
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-purple-500'></div>
          <span>
            <strong>I18n Indicator</strong> - 左上角 (优先级 6)
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded-full bg-red-500'></div>
          <span>
            <strong>Web Vitals</strong> - 左中 (优先级 5)
          </span>
        </div>
      </div>
    </Card>
  );
}
