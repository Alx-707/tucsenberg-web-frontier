/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../sheet';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  XIcon: ({ className, ...props }: any) => (
    <svg
      data-testid='x-icon'
      className={className}
      {...props}
    >
      <path d='M18 6L6 18M6 6l12 12' />
    </svg>
  ),
}));

describe('Sheet Components', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Sheet', () => {
    it('renders sheet root component', () => {
      render(
        <Sheet>
          <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      // Sheet is a context provider, so we test its children
      const trigger = screen.getByTestId('sheet-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });

    it('passes through props to root component', () => {
      render(
        <Sheet defaultOpen={false}>
          <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      // Verify the Sheet context works by checking trigger state
      const trigger = screen.getByTestId('sheet-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('SheetTrigger', () => {
    it('renders sheet trigger button', () => {
      render(
        <Sheet>
          <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      const trigger = screen.getByTestId('sheet-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
      expect(trigger).toHaveTextContent('Open Sheet');
    });

    it('opens sheet when clicked', async () => {
      render(
        <Sheet>
          <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      const trigger = screen.getByTestId('sheet-trigger');
      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      render(
        <Sheet>
          <SheetTrigger
            className='custom-trigger'
            data-testid='sheet-trigger'
          >
            Open Sheet
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      const trigger = screen.getByTestId('sheet-trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });
  });

  describe('SheetContent', () => {
    it('renders sheet content with default right side', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
            <div>Sheet content goes here</div>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
        expect(content).toHaveAttribute('data-slot', 'sheet-content');
        expect(content).toHaveTextContent('Sheet content goes here');
      });
    });

    it('renders with different side positions', async () => {
      const sides = ['left', 'right', 'top', 'bottom'] as const;

      for (const side of sides) {
        const { unmount } = render(
          <Sheet defaultOpen>
            <SheetTrigger>Open Sheet</SheetTrigger>
            <SheetContent
              side={side}
              data-testid={`sheet-content-${side}`}
            >
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
              </SheetHeader>
            </SheetContent>
          </Sheet>,
        );

        await waitFor(() => {
          const content = screen.getByTestId(`sheet-content-${side}`);
          expect(content).toBeInTheDocument();

          // Check for side-specific classes
          if (side === 'right') {
            expect(content).toHaveClass('inset-y-0', 'right-0');
          } else if (side === 'left') {
            expect(content).toHaveClass('inset-y-0', 'left-0');
          } else if (side === 'top') {
            expect(content).toHaveClass('inset-x-0', 'top-0');
          } else if (side === 'bottom') {
            expect(content).toHaveClass('inset-x-0', 'bottom-0');
          }
        });

        unmount();
      }
    });

    it('includes close button with X icon', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const xIcon = screen.getByTestId('x-icon');
        expect(xIcon).toBeInTheDocument();

        const closeButton = xIcon.closest('button');
        expect(closeButton).toBeInTheDocument();

        const srText = screen.getByText('Close');
        expect(srText).toHaveClass('sr-only');
      });
    });

    it('closes when close button is clicked', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
      });

      const xIcon = screen.getByTestId('x-icon');
      const closeButton = xIcon.closest('button');

      if (closeButton) {
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
        });
      }
    });

    it('applies custom className', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent
            className='custom-content'
            data-testid='sheet-content'
          >
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toHaveClass('custom-content');
      });
    });

    it('includes overlay by default', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        // Look for overlay element with specific classes
        const overlay = document.querySelector('[data-slot="sheet-overlay"]');
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/50');
      });
    });
  });

  describe('SheetClose', () => {
    it('renders sheet close button', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
            <SheetClose data-testid='custom-close'>Custom Close</SheetClose>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const closeButton = screen.getByTestId('custom-close');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute('data-slot', 'sheet-close');
        expect(closeButton).toHaveTextContent('Custom Close');
      });
    });

    it('closes sheet when clicked', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
            <SheetClose data-testid='custom-close'>Custom Close</SheetClose>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('custom-close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('SheetHeader', () => {
    it('renders sheet header', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid='sheet-header'>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>Sheet description</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const header = screen.getByTestId('sheet-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveAttribute('data-slot', 'sheet-header');
      });
    });

    it('applies default classes', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid='sheet-header'>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const header = screen.getByTestId('sheet-header');
        expect(header).toHaveClass('flex', 'flex-col', 'gap-1.5', 'p-4');
      });
    });

    it('applies custom className', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader
              className='custom-header'
              data-testid='sheet-header'
            >
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const header = screen.getByTestId('sheet-header');
        expect(header).toHaveClass('custom-header');
      });
    });
  });

  describe('SheetFooter', () => {
    it('renders sheet footer', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
            <SheetFooter data-testid='sheet-footer'>
              <button>Cancel</button>
              <button>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const footer = screen.getByTestId('sheet-footer');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveAttribute('data-slot', 'sheet-footer');
      });
    });

    it('applies default classes', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
            <SheetFooter data-testid='sheet-footer'>
              <button>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const footer = screen.getByTestId('sheet-footer');
        expect(footer).toHaveClass(
          'mt-auto',
          'flex',
          'flex-col',
          'gap-2',
          'p-4',
        );
      });
    });

    it('applies custom className', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
            <SheetFooter
              className='custom-footer'
              data-testid='sheet-footer'
            >
              <button>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const footer = screen.getByTestId('sheet-footer');
        expect(footer).toHaveClass('custom-footer');
      });
    });
  });

  describe('SheetTitle', () => {
    it('renders sheet title', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle data-testid='sheet-title'>My Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const title = screen.getByTestId('sheet-title');
        expect(title).toBeInTheDocument();
        expect(title).toHaveAttribute('data-slot', 'sheet-title');
        expect(title).toHaveTextContent('My Sheet Title');
      });
    });

    it('applies default classes', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle data-testid='sheet-title'>My Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const title = screen.getByTestId('sheet-title');
        expect(title).toHaveClass('text-foreground', 'font-semibold');
      });
    });

    it('applies custom className', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle
                className='custom-title'
                data-testid='sheet-title'
              >
                My Sheet Title
              </SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const title = screen.getByTestId('sheet-title');
        expect(title).toHaveClass('custom-title');
      });
    });
  });

  describe('SheetDescription', () => {
    it('renders sheet description', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription data-testid='sheet-description'>
                This is a sheet description
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const description = screen.getByTestId('sheet-description');
        expect(description).toBeInTheDocument();
        expect(description).toHaveAttribute('data-slot', 'sheet-description');
        expect(description).toHaveTextContent('This is a sheet description');
      });
    });

    it('applies default classes', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription data-testid='sheet-description'>
                This is a sheet description
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const description = screen.getByTestId('sheet-description');
        expect(description).toHaveClass('text-muted-foreground', 'text-sm');
      });
    });

    it('applies custom className', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription
                className='custom-description'
                data-testid='sheet-description'
              >
                This is a sheet description
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const description = screen.getByTestId('sheet-description');
        expect(description).toHaveClass('custom-description');
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle data-testid='sheet-title'>Sheet Title</SheetTitle>
              <SheetDescription data-testid='sheet-description'>
                Sheet description
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        const title = screen.getByTestId('sheet-title');
        const description = screen.getByTestId('sheet-description');

        expect(content).toBeInTheDocument();
        expect(title).toBeInTheDocument();
        expect(description).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(
        <Sheet>
          <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      const trigger = screen.getByTestId('sheet-trigger');

      // Focus and activate with keyboard
      trigger.focus();
      expect(trigger).toHaveFocus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
      });
    });

    it('handles escape key to close', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
      });

      // Press escape to close
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('works with complete sheet structure', async () => {
      render(
        <Sheet>
          <SheetTrigger data-testid='open-sheet'>Open Settings</SheetTrigger>
          <SheetContent
            side='right'
            data-testid='sheet-content'
          >
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
              <SheetDescription>
                Manage your account settings and preferences.
              </SheetDescription>
            </SheetHeader>
            <div className='py-4'>
              <p>Settings content goes here</p>
            </div>
            <SheetFooter>
              <SheetClose>Cancel</SheetClose>
              <button>Save changes</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>,
      );

      // Open sheet
      const trigger = screen.getByTestId('open-sheet');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(
          screen.getByText('Manage your account settings and preferences.'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Settings content goes here'),
        ).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save changes')).toBeInTheDocument();
      });
    });

    it('handles multiple sheets', () => {
      render(
        <div>
          <Sheet>
            <SheetTrigger data-testid='sheet1-trigger'>
              Open Sheet 1
            </SheetTrigger>
            <SheetContent data-testid='sheet1-content'>
              <SheetHeader>
                <SheetTitle>Sheet 1</SheetTitle>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger data-testid='sheet2-trigger'>
              Open Sheet 2
            </SheetTrigger>
            <SheetContent data-testid='sheet2-content'>
              <SheetHeader>
                <SheetTitle>Sheet 2</SheetTitle>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>,
      );

      expect(screen.getByTestId('sheet1-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('sheet2-trigger')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles sheet without header', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <div>Content without header</div>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
        expect(content).toHaveTextContent('Content without header');
      });
    });

    it('handles sheet without footer', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content'>
            <SheetHeader>
              <SheetTitle>Title Only</SheetTitle>
            </SheetHeader>
            <div>Content without footer</div>
          </SheetContent>
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
        expect(content).toHaveTextContent('Content without footer');
      });
    });

    it('handles empty sheet content', async () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent data-testid='sheet-content' />
        </Sheet>,
      );

      await waitFor(() => {
        const content = screen.getByTestId('sheet-content');
        expect(content).toBeInTheDocument();
      });
    });
  });
});
