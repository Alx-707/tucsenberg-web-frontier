import {
  CurrentMetrics,
  HistoricalData,
  ThresholdReference,
  type SimpleWebVitals,
} from './components';

/**
 * 页面标题组件
 */
export function PageHeader() {
  return (
    <div className='mb-8 text-center'>
      <h1 className='mb-4 text-4xl font-bold tracking-tight'>
        Web Vitals 性能诊断
      </h1>
      <p className='text-muted-foreground mx-auto max-w-3xl text-xl'>
        深入分析网站性能指标，识别关键问题，获取专业的优化建议。 实时监控
        CLS、LCP、FID 等核心 Web Vitals 指标。
      </p>
    </div>
  );
}

/**
 * 主要内容区域组件
 */
interface MainContentProps {
  currentMetrics: SimpleWebVitals | null;
  historicalData: SimpleWebVitals[];
}

export function MainContent({ currentMetrics, historicalData }: MainContentProps) {
  return (
    <>
      {/* 当前页面性能指标 */}
      {currentMetrics && <CurrentMetrics metrics={currentMetrics} />}

      {/* 历史数据 */}
      <HistoricalData data={historicalData} />

      {/* 性能阈值参考 */}
      <ThresholdReference />
    </>
  );
}
