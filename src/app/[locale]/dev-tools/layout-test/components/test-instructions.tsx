/**
 * 测试说明组件
 */
import { Card } from '@/components/ui/card';

export function TestInstructions() {
  return (
    <Card className='p-6'>
      <h2 className='mb-4 text-xl font-semibold'>🧪 测试步骤</h2>
      <ol className='list-inside list-decimal space-y-2 text-sm'>
        <li>检查页面四个角落的开发工具是否正确显示</li>
        <li>验证工具之间没有重叠或遮挡</li>
        <li>
          测试{' '}
          <kbd className='rounded bg-gray-200 px-1 dark:bg-gray-700'>
            Ctrl+Shift+D
          </kbd>{' '}
          打开开发工具控制器
        </li>
        <li>在控制器中查看所有工具的布局信息</li>
        <li>测试可折叠工具的展开/收起功能</li>
        <li>调整浏览器窗口大小，确保响应式布局正常</li>
      </ol>
    </Card>
  );
}
