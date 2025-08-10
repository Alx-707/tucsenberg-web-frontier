import { Geist, Geist_Mono } from 'next/font/google';

/**
 * Geist Sans 字体配置
 * 用于主要文本内容
 */
export const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

/**
 * Geist Mono 字体配置
 * 用于代码和等宽文本
 */
export const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

/**
 * 获取字体类名字符串
 * 用于应用到body元素
 */
export function getFontClassNames(): string {
  return `${geistSans.variable} ${geistMono.variable}`;
}
