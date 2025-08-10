import { TEST_COUNTS } from '@/constants/test-constants';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock hooks with vi.hoisted
const mockUseBreakpoint = vi.hoisted(() => vi.fn());
const mockUseReducedMotion = vi.hoisted(() => vi.fn());

// Default mock return values
const defaultBreakpointReturn = {
  currentBreakpoint: 'md' as const,
  isAbove: vi.fn(() => false),
  isBelow: vi.fn(() => false),
  isExactly: vi.fn(() => true),
  width: 768,
};

mockUseBreakpoint.mockReturnValue(defaultBreakpointReturn);
mockUseReducedMotion.mockReturnValue(false);

vi.mock('@/hooks/use-breakpoint', () => ({
  useBreakpoint: mockUseBreakpoint,
}));

vi.mock('@/hooks/use-reduced-motion', () => ({
  useReducedMotion: mockUseReducedMotion,
}));

import { ResponsiveLayout } from '../responsive-layout';

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

mockResizeObserver.mockImplementation(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

Object.defineProperty(global, 'ResizeObserver', {
  value: mockResizeObserver,
  writable: true,
});

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
});

describe('ResponsiveLayout', () => {
  const defaultBreakpointData = {
    currentBreakpoint: 'lg' as const,
    isAbove: vi.fn(() => false),
    isBelow: vi.fn(() => false),
    isExactly: vi.fn(() => true),
    width: 1280,
  };

  const mockChildren = (
    <div data-testid='layout-content'>
      <h1>Test Content</h1>
      <p>This is test content for responsive layout.</p>
    </div>
  );

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseBreakpoint.mockReturnValue(defaultBreakpointData);
    mockUseReducedMotion.mockReturnValue(false);

    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染', () => {
    it('should render children correctly', () => {
      render(<ResponsiveLayout>{mockChildren}</ResponsiveLayout>);

      expect(screen.getByTestId('layout-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply default responsive classes', () => {
      render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      // With default mock (md breakpoint), should have tablet class
      expect(layout).toHaveClass('responsive-tablet');
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
  });

  describe('移动端布局', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({
        currentBreakpoint: 'sm',
        isAbove: vi.fn(() => false),
        isBelow: vi.fn((breakpoint) => breakpoint === 'md'), // isBelow('md') = true for mobile
        isExactly: vi.fn((breakpoint) => breakpoint === 'sm'),
        width: 375,
      });
    });

    it('should apply mobile-specific classes', () => {
      render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      expect(layout).toHaveClass('responsive-mobile');
    });

    it('should render mobile navigation when provided', () => {
      const mobileNav = <nav data-testid='mobile-nav'>Mobile Navigation</nav>;

      render(
        <ResponsiveLayout mobileNavigation={mobileNav}>
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });

    it('should handle touch events on mobile', () => {
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
  });

  describe('平板端布局', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({
        currentBreakpoint: 'md',
        isAbove: vi.fn(() => false),
        isBelow: vi.fn(() => false), // isBelow('md') = false for tablet
        isExactly: vi.fn((breakpoint) => breakpoint === 'md'),
        width: 768,
      });
    });

    it('should apply tablet-specific classes', () => {
      render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      expect(layout).toHaveClass('responsive-tablet');
    });

    it('should render tablet sidebar when provided', () => {
      const tabletSidebar = (
        <aside data-testid='tablet-sidebar'>Tablet Sidebar</aside>
      );

      render(
        <ResponsiveLayout tabletSidebar={tabletSidebar}>
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('tablet-sidebar')).toBeInTheDocument();
    });
  });

  describe('桌面端布局', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({
        currentBreakpoint: 'xl',
        isAbove: vi.fn((breakpoint) => breakpoint === 'lg'), // isAbove('lg') = true for desktop
        isBelow: vi.fn(() => false),
        isExactly: vi.fn((breakpoint) => breakpoint === 'xl'),
        width: 1280,
      });
    });

    it('should apply desktop-specific classes', () => {
      render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      expect(layout).toHaveClass('responsive-desktop');
    });

    it('should render desktop sidebar when provided', () => {
      const desktopSidebar = (
        <aside data-testid='desktop-sidebar'>Desktop Sidebar</aside>
      );

      render(
        <ResponsiveLayout desktopSidebar={desktopSidebar}>
          {mockChildren}
        </ResponsiveLayout>,
      );

      expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
    });

    it('should handle mouse events on desktop', () => {
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

  describe('响应式断点变化', () => {
    it('should update layout when breakpoint changes', async () => {
      const { rerender } = render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      // Initially desktop
      expect(screen.getByTestId('responsive-layout')).toHaveClass(
        'desktop-layout',
      );

      // Change to mobile
      mockUseBreakpoint.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        currentBreakpoint: 'mobile',
        width: 375,
        height: 667,
      });

      rerender(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('responsive-layout')).toHaveClass(
          'mobile-layout',
        );
      });
    });

    it('should trigger layout change callback', async () => {
      const onLayoutChange = vi.fn();

      const { rerender } = render(
        <ResponsiveLayout
          data-testid='responsive-layout'
          onLayoutChange={onLayoutChange}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      // Change breakpoint
      mockUseBreakpoint.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        currentBreakpoint: 'mobile',
        width: 375,
        height: 667,
      });

      rerender(
        <ResponsiveLayout
          data-testid='responsive-layout'
          onLayoutChange={onLayoutChange}
        >
          {mockChildren}
        </ResponsiveLayout>,
      );

      await waitFor(() => {
        expect(onLayoutChange).toHaveBeenCalledWith('mobile');
      });
    });
  });

  describe('无障碍功能', () => {
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

    it('should handle reduced motion preference', () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      const layout = screen.getByTestId('responsive-layout');
      expect(layout).toHaveClass('reduced-motion');
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

  describe('性能优化', () => {
    it('should memoize layout calculations', () => {
      const { rerender } = render(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      // Rerender with same props
      rerender(
        <ResponsiveLayout data-testid='responsive-layout'>
          {mockChildren}
        </ResponsiveLayout>,
      );

      // Should not cause unnecessary re-calculations
      expect(mockUseBreakpoint).toHaveBeenCalledTimes(TEST_COUNTS.SMALL_LOOP); // Once per render
    });

    it('should cleanup observers on unmount', () => {
      const { unmount } = render(
        <ResponsiveLayout>{mockChildren}</ResponsiveLayout>,
      );

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('边缘情况处理', () => {
    it('should handle missing breakpoint data', () => {
      mockUseBreakpoint.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        currentBreakpoint: 'unknown',
        width: 0,
        height: 0,
      });

      expect(() => {
        render(<ResponsiveLayout>{mockChildren}</ResponsiveLayout>);
      }).not.toThrow();
    });

    it('should handle ResizeObserver errors gracefully', () => {
      mockResizeObserver.mockImplementation(() => {
        throw new Error('ResizeObserver failed');
      });

      expect(() => {
        render(<ResponsiveLayout>{mockChildren}</ResponsiveLayout>);
      }).not.toThrow();
    });

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
  });
});
