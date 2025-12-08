/**
 * Header Component Tests
 *
 * Tests for the async Server Component Header using a render helper
 * that awaits the component before passing to React Testing Library.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/layout/header';

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
  Idle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/layout/header-scroll-chrome', () => ({
  HeaderScrollChrome: () => null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (asChild ? <>{children}</> : <button {...props}>{children}</button>),
}));

/**
 * Helper to render async Server Components in tests.
 * Awaits the component and renders the resolved JSX.
 */
async function renderAsyncComponent(
  asyncComponent: Promise<React.JSX.Element>,
) {
  const resolvedElement = await asyncComponent;
  return render(resolvedElement);
}

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default Header', () => {
    it('renders all navigation components', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByTestId('nav-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('language-toggle-button')).toBeInTheDocument();
    });

    it('applies default sticky positioning', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('applies custom className when provided', async () => {
      const customClass = 'custom-header-class';
      await renderAsyncComponent(
        Header({ locale: 'en', className: customClass }),
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(customClass);
    });

    it('can disable sticky positioning', async () => {
      await renderAsyncComponent(Header({ locale: 'en', sticky: false }));

      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
    });
  });

  describe('Header Variants', () => {
    it('renders minimal variant correctly', async () => {
      await renderAsyncComponent(Header({ locale: 'en', variant: 'minimal' }));

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      // Minimal variant hides center nav
      expect(screen.queryByTestId('nav-switcher')).not.toBeInTheDocument();
    });

    it('renders transparent variant correctly', async () => {
      await renderAsyncComponent(
        Header({ locale: 'en', variant: 'transparent' }),
      );

      const header = screen.getByRole('banner');
      // Transparent variant always applies bg-transparent
      expect(header).toHaveClass('bg-transparent');
      // Transparent headers should not be sticky
      expect(header).not.toHaveClass('sticky');
    });

    it('transparent variant ignores sticky prop', async () => {
      await renderAsyncComponent(
        Header({ locale: 'en', variant: 'transparent', sticky: true }),
      );

      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
    });
  });

  describe('Convenience Components', () => {
    // Note: HeaderMinimal and HeaderTransparent are convenience wrappers that
    // don't pass locale, relying on next-intl's getLocale() in real usage.
    // In unit tests without the full next-intl server context, we test the
    // underlying Header component with explicit locale and variant props.

    it('HeaderMinimal behavior via Header with minimal variant', async () => {
      await renderAsyncComponent(Header({ locale: 'en', variant: 'minimal' }));

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      // Minimal variant still has sticky positioning
      expect(header).toHaveClass('sticky');
    });

    it('HeaderTransparent behavior via Header with transparent variant', async () => {
      await renderAsyncComponent(
        Header({ locale: 'en', variant: 'transparent' }),
      );

      const header = screen.getByRole('banner');
      // Transparent variant always applies bg-transparent
      expect(header).toHaveClass('bg-transparent');
      // Transparent variant disables sticky
      expect(header).not.toHaveClass('sticky');
    });

    it('Header accepts className prop with variant', async () => {
      const customClass = 'custom-class';

      await renderAsyncComponent(
        Header({ locale: 'en', variant: 'minimal', className: customClass }),
      );
      expect(screen.getByRole('banner')).toHaveClass(customClass);
    });
  });

  describe('Accessibility', () => {
    it('has proper banner role', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      // Header should not interfere with focus management
      const header = screen.getByRole('banner');
      expect(header).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Responsive Behavior', () => {
    it('contains both desktop and mobile navigation', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      // Both should be present, visibility controlled by CSS
      expect(screen.getByTestId('nav-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    });
  });
});
