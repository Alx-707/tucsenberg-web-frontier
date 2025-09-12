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
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger
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
function setupAccessibilityTest() {
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

describe('NavigationMenu - ARIA & Accessibility', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    const setup = setupAccessibilityTest();
    user = setup.user;
  });

  describe('ARIA Attributes', () => {
    it('provides proper ARIA attributes', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='trigger'>
                Products
              </NavigationMenuTrigger>
              <NavigationMenuContent data-testid='content'>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('data-state', 'closed');
    });

    it('updates ARIA attributes when menu opens', async () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid='trigger'>
                Products
              </NavigationMenuTrigger>
              <NavigationMenuContent data-testid='content'>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const trigger = screen.getByTestId('trigger');

      // Click to open menu
      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('maintains ARIA state consistency', async () => {
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

      // Open first menu
      await user.click(trigger1);
      expect(trigger1).toHaveAttribute('aria-expanded', 'true');
      expect(trigger2).toHaveAttribute('aria-expanded', 'false');

      // Open second menu (should close first)
      await user.click(trigger2);
      expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    });
  });



  describe('NavigationMenuIndicator', () => {
    it('renders navigation menu indicator when menu is active', () => {
      render(
        <NavigationMenu defaultValue='item-1'>
          <NavigationMenuList>
            <NavigationMenuItem value='item-1'>
              <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuIndicator data-testid='indicator' />
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const indicator = screen.getByTestId('indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('component is defined and can be imported', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
            </NavigationMenuItem>
            <NavigationMenuIndicator data-testid='indicator' />
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const indicator = screen.getByTestId('indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('accepts className prop', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
            </NavigationMenuItem>
            <NavigationMenuIndicator
              className='custom-indicator'
              data-testid='indicator'
            />
          </NavigationMenuList>
        </NavigationMenu>,
      );

      const indicator = screen.getByTestId('indicator');
      expect(indicator).toHaveClass('custom-indicator');
    });
  });
});
