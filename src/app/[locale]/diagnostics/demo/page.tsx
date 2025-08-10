'use client';

import { useEffect } from 'react';
import { ControlPanel, PageHeader } from './components';
import { useDiagnostics } from './hooks';
import { MainContent } from './main-content';
import { PERFORMANCE_CONSTANTS } from './utils';

export default function WebVitalsDemoPage() {
  const { testResults, isRunning, logs, runDiagnostics, handleExportResults } =
    useDiagnostics();

  useEffect(() => {
    // 页面加载时自动运行一次诊断
    setTimeout(runDiagnostics, PERFORMANCE_CONSTANTS.AUTO_RUN_DELAY);
  }, [runDiagnostics]);

  return (
    <div className='bg-background min-h-screen py-8'>
      <div className='container mx-auto max-w-6xl px-4'>
        <PageHeader />

        <ControlPanel
          isRunning={isRunning}
          testResults={testResults}
          onRunDiagnostics={runDiagnostics}
          onExportResults={handleExportResults}
        />

        <MainContent
          testResults={testResults}
          logs={logs}
        />
      </div>
    </div>
  );
}
