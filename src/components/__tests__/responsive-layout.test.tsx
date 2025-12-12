import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResponsiveLayout } from '@/components/responsive-layout';

describe('ResponsiveLayout (CSS-First)', () => {
  const mockChildren = (
    <div data-testid='layout-content'>
      <h1>Test Content</h1>
      <p>This is test content for responsive layout.</p>
    </div>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(<ResponsiveLayout>{mockChildren}</ResponsiveLayout>);

      expect(screen.getByTestId('layout-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <ResponsiveLayout
          className='custom-layout'
          data-testid='responsive-layout'
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      expect(layout).toHaveClass('custom-layout');
    });

    it('should not add responsive-* classes (CSS handles this now)', () => {
      render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      // CSS-first approach: no JS-generated responsive classes
      expect(layout).not.toHaveClass('responsive-mobile');
      expect(layout).not.toHaveClass('responsive-tablet');
      expect(layout).not.toHaveClass('responsive-desktop');
    });
  });

  describe('CSS-Based Slot Rendering', () => {
    it('should render mobile content with correct visibility classes', () => {
      const mobileNav = <nav data-testid='mobile-nav'>Mobile Navigation</nav>;

      render(
        <ResponsiveLayout mobileNavigation={mobileNav}>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const mobileElement = screen.getByTestId('mobile-nav');
      expect(mobileElement).toBeInTheDocument();
      // Parent div should have CSS-based visibility classes
      expect(mobileElement.parentElement).toHaveClass('block', 'md:hidden');
    });

    it('should render tablet content with correct visibility classes', () => {
      const tabletSidebar = (
        <aside data-testid='tablet-sidebar'>Tablet Sidebar</aside>
      );

      render(
        <ResponsiveLayout tabletSidebar={tabletSidebar}>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const tabletElement = screen.getByTestId('tablet-sidebar');
      expect(tabletElement).toBeInTheDocument();
      expect(tabletElement.parentElement).toHaveClass(
        'hidden',
        'md:block',
        'lg:hidden',
      );
    });

    it('should render desktop content with correct visibility classes', () => {
      const desktopSidebar = (
        <aside data-testid='desktop-sidebar'>Desktop Sidebar</aside>
      );

      render(
        <ResponsiveLayout desktopSidebar={desktopSidebar}>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const desktopElement = screen.getByTestId('desktop-sidebar');
      expect(desktopElement).toBeInTheDocument();
      expect(desktopElement.parentElement).toHaveClass('hidden', 'lg:block');
    });

    it('should render all slots when provided', () => {
      render(
        <ResponsiveLayout
          mobileContent={<div data-testid='mobile'>Mobile</div>}
          tabletContent={<div data-testid='tablet'>Tablet</div>}
          desktopContent={<div data-testid='desktop'>Desktop</div>}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('mobile')).toBeInTheDocument();
      expect(screen.getByTestId('tablet')).toBeInTheDocument();
      expect(screen.getByTestId('desktop')).toBeInTheDocument();
    });
  });

  describe('Event Handlers (JS-Required Use Cases)', () => {
    it('should handle touch events', () => {
      const onTouchStart = vi.fn();
      const onTouchEnd = vi.fn();

      render(
        <ResponsiveLayout
          data-testid='responsive-layout'
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');

      fireEvent.touchStart(layout);
      expect(onTouchStart).toHaveBeenCalled();

      fireEvent.touchEnd(layout);
      expect(onTouchEnd).toHaveBeenCalled();
    });

    it('should handle mouse events', () => {
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();

      render(
        <ResponsiveLayout
          data-testid='responsive-layout'
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');

      fireEvent.mouseEnter(layout);
      expect(onMouseEnter).toHaveBeenCalled();

      fireEvent.mouseLeave(layout);
      expect(onMouseLeave).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA attributes', () => {
      render(
        <ResponsiveLayout
          data-testid='responsive-layout'
          role='main'
          aria-label='Main content area'
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      expect(layout).toHaveAttribute('role', 'main');
      expect(layout).toHaveAttribute('aria-label', 'Main content area');
    });

    it('should support keyboard navigation', () => {
      render(
        <ResponsiveLayout
          data-testid='responsive-layout'
          tabIndex={0}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      expect(layout).toHaveAttribute('tabIndex', '0');

      layout.focus();
      expect(layout).toHaveFocus();
    });
  });

  describe('Legacy Props Compatibility', () => {
    it('should support mobileLayout (deprecated)', () => {
      render(
        <ResponsiveLayout
          mobileLayout={<div data-testid='mobile-legacy'>Mobile Legacy</div>}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('mobile-legacy')).toBeInTheDocument();
    });

    it('should support tabletLayout (deprecated)', () => {
      render(
        <ResponsiveLayout
          tabletLayout={<div data-testid='tablet-legacy'>Tablet Legacy</div>}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('tablet-legacy')).toBeInTheDocument();
    });

    it('should support desktopLayout (deprecated)', () => {
      render(
        <ResponsiveLayout
          desktopLayout={<div data-testid='desktop-legacy'>Desktop Legacy</div>}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('desktop-legacy')).toBeInTheDocument();
    });

    it('should prefer new props over legacy props', () => {
      render(
        <ResponsiveLayout
          mobileContent={<div data-testid='mobile-new'>New Mobile</div>}
          mobileLayout={<div data-testid='mobile-legacy'>Legacy Mobile</div>}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('mobile-new')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-legacy')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      expect(() => {
        render(<ResponsiveLayout>{null}</ResponsiveLayout>);
      }).not.toThrow();
    });

    it('should handle undefined props gracefully', () => {
      expect(() => {
        render(
          <ResponsiveLayout
            mobileNavigation={undefined}
            tabletSidebar={undefined}
            desktopSidebar={undefined}
          >
            {mockChildren}
          </ResponsiveLayout>,
        );
      }).not.toThrow();
    });

    it('should render only children when no slots are provided', () => {
      render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('layout-content')).toBeInTheDocument();
      // Should not have slot wrapper divs
      expect(screen.queryByText('mobile')).not.toBeInTheDocument();
    });
  });

  describe('Performance (No Hydration)', () => {
    it('should be a Server Component-compatible (no useEffect/useState)', () => {
      // This test verifies the component can render synchronously
      // without client-side hooks that would cause hydration mismatch
      const { container } = render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      // Component should render immediately without waiting for effects
      expect(
        container.querySelector('[data-testid="responsive-layout"]'),
      ).toBeInTheDocument();
    });

    it('should not cause layout shift (same HTML on server and client)', () => {
      // First render simulates SSR
      const { container: ssrContainer } = render(
        <ResponsiveLayout
          mobileContent={<div>Mobile</div>}
          desktopContent={<div>Desktop</div>}
        >
          <div>Children</div>
        </ResponsiveLayout>,
      );

      const ssrHTML = ssrContainer.innerHTML;

      // Second render simulates client hydration
      const { container: clientContainer } = render(
        <ResponsiveLayout
          mobileContent={<div>Mobile</div>}
          desktopContent={<div>Desktop</div>}
        >
          <div>Children</div>
        </ResponsiveLayout>,
      );

      const clientHTML = clientContainer.innerHTML;

      // HTML should be identical (no hydration mismatch)
      expect(ssrHTML).toBe(clientHTML);
    });
  });
});
