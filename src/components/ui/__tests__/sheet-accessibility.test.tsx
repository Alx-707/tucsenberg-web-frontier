/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '../sheet';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  XIcon: ({ className, ...props }: React.ComponentProps<'svg'>) => (
    <svg
      data-testid='x-icon'
      className={className}
      {...props}
    >
      <path d='M18 6L6 18M6 6l12 12' />
    </svg>
  ),
}));

// Shared test setup function
function setupAccessibilityTest() {
  const user = userEvent.setup();
  return { user };
}

describe('Sheet - Accessibility', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    const setup = setupAccessibilityTest();
    user = setup.user;
  });

  it('provides proper ARIA attributes', async () => {
    render(
      <Sheet>
        <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
        <SheetContent data-testid='sheet-content'>
          <SheetHeader>
            <SheetTitle>Accessible Sheet</SheetTitle>
            <SheetDescription>This is an accessible sheet dialog</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );

    const trigger = screen.getByTestId('sheet-trigger');
    await user.click(trigger);

    await waitFor(() => {
      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveAttribute('role', 'dialog');
      expect(content).toHaveAttribute('aria-modal', 'true');

      const title = screen.getByText('Accessible Sheet');
      expect(title).toBeInTheDocument();

      const description = screen.getByText('This is an accessible sheet dialog');
      expect(description).toBeInTheDocument();
    });
  });

  it('manages focus correctly', async () => {
    render(
      <Sheet>
        <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
        <SheetContent data-testid='sheet-content'>
          <SheetHeader>
            <SheetTitle>Focus Test</SheetTitle>
          </SheetHeader>
          <button data-testid='first-button'>First Button</button>
          <button data-testid='second-button'>Second Button</button>
          <SheetClose data-testid='close-button'>Close</SheetClose>
        </SheetContent>
      </Sheet>,
    );

    const trigger = screen.getByTestId('sheet-trigger');
    await user.click(trigger);

    await waitFor(() => {
      const content = screen.getByTestId('sheet-content');
      expect(content).toBeInTheDocument();
    });

    // Focus should be trapped within the sheet
    const firstButton = screen.getByTestId('first-button');
    const secondButton = screen.getByTestId('second-button');
    const closeButton = screen.getByTestId('close-button');

    // Tab through elements
    await user.tab();
    expect(firstButton).toHaveFocus();

    await user.tab();
    expect(secondButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('returns focus to trigger when closed', async () => {
    render(
      <Sheet>
        <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
        <SheetContent data-testid='sheet-content'>
          <SheetHeader>
            <SheetTitle>Focus Return Test</SheetTitle>
          </SheetHeader>
          <SheetClose data-testid='close-button'>Close</SheetClose>
        </SheetContent>
      </Sheet>,
    );

    const trigger = screen.getByTestId('sheet-trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId('close-button');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it('supports screen readers with proper labeling', async () => {
    render(
      <Sheet>
        <SheetTrigger data-testid='sheet-trigger'>Open Settings</SheetTrigger>
        <SheetContent data-testid='sheet-content'>
          <SheetHeader>
            <SheetTitle id='sheet-title'>Settings</SheetTitle>
            <SheetDescription id='sheet-description'>
              Configure your application settings
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );

    const trigger = screen.getByTestId('sheet-trigger');
    await user.click(trigger);

    await waitFor(() => {
      const content = screen.getByTestId('sheet-content');
      expect(content).toHaveAttribute('aria-labelledby', 'sheet-title');
      expect(content).toHaveAttribute('aria-describedby', 'sheet-description');
    });
  });

  it('handles keyboard navigation correctly', async () => {
    render(
      <Sheet>
        <SheetTrigger data-testid='sheet-trigger'>Open Sheet</SheetTrigger>
        <SheetContent data-testid='sheet-content'>
          <SheetHeader>
            <SheetTitle>Keyboard Test</SheetTitle>
          </SheetHeader>
          <input data-testid='text-input' placeholder='Enter text' />
          <button data-testid='action-button'>Action</button>
        </SheetContent>
      </Sheet>,
    );

    const trigger = screen.getByTestId('sheet-trigger');

    // Open with keyboard
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    });

    // Navigate with Tab
    await user.tab();
    const textInput = screen.getByTestId('text-input');
    expect(textInput).toHaveFocus();

    await user.tab();
    const actionButton = screen.getByTestId('action-button');
    expect(actionButton).toHaveFocus();

    // Close with Escape
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
    });
  });
});
