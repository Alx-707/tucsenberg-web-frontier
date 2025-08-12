/**
 * React Scan 配置
 *
 * 用于开发环境的 React 性能监控和渲染分析
 * 只在开发环境启用，不影响生产构建
 */

export interface ReactScanConfig {
  enabled: boolean;
  showToolbar: boolean;
  log: boolean;
  trackUnnecessaryRenders: boolean;
  animationSpeed: 'slow' | 'fast' | 'off';
}

/**
 * 检查是否应该启用 React Scan
 *
 * 启用条件：
 * 1. 必须是开发环境 (NODE_ENV === 'development')
 * 2. 生产环境强制禁用
 * 3. 开发环境默认启用，可通过环境变量禁用
 */
export const shouldEnableReactScan = (): boolean => {
  // 生产环境强制禁用
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // 非开发环境禁用
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  // 开发环境：检查是否明确禁用
  const explicitlyDisabled = process.env.NEXT_PUBLIC_DISABLE_REACT_SCAN === 'true';

  // 开发环境默认启用，除非明确禁用
  return !explicitlyDisabled;
};

/**
 * 默认 React Scan 配置
 */
export const DEFAULT_REACT_SCAN_CONFIG: ReactScanConfig = {
  enabled: shouldEnableReactScan(),
  showToolbar: true,
  log: false, // 避免控制台噪音
  trackUnnecessaryRenders: true, // 检测不必要的渲染
  animationSpeed: 'fast',
};

/**
 * 初始化 React Scan
 *
 * 自动跟随开发环境启用/禁用，生产环境强制禁用
 */
export const initReactScan = async (config: Partial<ReactScanConfig> = {}) => {
  // 使用统一的启用检查逻辑
  const shouldEnable = shouldEnableReactScan();

  if (!shouldEnable) {
    // 在开发环境显示禁用信息
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 React Scan disabled (set NEXT_PUBLIC_DISABLE_REACT_SCAN=false to enable)');
    }
    return;
  }

  try {
    // 动态导入 React Scan，避免影响生产构建
    const { scan } = await import('react-scan');

    const finalConfig = {
      ...DEFAULT_REACT_SCAN_CONFIG,
      ...config,
    };

    scan(finalConfig);

    // 开发环境日志
    console.log('🔍 React Scan initialized with config:', finalConfig);
    console.log('💡 To disable: set NEXT_PUBLIC_DISABLE_REACT_SCAN=true');
  } catch (error) {
    console.warn('Failed to initialize React Scan:', error);
  }
};

/**
 * React Scan 包装器组件
 *
 * 用于在 React 组件中初始化 React Scan
 */
export const ReactScanWrapper = ({ children }: { children: React.ReactNode }) => {
  if (typeof window !== 'undefined') {
    // 客户端初始化
    initReactScan();
  }

  return children;
};
