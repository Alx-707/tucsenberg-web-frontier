/**
 * 键盘快捷键说明组件
 */
export function KeyboardShortcutsGuide() {
  return (
    <div className='rounded-lg border bg-white p-6 shadow-sm'>
      <h2 className='mb-4 text-xl font-semibold text-gray-900'>
        键盘快捷键说明
      </h2>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>Tab</kbd>
            <span className='text-gray-600'>下一个可聚焦元素</span>
          </div>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>
              Shift + Tab
            </kbd>
            <span className='text-gray-600'>上一个可聚焦元素</span>
          </div>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>Enter</kbd>
            <span className='text-gray-600'>激活链接或按钮</span>
          </div>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>Space</kbd>
            <span className='text-gray-600'>激活按钮</span>
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>Escape</kbd>
            <span className='text-gray-600'>关闭下拉菜单</span>
          </div>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>↑ ↓</kbd>
            <span className='text-gray-600'>菜单项间导航</span>
          </div>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>← →</kbd>
            <span className='text-gray-600'>菜单间切换</span>
          </div>
          <div className='flex items-center space-x-2'>
            <kbd className='rounded bg-gray-100 px-2 py-1 text-sm'>Home</kbd>
            <span className='text-gray-600'>第一个菜单项</span>
          </div>
        </div>
      </div>
    </div>
  );
}
