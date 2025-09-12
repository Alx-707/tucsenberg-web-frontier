/**
 * 其他开发工具信息组件
 */
import { Card } from '@/components/ui/card';

export function OtherDevTools() {
  return (
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
  );
}
