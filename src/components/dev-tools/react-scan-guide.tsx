'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button'; // TODO: Add Button usage when needed
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * React Scan 使用指南组件
 *
 * 提供完整的 React Scan 使用指导和最佳实践
 */
export function ReactScanGuide() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quickStart: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection
      [section]: !prev[section], // section 来自内部控制，安全
    }));
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>📚 React Scan 完整使用指南</CardTitle>
          <CardDescription>
            掌握 React Scan 的所有功能，优化你的 React 应用性能
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs
        defaultValue='basics'
        className='w-full'
      >
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='basics'>基础使用</TabsTrigger>
          <TabsTrigger value='colors'>颜色含义</TabsTrigger>
          <TabsTrigger value='debugging'>问题诊断</TabsTrigger>
          <TabsTrigger value='optimization'>优化技巧</TabsTrigger>
          <TabsTrigger value='workflow'>工作流程</TabsTrigger>
        </TabsList>

        <TabsContent
          value='basics'
          className='space-y-4'
        >
          <Card>
            <CardHeader
              className='cursor-pointer hover:bg-gray-50'
              onClick={() => toggleSection('quickStart')}
            >
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>🚀 快速开始</CardTitle>
                {openSections.quickStart ? (
                  <ChevronDown className='h-4 w-4' />
                ) : (
                  <ChevronRight className='h-4 w-4' />
                )}
              </div>
            </CardHeader>
            {openSections.quickStart && (
              <CardContent>
                <div className='space-y-4'>
                  <div>
                    <h4 className='mb-2 font-semibold'>启用/禁用 React Scan</h4>
                    <ul className='space-y-1 text-sm'>
                      <li>
                        •{' '}
                        <kbd className='rounded bg-gray-100 px-2 py-1'>
                          Ctrl+Shift+X
                        </kbd>{' '}
                        - 切换开关
                      </li>
                      <li>• 右下角工具栏显示状态</li>
                      <li>• 控制台会显示状态变化</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='mb-2 font-semibold'>基本使用流程</h4>
                    <ol className='list-inside list-decimal space-y-1 text-sm'>
                      <li>打开开发者工具 (F12)</li>
                      <li>按 Ctrl+Shift+X 启用 React Scan</li>
                      <li>与页面交互，观察组件高亮</li>
                      <li>使用工具栏查看详细信息</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader
              className='cursor-pointer hover:bg-gray-50'
              onClick={() => toggleSection('toolbar')}
            >
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>🔧 工具栏功能</CardTitle>
                {openSections.toolbar ? (
                  <ChevronDown className='h-4 w-4' />
                ) : (
                  <ChevronRight className='h-4 w-4' />
                )}
              </div>
            </CardHeader>
            {openSections.toolbar && (
              <CardContent>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <h4 className='mb-2 font-semibold'>主要功能</h4>
                    <ul className='space-y-1 text-sm'>
                      <li>• 暂停/继续监控</li>
                      <li>• 清除高亮效果</li>
                      <li>• 设置选项</li>
                      <li>• 组件检查器</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='mb-2 font-semibold'>性能数据</h4>
                    <ul className='space-y-1 text-sm'>
                      <li>• 总渲染次数</li>
                      <li>• 组件统计</li>
                      <li>• 性能指标</li>
                      <li>• 渲染历史</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent
          value='colors'
          className='space-y-4'
        >
          <div className='grid gap-4 md:grid-cols-3'>
            <Card className='border-red-200 bg-red-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-red-800'>
                  <div className='h-4 w-4 rounded bg-red-500'></div>
                  红色高亮
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  <p className='font-semibold text-red-700'>不必要渲染</p>
                  <ul className='space-y-1 text-red-600'>
                    <li>• Props 引用变化但值相同</li>
                    <li>• 父组件导致的无意义渲染</li>
                    <li>• 缺少性能优化</li>
                  </ul>
                  <Badge
                    variant='destructive'
                    className='text-xs'
                  >
                    需要优化
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className='border-green-200 bg-green-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-green-800'>
                  <div className='h-4 w-4 rounded bg-green-500'></div>
                  绿色高亮
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  <p className='font-semibold text-green-700'>优化渲染</p>
                  <ul className='space-y-1 text-green-600'>
                    <li>• Props 或 state 确实变化</li>
                    <li>• 渲染是有意义的</li>
                    <li>• 性能优化良好</li>
                  </ul>
                  <Badge
                    variant='default'
                    className='bg-green-600 text-xs'
                  >
                    性能良好
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className='border-yellow-200 bg-yellow-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-yellow-800'>
                  <div className='h-4 w-4 rounded bg-yellow-500'></div>
                  黄色高亮
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  <p className='font-semibold text-yellow-700'>正常渲染</p>
                  <ul className='space-y-1 text-yellow-600'>
                    <li>• 首次渲染</li>
                    <li>• 正常状态更新</li>
                    <li>• 无特殊优化需求</li>
                  </ul>
                  <Badge
                    variant='secondary'
                    className='text-xs'
                  >
                    正常状态
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value='debugging'
          className='space-y-4'
        >
          <Card>
            <CardHeader>
              <CardTitle>🐛 常见性能问题诊断</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div>
                  <h4 className='mb-3 font-semibold text-red-700'>
                    问题 1: 频繁的红色高亮
                  </h4>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div>
                      <h5 className='mb-2 font-medium'>诊断步骤</h5>
                      <pre className='overflow-x-auto rounded bg-gray-100 p-3 text-xs'>
                        {`// 检查 props 变化
console.log('Props:', props);

// 检查依赖优化
const memoized = useMemo(() => {
  return calculate(data);
}, [data]);`}
                      </pre>
                    </div>
                    <div>
                      <h5 className='mb-2 font-medium'>解决方案</h5>
                      <ul className='space-y-1 text-sm'>
                        <li>• 使用 React.memo</li>
                        <li>• 使用 useMemo 缓存计算</li>
                        <li>• 使用 useCallback 缓存函数</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='mb-3 font-semibold text-red-700'>
                    问题 2: 大量组件同时渲染
                  </h4>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div>
                      <h5 className='mb-2 font-medium'>诊断步骤</h5>
                      <pre className='overflow-x-auto rounded bg-gray-100 p-3 text-xs'>
                        {`// 检查状态提升
const [global, setGlobal] = useState();

// 考虑状态分割
const [local, setLocal] = useState();`}
                      </pre>
                    </div>
                    <div>
                      <h5 className='mb-2 font-medium'>解决方案</h5>
                      <ul className='space-y-1 text-sm'>
                        <li>• 状态下沉到最小范围</li>
                        <li>• Context Provider 分割</li>
                        <li>• 使用状态管理库</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='mb-3 font-semibold text-red-700'>
                    问题 3: 列表渲染性能问题
                  </h4>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div>
                      <h5 className='mb-2 font-medium'>诊断步骤</h5>
                      <pre className='overflow-x-auto rounded bg-gray-100 p-3 text-xs'>
                        {`// 检查 key 属性
{items.map(item => (
  <Item key={item.id} data={item} />
))}`}
                      </pre>
                    </div>
                    <div>
                      <h5 className='mb-2 font-medium'>解决方案</h5>
                      <ul className='space-y-1 text-sm'>
                        <li>• 使用稳定的 key 值</li>
                        <li>• 列表项使用 React.memo</li>
                        <li>• 避免渲染中创建新对象</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value='optimization'
          className='space-y-4'
        >
          <Card>
            <CardHeader>
              <CardTitle>💡 优化最佳实践</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div>
                  <h4 className='mb-3 font-semibold text-green-700'>
                    ✅ 优化的组件模式
                  </h4>
                  <pre className='overflow-x-auto rounded border border-green-200 bg-green-50 p-4 text-xs'>
                    {`const OptimizedComponent = React.memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return processData(data);
  }, [data]);

  const handleAction = useCallback((id) => {
    onAction(id);
  }, [onAction]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onAction={handleAction} />
      ))}
    </div>
  );
});`}
                  </pre>
                </div>

                <div>
                  <h4 className='mb-3 font-semibold text-red-700'>
                    ❌ 未优化的组件模式
                  </h4>
                  <pre className='overflow-x-auto rounded border border-red-200 bg-red-50 p-4 text-xs'>
                    {`const UnoptimizedComponent = ({ data, onAction }) => {
  // 每次渲染都重新计算
  const processedData = processData(data);

  // 每次渲染都创建新函数
  const handleAction = (id) => onAction(id);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onAction={handleAction} />
      ))}
    </div>
  );
};`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value='workflow'
          className='space-y-4'
        >
          <div className='grid gap-4 md:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle className='text-blue-700'>1. 开发阶段</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className='list-inside list-decimal space-y-2 text-sm'>
                  <li>启用 React Scan</li>
                  <li>基础交互测试</li>
                  <li>识别红色高亮</li>
                  <li>记录问题组件</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-green-700'>2. 优化验证</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className='list-inside list-decimal space-y-2 text-sm'>
                  <li>应用优化方案</li>
                  <li>重新测试交互</li>
                  <li>对比优化结果</li>
                  <li>性能测量确认</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-purple-700'>3. 持续监控</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className='list-inside list-decimal space-y-2 text-sm'>
                  <li>定期性能检查</li>
                  <li>新功能回归测试</li>
                  <li>团队培训推广</li>
                  <li>性能预算设置</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>📈 性能优化检查清单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <h4 className='mb-2 font-semibold'>基础检查</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>□ 启用 React Scan 监控</li>
                    <li>□ 识别红色高亮组件</li>
                    <li>□ 检查 props 变化原因</li>
                    <li>□ 添加适当的 memo 优化</li>
                  </ul>
                </div>
                <div>
                  <h4 className='mb-2 font-semibold'>高级优化</h4>
                  <ul className='space-y-1 text-sm'>
                    <li>□ 使用 useMemo 缓存计算</li>
                    <li>□ 使用 useCallback 缓存函数</li>
                    <li>□ 验证优化效果</li>
                    <li>□ 测量实际性能改善</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
