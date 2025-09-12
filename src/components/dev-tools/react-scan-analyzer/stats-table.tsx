import React from 'react';
import type { ComponentStats } from './data-reader';
;

interface StatsTableProps {
  componentStats: ComponentStats[];
}

/**
 * 组件统计表格
 */
export function StatsTable({ componentStats }: StatsTableProps) {
  if (!componentStats.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无组件数据
      </div>
    );
  }

  return (
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
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    stat.efficiency >= 80
                      ? 'bg-green-100 text-green-800'
                      : stat.efficiency >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {stat.efficiency.toFixed(0)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
