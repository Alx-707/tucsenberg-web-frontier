/**
 * 监控仪表板相关类型定义和常量
 */

// 时间常量（毫秒）
export const MINUTES_PER_HOUR = 60;
export const SECONDS_PER_MINUTE = 60;
export const MS_PER_SECOND = 1000;
export const HOURS_24 = 24;
export const HOURS_2 = 2;

export const HOURS_24_IN_MS =
  HOURS_24 * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
export const HOURS_2_IN_MS =
  HOURS_2 * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

/**
 * 监控数据类型定义
 */
export interface MonitoringData {
  source: string;
  metrics: Record<string, unknown>;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * 验证监控数据格式
 */
export function validateMonitoringData(data: unknown): data is MonitoringData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const record = data as Record<string, unknown>;
  const requiredFields = ['source', 'metrics', 'timestamp'];
  return requiredFields.every((field) => field in record);
}
