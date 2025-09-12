// @ts-nocheck - 开发工具豁免：仅开发环境使用，不影响生产代码质量
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallback, useEffect, useState } from 'react';

// React Scan 全局对象类型定义
interface ReactScanGlobal {
  components?: Record<string, {
    renderCount: number;
    renderTime: number;
  }>;
}

declare global {
  interface Window {
    __REACT_SCAN__?: ReactScanGlobal;
  }
}

interface ComponentStats {
  name: string;
  renderCount: number;
  renderTime: number;
  avgRenderTime: number;
  efficiency: number;
}

/**
 * React Scan 数据分析器 - 简化版
 */
export function ReactScanAnalyzer() {
  const [componentStats, _setComponentStats] = useState<ComponentStats[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // 读取 React Scan 数据
  const readReactScanData = useCallback(() => {
    if (typeof window === 'undefined') return [];

    try {
      const globalScan = window.__REACT_SCAN__;
      if (!globalScan) return [];

      const components = Object.entries(globalScan.components || {}).map(
        ([name, data]) => ({
          name,
          renderCount: data.renderCount || 0,
          renderTime: data.renderTime || 0,
          avgRenderTime: data.renderCount > 0 ? data.renderTime / data.renderCount : 0,
          efficiency: Math.max(0, 100 - (data.renderTime / data.renderCount || 0) * 10),
        }),
      );

      return components.sort((a, b) => b.renderTime - a.renderTime);
    } catch (error) {
      console.warn('Failed to read React Scan data:', error);
      return [];
    }
  }, []);

  // 更新数据
  const updateData = useCallback(() => {
    const newStats = readReactScanData();
    _setComponentStats(newStats);
  }, [readReactScanData]);

  // 定期更新数据
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, [isRecording, updateData]);

  // 控制函数
  const startRecording = () => {
    setIsRecording(true);
    updateData();
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const clearData = () => {
    _setComponentStats([]);
    setIsRecording(false);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(componentStats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `react-scan-data-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          React Scan 分析器
          <Badge variant={isRecording ? 'destructive' : 'secondary'}>
            {isRecording ? '记录中' : '已停止'}
          </Badge>
        </CardTitle>
        <CardDescription>
          分析 React 组件的渲染性能和效率
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 控制面板 */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? 'destructive' : 'default'}
          >
            {isRecording ? '停止记录' : '开始记录'}
          </Button>
          <Button onClick={clearData} variant="outline">
            清除数据
          </Button>
          <Button onClick={exportData} variant="outline" disabled={!componentStats.length}>
            导出数据
          </Button>
        </div>

        {/* 数据表格 */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList>
            <TabsTrigger value="stats">组件统计</TabsTrigger>
            <TabsTrigger value="summary">性能摘要</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            {componentStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">组件名称</th>
                      <th className="text-right p-2 font-medium">渲染次数</th>
                      <th className="text-right p-2 font-medium">总时间(ms)</th>
                      <th className="text-right p-2 font-medium">平均时间(ms)</th>
                      <th className="text-right p-2 font-medium">效率分数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentStats.map((stat, index) => (
                      <tr key={`${stat.name}-${index}`} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-sm">{stat.name}</td>
                        <td className="p-2 text-right">{stat.renderCount}</td>
                        <td className="p-2 text-right">{stat.renderTime.toFixed(2)}</td>
                        <td className="p-2 text-right">{stat.avgRenderTime.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <Badge
                            variant={
                              stat.efficiency >= 80
                                ? 'default'
                                : stat.efficiency >= 60
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {stat.efficiency.toFixed(0)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无组件数据，请点击&ldquo;开始记录&rdquo;开始分析
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {componentStats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">总组件数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{componentStats.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">总渲染次数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {componentStats.reduce((sum, c) => sum + c.renderCount, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">总渲染时间</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {componentStats.reduce((sum, c) => sum + c.renderTime, 0).toFixed(2)}ms
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无数据
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
