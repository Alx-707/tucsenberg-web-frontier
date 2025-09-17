// React Scan 类型定义

/**
 * React Scan 统计数据接口
 */
export interface ReactScanStats {
  enabled: boolean;
  totalRenders: number;
  componentsTracked: number;
  lastUpdate: string;
}

/**
 * React Scan 全局对象类型定义
 */
export interface ReactScanGlobal {
  ReactScanInternals?: {
    enabled?: boolean;
    totalRenders?: number;
    componentsScanned?: number;
  };
  components?: Record<
    string,
    {
      renderCount: number;
      renderTime: number;
    }
  >;
}

/**
 * 扩展的 Window 接口，包含 React Scan 相关属性
 */
declare global {
  interface Window {
    __REACT_SCAN__?: ReactScanGlobal;
  }
}

export type ReactScanWindow = Window;

/**
 * React Scan 配置选项
 */
export interface ReactScanConfig {
  enabled: boolean;
  showOverlay: boolean;
  trackRenders: boolean;
  logToConsole: boolean;
  maxRenderCount: number;
}

/**
 * 组件性能数据
 */
export interface ComponentPerformanceData {
  name: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  isOptimized: boolean;
}

/**
 * React Scan 事件类型
 */
export type ReactScanEventType =
  | 'component-render'
  | 'unnecessary-render'
  | 'optimization-detected'
  | 'performance-warning';

/**
 * React Scan 事件数据
 */
export interface ReactScanEvent {
  type: ReactScanEventType;
  componentName: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * React Scan 监控状态
 */
export interface ReactScanMonitorState {
  isActive: boolean;
  startTime: number;
  events: ReactScanEvent[];
  components: ComponentPerformanceData[];
}
