import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/components/layout/__tests__/test-utils';
import {
  Header,
  HeaderMinimal,
  HeaderTransparent,
} from '@/components/layout/header';

// Mock the navigation components used by Header
vi.mock('@/components/layout/nav-switcher', () => ({
  NavSwitcher: () => <nav data-testid='nav-switcher'>Main Navigation</nav>,
}));

vi.mock('@/components/layout/mobile-navigation', () => ({
  MobileNavigation: () => (
    <nav data-testid='mobile-navigation'>Mobile Navigation</nav>
  ),
}));

vi.mock('@/components/language-toggle', () => ({
  LanguageToggle: () => (
    <button data-testid='language-toggle-button'>Language Toggle</button>
  ),
}));

vi.mock('@/components/layout/logo', () => ({
  Logo: () => <div data-testid='logo'>Logo</div>,
}));

// Mock header islands and Idle wrapper to render immediately in tests
vi.mock('@/components/layout/header-client', () => ({
  MobileNavigationIsland: () => (
    <nav data-testid='mobile-navigation'>Mobile Navigation</nav>
  ),
  NavSwitcherIsland: () => (
    <nav data-testid='nav-switcher'>Main Navigation</nav>
  ),
  LanguageToggleIsland: () => (
    <button data-testid='language-toggle-button'>Language Toggle</button>
  ),
}));

vi.mock('@/components/lazy/idle', () => ({
  Idle: ({ children }: { children: any }) => <>{children}</>,
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default Header', () => {
    it('renders all navigation components', async () => {
      renderWithProviders(<Header />);

      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(await screen.findByTestId('nav-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(
        await screen.findByTestId('language-toggle-button'),
      ).toBeInTheDocument();
      // Header组件不包含ThemeToggle（已移除）
    });

    it('applies default sticky positioning', () => {
      renderWithProviders(<Header />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-header-class';
      renderWithProviders(<Header className={customClass} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(customClass);
    });

    it('can disable sticky positioning', () => {
      renderWithProviders(<Header sticky={false} />);

      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
    });
  });

  describe('Header Variants', () => {
    it('renders minimal variant correctly', () => {
      renderWithProviders(<Header variant='minimal' />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      // Minimal variant should still contain all components but may have different styling
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('renders transparent variant correctly', () => {
      renderWithProviders(<Header variant='transparent' />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('border-transparent', 'bg-transparent');
      // Transparent headers should not be sticky
      expect(header).not.toHaveClass('sticky');
    });

    it('transparent variant ignores sticky prop', () => {
      renderWithProviders(
        <Header
          variant='transparent'
          sticky={true}
        />,
      );

      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
    });
  });

  describe('Convenience Components', () => {
    it('HeaderMinimal renders with minimal variant', () => {
      renderWithProviders(<HeaderMinimal />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('HeaderTransparent renders with transparent variant', () => {
      renderWithProviders(<HeaderTransparent />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('border-transparent', 'bg-transparent');
    });

    it('convenience components accept className prop', () => {
      const customClass = 'custom-class';

      renderWithProviders(<HeaderMinimal className={customClass} />);
      expect(screen.getByRole('banner')).toHaveClass(customClass);
    });
  });

  describe('Accessibility', () => {
    it('has proper banner role', () => {
      renderWithProviders(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('maintains focus management', () => {
      renderWithProviders(<Header />);

      // Header should not interfere with focus management
      const header = screen.getByRole('banner');
      expect(header).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Responsive Behavior', () => {
    it('contains both desktop and mobile navigation', async () => {
      renderWithProviders(<Header />);

      // Both should be present, visibility controlled by CSS
      expect(await screen.findByTestId('nav-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    });
  });
});
