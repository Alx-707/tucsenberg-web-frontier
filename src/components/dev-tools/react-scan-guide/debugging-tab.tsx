import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * React Scan 问题诊断标签页
 */
export function DebuggingTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 常见性能问题诊断</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                过度渲染问题
              </h4>
              <div className="space-y-2">
                <div>
                  <Badge variant="destructive" className="mb-2">症状</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 组件显示红色边框</li>
                    <li>• 渲染次数异常高 (10+ 次/秒)</li>
                    <li>• 页面响应缓慢</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">可能原因</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 在渲染函数中创建新对象/数组</li>
                    <li>• 缺少 useMemo/useCallback 优化</li>
                    <li>• 不必要的 state 更新</li>
                    <li>• 父组件频繁重新渲染</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="default" className="mb-2">解决方案</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 使用 React.memo 包装组件</li>
                    <li>• 优化 props 传递，避免内联对象</li>
                    <li>• 合理使用 useMemo/useCallback</li>
                    <li>• 检查 useEffect 依赖项</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                渲染时间过长
              </h4>
              <div className="space-y-2">
                <div>
                  <Badge variant="destructive" className="mb-2">症状</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 单次渲染时间 &gt; 33ms</li>
                    <li>• 用户交互有明显延迟</li>
                    <li>• 动画不流畅</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">可能原因</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 复杂的计算逻辑</li>
                    <li>• 大量 DOM 操作</li>
                    <li>• 深层组件嵌套</li>
                    <li>• 同步的网络请求</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="default" className="mb-2">解决方案</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 使用 useMemo 缓存计算结果</li>
                    <li>• 拆分大组件为小组件</li>
                    <li>• 使用虚拟滚动处理长列表</li>
                    <li>• 异步处理耗时操作</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                内存泄漏问题
              </h4>
              <div className="space-y-2">
                <div>
                  <Badge variant="destructive" className="mb-2">症状</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 页面使用时间越长越卡</li>
                    <li>• 组件卸载后仍有渲染</li>
                    <li>• 浏览器内存持续增长</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">可能原因</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 未清理的定时器</li>
                    <li>• 未取消的网络请求</li>
                    <li>• 事件监听器未移除</li>
                    <li>• 闭包引用未释放</li>
                  </ul>
                </div>
                <div>
                  <Badge variant="default" className="mb-2">解决方案</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• 在 useEffect 清理函数中移除监听器</li>
                    <li>• 使用 AbortController 取消请求</li>
                    <li>• 清理定时器和订阅</li>
                    <li>• 避免在闭包中保存大对象引用</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🛠️ 调试技巧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">使用浏览器开发者工具</h4>
              <ul className="text-sm space-y-1">
                <li>• 打开 Performance 面板录制性能</li>
                <li>• 使用 React DevTools Profiler</li>
                <li>• 查看 Console 中的 React Scan 日志</li>
                <li>• 使用 Memory 面板检查内存使用</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">React Scan 特定功能</h4>
              <ul className="text-sm space-y-1">
                <li>• 点击组件查看详细渲染信息</li>
                <li>• 使用录制功能捕获性能问题</li>
                <li>• 对比不同时间段的性能数据</li>
                <li>• 导出性能报告进行分析</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
