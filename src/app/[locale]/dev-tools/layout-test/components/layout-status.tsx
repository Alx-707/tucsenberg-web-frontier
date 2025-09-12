/**
 * 布局状态组件
 */
import { Card } from '@/components/ui/card';

export function LayoutStatus() {
  return (
    <Card className='p-6'>
      <h2 className='mb-4 text-xl font-semibold'>📊 当前状态</h2>
      <div className='space-y-3'>
        <div className='text-muted-foreground text-sm'>
          使用开发工具控制器 (Ctrl+Shift+D) 查看实时布局信息
        </div>

        <div className='grid grid-cols-2 gap-4 text-xs'>
          <div className='rounded bg-gray-50 p-3 dark:bg-gray-800'>
            <div className='mb-1 font-medium'>左上角</div>
            <div className='text-muted-foreground'>I18n Indicator</div>
          </div>
          <div className='rounded bg-gray-50 p-3 dark:bg-gray-800'>
            <div className='mb-1 font-medium'>右上角</div>
            <div className='text-muted-foreground'>I18n Performance</div>
          </div>
          <div className='rounded bg-gray-50 p-3 dark:bg-gray-800'>
            <div className='mb-1 font-medium'>左下角</div>
            <div className='text-muted-foreground'>
              React Scan Indicator
            </div>
          </div>
          <div className='rounded bg-gray-50 p-3 dark:bg-gray-800'>
            <div className='mb-1 font-medium'>右下角</div>
            <div className='text-muted-foreground'>React Scan Controls</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
