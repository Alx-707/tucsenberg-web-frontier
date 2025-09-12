/**
 * 文档链接组件
 */
import { Card } from '@/components/ui/card';

export function DocumentationLinks() {
  return (
    <Card className='p-6'>
      <h2 className='mb-4 text-xl font-semibold'>📚 Documentation</h2>
      <div className='space-y-2'>
        <a
          href='/docs/development/react-scan.md'
          className='block text-blue-600 hover:underline'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Scan Integration Guide
        </a>
        <a
          href='https://github.com/aidenybai/react-scan'
          className='block text-blue-600 hover:underline'
          target='_blank'
          rel='noopener noreferrer'
        >
          React Scan GitHub Repository
        </a>
        <a
          href='/docs/development/performance-monitoring.md'
          className='block text-blue-600 hover:underline'
          target='_blank'
          rel='noopener noreferrer'
        >
          Performance Monitoring Guide
        </a>
      </div>
    </Card>
  );
}
