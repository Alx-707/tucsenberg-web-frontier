import { GeistSans } from 'geist/font/sans';

/**
 * Geist Sans 字体配置
 * 用于主要文本内容
 */
export const geistSans = GeistSans;

/**
 * Geist Mono 不再全局加载（P2-1 Phase 2 优化）
 * 等宽字体使用系统字体栈回退：ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
 * 这样可以节省 ~59KB 的首屏字体下载体积
 *
 * 如需在特定组件中使用 Geist Mono，可单独导入：
 * import { GeistMono } from 'geist/font/mono';
 */

/**
 * 中文字体采用系统字体栈与可选子集（见 head.tsx 注入的 @font-face）。
 * 不再依赖 Google Fonts，避免 CI/受限网络环境下载超时。
 */

/**
 * 获取字体类名字符串
 * 用于应用到body元素
 * P0.4 优化：支持环境变量控制中文字体启用/禁用
 * P2-1 Phase 2：移除 Geist Mono 全局变量，减少字体下载体积
 */
export function getFontClassNames(): string {
  // 仅包含 Geist Sans 变量。Geist Mono 不再全局注入，等宽字体使用系统回退。
  // 中文字体通过 CSS 变量 --font-chinese-stack 控制，与 head.tsx 注入的子集样式解耦。
  return geistSans.variable;
}
