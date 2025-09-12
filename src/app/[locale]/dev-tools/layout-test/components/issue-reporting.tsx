/**
 * 问题报告组件
 */
import { Card } from '@/components/ui/card';

export function IssueReporting() {
  return (
    <Card className='mt-6 p-6'>
      <h2 className='mb-4 text-xl font-semibold'>🐛 问题报告</h2>
      <div className='text-muted-foreground text-sm'>
        <p className='mb-2'>如果发现以下问题，请检查开发工具定位系统：</p>
        <ul className='list-inside list-disc space-y-1'>
          <li>开发工具重叠或遮挡</li>
          <li>工具显示在错误的位置</li>
          <li>快捷键不响应</li>
          <li>工具无法折叠或展开</li>
          <li>布局在不同屏幕尺寸下异常</li>
        </ul>
      </div>
    </Card>
  );
}
