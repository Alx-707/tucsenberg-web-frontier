// import { useTranslations } from 'next-intl'; // TODO: Add translations when needed
import {
  DynamicReactScanDemo,
  DynamicReactScanStressTest,
} from '@/components/shared/dynamic-imports';
import { Card } from '@/components/ui/card';

/**
 * 开发工具页面
 *
 * 展示各种开发环境工具和演示组件
 * 包括 React Scan 性能监控演示
 */
export default function DevToolsPage() {
  // const t = useTranslations('DevTools');

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='p-8 text-center'>
          <h1 className='mb-4 text-2xl font-bold'>Development Tools</h1>
          <p className='text-muted-foreground'>
            This page is only available in development mode.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='mb-4 text-3xl font-bold'>Development Tools</h1>
        <p className='text-muted-foreground'>
          Tools and utilities for development and performance monitoring.
        </p>
      </div>

      <div className='space-y-8'>
        {/* React Scan 介绍 */}
        <Card className='p-6'>
          <h2 className='mb-4 text-xl font-semibold'>
            🔍 React Scan Performance Monitor
          </h2>
          <div className='space-y-4'>
            <p className='text-muted-foreground'>
              React Scan is a performance monitoring tool that helps identify
              unnecessary re-renders and performance bottlenecks in React
              components.
            </p>

            <div className='rounded-lg bg-blue-50 p-4'>
              <h3 className='mb-2 font-medium'>Getting Started:</h3>
              <ol className='list-inside list-decimal space-y-1 text-sm'>
                <li>
                  Set{' '}
                  <code className='rounded bg-gray-200 px-1'>
                    NEXT_PUBLIC_ENABLE_REACT_SCAN=true
                  </code>{' '}
                  in your .env.local
                </li>
                <li>
                  Restart the development server with{' '}
                  <code className='rounded bg-gray-200 px-1'>
                    pnpm dev:scan
                  </code>
                </li>
                <li>
                  Look for the React Scan indicators in the bottom corners
                </li>
                <li>
                  Use the demo components below to see React Scan in action
                </li>
              </ol>
            </div>

            <div className='rounded-lg bg-yellow-50 p-4'>
              <h3 className='mb-2 font-medium'>Visual Indicators:</h3>
              <ul className='list-inside list-disc space-y-1 text-sm'>
                <li>
                  <span className='text-red-600'>Red highlights</span> =
                  Unnecessary re-renders (needs optimization)
                </li>
                <li>
                  <span className='text-green-600'>Green highlights</span> =
                  Optimized renders
                </li>
                <li>
                  <span className='text-blue-600'>Blue indicator</span> = React
                  Scan is active
                </li>
              </ul>
            </div>
          </div>
        </Card>

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

        {/* 其他开发工具信息 */}
        <Card className='p-6'>
          <h2 className='mb-4 text-xl font-semibold'>
            🛠️ Other Development Tools
          </h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='rounded border p-4'>
              <h3 className='mb-2 font-medium'>Web Vitals Monitor</h3>
              <p className='text-muted-foreground text-sm'>
                Real-time monitoring of Core Web Vitals metrics including CLS,
                FCP, and LCP.
              </p>
            </div>

            <div className='rounded border p-4'>
              <h3 className='mb-2 font-medium'>Theme Performance Monitor</h3>
              <p className='text-muted-foreground text-sm'>
                Tracks theme switching performance and CSS-in-JS optimization.
              </p>
            </div>

            <div className='rounded border p-4'>
              <h3 className='mb-2 font-medium'>I18n Performance Dashboard</h3>
              <p className='text-muted-foreground text-sm'>
                Monitors internationalization performance and translation
                loading times.
              </p>
            </div>

            <div className='rounded border p-4'>
              <h3 className='mb-2 font-medium'>Translation Preloader</h3>
              <p className='text-muted-foreground text-sm'>
                Optimizes translation loading and caching for better
                performance.
              </p>
            </div>
          </div>
        </Card>

        {/* 快捷键参考 */}
        <Card className='p-6'>
          <h2 className='mb-4 text-xl font-semibold'>⌨️ Keyboard Shortcuts</h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <h3 className='mb-2 font-medium'>React Scan</h3>
              <ul className='space-y-1 text-sm'>
                <li>
                  <kbd className='rounded bg-gray-200 px-1'>Ctrl+Shift+X</kbd> -
                  Toggle display
                </li>
                <li>
                  <kbd className='rounded bg-gray-200 px-1'>Ctrl+Shift+C</kbd> -
                  Clear history
                </li>
              </ul>
            </div>

            <div>
              <h3 className='mb-2 font-medium'>Browser DevTools</h3>
              <ul className='space-y-1 text-sm'>
                <li>
                  <kbd className='rounded bg-gray-200 px-1'>F12</kbd> - Open
                  DevTools
                </li>
                <li>
                  <kbd className='rounded bg-gray-200 px-1'>Ctrl+Shift+I</kbd> -
                  Open DevTools
                </li>
                <li>
                  <kbd className='rounded bg-gray-200 px-1'>Ctrl+Shift+J</kbd> -
                  Open Console
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 文档链接 */}
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
      </div>
    </div>
  );
}
