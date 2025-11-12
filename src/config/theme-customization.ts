/**
 * 主题定制配置
 * 允许在不修改组件内部的情况下调整品牌色、布局与交互组件的默认行为
 */

export type BrandPalette = {
  primary: string;
  secondary: string;
  accent: string;
};

export type LayoutScale = {
  maxContentWidth: string;
  headerStyle: 'solid' | 'transparent' | 'floating';
};

export type ButtonAppearance = {
  defaultVariant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  defaultSize: 'default' | 'sm' | 'lg' | 'icon';
};

export interface ThemeCustomization {
  brand: BrandPalette;
  layout: LayoutScale;
  components: {
    button: ButtonAppearance;
  };
}

export const THEME_CUSTOMIZATION: ThemeCustomization = {
  brand: {
    primary: 'hsl(167, 75%, 47%)',
    secondary: 'hsl(214, 76%, 40%)',
    accent: 'hsl(45, 100%, 51%)',
  },
  layout: {
    maxContentWidth: '1100px',
    headerStyle: 'floating',
  },
  components: {
    button: {
      defaultVariant: 'default',
      defaultSize: 'default',
    },
  },
};

export const getThemeCssVariables = (
  customization: ThemeCustomization = THEME_CUSTOMIZATION,
): Record<string, string> => ({
  '--primary': customization.brand.primary,
  '--secondary': customization.brand.secondary,
  '--accent': customization.brand.accent,
  '--layout-max-content-width': customization.layout.maxContentWidth,
});
