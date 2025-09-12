/**
 * Integration Tests for ThemeToggle Component
 *
 * Tests the complete theme switching workflow including:
 * - User interaction flows
 * - State persistence
 * - Accessibility features
 * - Browser preference detection
 * - Error recovery mechanisms
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '@/components/theme-toggle';

// Mock next-themes
const mockSetTheme = vi.fn();
const mockTheme = vi.fn(() => 'light');

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockTheme(),
    setTheme: mockSetTheme,
    resolvedTheme: mockTheme(),
    themes: ['light', 'dark', 'system'],
  }),
}));

// Mock useThemeToggle hook with realistic behavior
const mockUseThemeToggle = {
  theme: 'light',
  isOpen: false,
  setIsOpen: vi.fn(),
  supportsViewTransitions: true,
  prefersReducedMotion: false,
  prefersHighContrast: false,
  handleThemeChange: vi.fn(),
  handleKeyDown: vi.fn(),
  ariaAttributes: {
    'aria-label': '主题切换',
    'aria-expanded': 'false',
    'aria-haspopup': 'menu',
    'aria-current': 'light',
  },
};

vi.mock('@/hooks/use-theme-toggle', () => ({
  useThemeToggle: vi.fn(() => mockUseThemeToggle),
}));

// Mock UI components with realistic behavior
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open, onOpenChange }: React.ComponentProps<"div">) => (
    <div
      data-testid='dropdown-menu'
      data-open={open}
    >
      <div onClick={() => onOpenChange?.(!open)}>{children}</div>
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild: _asChild }: React.ComponentProps<"div">) => (
    <div data-testid='dropdown-trigger'>{children}</div>
  ),
  DropdownMenuContent: ({
    children,
    align,
    className,
    role,
    ...props
  }: React.ComponentProps<"div">) => (
    <div
      data-testid='dropdown-content'
      data-align={align}
      className={className}
      role={role}
      {...props}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/theme/theme-toggle-button', () => ({
  ThemeToggleButton: ({ ariaAttributes, onKeyDown, ...props }: React.ComponentProps<"div">) => (
    <button
      data-testid='theme-toggle-button'
      onKeyDown={onKeyDown}
      {...ariaAttributes}
      {...props}
    >
      Theme Toggle
    </button>
  ),
}));

vi.mock('@/components/theme/theme-menu-item', () => ({
  ThemeMenuItem: ({
    theme,
    currentTheme,
    label,
    ariaLabel,
    onClick,
    onKeyDown,
    ...props
  }: React.ComponentProps<"div">) => (
    <div
      data-testid={`theme-menu-item-${theme}`}
      data-current={currentTheme === theme}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role='menuitem'
      {...props}
    >
      {label}
    </div>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Monitor: () => <span data-testid='monitor-icon'>🖥️</span>,
  Moon: () => <span data-testid='moon-icon'>🌙</span>,
  Sun: () => <span data-testid='sun-icon'>☀️</span>,
}));

describe('ThemeToggle Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock state
    Object.assign(mockUseThemeToggle, {
      theme: 'light',
      isOpen: false,
      setIsOpen: vi.fn(),
      supportsViewTransitions: true,
      prefersReducedMotion: false,
      prefersHighContrast: false,
      handleThemeChange: vi.fn(),
      handleKeyDown: vi.fn(),
      ariaAttributes: {
        'aria-label': '主题切换',
        'aria-expanded': 'false',
        'aria-haspopup': 'menu',
        'aria-current': 'light',
      },
    });

    mockTheme.mockReturnValue('light');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Theme Switching Workflow', () => {
    it('should complete full theme switch from light to dark', async () => {
      const { rerender } = render(<ThemeToggle />);

      // 1. Initial state verification
      const toggleButton = screen.getByTestId('theme-toggle-button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-current', 'light');

      // 2. Open dropdown menu
      await user.click(toggleButton);
      expect(mockUseThemeToggle.setIsOpen).toHaveBeenCalledWith(true);

      // 3. Simulate menu opening
      Object.assign(mockUseThemeToggle, { isOpen: true });
      rerender(<ThemeToggle />);

      // 4. Select dark theme
      const darkMenuItems = screen.getAllByTestId('theme-menu-item-dark');
      const darkMenuItem = darkMenuItems[darkMenuItems.length - 1]; // Get the last one (from the open menu)
      expect(darkMenuItem).toBeInTheDocument();

      await user.click(darkMenuItem!);
      expect(mockUseThemeToggle.handleThemeChange).toHaveBeenCalledWith(
        'dark',
        expect.any(Object),
      );

      // 5. Verify theme change completion
      expect(mockUseThemeToggle.handleThemeChange).toHaveBeenCalledTimes(1);
    });

    it('should handle system theme preference workflow', async () => {
      render(<ThemeToggle />);

      const toggleButton = screen.getByTestId('theme-toggle-button');
      await user.click(toggleButton);

      // Select system theme
      const systemMenuItem = screen.getByTestId('theme-menu-item-system');
      await user.click(systemMenuItem);

      expect(mockUseThemeToggle.handleThemeChange).toHaveBeenCalledWith(
        'system',
        expect.any(Object),
      );
    });
  });

  describe('Accessibility Integration', () => {
    it('should support complete keyboard navigation workflow', async () => {
      render(<ThemeToggle />);

      const toggleButton = screen.getByTestId('theme-toggle-button');

      // Test keyboard activation
      toggleButton.focus();
      await user.keyboard('{Enter}');

      expect(mockUseThemeToggle.handleKeyDown).toHaveBeenCalled();
    });

    it('should handle high contrast preference integration', async () => {
      // Simulate high contrast preference
      Object.assign(mockUseThemeToggle, {
        prefersHighContrast: true,
      });

      render(<ThemeToggle />);

      const dropdownContent = screen.getByTestId('dropdown-content');
      expect(dropdownContent).toHaveClass('border-foreground', 'border-2');
    });

    it('should handle reduced motion preference integration', async () => {
      // Simulate reduced motion preference
      Object.assign(mockUseThemeToggle, {
        prefersReducedMotion: true,
      });

      render(<ThemeToggle />);

      const dropdownContent = screen.getByTestId('dropdown-content');
      expect(dropdownContent.className).not.toContain('animate-in');
    });
  });

  describe('State Persistence Integration', () => {
    it('should maintain theme state across component re-renders', async () => {
      // Initial render with light theme
      const { rerender } = render(<ThemeToggle />);

      let toggleButton = screen.getByTestId('theme-toggle-button');
      expect(toggleButton).toHaveAttribute('aria-current', 'light');

      // Simulate theme change to dark
      Object.assign(mockUseThemeToggle, {
        theme: 'dark',
        ariaAttributes: {
          ...mockUseThemeToggle.ariaAttributes,
          'aria-current': 'dark',
        },
      });

      // Re-render component
      rerender(<ThemeToggle />);

      toggleButton = screen.getByTestId('theme-toggle-button');
      expect(toggleButton).toHaveAttribute('aria-current', 'dark');
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle hook errors gracefully', async () => {
      // Simulate hook error by providing invalid state
      Object.assign(mockUseThemeToggle, {
        theme: null,
        ariaAttributes: {},
      });

      expect(() => render(<ThemeToggle />)).not.toThrow();
    });

    it('should handle missing theme data gracefully', async () => {
      Object.assign(mockUseThemeToggle, {
        theme: undefined,
      });

      render(<ThemeToggle />);

      // Component should still render with fallback behavior
      const toggleButton = screen.getByTestId('theme-toggle-button');
      expect(toggleButton).toBeInTheDocument();
    });
  });
});
