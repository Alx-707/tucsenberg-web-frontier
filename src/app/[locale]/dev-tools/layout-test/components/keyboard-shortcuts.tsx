/**
 * 快捷键说明组件
 */
import { Card } from '@/components/ui/card';

export function KeyboardShortcuts() {
  return (
    <Card className='p-6'>
      <h2 className='mb-4 text-xl font-semibold'>⌨️ 快捷键</h2>
      <div className='space-y-2 text-sm'>
        <div className='flex items-center justify-between'>
          <span>开发工具控制器</span>
          <kbd className='rounded bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700'>
            Ctrl+Shift+D
          </kbd>
        </div>
        <div className='flex items-center justify-between'>
          <span>React Scan 切换</span>
          <kbd className='rounded bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700'>
            Ctrl+Shift+X
          </kbd>
        </div>
      </div>
    </Card>
  );
}
