'use client';

import { ControlPanel } from './components';
import { MainContent, PageHeader } from './page-components';
import { useDiagnosticsData } from './page-hooks';

export default function DiagnosticsPage() {
  const {
    currentMetrics,
    historicalData,
    isLoading,
    refreshData,
    handleExportData,
  } = useDiagnosticsData();

  return (
    <div className='bg-background min-h-screen py-8'>
      <div className='container mx-auto max-w-6xl px-4'>
        <PageHeader />

        {/* 控制面板 */}
        <ControlPanel
          isLoading={isLoading}
          currentMetrics={currentMetrics}
          onRefresh={refreshData}
          onExport={handleExportData}
        />

        <MainContent
          currentMetrics={currentMetrics}
          historicalData={historicalData}
        />
      </div>
    </div>
  );
}
