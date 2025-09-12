// 诊断页面组件主入口文件
// Main diagnostics components entry point

/**
 * 这个文件作为所有诊断页面组件的统一入口，重新导出所有相关功能
 * This file serves as a unified entry point for all diagnostics components
 */

// 重新导出所有诊断组件模块的功能
// Re-export all diagnostics component module functions

// 常量和工具函数
export {
    DISPLAY_THRESHOLDS, HistoryItem, METRIC_CONFIGS, MetricCard,
    ScoreCard,
    ThresholdDisplay, UI_CONSTANTS, getBadgeVariant, getScoreLabel, getScoreStatus, getStatusIcon,
    getStatusLabel, type SimpleWebVitals
} from './diagnostics-constants';

// 控制面板组件
export {
    ControlPanel,
    ExtendedControlPanel, QuickActions, SimpleControlPanel,
    StatusIndicator
} from './diagnostics-control-panel';

// 当前指标组件
export {
    CurrentMetrics, MetricsComparison,
    MetricsSummary, SimpleMetrics
} from './diagnostics-current-metrics';

// 历史数据组件
export {
    HistoricalData, HistoricalDataFilter, HistoricalStats, HistoricalTrend, SimpleHistoricalData
} from './diagnostics-historical-data';

// 阈值参考组件
export {
    DetailedThresholdReference,
    SimpleThresholdReference, ThresholdReference
} from './diagnostics-threshold-reference';

