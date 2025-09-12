/**
 * Test utilities for layout components
 */
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock messages for testing
export const mockMessages = {
  navigation: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    products: 'Products',
    blog: 'Blog',
    contact: 'Contact',
  },
  language: {
    switch: 'Switch language',
    english: 'English',
    chinese: 'Chinese',
    current: 'Current language: {locale}',
  },
  theme: {
    toggle: 'Toggle theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
};

// Simple render function without complex providers for now
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
  messages?: Record<string, unknown>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  // For now, just use basic render - we'll mock the i18n hooks directly
  return render(ui, options);
}

// Mock theme provider
export const mockThemeProvider = {
  theme: 'light' as const,
  setTheme: vi.fn(),
  systemTheme: 'light' as const,
  resolvedTheme: 'light' as const,
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
