/**
 * OKLCH颜色系统管理库
 * 提供统一的颜色定义、对比度检查和主题管理
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

/**
 * 明亮主题颜色定义
 */
export const lightThemeColors: ThemeColors = {
  // 基础颜色 - 高对比度白色背景
  background: { l: 1, c: 0, h: 0 }, // 纯白
  foreground: { l: 0.145, c: 0, h: 0 }, // 深灰，确保高对比度

  // 卡片和弹出层
  card: { l: 1, c: 0, h: 0 },
  cardForeground: { l: 0.145, c: 0, h: 0 },
  popover: { l: 1, c: 0, h: 0 },
  popoverForeground: { l: 0.145, c: 0, h: 0 },

  // 主要颜色 - 深色确保对比度
  primary: { l: 0.205, c: 0, h: 0 },
  primaryForeground: { l: 0.985, c: 0, h: 0 },

  // 次要颜色
  secondary: { l: 0.97, c: 0, h: 0 },
  secondaryForeground: { l: 0.205, c: 0, h: 0 },

  // 静音颜色
  muted: { l: 0.97, c: 0, h: 0 },
  mutedForeground: { l: 0.556, c: 0, h: 0 },

  // 强调颜色
  accent: { l: 0.97, c: 0, h: 0 },
  accentForeground: { l: 0.205, c: 0, h: 0 },

  // 破坏性颜色 - 红色系
  destructive: { l: 0.577, c: 0.245, h: 27.325 },
  destructiveForeground: { l: 0.985, c: 0, h: 0 },

  // 边框和输入
  border: { l: 0.922, c: 0, h: 0 },
  input: { l: 0.922, c: 0, h: 0 },
  ring: { l: 0.708, c: 0, h: 0 },

  // 语义化颜色
  success: { l: 0.646, c: 0.222, h: 142.5 }, // 绿色
  successForeground: { l: 0.985, c: 0, h: 0 },
  warning: { l: 0.828, c: 0.189, h: 84.429 }, // 黄色
  warningForeground: { l: 0.145, c: 0, h: 0 },
  error: { l: 0.577, c: 0.245, h: 27.325 }, // 红色
  errorForeground: { l: 0.985, c: 0, h: 0 },
  info: { l: 0.6, c: 0.118, h: 184.704 }, // 蓝色
  infoForeground: { l: 0.985, c: 0, h: 0 },
};

/**
 * 暗黑主题颜色定义
 */
export const darkThemeColors: ThemeColors = {
  // 基础颜色 - 深色背景
  background: { l: 0.145, c: 0, h: 0 },
  foreground: { l: 0.985, c: 0, h: 0 },

  // 卡片和弹出层
  card: { l: 0.145, c: 0, h: 0 },
  cardForeground: { l: 0.985, c: 0, h: 0 },
  popover: { l: 0.145, c: 0, h: 0 },
  popoverForeground: { l: 0.985, c: 0, h: 0 },

  // 主要颜色
  primary: { l: 0.985, c: 0, h: 0 },
  primaryForeground: { l: 0.205, c: 0, h: 0 },

  // 次要颜色
  secondary: { l: 0.262, c: 0, h: 0 },
  secondaryForeground: { l: 0.985, c: 0, h: 0 },

  // 静音颜色
  muted: { l: 0.262, c: 0, h: 0 },
  mutedForeground: { l: 0.708, c: 0, h: 0 },

  // 强调颜色
  accent: { l: 0.262, c: 0, h: 0 },
  accentForeground: { l: 0.985, c: 0, h: 0 },

  // 破坏性颜色
  destructive: { l: 0.631, c: 0.245, h: 27.325 },
  destructiveForeground: { l: 0.985, c: 0, h: 0 },

  // 边框和输入
  border: { l: 0.262, c: 0, h: 0 },
  input: { l: 0.262, c: 0, h: 0 },
  ring: { l: 0.708, c: 0, h: 0 },

  // 语义化颜色
  success: { l: 0.7, c: 0.222, h: 142.5 },
  successForeground: { l: 0.145, c: 0, h: 0 },
  warning: { l: 0.85, c: 0.189, h: 84.429 },
  warningForeground: { l: 0.145, c: 0, h: 0 },
  error: { l: 0.631, c: 0.245, h: 27.325 },
  errorForeground: { l: 0.985, c: 0, h: 0 },
  info: { l: 0.65, c: 0.118, h: 184.704 },
  infoForeground: { l: 0.145, c: 0, h: 0 },
};

/**
 * 将OKLCH颜色转换为CSS字符串
 */
export function oklchToCSS(color: OKLCHColor): string {
  const { l, c, h, alpha = 1 } = color;
  if (alpha < 1) {
    return `oklch(${l} ${c} ${h} / ${alpha})`;
  }
  return `oklch(${l} ${c} ${h})`;
}

/**
 * 计算两个OKLCH颜色之间的对比度
 * 基于WCAG 2.1标准
 */
export function calculateContrast(
  color1: OKLCHColor,
  color2: OKLCHColor,
): number {
  // 简化的对比度计算，基于亮度差异
  // 实际项目中应该使用更精确的算法
  const l1 = Math.max(color1.l, color2.l);
  const l2 = Math.min(color1.l, color2.l);

  // WCAG对比度公式的简化版本
  const contrastOffset = 0.05;
  return (l1 + contrastOffset) / (l2 + contrastOffset);
}

/**
 * 检查颜色对比度是否符合WCAG标准
 */
export function checkContrastCompliance(
  foreground: OKLCHColor,
  background: OKLCHColor,
  level: ContrastLevel = 'AA',
): boolean {
  const contrast = calculateContrast(foreground, background);
  const aaaMinRatio = 7;
  const aaMinRatio = 4.5;
  const minRatio = level === 'AAA' ? aaaMinRatio : aaMinRatio;
  return contrast >= minRatio;
}

/**
 * 生成CSS变量定义
 */
export function generateCSSVariables(
  colors: ThemeColors,
  prefix = '',
): Record<string, string> {
  const variables: Record<string, string> = {};

  Object.entries(colors).forEach(([key, color]) => {
    const cssKey = `--${prefix}${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    // eslint-disable-next-line security/detect-object-injection
    variables[cssKey] = oklchToCSS(color);
  });

  return variables;
}

/**
 * 验证主题颜色的对比度合规性
 */
export function validateThemeContrast(colors: ThemeColors): {
  compliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 检查主要的前景/背景组合
  const checks = [
    {
      fg: colors.foreground,
      bg: colors.background,
      name: 'foreground/background',
    },
    {
      fg: colors.cardForeground,
      bg: colors.card,
      name: 'card-foreground/card',
    },
    {
      fg: colors.primaryForeground,
      bg: colors.primary,
      name: 'primary-foreground/primary',
    },
    {
      fg: colors.secondaryForeground,
      bg: colors.secondary,
      name: 'secondary-foreground/secondary',
    },
    {
      fg: colors.mutedForeground,
      bg: colors.muted,
      name: 'muted-foreground/muted',
    },
    {
      fg: colors.accentForeground,
      bg: colors.accent,
      name: 'accent-foreground/accent',
    },
    {
      fg: colors.destructiveForeground,
      bg: colors.destructive,
      name: 'destructive-foreground/destructive',
    },
    {
      fg: colors.successForeground,
      bg: colors.success,
      name: 'success-foreground/success',
    },
    {
      fg: colors.warningForeground,
      bg: colors.warning,
      name: 'warning-foreground/warning',
    },
    {
      fg: colors.errorForeground,
      bg: colors.error,
      name: 'error-foreground/error',
    },
    {
      fg: colors.infoForeground,
      bg: colors.info,
      name: 'info-foreground/info',
    },
  ];

  checks.forEach(({ fg, bg, name }) => {
    if (!checkContrastCompliance(fg, bg, 'AA')) {
      const contrast = calculateContrast(fg, bg);
      const decimalPlaces = 2;
      issues.push(
        `${name}: ${contrast.toFixed(decimalPlaces)}:1 (需要 ≥4.5:1)`,
      );
    }
  });

  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * 颜色系统工具类
 */
export class ColorSystem {
  static light = lightThemeColors;
  static dark = darkThemeColors;

  static toCSS = oklchToCSS;
  static calculateContrast = calculateContrast;
  static checkCompliance = checkContrastCompliance;
  static generateVariables = generateCSSVariables;
  static validate = validateThemeContrast;
}
