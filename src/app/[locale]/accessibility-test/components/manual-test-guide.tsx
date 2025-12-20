/**
 * 手动测试指南组件
 */
export function ManualTestGuide() {
  return (
    <div className='mb-8 rounded-lg border bg-white p-6 shadow-sm'>
      <h2 className='mb-4 text-xl font-semibold text-gray-900'>手动测试指南</h2>
      <div className='space-y-4'>
        <div className='border-l-4 border-blue-500 pl-4'>
          <h3 className='font-medium text-gray-900'>1. Tab 键导航测试</h3>
          <p className='text-sm text-gray-600'>
            使用 Tab 键在导航元素间循环，确保焦点顺序合理且可见
          </p>
        </div>
        <div className='border-l-4 border-green-500 pl-4'>
          <h3 className='font-medium text-gray-900'>
            2. Enter/Space 键激活测试
          </h3>
          <p className='text-sm text-gray-600'>
            聚焦到下拉菜单触发器，按 Enter 或 Space 键打开菜单
          </p>
        </div>
        <div className='border-l-4 border-yellow-500 pl-4'>
          <h3 className='font-medium text-gray-900'>3. Escape 键关闭测试</h3>
          <p className='text-sm text-gray-600'>
            打开下拉菜单后，按 Escape 键关闭菜单
          </p>
        </div>
        <div className='border-l-4 border-purple-500 pl-4'>
          <h3 className='font-medium text-gray-900'>4. 方向键导航测试</h3>
          <p className='text-sm text-gray-600'>
            在下拉菜单中使用上下方向键在菜单项间导航
          </p>
        </div>
      </div>
    </div>
  );
}
