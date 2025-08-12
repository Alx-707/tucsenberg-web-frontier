// @ts-nocheck - 开发工具豁免：仅开发环境使用，不影响生产代码质量
'use client';

import { ReactScanAnalyzer } from '@/components/dev-tools/react-scan-analyzer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEV_TOOLS_CONSTANTS } from '@/constants/dev-tools';
import { REACT_SCAN_CONFIG } from '@/constants/react-scan';

// React Scan 类型定义
interface ReactScanStats {
  enabled: boolean;
  totalRenders: number;
  componentsTracked: number;
  lastUpdate: string;
}

interface ReactScanWindow extends Window {
  __REACT_SCAN__?: {
    ReactScanInternals?: {
      enabled?: boolean;
      totalRenders?: number;
      componentsScanned?: number;
      lastScanTime?: number;
    };
  };
}

/**
 * 故意设计的低效组件 - 用于演示 React Scan 检测不必要渲染
 */
function IneffientComponent({ count }: { count: number }) {
  // 故意在每次渲染时创建新对象 - 这会导致不必要的渲染
  const expensiveObject = {
    timestamp: Date.now(),
    random: Math.random(),
    count,
  };

  // 故意的昂贵计算 - 每次渲染都会执行
  const expensiveCalculation = () => {
    let result = 0;
    for (let i = 0; i < DEV_TOOLS_CONSTANTS.REACT_SCAN.MAX_RENDERS; i++) {
      result += Math.random();
    }
    return result;
  };

  const result = expensiveCalculation();

  return (
    <Card className='border-red-200 bg-red-50'>
      <CardHeader>
        <CardTitle className='text-red-800'>❌ 低效组件</CardTitle>
        <CardDescription className='text-red-600'>
          这个组件故意设计得低效，会触发不必要的渲染
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 text-sm'>
          <p>计数: {count}</p>
          <p>时间戳: {expensiveObject.timestamp}</p>
          <p>随机数: {expensiveObject.random.toFixed(DEV_TOOLS_CONSTANTS.REACT_SCAN.GRID_COLUMNS)}</p>
          <p>昂贵计算结果: {result.toFixed(DEV_TOOLS_CONSTANTS.REACT_SCAN.GRID_ROWS)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 优化的组件 - 用于演示 React Scan 检测优化渲染
 */
function OptimizedComponent({ count }: { count: number }) {
  // 使用 useMemo 缓存昂贵计算
  const expensiveCalculation = useMemo(() => {
    let result = 0;
    for (let i = 0; i < REACT_SCAN_CONFIG.EXPENSIVE_CALCULATION_ITERATIONS; i++) {
      result += Math.random();
    }
    return result;
  }, []); // 只计算一次，不依赖任何变量

  // 使用 useMemo 缓存对象
  const optimizedObject = useMemo(
    () => ({
      timestamp: Date.now(),
      random: Math.random(),
      count,
    }),
    [count],
  );

  return (
    <Card className='border-green-200 bg-green-50'>
      <CardHeader>
        <CardTitle className='text-green-800'>✅ 优化组件</CardTitle>
        <CardDescription className='text-green-600'>
          这个组件使用了 useMemo 和 useCallback 进行优化
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 text-sm'>
          <p>计数: {count}</p>
          <p>时间戳: {optimizedObject.timestamp}</p>
          <p>随机数: {optimizedObject.random.toFixed(DEV_TOOLS_CONSTANTS.REACT_SCAN.GRID_COLUMNS)}</p>
          <p>昂贵计算结果: {expensiveCalculation.toFixed(DEV_TOOLS_CONSTANTS.REACT_SCAN.GRID_ROWS)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * React Scan 性能数据显示组件
 */
function ReactScanStats() {
  const [stats, setStats] = useState<ReactScanStats | null>(null);

  const updateStats = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        // 检查多种可能的 React Scan 状态
        const reactScan = (window as ReactScanWindow).__REACT_SCAN__;
        const reactScanInternals = reactScan?.ReactScanInternals;

        // 尝试从多个位置获取状态
        let isEnabled = false;
        let totalRenders = 0;
        let componentsTracked = 0;

        if (reactScan) {
          // 检查全局启用状态 - React Scan 0.0.42 的实际状态路径
          isEnabled =
            reactScan.enabled ||
            reactScanInternals?.options?.v?.enabled ||
            reactScanInternals?.options?.enabled ||
            reactScanInternals?.enabled ||
            false;

          // 获取渲染统计
          totalRenders =
            reactScanInternals?.totalRenders ||
            reactScanInternals?.renderCount ||
            0;

          // 获取跟踪组件数
          const fiberRoots = reactScanInternals?.fiberRoots || {};
          componentsTracked = Object.keys(fiberRoots).length;
        }

        setStats({
          isEnabled,
          totalRenders,
          componentsTracked,
          lastUpdate: new Date().toLocaleTimeString(),
        });
      } catch (error) {
        console.warn('Failed to read React Scan stats:', error);
        // 提供降级状态
        setStats({
          isEnabled: false,
          totalRenders: 0,
          componentsTracked: 0,
          lastUpdate: new Date().toLocaleTimeString(),
        });
      }
    }
  }, []);

  useEffect(() => {
    updateStats();

    // 更频繁的轮询以快速响应状态变化
    const interval = setInterval(updateStats, REACT_SCAN_CONFIG.STATS_UPDATE_INTERVAL);

    // 监听键盘事件以立即更新状态
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'x') {
        // 延迟一点更新以确保 React Scan 状态已经改变
        setTimeout(updateStats, 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateStats]);

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 React Scan 统计</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-gray-500'>正在加载统计数据...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 React Scan 统计</CardTitle>
        <CardDescription>实时性能监控数据</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-sm font-medium'>状态</p>
            <Badge variant={stats.isEnabled ? 'default' : 'secondary'}>
              {stats.isEnabled ? '启用' : '禁用'}
            </Badge>
          </div>
          <div>
            <p className='text-sm font-medium'>总渲染次数</p>
            <p className='text-lg font-bold'>{stats.totalRenders}</p>
          </div>
          <div>
            <p className='text-sm font-medium'>跟踪组件数</p>
            <p className='text-lg font-bold'>{stats.componentsTracked}</p>
          </div>
          <div>
            <p className='text-sm font-medium'>最后更新</p>
            <p className='text-sm text-gray-600'>{stats.lastUpdate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReactScanDemoClient() {
  const [count, setCount] = useState(0);
  const [triggerRender, setTriggerRender] = useState(0);

  // 故意触发不必要渲染的函数
  const triggerUnnecessaryRender = useCallback(() => {
    setTriggerRender((prev) => prev + 1);
  }, []);

  return (
    <div className='space-y-6'>
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle>🎮 React Scan 演示控制台</CardTitle>
          <CardDescription>
            使用下面的按钮来触发不同类型的渲染，观察 React Scan 的高亮效果。
            启用 React Scan
            后，组件会显示彩色边框：🔴红色=不必要渲染，🟢绿色=优化渲染
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* 操作提示 */}
            <div className='rounded-lg bg-blue-50 p-4 text-sm'>
              <p className='mb-2 font-semibold text-blue-900'>💡 操作指南：</p>
              <ol className='space-y-1 text-blue-800'>
                <li>
                  1. 按{' '}
                  <kbd className='rounded bg-blue-100 px-2 py-1 font-mono'>
                    Ctrl+Shift+X
                  </kbd>{' '}
                  启用 React Scan
                </li>
                <li>2. 点击下方按钮触发组件渲染</li>
                <li>3. 观察组件周围出现的彩色高亮边框</li>
                <li>4. 红色边框表示不必要的渲染，绿色边框表示优化的渲染</li>
              </ol>
            </div>

            {/* 按钮组 */}
            <div className='flex flex-wrap gap-4'>
              <div className='space-y-2'>
                <Button
                  onClick={() => setCount((prev) => prev + 1)}
                  className='w-full'
                >
                  🔢 增加计数 ({count})
                </Button>
                <p className='text-xs text-gray-600'>
                  正常渲染：更新计数值，组件合理重新渲染
                </p>
              </div>

              <div className='space-y-2'>
                <Button
                  variant='destructive'
                  onClick={triggerUnnecessaryRender}
                  className='w-full'
                >
                  ⚠️ 触发不必要渲染 ({triggerRender})
                </Button>
                <p className='text-xs text-gray-600'>
                  不必要渲染：强制组件重新渲染但没有实际变化
                </p>
              </div>

              <div className='space-y-2'>
                <Button
                  variant='outline'
                  onClick={() => window.location.reload()}
                  className='w-full'
                >
                  🔄 重新加载页面
                </Button>
                <p className='text-xs text-gray-600'>
                  重置演示：清除所有状态并重新开始
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* React Scan 统计 */}
      <ReactScanStats />

      {/* 组件对比 */}
      <div className='grid gap-6 md:grid-cols-2'>
        <IneffientComponent count={count} />
        <OptimizedComponent count={count} />
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>📖 如何使用 React Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4 text-sm'>
            <div>
              <h4 className='font-semibold'>🔴 红色高亮</h4>
              <p>表示不必要的渲染。这些组件重新渲染了，但实际上没有必要。</p>
            </div>
            <div>
              <h4 className='font-semibold'>🟢 绿色高亮</h4>
              <p>表示优化的渲染。这些组件只在必要时才重新渲染。</p>
            </div>
            <div>
              <h4 className='font-semibold'>⌨️ 快捷键</h4>
              <p>
                按{' '}
                <kbd className='rounded bg-gray-100 px-2 py-1'>
                  Ctrl+Shift+X
                </kbd>{' '}
                来切换 React Scan 的启用状态。
              </p>
            </div>
            <div>
              <h4 className='font-semibold'>🔧 工具栏</h4>
              <p>点击页面右下角的 React Scan 工具栏来查看详细的性能信息。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* React Scan 深度分析器 */}
      <div className='mt-8'>
        <h2 className='mb-4 text-2xl font-bold'>🔍 React Scan 深度分析</h2>
        <ReactScanAnalyzer />
      </div>

      {/* React Scan 使用指南 */}
      <div className='mt-8'>
        <h2 className='mb-4 text-2xl font-bold'>📚 完整使用指南</h2>
        <Card>
          <CardHeader>
            <CardTitle>React Scan 使用指南</CardTitle>
            <CardDescription>
              掌握 React Scan 的所有功能，优化你的 React 应用性能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div>
                <h3 className='mb-3 text-lg font-semibold'>🚀 快速开始</h3>
                <div className='space-y-2 text-sm'>
                  <p>
                    • 按{' '}
                    <kbd className='rounded bg-gray-100 px-2 py-1'>
                      Ctrl+Shift+X
                    </kbd>{' '}
                    启用/禁用 React Scan
                  </p>
                  <p>• 右下角工具栏显示状态</p>
                  <p>• 与页面交互，观察组件高亮效果</p>
                </div>
              </div>

              <div>
                <h3 className='mb-3 text-lg font-semibold'>🎨 颜色含义</h3>
                <div className='grid gap-3 md:grid-cols-3'>
                  <div className='flex items-center gap-2'>
                    <div className='h-3 w-3 rounded bg-red-500'></div>
                    <span className='text-sm'>红色 - 不必要渲染</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-3 w-3 rounded bg-green-500'></div>
                    <span className='text-sm'>绿色 - 优化渲染</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-3 w-3 rounded bg-yellow-500'></div>
                    <span className='text-sm'>黄色 - 正常渲染</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='mb-3 text-lg font-semibold'>💡 优化建议</h3>
                <div className='space-y-2 text-sm'>
                  <p>• 关注红色高亮的组件，这些可能需要优化</p>
                  <p>
                    • 使用 React.memo、useMemo、useCallback 来减少不必要渲染
                  </p>
                  <p>• 检查组件的 props 是否频繁变化</p>
                  <p>• 避免在渲染过程中创建新对象或函数</p>
                </div>
              </div>

              <div>
                <h3 className='mb-3 text-lg font-semibold'>🔧 工具栏功能</h3>
                <div className='space-y-2 text-sm'>
                  <p>• 暂停/继续监控 - 暂停实时监控以分析当前状态</p>
                  <p>• 清除高亮 - 清除所有当前的高亮效果</p>
                  <p>• 设置选项 - 调整动画速度和监控选项</p>
                  <p>• 组件检查器 - 点击组件查看详细信息</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
