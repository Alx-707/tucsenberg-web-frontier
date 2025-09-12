/**
 * 颜色系统工具类
 */

import { lightThemeColors } from './light-theme';
import { darkThemeColors } from './dark-theme';
import {
  oklchToCSS,
  calculateContrast,
  checkContrastCompliance,
  generateCSSVariables,
  validateThemeContrast,
} from './utils';

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
