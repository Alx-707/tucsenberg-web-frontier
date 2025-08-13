import { TEST_COUNT_CONSTANTS, TEST_COUNTS } from '@/constants/test-constants';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
// Import after mocks
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from '../dropdown-menu';

// Use vi.hoisted to ensure proper mock setup
const { mockRadixComponents, mockLucideIcons } = vi.hoisted(() => ({
  mockRadixComponents: {
    Root: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-root'
        {...props}
      >
        {children}
      </div>
    ),
    Portal: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-portal'
        {...props}
      >
        {children}
      </div>
    ),
    Trigger: ({ children, ...props }: any) => (
      <button
        data-testid='dropdown-trigger'
        {...props}
      >
        {children}
      </button>
    ),
    Content: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-content'
        {...props}
      >
        {children}
      </div>
    ),
    Group: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-group'
        {...props}
      >
        {children}
      </div>
    ),
    Item: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-item'
        role='menuitem'
        {...props}
      >
        {children}
      </div>
    ),
    CheckboxItem: ({ children, checked, ...props }: any) => (
      <div
        data-testid='dropdown-checkbox-item'
        role='menuitemcheckbox'
        aria-checked={checked}
        {...props}
      >
        {children}
      </div>
    ),
    RadioGroup: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-radio-group'
        role='radiogroup'
        {...props}
      >
        {children}
      </div>
    ),
    RadioItem: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-radio-item'
        role='menuitemradio'
        aria-checked='false'
        {...props}
      >
        {children}
      </div>
    ),
    ItemIndicator: ({ children, ...props }: any) => (
      <span
        data-testid='dropdown-indicator'
        {...props}
      >
        {children}
      </span>
    ),
    Label: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-label'
        {...props}
      >
        {children}
      </div>
    ),
    Separator: ({ ...props }: any) => (
      <div
        data-testid='dropdown-separator'
        role='separator'
        {...props}
      />
    ),
    Sub: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-sub'
        {...props}
      >
        {children}
      </div>
    ),
    SubTrigger: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-sub-trigger'
        {...props}
      >
        {children}
      </div>
    ),
    SubContent: ({ children, ...props }: any) => (
      <div
        data-testid='dropdown-sub-content'
        {...props}
      >
        {children}
      </div>
    ),
  },
  mockLucideIcons: {
    CheckIcon: ({ className }: any) => (
      <span
        data-testid='check-icon'
        className={className}
      >
        ✓
      </span>
    ),
    ChevronRightIcon: ({ className }: any) => (
      <span
        data-testid='chevron-right-icon'
        className={className}
      >
        →
      </span>
    ),
    CircleIcon: ({ className }: any) => (
      <span
        data-testid='circle-icon'
        className={className}
      >
        ●
      </span>
    ),
  },
}));

// Mock Radix UI components
vi.mock('@radix-ui/react-dropdown-menu', () => mockRadixComponents);

// Mock Lucide icons
vi.mock('lucide-react', () => mockLucideIcons);

describe('DropdownMenu Components', () => {
  describe('DropdownMenu', () => {
    it('renders dropdown menu root', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>,
      );

      const root = screen.getByTestId('dropdown-root');
      expect(root).toBeInTheDocument();
      expect(root).toHaveAttribute('data-slot', 'dropdown-menu');
    });

    it('passes through props to root', () => {
      render(
        <DropdownMenu data-custom='test-value'>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>,
      );

      const root = screen.getByTestId('dropdown-root');
      expect(root).toHaveAttribute('data-custom', 'test-value');
    });
  });

  describe('DropdownMenuPortal', () => {
    it('renders portal component', () => {
      render(
        <DropdownMenuPortal>
          <div data-testid='portal-content'>Portal Content</div>
        </DropdownMenuPortal>,
      );

      const portal = screen.getByTestId('dropdown-portal');
      const content = screen.getByTestId('portal-content');

      expect(portal).toBeInTheDocument();
      expect(portal).toHaveAttribute('data-slot', 'dropdown-menu-portal');
      expect(content).toBeInTheDocument();
    });

    it('passes through props to portal', () => {
      render(
        <DropdownMenuPortal className='custom-portal' data-custom='test-value'>
          <div>Portal Content</div>
        </DropdownMenuPortal>,
      );

      const portal = screen.getByTestId('dropdown-portal');
      expect(portal).toHaveClass('custom-portal');
      expect(portal).toHaveAttribute('data-custom', 'test-value');
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('renders trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger');
      expect(trigger).toHaveTextContent('Open Menu');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger onClick={handleClick}>Open</DropdownMenuTrigger>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports asChild prop', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>Custom Trigger</div>
          </DropdownMenuTrigger>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Custom Trigger');
    });
  });

  describe('DropdownMenuContent', () => {
    it('renders content with default props', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('dropdown-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute('data-slot', 'dropdown-menu-content');
      expect(content).toHaveAttribute('sideOffset', '4');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className='custom-content'>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveClass('custom-content');
    });

    it('supports custom sideOffset', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={8}>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveAttribute('sideOffset', '8');
    });

    it('renders within portal', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const portal = screen.getByTestId('dropdown-portal');
      const content = screen.getByTestId('dropdown-content');

      expect(portal).toBeInTheDocument();
      expect(portal).toContainElement(content);
    });
  });

  describe('DropdownMenuItem', () => {
    it('renders menu item with default variant', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Default Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveAttribute('data-slot', 'dropdown-menu-item');
      expect(item).toHaveAttribute('data-variant', 'default');
      expect(item).toHaveTextContent('Default Item');
    });

    it('renders destructive variant', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant='destructive'>
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-item');
      expect(item).toHaveAttribute('data-variant', 'destructive');
    });

    it('applies inset styling', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-item');
      expect(item).toHaveAttribute('data-inset', 'true');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();

      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleClick}>
              Clickable Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-item');
      fireEvent.click(item);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports disabled state', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-item');
      expect(item).toHaveAttribute('disabled', '');
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('renders checkbox item', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-checkbox-item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveAttribute('data-slot', 'dropdown-menu-checkbox-item');
      expect(item).toHaveAttribute('aria-checked', 'false');
    });

    it('shows check indicator when checked', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-checkbox-item');
      const indicator = screen.getByTestId('dropdown-indicator');
      const checkIcon = screen.getByTestId('check-icon');

      expect(item).toHaveAttribute('aria-checked', 'true');
      expect(indicator).toBeInTheDocument();
      expect(checkIcon).toBeInTheDocument();
    });

    it('handles undefined checked state', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>
              Undefined Checked
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-checkbox-item');
      expect(item).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('DropdownMenuRadioGroup and RadioItem', () => {
    it('renders radio group', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value='option1'>
              <DropdownMenuRadioItem value='option1'>
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='option2'>
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const radioGroup = screen.getByTestId('dropdown-radio-group');
      expect(radioGroup).toBeInTheDocument();
      expect(radioGroup).toHaveAttribute(
        'data-slot',
        'dropdown-menu-radio-group',
      );
      expect(radioGroup).toHaveAttribute('value', 'option1');
    });

    it('renders radio items', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value='option1'>
                Option 1
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const radioItem = screen.getByTestId('dropdown-radio-item');
      const indicator = screen.getByTestId('dropdown-indicator');
      const circleIcon = screen.getByTestId('circle-icon');

      expect(radioItem).toBeInTheDocument();
      expect(radioItem).toHaveAttribute(
        'data-slot',
        'dropdown-menu-radio-item',
      );
      expect(radioItem).toHaveAttribute('value', 'option1');
      expect(indicator).toBeInTheDocument();
      expect(circleIcon).toBeInTheDocument();
    });
  });

  describe('DropdownMenuLabel', () => {
    it('renders label', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const label = screen.getByTestId('dropdown-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('data-slot', 'dropdown-menu-label');
      expect(label).toHaveTextContent('Menu Label');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className='custom-label'>
              Custom Label
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const label = screen.getByTestId('dropdown-label');
      expect(label).toHaveClass('custom-label');
    });

    it('supports inset prop', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const label = screen.getByTestId('dropdown-label');
      expect(label).toHaveAttribute('data-inset', 'true');
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('renders separator', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const separator = screen.getByTestId('dropdown-separator');
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveAttribute('data-slot', 'dropdown-menu-separator');
      expect(separator).toHaveAttribute('role', 'separator');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator className='custom-separator' />
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const separator = screen.getByTestId('dropdown-separator');
      expect(separator).toHaveClass('custom-separator');
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('renders shortcut', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Copy
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const shortcut = screen.getByText('⌘C');
      expect(shortcut).toBeInTheDocument();
      expect(shortcut).toHaveAttribute('data-slot', 'dropdown-menu-shortcut');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Paste
              <DropdownMenuShortcut className='custom-shortcut'>
                ⌘V
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const shortcut = screen.getByText('⌘V');
      expect(shortcut).toHaveClass('custom-shortcut');
    });
  });

  describe('DropdownMenuGroup', () => {
    it('renders group', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Grouped Item 1</DropdownMenuItem>
              <DropdownMenuItem>Grouped Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const group = screen.getByTestId('dropdown-group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('data-slot', 'dropdown-menu-group');
    });
  });

  describe('DropdownMenuSub Components', () => {
    it('renders sub menu', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const sub = screen.getByTestId('dropdown-sub');
      const subTrigger = screen.getByTestId('dropdown-sub-trigger');
      const subContent = screen.getByTestId('dropdown-sub-content');

      expect(sub).toBeInTheDocument();
      expect(sub).toHaveAttribute('data-slot', 'dropdown-menu-sub');
      expect(subTrigger).toHaveAttribute(
        'data-slot',
        'dropdown-menu-sub-trigger',
      );
      expect(subContent).toHaveAttribute(
        'data-slot',
        'dropdown-menu-sub-content',
      );
    });

    it('shows chevron icon in sub trigger', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const chevronIcon = screen.getByTestId('chevron-right-icon');
      expect(chevronIcon).toBeInTheDocument();
    });

    it('supports inset prop on sub trigger', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>
                Inset Sub Trigger
              </DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const subTrigger = screen.getByTestId('dropdown-sub-trigger');
      expect(subTrigger).toHaveAttribute('data-inset', 'true');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      const items = screen.getAllByTestId('dropdown-item');

      expect(trigger).toBeInTheDocument();
      expect(items).toHaveLength(TEST_COUNT_CONSTANTS.SMALL);
      expect(items[0]).toHaveAttribute('role', 'menuitem');
    });

    it('supports ARIA attributes', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger aria-label='Open menu'>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toHaveAttribute('aria-label', 'Open menu');
    });

    it('handles disabled items correctly', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const item = screen.getByTestId('dropdown-item');
      expect(item).toHaveAttribute('disabled', '');
    });
  });

  describe('Complex Menu Structure', () => {
    it('renders complete menu with all components', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Complete Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Copy
                <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Paste
                <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={true}>
              Show Toolbar
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value='light'>
              <DropdownMenuRadioItem value='light'>Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='dark'>Dark</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      expect(screen.getByTestId('dropdown-label')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-group')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-separator')).toHaveLength(
        TEST_COUNTS.SMALL,
      );
      expect(screen.getByTestId('dropdown-checkbox-item')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-radio-group')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-sub')).toBeInTheDocument();
    });
  });
});
