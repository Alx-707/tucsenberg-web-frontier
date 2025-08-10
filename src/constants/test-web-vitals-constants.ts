/**
 * Web Vitals 测试常量定义
 * 专门用于性能监控和Web Vitals相关的测试
 */

/** Web Vitals 阈值常量 */
export const WEB_VITALS_CONSTANTS = {
  // Core Web Vitals 阈值
  /** CLS 良好阈值 - 0.1 */
  CLS_GOOD_THRESHOLD: 0.1,

  /** CLS 需要改进阈值 - 0.25 */
  CLS_NEEDS_IMPROVEMENT_THRESHOLD: 0.25,

  /** CLS 警告变化 - 0.05 */
  CLS_WARNING_CHANGE: 0.05,

  /** CLS 严重变化 - 0.1 */
  CLS_CRITICAL_CHANGE: 0.1,

  /** FID 良好阈值 - 100ms */
  FID_GOOD_THRESHOLD: 100,

  /** FID 需要改进阈值 - 300ms */
  FID_NEEDS_IMPROVEMENT_THRESHOLD: 300,

  /** FCP 良好阈值 - 1800ms */
  FCP_GOOD_THRESHOLD: 1800,

  /** FCP 需要改进阈值 - 3000ms */
  FCP_NEEDS_IMPROVEMENT_THRESHOLD: 3000,

  /** LCP 良好阈值 - 2500ms */
  LCP_GOOD_THRESHOLD: 2500,

  /** LCP 需要改进阈值 - 4000ms */
  LCP_NEEDS_IMPROVEMENT_THRESHOLD: 4000,

  /** TTFB 良好阈值 - 800ms */
  TTFB_GOOD_THRESHOLD: 800,

  /** TTFB 需要改进阈值 - 1800ms */
  TTFB_NEEDS_IMPROVEMENT_THRESHOLD: 1800,

  // 时间单位
  /** 毫秒每秒 - 1000 */
  MILLISECONDS_PER_SECOND: 1000,

  /** 秒每分钟 - 60 */
  SECONDS_PER_MINUTE: 60,

  /** 分钟每小时 - 60 */
  MINUTES_PER_HOUR: 60,

  /** 小时每天 - 24 */
  HOURS_PER_DAY: 24,

  // 基准管理
  /** 最大基准数量 - 50 */
  MAX_BASELINES: 50,

  /** 基准最大年龄（天）- 30 */
  BASELINE_MAX_AGE_DAYS: 30,

  /** 基准保存延迟 - 5000ms */
  BASELINE_SAVE_DELAY: 5000,

  // ID生成
  /** 哈希基数 - 36 */
  HASH_BASE: 36,

  /** ID截取开始位置 - 2 */
  ID_SUBSTR_START: 2,

  /** ID随机长度 - 9 */
  ID_RANDOM_LENGTH: 9,

  // 报告
  /** 报告项目限制 - 50 */
  REPORT_ITEM_LIMIT: 50,
} as const;

/** Web Vitals 诊断常量 */
export const TEST_WEB_VITALS_DIAGNOSTICS = {
  /** 诊断超时 - 5000ms */
  TIMEOUT: 5000,

  /** 最大重试次数 - 3 */
  MAX_RETRIES: 3,

  /** 重试延迟 - 1000ms */
  RETRY_DELAY: 1000,

  /** 采样率 - 0.1 (10%) */
  SAMPLING_RATE: 0.1,

  /** 缓冲区大小 - 100 */
  BUFFER_SIZE: 100,

  /** 批处理大小 - 10 */
  BATCH_SIZE: 10,

  /** 刷新间隔 - 30000ms (30秒) */
  FLUSH_INTERVAL: 30000,

  /** 最大队列大小 - 1000 */
  MAX_QUEUE_SIZE: 1000,

  /** 压缩阈值 - 1024字节 */
  COMPRESSION_THRESHOLD: 1024,

  /** 最大有效负载大小 - 64KB */
  MAX_PAYLOAD_SIZE: 65536,
} as const;
