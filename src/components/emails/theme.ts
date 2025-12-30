/**
 * Email theme constants for consistent styling across all email templates.
 * Uses inline styles for maximum email client compatibility.
 */

export const COLORS = {
  primary: '#007ee6',
  success: '#059669',
  successLight: '#ecfdf5',
  text: '#333333',
  textLight: '#555555',
  muted: '#666666',
  background: '#ffffff',
  contentBackground: '#f9f9f9',
  headerText: '#ffffff',
  border: '#eaeaea',
} as const;

export const SPACING = {
  xs: '6px',
  sm: '10px',
  md: '15px',
  lg: '20px',
  xl: '24px',
} as const;

export const FONT_SIZES = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '24px',
} as const;

export const SIZES = {
  maxWidth: '600px',
  borderRadius: '4px',
} as const;

export const FONT_FAMILY =
  'Arial, sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica';
