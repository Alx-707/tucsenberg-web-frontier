/**
 * 屏幕阅读器测试说明组件
 */
export function ScreenReaderGuide() {
  return (
    <div className='mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6'>
      <h2 className='mb-4 text-xl font-semibold text-blue-900'>
        屏幕阅读器测试说明
      </h2>
      <div className='space-y-2 text-blue-800'>
        <p>
          • <strong>macOS</strong>: 启用 VoiceOver (Cmd + F5)
        </p>
        <p>
          • <strong>Windows</strong>: 使用 NVDA 或 JAWS
        </p>
        <p>
          • <strong>Chrome</strong>: 安装 ChromeVox 扩展
        </p>
        <p>• 验证导航元素的语音播报是否清晰准确</p>
        <p>• 检查菜单状态变化是否被正确播报</p>
      </div>
    </div>
  );
}
