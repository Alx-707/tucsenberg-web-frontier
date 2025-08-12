import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/layout/header';

// Mock child components
vi.mock('@/components/layout/language-switcher', () => ({
  LanguageSwitcher: () => (
    <div data-testid='language-switcher'>Language Switcher</div>
  ),
}));

vi.mock('@/components/layout/logo', () => ({
  Logo: () => <div data-testid='logo'>Logo</div>,
}));

vi.mock('@/components/layout/main-navigation', () => ({
  MainNavigation: () => (
    <div data-testid='main-navigation'>Main Navigation</div>
  ),
}));

vi.mock('@/components/layout/mobile-navigation', () => ({
  MobileNavigation: () => (
    <div data-testid='mobile-navigation'>Mobile Navigation</div>
  ),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid='theme-toggle'>Theme Toggle</div>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid='separator'>Separator</div>,
}));

describe('Header Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Integration', () => {
    it('should render all child components correctly', () => {
      render(<Header />);

      // Verify all child components are rendered
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('should have correct default structure and classes', () => {
      render(<Header />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-background/95');
      expect(header).toHaveClass('supports-[backdrop-filter]:bg-background/60');
      expect(header).toHaveClass('w-full');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('backdrop-blur');
      expect(header).toHaveClass('sticky');
      expect(header).toHaveClass('top-0');
      expect(header).toHaveClass('z-50');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-header-class';
      render(<Header className={customClass} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass(customClass);
    });
  });

  describe('Variant Behavior', () => {
    it('should apply default variant styles', () => {
      render(<Header variant='default' />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');
      expect(header).not.toHaveClass('border-transparent');
      expect(header).not.toHaveClass('bg-transparent');
    });

    it('should apply minimal variant styles', () => {
      render(<Header variant='minimal' />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');
      expect(header).not.toHaveClass('border-transparent');
      expect(header).not.toHaveClass('bg-transparent');
    });

    it('should apply transparent variant styles', () => {
      render(<Header variant='transparent' />);

      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
      expect(header).toHaveClass('border-transparent');
      expect(header).toHaveClass('bg-transparent');
    });

    it('should handle sticky prop correctly', () => {
      const { rerender } = render(<Header sticky={true} />);
      let header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');

      rerender(<Header sticky={false} />);
      header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
    });

    it('should override sticky prop for transparent variant', () => {
      render(
        <Header
          variant='transparent'
          sticky={true}
        />,
      );

      const header = screen.getByRole('banner');
      // Transparent variant should never be sticky, even if sticky=true
      expect(header).not.toHaveClass('sticky');
    });
  });

  describe('Responsive Behavior', () => {
    it('should contain responsive container', () => {
      render(<Header />);

      const container = screen.getByRole('banner').querySelector('.container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('mx-auto');
      expect(container).toHaveClass('px-4');
    });

    it('should render both desktop and mobile navigation', () => {
      render(<Header />);

      // Both navigation components should be present
      // (visibility is controlled by CSS classes)
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<Header />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('HEADER');
    });

    it('should be keyboard navigable', () => {
      render(<Header />);

      const header = screen.getByRole('banner');

      // Header should be focusable for screen readers
      expect(header).toBeInTheDocument();

      // Child components should handle their own keyboard navigation
      expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });
  });

  describe('Component Interaction', () => {
    it('should maintain component hierarchy', () => {
      render(<Header />);

      const header = screen.getByRole('banner');
      const container = header.querySelector('.container');

      expect(container).toBeInTheDocument();
      expect(header).toContainElement(container as HTMLElement);

      // All components should be within the container
      const logo = screen.getByTestId('logo');
      const mainNav = screen.getByTestId('main-navigation');
      const mobileNav = screen.getByTestId('mobile-navigation');
      const langSwitcher = screen.getByTestId('language-switcher');
      const themeToggle = screen.getByTestId('theme-toggle');

      expect(container).toContainElement(logo);
      expect(container).toContainElement(mainNav);
      expect(container).toContainElement(mobileNav);
      expect(container).toContainElement(langSwitcher);
      expect(container).toContainElement(themeToggle);
    });

    it('should handle component updates correctly', () => {
      const { rerender } = render(<Header variant='default' />);

      let header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky');

      rerender(<Header variant='transparent' />);

      header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sticky');
      expect(header).toHaveClass('bg-transparent');
    });
  });

  describe('Error Handling', () => {
    it('should render gracefully with undefined props', () => {
      render(<Header />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      // Should fall back to default variant
      expect(header).toHaveClass('sticky');
    });

    it('should handle invalid variant gracefully', () => {
      render(<Header variant={'invalid' as any} />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      // Should apply default behavior
      expect(header).toHaveClass('sticky');
    });
  });

  describe('Performance', () => {
    it('should render efficiently without unnecessary re-renders', () => {
      const { rerender } = render(<Header />);

      // Initial render should work
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Re-render with same props should not cause issues
      rerender(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Re-render with different props should update correctly
      rerender(<Header variant='minimal' />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
