/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';

describe('Tabs Components', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Tabs', () => {
    it('renders tabs root component', () => {
      render(
        <Tabs
          defaultValue='tab1'
          data-testid='tabs-root'
        >
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>,
      );

      const tabsRoot = screen.getByTestId('tabs-root');
      expect(tabsRoot).toBeInTheDocument();
      expect(tabsRoot).toHaveAttribute('data-slot', 'tabs');
    });

    it('applies default classes', () => {
      render(
        <Tabs
          defaultValue='tab1'
          data-testid='tabs-root'
        >
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>,
      );

      const tabsRoot = screen.getByTestId('tabs-root');
      expect(tabsRoot).toHaveClass('flex', 'flex-col', 'gap-2');
    });

    it('applies custom className', () => {
      render(
        <Tabs
          defaultValue='tab1'
          className='custom-tabs'
          data-testid='tabs-root'
        >
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>,
      );

      const tabsRoot = screen.getByTestId('tabs-root');
      expect(tabsRoot).toHaveClass('custom-tabs');
    });

    it('passes through additional props', () => {
      render(
        <Tabs
          defaultValue='tab1'
          orientation='vertical'
          data-testid='tabs-root'
        >
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>,
      );

      const tabsRoot = screen.getByTestId('tabs-root');
      expect(tabsRoot).toHaveAttribute('data-orientation', 'vertical');
    });

    it('handles controlled value', () => {
      const handleValueChange = vi.fn();

      render(
        <Tabs
          value='tab2'
          onValueChange={handleValueChange}
          data-testid='tabs-root'
        >
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>,
      );

      const tabsRoot = screen.getByTestId('tabs-root');
      expect(tabsRoot).toBeInTheDocument();

      // Tab 2 should be active
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('TabsList', () => {
    it('renders tabs list', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList data-testid='tabs-list'>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>,
      );

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toBeInTheDocument();
      expect(tabsList).toHaveAttribute('data-slot', 'tabs-list');
    });

    it('applies default classes', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList data-testid='tabs-list'>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>,
      );

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toHaveClass(
        'bg-muted',
        'text-muted-foreground',
        'inline-flex',
        'h-9',
        'w-fit',
        'items-center',
        'justify-center',
        'rounded-lg',
      );
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList
            className='custom-list'
            data-testid='tabs-list'
          >
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>,
      );

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toHaveClass('custom-list');
    });

    it('contains tab triggers', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList data-testid='tabs-list'>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
            <TabsTrigger value='tab3'>Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
          <TabsContent value='tab3'>Content 3</TabsContent>
        </Tabs>,
      );

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toBeInTheDocument();

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });
  });

  describe('TabsTrigger', () => {
    it('renders tabs trigger', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='tab-trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              data-testid='tab-trigger-2'
            >
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>,
      );

      const trigger1 = screen.getByTestId('tab-trigger-1');
      const trigger2 = screen.getByTestId('tab-trigger-2');

      expect(trigger1).toBeInTheDocument();
      expect(trigger1).toHaveAttribute('data-slot', 'tabs-trigger');
      expect(trigger1).toHaveTextContent('Tab 1');

      expect(trigger2).toBeInTheDocument();
      expect(trigger2).toHaveTextContent('Tab 2');
    });

    it('applies default classes', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='tab-trigger'
            >
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>,
      );

      const trigger = screen.getByTestId('tab-trigger');
      expect(trigger).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'gap-1.5',
        'rounded-md',
        'border',
        'border-transparent',
        'px-2',
        'py-1',
        'text-sm',
        'font-medium',
        'whitespace-nowrap',
      );
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              className='custom-trigger'
              data-testid='tab-trigger'
            >
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
        </Tabs>,
      );

      const trigger = screen.getByTestId('tab-trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('shows active state for selected tab', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='tab-trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              data-testid='tab-trigger-2'
            >
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>,
      );

      const trigger1 = screen.getByTestId('tab-trigger-1');
      const trigger2 = screen.getByTestId('tab-trigger-2');

      expect(trigger1).toHaveAttribute('data-state', 'active');
      expect(trigger2).toHaveAttribute('data-state', 'inactive');
    });

    it('handles click to switch tabs', async () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='tab-trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              data-testid='tab-trigger-2'
            >
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            data-testid='content-1'
          >
            Content 1
          </TabsContent>
          <TabsContent
            value='tab2'
            data-testid='content-2'
          >
            Content 2
          </TabsContent>
        </Tabs>,
      );

      const trigger2 = screen.getByTestId('tab-trigger-2');

      // Initially tab 1 content should be visible (active)
      expect(screen.getByTestId('content-1')).toBeInTheDocument();
      expect(screen.getByTestId('content-1')).toHaveAttribute(
        'data-state',
        'active',
      );
      expect(screen.getByTestId('content-2')).toBeInTheDocument();
      expect(screen.getByTestId('content-2')).toHaveAttribute(
        'data-state',
        'inactive',
      );
      expect(screen.getByTestId('content-2')).toHaveAttribute('hidden');

      // Click tab 2
      await user.click(trigger2);

      // Now tab 2 content should be active
      await waitFor(() => {
        expect(screen.getByTestId('content-1')).toHaveAttribute(
          'data-state',
          'inactive',
        );
        expect(screen.getByTestId('content-1')).toHaveAttribute('hidden');
        expect(screen.getByTestId('content-2')).toHaveAttribute(
          'data-state',
          'active',
        );
        expect(screen.getByTestId('content-2')).not.toHaveAttribute('hidden');
      });
    });

    it('supports disabled state', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='tab-trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              disabled
              data-testid='tab-trigger-2'
            >
              Tab 2 (Disabled)
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>,
      );

      const trigger2 = screen.getByTestId('tab-trigger-2');
      expect(trigger2).toBeDisabled();
      expect(trigger2).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:opacity-50',
      );
    });
  });

  describe('TabsContent', () => {
    it('renders tabs content', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            data-testid='content-1'
          >
            <div>This is content for tab 1</div>
          </TabsContent>
          <TabsContent
            value='tab2'
            data-testid='content-2'
          >
            <div>This is content for tab 2</div>
          </TabsContent>
        </Tabs>,
      );

      const content1 = screen.getByTestId('content-1');
      expect(content1).toBeInTheDocument();
      expect(content1).toHaveAttribute('data-slot', 'tabs-content');
      expect(content1).toHaveTextContent('This is content for tab 1');

      // Content 2 should be in DOM but hidden initially
      const content2 = screen.getByTestId('content-2');
      expect(content2).toBeInTheDocument();
      expect(content2).toHaveAttribute('hidden');
    });

    it('applies default classes', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            data-testid='content-1'
          >
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByTestId('content-1');
      expect(content).toHaveClass('flex-1', 'outline-none');
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            className='custom-content'
            data-testid='content-1'
          >
            Content 1
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByTestId('content-1');
      expect(content).toHaveClass('custom-content');
    });

    it('shows only active tab content', async () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              data-testid='trigger-2'
            >
              Tab 2
            </TabsTrigger>
            <TabsTrigger
              value='tab3'
              data-testid='trigger-3'
            >
              Tab 3
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            data-testid='content-1'
          >
            Content 1
          </TabsContent>
          <TabsContent
            value='tab2'
            data-testid='content-2'
          >
            Content 2
          </TabsContent>
          <TabsContent
            value='tab3'
            data-testid='content-3'
          >
            Content 3
          </TabsContent>
        </Tabs>,
      );

      // Initially only content 1 should be active
      expect(screen.getByTestId('content-1')).toBeInTheDocument();
      expect(screen.getByTestId('content-1')).toHaveAttribute(
        'data-state',
        'active',
      );
      expect(screen.getByTestId('content-2')).toBeInTheDocument();
      expect(screen.getByTestId('content-2')).toHaveAttribute('hidden');
      expect(screen.getByTestId('content-3')).toBeInTheDocument();
      expect(screen.getByTestId('content-3')).toHaveAttribute('hidden');

      // Click tab 2
      await user.click(screen.getByTestId('trigger-2'));

      await waitFor(() => {
        expect(screen.getByTestId('content-1')).toHaveAttribute('hidden');
        expect(screen.getByTestId('content-2')).toHaveAttribute(
          'data-state',
          'active',
        );
        expect(screen.getByTestId('content-3')).toHaveAttribute('hidden');
      });

      // Click tab 3
      await user.click(screen.getByTestId('trigger-3'));

      await waitFor(() => {
        expect(screen.getByTestId('content-1')).toHaveAttribute('hidden');
        expect(screen.getByTestId('content-2')).toHaveAttribute('hidden');
        expect(screen.getByTestId('content-3')).toHaveAttribute(
          'data-state',
          'active',
        );
      });
    });

    it('handles complex content', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            data-testid='content-1'
          >
            <div>
              <h2>Complex Content</h2>
              <p>This is a paragraph</p>
              <button>A button</button>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>,
      );

      const content = screen.getByTestId('content-1');
      expect(content).toBeInTheDocument();
      expect(screen.getByText('Complex Content')).toBeInTheDocument();
      expect(screen.getByText('This is a paragraph')).toBeInTheDocument();
      expect(screen.getByText('A button')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.getByText('List item 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList data-testid='tabs-list'>
            <TabsTrigger
              value='tab1'
              data-testid='trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              data-testid='trigger-2'
            >
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            data-testid='content-1'
          >
            Content 1
          </TabsContent>
          <TabsContent
            value='tab2'
            data-testid='content-2'
          >
            Content 2
          </TabsContent>
        </Tabs>,
      );

      const tabsList = screen.getByTestId('tabs-list');
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      expect(tabsList).toHaveAttribute('role', 'tablist');
      expect(trigger1).toHaveAttribute('role', 'tab');
      expect(trigger2).toHaveAttribute('role', 'tab');
      expect(trigger1).toHaveAttribute('aria-selected', 'true');
      expect(trigger2).toHaveAttribute('aria-selected', 'false');
    });

    it('supports keyboard navigation', async () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              data-testid='trigger-2'
            >
              Tab 2
            </TabsTrigger>
            <TabsTrigger
              value='tab3'
              data-testid='trigger-3'
            >
              Tab 3
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value='tab1'
            data-testid='content-1'
          >
            Content 1
          </TabsContent>
          <TabsContent
            value='tab2'
            data-testid='content-2'
          >
            Content 2
          </TabsContent>
          <TabsContent
            value='tab3'
            data-testid='content-3'
          >
            Content 3
          </TabsContent>
        </Tabs>,
      );

      const trigger1 = screen.getByTestId('trigger-1');

      // Focus first tab
      trigger1.focus();
      expect(trigger1).toHaveFocus();

      // Use arrow keys to navigate
      await user.keyboard('{ArrowRight}');

      const trigger2 = screen.getByTestId('trigger-2');
      expect(trigger2).toHaveFocus();

      // Activate with Enter or Space
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('content-2')).toBeInTheDocument();
      });
    });

    it('handles focus management correctly', async () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger
              value='tab1'
              data-testid='trigger-1'
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value='tab2'
              data-testid='trigger-2'
            >
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>
            <button data-testid='content-button-1'>Button in content 1</button>
          </TabsContent>
          <TabsContent value='tab2'>
            <button data-testid='content-button-2'>Button in content 2</button>
          </TabsContent>
        </Tabs>,
      );

      // Tab to first trigger
      await user.tab();
      expect(screen.getByTestId('trigger-1')).toHaveFocus();

      // Tab to content - focus may be on TabsContent container first
      await user.tab();
      // In Radix UI, focus goes to TabsContent container first, then to focusable elements inside
      const focusedElement = document.activeElement;
      const contentButton = screen.getByTestId('content-button-1');

      // Either the button has focus directly, or the TabsContent container has focus
      expect(
        focusedElement === contentButton ||
          focusedElement?.contains(contentButton),
      ).toBe(true);
    });
  });

  describe('Integration', () => {
    it('works with complex tab structure', async () => {
      render(
        <Tabs
          defaultValue='overview'
          data-testid='main-tabs'
        >
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='reports'>Reports</TabsTrigger>
            <TabsTrigger value='notifications'>Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value='overview'>
            <div>
              <h2>Overview Dashboard</h2>
              <p>Welcome to your dashboard overview.</p>
            </div>
          </TabsContent>

          <TabsContent value='analytics'>
            <div>
              <h2>Analytics</h2>
              <p>View your analytics data here.</p>
            </div>
          </TabsContent>

          <TabsContent value='reports'>
            <div>
              <h2>Reports</h2>
              <p>Generate and view reports.</p>
            </div>
          </TabsContent>

          <TabsContent value='notifications'>
            <div>
              <h2>Notifications</h2>
              <p>Manage your notifications.</p>
            </div>
          </TabsContent>
        </Tabs>,
      );

      const mainTabs = screen.getByTestId('main-tabs');
      expect(mainTabs).toBeInTheDocument();

      // Check all tabs are present
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();

      // Check initial content
      expect(screen.getByText('Overview Dashboard')).toBeInTheDocument();

      // Switch to analytics
      await user.click(screen.getByText('Analytics'));

      await waitFor(() => {
        expect(
          screen.getByText('View your analytics data here.'),
        ).toBeInTheDocument();
      });
    });

    it('handles nested interactive elements', async () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>

          <TabsContent value='tab1'>
            <div>
              <input
                data-testid='input-1'
                placeholder='Input in tab 1'
              />
              <button data-testid='button-1'>Button in tab 1</button>
            </div>
          </TabsContent>

          <TabsContent value='tab2'>
            <div>
              <input
                data-testid='input-2'
                placeholder='Input in tab 2'
              />
              <button data-testid='button-2'>Button in tab 2</button>
            </div>
          </TabsContent>
        </Tabs>,
      );

      // Interact with elements in first tab
      const input1 = screen.getByTestId('input-1');
      await user.type(input1, 'Hello');
      expect(input1).toHaveValue('Hello');

      // Switch to second tab
      await user.click(screen.getByText('Tab 2'));

      await waitFor(() => {
        const input2 = screen.getByTestId('input-2');
        expect(input2).toBeInTheDocument();
      });

      // Interact with elements in second tab
      const input2 = screen.getByTestId('input-2');
      await user.type(input2, 'World');
      expect(input2).toHaveValue('World');
    });
  });

  describe('Edge Cases', () => {
    it('handles tabs without content', () => {
      render(
        <Tabs defaultValue='tab1'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>,
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('handles empty tabs list', () => {
      render(
        <Tabs
          defaultValue='tab1'
          data-testid='empty-tabs'
        >
          <TabsList data-testid='empty-list' />
        </Tabs>,
      );

      const tabs = screen.getByTestId('empty-tabs');
      const list = screen.getByTestId('empty-list');

      expect(tabs).toBeInTheDocument();
      expect(list).toBeInTheDocument();
    });

    it('handles single tab', () => {
      render(
        <Tabs defaultValue='only-tab'>
          <TabsList>
            <TabsTrigger value='only-tab'>Only Tab</TabsTrigger>
          </TabsList>
          <TabsContent value='only-tab'>Only Content</TabsContent>
        </Tabs>,
      );

      expect(screen.getByText('Only Tab')).toBeInTheDocument();
      expect(screen.getByText('Only Content')).toBeInTheDocument();
    });

    it('handles tabs with no default value', () => {
      render(
        <Tabs data-testid='no-default-tabs'>
          <TabsList>
            <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
            <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </Tabs>,
      );

      const tabs = screen.getByTestId('no-default-tabs');
      expect(tabs).toBeInTheDocument();

      // No content should be visible initially
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });
  });
});
