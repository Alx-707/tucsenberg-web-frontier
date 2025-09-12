/**
 * 手动测试指南组件
 */
export function ManualTestGuide() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        手动测试指南
      </h2>
      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-medium text-gray-900">1. Tab 键导航测试</h3>
          <p className="text-gray-600 text-sm">
            使用 Tab 键在导航元素间循环，确保焦点顺序合理且可见
          </p>
        </div>
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-medium text-gray-900">2. Enter/Space 键激活测试</h3>
          <p className="text-gray-600 text-sm">
            聚焦到下拉菜单触发器，按 Enter 或 Space 键打开菜单
          </p>
        </div>
        <div className="border-l-4 border-yellow-500 pl-4">
          <h3 className="font-medium text-gray-900">3. Escape 键关闭测试</h3>
          <p className="text-gray-600 text-sm">
            打开下拉菜单后，按 Escape 键关闭菜单
          </p>
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="font-medium text-gray-900">4. 方向键导航测试</h3>
          <p className="text-gray-600 text-sm">
            在下拉菜单中使用上下方向键在菜单项间导航
          </p>
        </div>
      </div>
    </div>
  );
}
