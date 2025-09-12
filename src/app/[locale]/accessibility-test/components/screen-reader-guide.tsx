/**
 * 屏幕阅读器测试说明组件
 */
export function ScreenReaderGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
      <h2 className="text-xl font-semibold text-blue-900 mb-4">
        屏幕阅读器测试说明
      </h2>
      <div className="text-blue-800 space-y-2">
        <p>• <strong>macOS</strong>: 启用 VoiceOver (Cmd + F5)</p>
        <p>• <strong>Windows</strong>: 使用 NVDA 或 JAWS</p>
        <p>• <strong>Chrome</strong>: 安装 ChromeVox 扩展</p>
        <p>• 验证导航元素的语音播报是否清晰准确</p>
        <p>• 检查菜单状态变化是否被正确播报</p>
      </div>
    </div>
  );
}
