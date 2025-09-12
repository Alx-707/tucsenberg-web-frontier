/**
 * 快捷键参考组件
 */
import { Card } from '@/components/ui/card';

export function KeyboardShortcuts() {
  return (
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
  );
}
