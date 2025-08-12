// 诊断页面组件

import {
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatMetric, getMetricStatus, type SimpleWebVitals } from './utils';

// 重新导出类型以便其他文件使用
export type { SimpleWebVitals } from './utils';

// 常量定义 - 避免魔法数字
const UI_CONSTANTS = {
  ICON_SIZE: 4, // Tailwind w-4 h-4
  SCORE_EXCELLENT_THRESHOLD: 80,
  SCORE_GOOD_THRESHOLD: 50,
} as const;

// Web Vitals 阈值常量 - 用于显示
const DISPLAY_THRESHOLDS = {
  CLS_GOOD: 0.1,
  CLS_NEEDS_IMPROVEMENT: 0.25,
  LCP_GOOD: 2.5, // 秒
  LCP_NEEDS_IMPROVEMENT: 4.0, // 秒
  FID_GOOD: 100, // 毫秒
  FID_NEEDS_IMPROVEMENT: 300, // 毫秒
} as const;

// 工具函数：获取状态图标
export function getStatusIcon(status: string) {
  const iconClass = `h-${UI_CONSTANTS.ICON_SIZE} w-${UI_CONSTANTS.ICON_SIZE}`;

  switch (status) {
    case 'good':
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    case 'needs-improvement':
      return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
    case 'poor':
      return <XCircle className={`${iconClass} text-red-600`} />;
    default:
      return <AlertTriangle className={`${iconClass} text-gray-400`} />;
  }
}

// 控制面板组件
interface ControlPanelProps {
  isLoading: boolean;
  currentMetrics: SimpleWebVitals | null;
  onRefresh: () => void;
  onExport: () => void;
}

export function ControlPanel({
  isLoading,
  currentMetrics,
  onRefresh,
  onExport,
}: ControlPanelProps) {
  return (
    <Card className='mb-6'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>性能诊断控制台</CardTitle>
            <CardDescription>实时监控和分析网站性能指标</CardDescription>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant='outline'
              size='sm'
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              {isLoading ? '检测中...' : '重新检测'}
            </Button>
            <Button
              onClick={onExport}
              disabled={!currentMetrics}
              variant='outline'
              size='sm'
            >
              <Download className='mr-2 h-4 w-4' />
              导出数据
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// 当前指标显示组件
interface CurrentMetricsProps {
  metrics: SimpleWebVitals;
}

// 工具函数：获取状态标签文本
function getStatusLabel(status: string): string {
  switch (status) {
    case 'good':
      return '良好';
    case 'needs-improvement':
      return '需要改进';
    default:
      return '较差';
  }
}

// 工具函数：获取Badge变体
function getBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'good':
      return 'default';
    case 'needs-improvement':
      return 'secondary';
    default:
      return 'destructive';
  }
}

// 指标卡片组件
interface MetricCardProps {
  label: string;
  value: string;
  status: string;
  description: string;
}

function MetricCard({ label, value, status, description }: MetricCardProps) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='font-semibold'>{label}</h3>
        {getStatusIcon(status)}
      </div>
      <div className='mb-1 text-2xl font-bold'>{value}</div>
      <Badge variant={getBadgeVariant(status)}>{getStatusLabel(status)}</Badge>
      <p className='text-muted-foreground mt-2 text-sm'>{description}</p>
    </div>
  );
}

// 指标配置
const METRIC_CONFIGS = [
  { key: 'cls', label: 'CLS', description: '累积布局偏移' },
  { key: 'lcp', label: 'LCP', description: '最大内容绘制' },
  { key: 'fid', label: 'FID', description: '首次输入延迟' },
  { key: 'fcp', label: 'FCP', description: '首次内容绘制' },
  { key: 'ttfb', label: 'TTFB', description: '首字节时间' },
] as const;

export function CurrentMetrics({ metrics }: CurrentMetricsProps) {
  // 计算综合评分状态
  const scoreStatus =
    metrics.score >= UI_CONSTANTS.SCORE_EXCELLENT_THRESHOLD
      ? 'good'
      : metrics.score >= UI_CONSTANTS.SCORE_GOOD_THRESHOLD
        ? 'needs-improvement'
        : 'poor';

  const scoreLabel =
    metrics.score >= UI_CONSTANTS.SCORE_EXCELLENT_THRESHOLD
      ? '优秀'
      : metrics.score >= UI_CONSTANTS.SCORE_GOOD_THRESHOLD
        ? '良好'
        : '需要优化';

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle>当前页面性能指标</CardTitle>
        <CardDescription>
          基于 Core Web Vitals 标准的实时性能评估
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {METRIC_CONFIGS.map(({ key, label, description }) => (
            <MetricCard
              key={key}
              label={label}
              value={formatMetric(
                key,
                metrics[key as keyof SimpleWebVitals] as number,
              )}
              status={getMetricStatus(
                key,
                metrics[key as keyof SimpleWebVitals] as number,
              )}
              description={description}
            />
          ))}

          {/* 综合评分 */}
          <div className='rounded-lg border p-4'>
            <div className='mb-2 flex items-center justify-between'>
              <h3 className='font-semibold'>综合评分</h3>
              {getStatusIcon(scoreStatus)}
            </div>
            <div className='mb-1 text-2xl font-bold'>
              {Math.round(metrics.score)}
            </div>
            <Badge variant={getBadgeVariant(scoreStatus)}>{scoreLabel}</Badge>
            <p className='text-muted-foreground mt-2 text-sm'>整体性能评估</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 历史数据组件
interface HistoricalDataProps {
  data: SimpleWebVitals[];
}

export function HistoricalData({ data }: HistoricalDataProps) {
  if (data.length === 0) return null;

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle>历史性能数据</CardTitle>
        <CardDescription>最近 {data.length} 次性能检测记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {data.map((record, index) => (
            <div
              key={record.timestamp}
              className='flex items-center justify-between rounded-lg border p-3'
            >
              <div className='flex items-center space-x-4'>
                <div className='text-muted-foreground text-sm'>
                  #{data.length - index}
                </div>
                <div>
                  <div className='font-medium'>
                    {new Date(record.timestamp).toLocaleString('zh-CN')}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {record.url}
                  </div>
                </div>
              </div>
              <div className='flex items-center space-x-4'>
                <div className='text-center'>
                  <div className='text-sm font-medium'>
                    {formatMetric('cls', record.cls)}
                  </div>
                  <div className='text-muted-foreground text-xs'>CLS</div>
                </div>
                <div className='text-center'>
                  <div className='text-sm font-medium'>
                    {formatMetric('lcp', record.lcp)}
                  </div>
                  <div className='text-muted-foreground text-xs'>LCP</div>
                </div>
                <div className='text-center'>
                  <div className='text-sm font-medium'>
                    {formatMetric('fid', record.fid)}
                  </div>
                  <div className='text-muted-foreground text-xs'>FID</div>
                </div>
                <div className='text-center'>
                  <div className='text-sm font-medium'>
                    {Math.round(record.score)}
                  </div>
                  <div className='text-muted-foreground text-xs'>评分</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 阈值参考组件
export function ThresholdReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>性能指标阈值参考</CardTitle>
        <CardDescription>基于 Google Core Web Vitals 标准</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <div>
            <h4 className='mb-3 font-semibold'>CLS (累积布局偏移)</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-green-600'>良好:</span>
                <span>≤ {DISPLAY_THRESHOLDS.CLS_GOOD}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-yellow-600'>需要改进:</span>
                <span>
                  {DISPLAY_THRESHOLDS.CLS_GOOD} -{' '}
                  {DISPLAY_THRESHOLDS.CLS_NEEDS_IMPROVEMENT}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-red-600'>较差:</span>
                <span>&gt; {DISPLAY_THRESHOLDS.CLS_NEEDS_IMPROVEMENT}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className='mb-3 font-semibold'>LCP (最大内容绘制)</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-green-600'>良好:</span>
                <span>≤ {DISPLAY_THRESHOLDS.LCP_GOOD}s</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-yellow-600'>需要改进:</span>
                <span>
                  {DISPLAY_THRESHOLDS.LCP_GOOD}s -{' '}
                  {DISPLAY_THRESHOLDS.LCP_NEEDS_IMPROVEMENT}s
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-red-600'>较差:</span>
                <span>&gt; {DISPLAY_THRESHOLDS.LCP_NEEDS_IMPROVEMENT}s</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className='mb-3 font-semibold'>FID (首次输入延迟)</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-green-600'>良好:</span>
                <span>≤ {DISPLAY_THRESHOLDS.FID_GOOD}ms</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-yellow-600'>需要改进:</span>
                <span>
                  {DISPLAY_THRESHOLDS.FID_GOOD}ms -{' '}
                  {DISPLAY_THRESHOLDS.FID_NEEDS_IMPROVEMENT}ms
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-red-600'>较差:</span>
                <span>&gt; {DISPLAY_THRESHOLDS.FID_NEEDS_IMPROVEMENT}ms</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
