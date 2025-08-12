'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReactScanData {
  isEnabled: boolean;
  totalRenders: number;
  componentsTracked: number;
  lastUpdate: string;
  fiberRoots: Record<string, any>;
  options: any;
  renderHistory: Array<{
    componentName: string;
    renderCount: number;
    lastRender: number;
    isUnnecessary: boolean;
  }>;
}

interface ComponentStats {
  name: string;
  renderCount: number;
  lastRender: number;
  isUnnecessary: boolean;
  averageRenderTime: number;
  totalRenderTime: number;
}

/**
 * React Scan 数据分析器
 * 
 * 提供深入的 React Scan 性能数据分析和可视化
 */
export function ReactScanAnalyzer() {
  const [scanData, setScanData] = useState<ReactScanData | null>(null);
  const [componentStats, setComponentStats] = useState<ComponentStats[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingHistory, setRecordingHistory] = useState<any[]>([]);

  // 读取 React Scan 内部数据
  const readReactScanData = useCallback((): ReactScanData | null => {
    if (typeof window === 'undefined') return null;

    try {
      const reactScan = (window as any).__REACT_SCAN__;
      if (!reactScan) return null;

      const internals = reactScan.ReactScanInternals;
      if (!internals) return null;

      // 分析组件渲染历史
      const renderHistory: any[] = [];
      const fiberRoots = internals.fiberRoots || {};

      Object.entries(fiberRoots).forEach(([key, root]: [string, any]) => {
        if (root && root.renders) {
          root.renders.forEach((render: any) => {
            renderHistory.push({
              componentName: render.fiber?.type?.name || render.fiber?.elementType?.name || 'Unknown',
              renderCount: render.count || 1,
              lastRender: render.time || Date.now(),
              isUnnecessary: render.unnecessary || false,
            });
          });
        }
      });

      return {
        isEnabled: internals.options?.enabled || false,
        totalRenders: internals.totalRenders || 0,
        componentsTracked: Object.keys(fiberRoots).length,
        lastUpdate: new Date().toLocaleTimeString(),
        fiberRoots,
        options: internals.options || {},
        renderHistory,
      };
    } catch (error) {
      console.warn('Failed to read React Scan data:', error);
      return null;
    }
  }, []);

  // 分析组件统计数据
  const analyzeComponentStats = useCallback((data: ReactScanData): ComponentStats[] => {
    const statsMap = new Map<string, ComponentStats>();

    data.renderHistory.forEach((render) => {
      const existing = statsMap.get(render.componentName);
      if (existing) {
        existing.renderCount += render.renderCount;
        existing.lastRender = Math.max(existing.lastRender, render.lastRender);
        if (render.isUnnecessary) {
          existing.isUnnecessary = true;
        }
      } else {
        statsMap.set(render.componentName, {
          name: render.componentName,
          renderCount: render.renderCount,
          lastRender: render.lastRender,
          isUnnecessary: render.isUnnecessary,
          averageRenderTime: 0,
          totalRenderTime: 0,
        });
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.renderCount - a.renderCount);
  }, []);

  // 更新数据
  const updateData = useCallback(() => {
    const data = readReactScanData();
    if (data) {
      setScanData(data);
      setComponentStats(analyzeComponentStats(data));

      if (isRecording) {
        setRecordingHistory(prev => [...prev, {
          timestamp: Date.now(),
          totalRenders: data.totalRenders,
          componentsTracked: data.componentsTracked,
        }]);
      }
    }
  }, [readReactScanData, analyzeComponentStats, isRecording]);

  // 切换 React Scan 状态
  const toggleReactScan = useCallback(async () => {
    try {
      const reactScan = (window as any).__REACT_SCAN__;
      if (reactScan && reactScan.ReactScanInternals) {
        const currentEnabled = reactScan.ReactScanInternals.options?.enabled || false;
        
        // 模拟切换（实际的切换逻辑在 ReactScanProvider 中）
        const event = new KeyboardEvent('keydown', {
          key: 'x',
          ctrlKey: true,
          shiftKey: true,
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.warn('Failed to toggle React Scan:', error);
    }
  }, []);

  // 开始/停止记录
  const toggleRecording = useCallback(() => {
    setIsRecording(prev => {
      if (!prev) {
        setRecordingHistory([]);
      }
      return !prev;
    });
  }, []);

  // 导出数据
  const exportData = useCallback(() => {
    const exportData = {
      scanData,
      componentStats,
      recordingHistory,
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `react-scan-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [scanData, componentStats, recordingHistory]);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, [updateData]);

  if (!scanData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔍 React Scan 分析器</CardTitle>
          <CardDescription>正在加载 React Scan 数据...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            请确保 React Scan 已启用。如果问题持续，请按 Ctrl+Shift+X 切换 React Scan。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle>🎛️ React Scan 控制面板</CardTitle>
          <CardDescription>管理 React Scan 监控和数据记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={toggleReactScan} variant={scanData.isEnabled ? 'destructive' : 'default'}>
              {scanData.isEnabled ? '禁用' : '启用'} React Scan
            </Button>
            <Button onClick={toggleRecording} variant={isRecording ? 'destructive' : 'outline'}>
              {isRecording ? '停止记录' : '开始记录'}
            </Button>
            <Button onClick={exportData} variant="secondary">
              导出数据
            </Button>
            <Button onClick={updateData} variant="ghost">
              刷新数据
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 数据标签页 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="components">组件分析</TabsTrigger>
          <TabsTrigger value="performance">性能指标</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">状态</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={scanData.isEnabled ? 'default' : 'secondary'}>
                  {scanData.isEnabled ? '启用' : '禁用'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总渲染次数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.totalRenders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">跟踪组件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scanData.componentsTracked}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">记录状态</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={isRecording ? 'destructive' : 'secondary'}>
                  {isRecording ? '记录中' : '未记录'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>组件渲染统计</CardTitle>
              <CardDescription>按渲染次数排序的组件列表</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {componentStats.length === 0 ? (
                  <p className="text-gray-500">暂无组件数据</p>
                ) : (
                  componentStats.slice(0, 10).map((component, index) => (
                    <div key={component.name} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono">{index + 1}</span>
                        <span className="font-medium">{component.name}</span>
                        {component.isUnnecessary && (
                          <Badge variant="destructive" className="text-xs">
                            不必要渲染
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{component.renderCount} 次</div>
                        <div className="text-xs text-gray-500">
                          {new Date(component.lastRender).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>性能指标</CardTitle>
              <CardDescription>React Scan 性能监控数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">配置选项</h4>
                  <pre className="mt-2 rounded bg-gray-100 p-3 text-sm">
                    {JSON.stringify(scanData.options, null, 2)}
                  </pre>
                </div>
                
                {recordingHistory.length > 0 && (
                  <div>
                    <h4 className="font-semibold">记录历史 ({recordingHistory.length} 条记录)</h4>
                    <div className="mt-2 max-h-40 overflow-y-auto rounded border">
                      {recordingHistory.slice(-10).map((record, index) => (
                        <div key={index} className="border-b p-2 text-sm">
                          <span className="font-mono">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </span>
                          {' - '}
                          渲染: {record.totalRenders}, 组件: {record.componentsTracked}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>React Scan 设置</CardTitle>
              <CardDescription>当前 React Scan 配置和使用说明</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">快捷键</h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• <kbd className="rounded bg-gray-100 px-2 py-1">Ctrl+Shift+X</kbd> - 切换 React Scan</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold">颜色含义</h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• <span className="inline-block h-3 w-3 rounded bg-red-500"></span> 红色 - 不必要的渲染</li>
                    <li>• <span className="inline-block h-3 w-3 rounded bg-green-500"></span> 绿色 - 优化的渲染</li>
                    <li>• <span className="inline-block h-3 w-3 rounded bg-yellow-500"></span> 黄色 - 正常渲染</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">使用建议</h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• 关注红色高亮的组件，这些可能需要优化</li>
                    <li>• 使用 React.memo、useMemo、useCallback 来减少不必要渲染</li>
                    <li>• 检查组件的 props 是否频繁变化</li>
                    <li>• 避免在渲染过程中创建新对象或函数</li>
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
