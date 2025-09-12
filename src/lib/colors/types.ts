/**
 * 颜色系统类型定义
 */

/**
 * OKLCH颜色值接口
 */
export interface OKLCHColor {
  l: number; // Lightness (0-1)
  c: number; // Chroma (0-0.4+)
  h: number; // Hue (0-360)
  alpha?: number; // Alpha (0-1)
}

/**
 * 颜色对比度等级
 */
export type ContrastLevel = 'AA' | 'AAA';

/**
 * 主题颜色定义
 */
export interface ThemeColors {
  // 基础颜色
  background: OKLCHColor;
  foreground: OKLCHColor;

  // 卡片和弹出层
  card: OKLCHColor;
  cardForeground: OKLCHColor;
  popover: OKLCHColor;
  popoverForeground: OKLCHColor;

  // 主要颜色
  primary: OKLCHColor;
  primaryForeground: OKLCHColor;

  // 次要颜色
  secondary: OKLCHColor;
  secondaryForeground: OKLCHColor;

  // 静音颜色
  muted: OKLCHColor;
  mutedForeground: OKLCHColor;

  // 强调颜色
  accent: OKLCHColor;
  accentForeground: OKLCHColor;

  // 破坏性颜色
  destructive: OKLCHColor;
  destructiveForeground: OKLCHColor;

  // 边框和输入
  border: OKLCHColor;
  input: OKLCHColor;
  ring: OKLCHColor;

  // 语义化颜色
  success: OKLCHColor;
  successForeground: OKLCHColor;
  warning: OKLCHColor;
  warningForeground: OKLCHColor;
  error: OKLCHColor;
  errorForeground: OKLCHColor;
  info: OKLCHColor;
  infoForeground: OKLCHColor;
}
