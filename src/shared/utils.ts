/**
 * 共享工具函数库
 * 提供项目中常用的工具函数，包括日期格式化、邮箱验证等
 */

/**
 * 格式化日期为ISO字符串格式 (YYYY-MM-DD)
 * @param date - 要格式化的日期对象
 * @returns ISO格式的日期字符串
 * @example
 * ```typescript
 * const today = new Date();
 * const formatted = formatDate(today); // "2025-07-29"
 * ```
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

/**
 * 验证邮箱地址格式是否正确
 * 使用标准的邮箱正则表达式进行验证
 * @param email - 要验证的邮箱地址
 * @returns 是否为有效邮箱格式
 * @example
 * ```typescript
 * validateEmail("user@example.com"); // true
 * validateEmail("invalid-email");    // false
 * validateEmail("test@domain.co.uk"); // true
 * ```
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
