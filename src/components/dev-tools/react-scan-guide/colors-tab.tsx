import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * React Scan 颜色含义标签页
 */
export function ColorsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎨 颜色编码系统</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 font-semibold">渲染频率指示</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <Badge variant="outline" className="text-green-700">低频渲染</Badge>
                    <span className="text-sm text-muted-foreground">0-2 次/秒</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <Badge variant="outline" className="text-yellow-700">中频渲染</Badge>
                    <span className="text-sm text-muted-foreground">3-5 次/秒</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <Badge variant="outline" className="text-orange-700">高频渲染</Badge>
                    <span className="text-sm text-muted-foreground">6-10 次/秒</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <Badge variant="outline" className="text-red-700">过度渲染</Badge>
                    <span className="text-sm text-muted-foreground">10+ 次/秒</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <Badge variant="outline" className="text-blue-700">初始渲染</Badge>
                    <span className="text-sm text-muted-foreground">首次挂载</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <Badge variant="outline" className="text-purple-700">异步渲染</Badge>
                    <span className="text-sm text-muted-foreground">Suspense/Lazy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <Badge variant="outline" className="text-gray-700">静态组件</Badge>
                    <span className="text-sm text-muted-foreground">无重新渲染</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">性能状态指示</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
                  <Badge variant="outline" className="text-green-700">优秀性能</Badge>
                  <span className="text-sm text-muted-foreground">渲染时间 &lt; 16ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded"></div>
                  <Badge variant="outline" className="text-yellow-700">一般性能</Badge>
                  <span className="text-sm text-muted-foreground">渲染时间 16-33ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-600 rounded"></div>
                  <Badge variant="outline" className="text-red-700">性能问题</Badge>
                  <span className="text-sm text-muted-foreground">渲染时间 &gt; 33ms</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">边框样式含义</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-solid border-blue-500"></div>
                  <Badge variant="outline">实线边框</Badge>
                  <span className="text-sm text-muted-foreground">正常组件</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dashed border-orange-500"></div>
                  <Badge variant="outline">虚线边框</Badge>
                  <span className="text-sm text-muted-foreground">Memo 组件</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dotted border-purple-500"></div>
                  <Badge variant="outline">点线边框</Badge>
                  <span className="text-sm text-muted-foreground">HOC 包装组件</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-4 border-double border-red-500"></div>
                  <Badge variant="outline">双线边框</Badge>
                  <span className="text-sm text-muted-foreground">问题组件</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 性能指标说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">渲染时间 (Render Time)</h4>
              <p className="text-sm text-muted-foreground">
                组件从开始渲染到完成的时间，包括子组件的渲染时间。
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">渲染次数 (Render Count)</h4>
              <p className="text-sm text-muted-foreground">
                在当前会话中组件被重新渲染的总次数。
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">平均渲染时间 (Avg Render Time)</h4>
              <p className="text-sm text-muted-foreground">
                所有渲染的平均时间，用于评估组件的稳定性能。
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">最大渲染时间 (Max Render Time)</h4>
              <p className="text-sm text-muted-foreground">
                单次渲染的最长时间，用于识别性能峰值。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
