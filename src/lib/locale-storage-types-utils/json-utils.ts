/**
 * 语言存储系统JSON工具函数
 * Locale Storage System JSON Utility Functions
 */

/**
 * 安全的JSON解析
 * Safe JSON parse
 */
export function safeJsonParse<T = unknown>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全的JSON字符串化
 * Safe JSON stringify
 */
export function safeJsonStringify(obj: unknown, defaultValue = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}
