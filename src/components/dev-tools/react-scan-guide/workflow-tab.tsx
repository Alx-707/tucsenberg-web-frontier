import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * React Scan 工作流程标签页
 */
export function WorkflowTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔄 开发工作流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 font-semibold">日常开发流程</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <h5 className="font-medium">开发前准备</h5>
                    <p className="text-sm text-muted-foreground">
                      启用 React Scan，设置基准性能指标
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <h5 className="font-medium">功能开发</h5>
                    <p className="text-sm text-muted-foreground">
                      边开发边观察组件渲染情况，及时发现问题
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <h5 className="font-medium">性能测试</h5>
                    <p className="text-sm text-muted-foreground">
                      完成功能后进行全面的性能测试和优化
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <h5 className="font-medium">代码审查</h5>
                    <p className="text-sm text-muted-foreground">
                      在代码审查中包含性能指标的检查
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">性能问题处理流程</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="mt-1">🔍</Badge>
                  <div>
                    <h5 className="font-medium">问题识别</h5>
                    <p className="text-sm text-muted-foreground">
                      通过 React Scan 发现性能异常的组件
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="mt-1">📊</Badge>
                  <div>
                    <h5 className="font-medium">数据收集</h5>
                    <p className="text-sm text-muted-foreground">
                      记录渲染次数、时间、触发条件等详细信息
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="mt-1">🔧</Badge>
                  <div>
                    <h5 className="font-medium">问题分析</h5>
                    <p className="text-sm text-muted-foreground">
                      分析根本原因，制定优化方案
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="mt-1">✅</Badge>
                  <div>
                    <h5 className="font-medium">验证效果</h5>
                    <p className="text-sm text-muted-foreground">
                      实施优化后验证性能改善效果
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">团队协作建议</h4>
              <div className="space-y-2">
                <div>
                  <Badge variant="secondary" className="mb-1">性能标准</Badge>
                  <p className="text-sm text-muted-foreground">
                    建立团队统一的性能标准和检查清单
                  </p>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1">知识分享</Badge>
                  <p className="text-sm text-muted-foreground">
                    定期分享性能优化经验和最佳实践
                  </p>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1">工具培训</Badge>
                  <p className="text-sm text-muted-foreground">
                    确保团队成员都熟练使用 React Scan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🚀 持续改进</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">性能监控自动化</h4>
              <ul className="text-sm space-y-1">
                <li>• 集成到 CI/CD 流程中</li>
                <li>• 设置性能回归警报</li>
                <li>• 自动生成性能报告</li>
                <li>• 建立性能趋势分析</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">长期优化策略</h4>
              <ul className="text-sm space-y-1">
                <li>• 定期重构性能瓶颈代码</li>
                <li>• 跟踪新的优化技术和工具</li>
                <li>• 建立性能优化知识库</li>
                <li>• 培养团队性能意识</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
