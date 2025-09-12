/**
 * 无障碍性测试页面
 * 用于测试导航组件的键盘导航和无障碍性功能
 */
'use client';

import { runAccessibilityTests } from '@/lib/accessibility-tester';
import { useState } from 'react';
import { AutomatedTestSection } from './components/automated-test-section';
import { KeyboardShortcutsGuide } from './components/keyboard-shortcuts-guide';
import { ManualTestGuide } from './components/manual-test-guide';
import { ScreenReaderGuide } from './components/screen-reader-guide';
import { TestTargetSection } from './components/test-target-section';

export default function AccessibilityTestPage() {
  // const _t = useTranslations(); // TODO: Add translations for accessibility test page
  const [testResults, setTestResults] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = async () => {
    const DOM_RENDER_DELAY = 500; // 等待DOM完全渲染的延迟时间（毫秒）

    setIsRunning(true);
    setTestResults('正在运行无障碍性测试...');

    try {
      // 等待DOM完全渲染
      await new Promise(resolve => setTimeout(resolve, DOM_RENDER_DELAY));

      const results = await runAccessibilityTests();
      setTestResults(results);
    } catch (_error) {
    // 忽略错误变量
      setTestResults(`测试运行失败: ${_error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            导航组件无障碍性测试
          </h1>
          <p className="text-gray-600 mb-6">
            此页面用于测试 Vercel 导航栏复刻组件的键盘导航和无障碍性功能。
            请使用键盘进行导航测试，或点击下方按钮运行自动化测试。
          </p>
        </div>

        <TestTargetSection />
        <ManualTestGuide />
        <AutomatedTestSection
          testResults={testResults}
          isRunning={isRunning}
          onRunTests={handleRunTests}
        />
        <KeyboardShortcutsGuide />
        <ScreenReaderGuide />
      </div>
    </div>
  );
}
