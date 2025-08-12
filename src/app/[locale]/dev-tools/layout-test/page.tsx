import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * 开发工具布局测试页面
 *
 * 用于测试和验证开发工具的定位系统
 * 显示所有开发工具的布局状态
 */
export default function DevToolsLayoutTestPage() {
  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold">开发工具布局测试</h1>
          <p className="text-muted-foreground">
            此页面仅在开发环境中可用。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">🛠️ 开发工具布局测试</h1>
        <p className="text-muted-foreground">
          此页面用于测试开发工具的定位系统，确保所有工具都能正确显示且不会重叠。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 布局说明 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">📍 布局策略</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span><strong>React Scan Indicator</strong> - 左下角 (优先级 9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span><strong>React Scan Controls</strong> - 右下角 (优先级 8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span><strong>I18n Performance</strong> - 右上角 (优先级 7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span><strong>I18n Indicator</strong> - 左上角 (优先级 6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span><strong>Web Vitals</strong> - 左中 (优先级 5)</span>
            </div>
          </div>
        </Card>

        {/* 快捷键说明 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">⌨️ 快捷键</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>开发工具控制器</span>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                Ctrl+Shift+D
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>React Scan 切换</span>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                Ctrl+Shift+X
              </kbd>
            </div>
          </div>
        </Card>

        {/* 测试说明 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">🧪 测试步骤</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>检查页面四个角落的开发工具是否正确显示</li>
            <li>验证工具之间没有重叠或遮挡</li>
            <li>测试 <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+D</kbd> 打开开发工具控制器</li>
            <li>在控制器中查看所有工具的布局信息</li>
            <li>测试可折叠工具的展开/收起功能</li>
            <li>调整浏览器窗口大小，确保响应式布局正常</li>
          </ol>
        </Card>

        {/* 布局状态 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">📊 当前状态</h2>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              使用开发工具控制器 (Ctrl+Shift+D) 查看实时布局信息
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium mb-1">左上角</div>
                <div className="text-muted-foreground">I18n Indicator</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium mb-1">右上角</div>
                <div className="text-muted-foreground">I18n Performance</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium mb-1">左下角</div>
                <div className="text-muted-foreground">React Scan Indicator</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium mb-1">右下角</div>
                <div className="text-muted-foreground">React Scan Controls</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 测试操作 */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">🎮 测试操作</h2>
        <div className="flex flex-wrap gap-4">
          <div className="text-sm text-muted-foreground">
            <p>使用以下快捷键测试开发工具：</p>
            <ul className="mt-2 space-y-1">
              <li>• <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+D</kbd> - 打开开发工具控制器</li>
              <li>• <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+X</kbd> - 切换 React Scan</li>
              <li>• <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">F5</kbd> - 刷新页面</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 问题报告 */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">🐛 问题报告</h2>
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">如果发现以下问题，请检查开发工具定位系统：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>开发工具重叠或遮挡</li>
            <li>工具显示在错误的位置</li>
            <li>快捷键不响应</li>
            <li>工具无法折叠或展开</li>
            <li>布局在不同屏幕尺寸下异常</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
