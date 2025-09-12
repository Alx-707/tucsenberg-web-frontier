/**
 * 测试操作组件
 */
import { Card } from '@/components/ui/card';

export function TestOperations() {
  return (
    <Card className='mt-6 p-6'>
      <h2 className='mb-4 text-xl font-semibold'>🎮 测试操作</h2>
      <div className='flex flex-wrap gap-4'>
        <div className='text-muted-foreground text-sm'>
          <p>使用以下快捷键测试开发工具：</p>
          <ul className='mt-2 space-y-1'>
            <li>
              •{' '}
              <kbd className='rounded bg-gray-200 px-1 dark:bg-gray-700'>
                Ctrl+Shift+D
              </kbd>{' '}
              - 打开开发工具控制器
            </li>
            <li>
              •{' '}
              <kbd className='rounded bg-gray-200 px-1 dark:bg-gray-700'>
                Ctrl+Shift+X
              </kbd>{' '}
              - 切换 React Scan
            </li>
            <li>
              •{' '}
              <kbd className='rounded bg-gray-200 px-1 dark:bg-gray-700'>
                F5
              </kbd>{' '}
              - 刷新页面
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
