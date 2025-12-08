/**
 * Header Integration Tests
 *
 * Tests for the async Server Component Header using a render helper
 * that awaits the component before passing to React Testing Library.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/layout/header';

vi.mock('next/dynamic', async () => {
  const React = await import('react');
  return {
    __esModule: true,
    default: (
      importer: () => Promise<
        { default?: React.ComponentType<any> } | React.ComponentType<any>
      >,
    ) =>
      function DynamicComponent(props: Record<string, unknown>) {
        const [Loaded, setLoaded] =
          React.useState<React.ComponentType<any> | null>(null);

        React.useEffect(() => {
          let mounted = true;
          importer().then((mod) => {
            if (!mounted) return;
            const Component =
              typeof mod === 'function'
                ? (mod as React.ComponentType<any>)
                : mod.default;
            setLoaded(() => Component ?? (() => null));
          });
          return () => {
            mounted = false;
          };
        }, []);

        if (!Loaded) return null;
        return React.createElement(Loaded, props);
      },
  };
});

// Mock child components
vi.mock('@/components/language-toggle', () => ({
  LanguageToggle: () => (
    <div data-testid='language-toggle'>Language Toggle</div>
  ),
}));

vi.mock('@/components/layout/logo', () => ({
  Logo: () => <div data-testid='logo'>Logo</div>,
}));

vi.mock('@/components/layout/nav-switcher', () => ({
  __esModule: true,
  default: () => <div data-testid='nav-switcher'>Nav Switcher</div>,
  NavSwitcher: () => <div data-testid='nav-switcher'>Nav Switcher</div>,
}));

vi.mock('@/components/layout/mobile-navigation', () => ({
  MobileNavigation: () => (
    <div data-testid='mobile-navigation'>Mobile Navigation</div>
  ),
}));

vi.mock('@/components/layout/header-client', () => ({
  MobileNavigationIsland: () => (
    <nav data-testid='mobile-navigation'>Mobile Navigation</nav>
  ),
  NavSwitcherIsland: () => <nav data-testid='nav-switcher'>Nav Switcher</nav>,
  LanguageToggleIsland: () => (
    <div data-testid='language-toggle'>Language Toggle</div>
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

describe('Header Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Integration', () => {
    it('should render all child components correctly', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      // Verify all child components are rendered
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByTestId('nav-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
    });

    it('should have correct default structure and classes', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-background');
      expect(header).toHaveClass('w-full');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('sticky');
      expect(header).toHaveClass('top-0');
      expect(header).toHaveClass('z-50');
      expect(header).toHaveClass('transition-all');
      expect(header).toHaveClass('duration-200');
    });

    it('should apply custom className', async () => {
      const customClass = 'custom-header-class';
      await renderAsyncComponent(
        Header({ locale: 'en', className: customClass }),
      );

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(customClass);
    });
  });

  describe('Variant Behavior', () => {
    it('should apply default variant styles', async () => {
      await renderAsyncComponent(Header({ locale: 'en', variant: 'default' }));

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('bg-background');
    });

    it('should apply minimal variant styles', async () => {
      await renderAsyncComponent(Header({ locale: 'en', variant: 'minimal' }));

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('bg-background');
      // Minimal variant hides center nav
      expect(screen.queryByTestId('nav-switcher')).not.toBeInTheDocument();
    });

    it('should apply transparent variant styles', async () => {
      await renderAsyncComponent(
        Header({ locale: 'en', variant: 'transparent' }),
      );

      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
      // Transparent variant applies bg-transparent
      expect(header).toHaveClass('bg-transparent');
    });

    it('should handle sticky prop correctly', async () => {
      await renderAsyncComponent(Header({ locale: 'en', sticky: true }));
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');
    });

    it('should handle sticky=false correctly', async () => {
      await renderAsyncComponent(Header({ locale: 'en', sticky: false }));
      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
    });

    it('should override sticky prop for transparent variant', async () => {
      await renderAsyncComponent(
        Header({ locale: 'en', variant: 'transparent', sticky: true }),
      );

      const header = screen.getByRole('banner');
      // Transparent variant should never be sticky, even if sticky=true
      expect(header).not.toHaveClass('sticky');
    });
  });

  describe('Responsive Behavior', () => {
    it('should contain responsive container', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      const container = screen
        .getByRole('banner')
        .querySelector('.mx-auto.max-w-7xl');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('px-4');
    });

    it('should render both desktop and mobile navigation', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      // Both navigation components should be present
      // (visibility is controlled by CSS classes)
      expect(screen.getByTestId('nav-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('HEADER');
    });

    it('should be keyboard navigable', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      const header = screen.getByRole('banner');

      // Header should be focusable for screen readers
      expect(header).toBeInTheDocument();

      // Child components should handle their own keyboard navigation
      expect(screen.getByTestId('nav-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
    });
  });

  describe('Component Interaction', () => {
    it('should maintain component hierarchy', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      const header = screen.getByRole('banner');
      const container = header.querySelector('.mx-auto.max-w-7xl');

      expect(container).toBeInTheDocument();
      expect(header).toContainElement(container as HTMLElement);

      // All components should be within the container
      const logo = screen.getByTestId('logo');
      const navSwitcher = screen.getByTestId('nav-switcher');
      const mobileNav = screen.getByTestId('mobile-navigation');
      const langToggle = screen.getByTestId('language-toggle');

      expect(container).toContainElement(logo);
      expect(container).toContainElement(navSwitcher);
      expect(container).toContainElement(mobileNav);
      expect(container).toContainElement(langToggle);
    });
  });

  describe('Error Handling', () => {
    it('should render gracefully with default variant', async () => {
      await renderAsyncComponent(Header({ locale: 'en' }));

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      // Should have default variant styles
      expect(header).toHaveClass('sticky');
    });

    it('should handle invalid variant gracefully', async () => {
      await renderAsyncComponent(
        Header({
          locale: 'en',
          variant: 'invalid' as unknown as
            | 'default'
            | 'minimal'
            | 'transparent',
        }),
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      // Should apply default behavior
      expect(header).toHaveClass('sticky');
    });
  });

  describe('Performance', () => {
    it('should render efficiently with different props', async () => {
      // Initial render should work
      await renderAsyncComponent(Header({ locale: 'en' }));
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render minimal variant correctly', async () => {
      await renderAsyncComponent(Header({ locale: 'en', variant: 'minimal' }));
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
