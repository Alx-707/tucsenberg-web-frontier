import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * 组件优化部分
 */
function ComponentOptimization() {
  return (
    <div>
      <h4 className="mb-3 font-semibold">组件优化</h4>
      <div className="space-y-3">
        <div>
          <Badge variant="default" className="mb-2">React.memo</Badge>
          <p className="text-sm text-muted-foreground mb-2">
            防止不必要的重新渲染，特别适用于纯展示组件
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono">
            const MyComponent = React.memo(({`{ name }`}) =&gt; {`{`}<br />
            &nbsp;&nbsp;return &lt;div&gt;{`{name}`}&lt;/div&gt;;<br />
            {`}`});
          </div>
        </div>
        <div>
          <Badge variant="default" className="mb-2">useMemo</Badge>
          <p className="text-sm text-muted-foreground mb-2">
            缓存计算结果，避免重复的昂贵计算
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono">
            const expensiveValue = useMemo(() =&gt; {`{`}<br />
            &nbsp;&nbsp;return heavyCalculation(data);<br />
            {`}`}, [data]);
          </div>
        </div>
        <div>
          <Badge variant="default" className="mb-2">useCallback</Badge>
          <p className="text-sm text-muted-foreground mb-2">
            缓存函数引用，防止子组件不必要的重新渲染
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono">
            const handleClick = useCallback(() =&gt; {`{`}<br />
            &nbsp;&nbsp;setCount(c =&gt; c + 1);<br />
            {`}`}, []);
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 状态管理优化部分
 */
function StateOptimization() {
  return (
    <div>
      <h4 className="mb-3 font-semibold">状态管理优化</h4>
      <div className="space-y-3">
        <div>
          <Badge variant="secondary" className="mb-2">状态分离</Badge>
          <p className="text-sm text-muted-foreground">
            将频繁变化的状态与稳定状态分离，减少不必要的重新渲染
          </p>
        </div>
        <div>
          <Badge variant="secondary" className="mb-2">状态下沉</Badge>
          <p className="text-sm text-muted-foreground">
            将状态移动到最近的公共父组件，避免过度提升状态
          </p>
        </div>
        <div>
          <Badge variant="secondary" className="mb-2">状态规范化</Badge>
          <p className="text-sm text-muted-foreground">
            对于复杂数据结构，使用规范化的状态形式提高更新效率
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 列表渲染优化部分
 */
function ListOptimization() {
  return (
    <div>
      <h4 className="mb-3 font-semibold">列表渲染优化</h4>
      <div className="space-y-3">
        <div>
          <Badge variant="outline" className="mb-2">key 属性</Badge>
          <p className="text-sm text-muted-foreground">
            使用稳定且唯一的 key，帮助 React 识别列表项的变化
          </p>
        </div>
        <div>
          <Badge variant="outline" className="mb-2">虚拟滚动</Badge>
          <p className="text-sm text-muted-foreground">
            对于长列表，只渲染可见区域的项目，大幅提升性能
          </p>
        </div>
        <div>
          <Badge variant="outline" className="mb-2">分页加载</Badge>
          <p className="text-sm text-muted-foreground">
            分批加载数据，避免一次性渲染大量内容
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 代码分割部分
 */
function CodeSplitting() {
  return (
    <div>
      <h4 className="mb-3 font-semibold">代码分割</h4>
      <div className="space-y-3">
        <div>
          <Badge variant="destructive" className="mb-2">React.lazy</Badge>
          <p className="text-sm text-muted-foreground mb-2">
            懒加载组件，减少初始包大小
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono">
            const LazyComponent = React.lazy(() =&gt;<br />
            &nbsp;&nbsp;import(&apos;./LazyComponent&apos;)<br />
            );
          </div>
        </div>
        <div>
          <Badge variant="destructive" className="mb-2">Suspense</Badge>
          <p className="text-sm text-muted-foreground">
            配合 lazy 使用，提供加载状态的优雅处理
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 性能监控建议部分
 */
function PerformanceMonitoring() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📈 性能监控建议</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold">设置性能预算</h4>
            <ul className="text-sm space-y-1">
              <li>• 单个组件渲染时间 &lt; 16ms</li>
              <li>• 页面总渲染时间 &lt; 100ms</li>
              <li>• 交互响应时间 &lt; 50ms</li>
              <li>• 内存使用增长 &lt; 10MB/小时</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">定期性能审查</h4>
            <ul className="text-sm space-y-1">
              <li>• 每周检查 React Scan 报告</li>
              <li>• 关注新增的性能问题</li>
              <li>• 验证优化措施的效果</li>
              <li>• 建立性能回归测试</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * React Scan 优化技巧标签页
 */
export function OptimizationTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">⚡ React 性能优化最佳实践</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <ComponentOptimization />
            <StateOptimization />
            <ListOptimization />
            <CodeSplitting />
          </div>
        </CardContent>
      </Card>
      <PerformanceMonitoring />
    </div>
  );
}
