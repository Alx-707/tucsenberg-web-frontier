/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '../navigation-menu';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ChevronDownIcon: ({ className, ...props }: React.ComponentProps<'svg'>) => (
    <svg
      data-testid='chevron-down-icon'
      className={className}
      {...props}
    >
      <path d='M6 9l6 6 6-6' />
    </svg>
  ),
}));

// Shared test setup function
function setupIntegrationTest() {
  const user = userEvent.setup();

  // Mock ResizeObserver for all tests
  const mockResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));

  vi.stubGlobal('ResizeObserver', mockResizeObserver);

  return { user, mockResizeObserver };
}

describe('NavigationMenu - Dropdown & State Management', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    const setup = setupIntegrationTest();
    user = setup.user;
  });

  describe('Dropdown Menu Interactions', () => {
    beforeEach(() => {
      // Additional setup for dropdown tests
      vi.clearAllMocks();
    });

    it('opens dropdown menu on trigger click', async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='dropdown-trigger'>
                Products
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='dropdown-content'>
                  <NavigationMenuLink href='/product1'>Product 1</NavigationMenuLink>
                  <NavigationMenuLink href='/product2'>Product 2</NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Initially content should not be visible
      expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();

      // Click trigger to open dropdown
      await user.click(trigger);

      // Content should now be visible
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    });

    it('closes dropdown menu on second trigger click', async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='dropdown-trigger'>
                Products
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='dropdown-content'>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Open dropdown
      await user.click(trigger);
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();

      // Close dropdown with second click
      await user.click(trigger);
      expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();
    });

    it('handles multiple dropdown menus independently', async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='trigger-1'>
                Menu 1
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='content-1'>Content 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='trigger-2'>
                Menu 2
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='content-2'>Content 2</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      // Open first menu
      await user.click(trigger1);
      expect(screen.getByTestId('content-1')).toBeInTheDocument();
      expect(screen.queryByTestId('content-2')).not.toBeInTheDocument();

      // Open second menu (should close first)
      await user.click(trigger2);
      expect(screen.queryByTestId('content-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('content-2')).toBeInTheDocument();
    });
  });

  describe('Navigation State Management', () => {
    it('maintains consistent state across navigation items', async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='trigger-1'>
                Item 1
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='content-1'>Content 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='trigger-2'>
                Item 2
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='content-2'>Content 2</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      // Test state transitions
      await user.click(trigger1);
      expect(trigger1).toHaveAttribute('data-state', 'open');
      expect(trigger2).toHaveAttribute('data-state', 'closed');

      await user.click(trigger2);
      expect(trigger1).toHaveAttribute('data-state', 'closed');
      expect(trigger2).toHaveAttribute('data-state', 'open');
    });

    it('handles controlled state changes', () => {
      const TestComponent = ({ value }: { value?: string }) => (
        <NavigationMenu value={value}>
          <NavigationMenuList>
            <NavigationMenuItem value='item-1'>
              <NavigationMenuTrigger data-testid='trigger-1'>
                Item 1
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='content-1'>Content 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value='item-2'>
              <NavigationMenuTrigger data-testid='trigger-2'>
                Item 2
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div data-testid='content-2'>Content 2</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      const { rerender } = render(<TestComponent />);

      // No content should be visible initially
      expect(screen.queryByTestId('content-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('content-2')).not.toBeInTheDocument();

      // Set value to item-1
      rerender(<TestComponent value='item-1' />);
      expect(screen.getByTestId('content-1')).toBeInTheDocument();
      expect(screen.queryByTestId('content-2')).not.toBeInTheDocument();

      // Change value to item-2
      rerender(<TestComponent value='item-2' />);
      expect(screen.queryByTestId('content-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('content-2')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty navigation menu', () => {
      render(
        <NavigationMenu data-testid='empty-nav'>
          <NavigationMenuList />
        </NavigationMenu>,
      );

      const nav = screen.getByTestId('empty-nav');
      expect(nav).toBeInTheDocument();
    });

    it('handles navigation without viewport', () => {
      render(
        <NavigationMenu viewport={false} data-testid='no-viewport-nav'>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const nav = screen.getByTestId('no-viewport-nav');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('data-viewport', 'false');
    });

    it('handles missing children gracefully', () => {
      render(
        <NavigationMenu data-testid='minimal-nav'>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Minimal</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const nav = screen.getByTestId('minimal-nav');
      expect(nav).toBeInTheDocument();
    });
  });
});
