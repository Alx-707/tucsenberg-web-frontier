/**
 * React Scan 介绍组件
 */
import { Card } from '@/components/ui/card';

export function ReactScanIntro() {
  return (
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
  );
}
