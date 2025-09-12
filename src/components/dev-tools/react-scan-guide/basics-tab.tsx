'use client';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

/**
 * 快速开始卡片组件
 */
function QuickStartCard({
  isOpen,
  onToggle
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🚀 快速开始</CardTitle>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">启用/禁用 React Scan</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  •{' '}
                  <kbd className="rounded bg-gray-100 px-2 py-1">
                    Ctrl+Shift+X
                  </kbd>{' '}
                  - 切换开关
                </li>
                <li>• 右下角工具栏显示状态</li>
                <li>• 控制台会显示状态变化</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">基本使用流程</h4>
              <ol className="list-inside list-decimal space-y-1 text-sm">
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
  );
}

/**
 * 界面介绍卡片组件
 */
function InterfaceCard({
  isOpen,
  onToggle
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🎛️ 界面介绍</CardTitle>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">工具栏功能</h4>
              <ul className="space-y-1 text-sm">
                <li>• <Badge variant="outline">状态指示器</Badge> - 显示当前扫描状态</li>
                <li>• <Badge variant="outline">组件计数</Badge> - 显示检测到的组件数量</li>
                <li>• <Badge variant="outline">性能指标</Badge> - 显示渲染性能数据</li>
                <li>• <Badge variant="outline">设置按钮</Badge> - 打开配置面板</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">高亮显示</h4>
              <ul className="space-y-1 text-sm">
                <li>• 组件边框会根据渲染频率显示不同颜色</li>
                <li>• 鼠标悬停显示组件详细信息</li>
                <li>• 点击组件可查看更多性能数据</li>
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * 快捷键卡片组件
 */
function ShortcutsCard({
  isOpen,
  onToggle
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">⌨️ 快捷键</CardTitle>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 font-semibold">基本操作</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <kbd className="rounded bg-gray-100 px-2 py-1">Ctrl+Shift+X</kbd> - 启用/禁用
                </li>
                <li>
                  <kbd className="rounded bg-gray-100 px-2 py-1">Ctrl+Shift+R</kbd> - 重置数据
                </li>
                <li>
                  <kbd className="rounded bg-gray-100 px-2 py-1">Ctrl+Shift+S</kbd> - 开始/停止录制
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">视图控制</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <kbd className="rounded bg-gray-100 px-2 py-1">Ctrl+Shift+H</kbd> - 切换高亮
                </li>
                <li>
                  <kbd className="rounded bg-gray-100 px-2 py-1">Ctrl+Shift+I</kbd> - 切换信息面板
                </li>
                <li>
                  <kbd className="rounded bg-gray-100 px-2 py-1">Ctrl+Shift+T</kbd> - 切换工具栏
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * React Scan 基础使用标签页
 */
export function BasicsTab() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quickStart: true,
    interface: false,
    shortcuts: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection
      [section]: !prev[section], // section 来自内部控制，安全
    }));
  };

  return (
    <div className="space-y-4">
      <QuickStartCard
        isOpen={!!openSections.quickStart}
        onToggle={() => toggleSection('quickStart')}
      />
      <InterfaceCard
        isOpen={!!openSections.interface}
        onToggle={() => toggleSection('interface')}
      />
      <ShortcutsCard
        isOpen={!!openSections.shortcuts}
        onToggle={() => toggleSection('shortcuts')}
      />
    </div>
  );
}
