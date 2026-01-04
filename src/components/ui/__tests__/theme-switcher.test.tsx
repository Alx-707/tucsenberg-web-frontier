import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from 'next-themes';
import { describe, expect, it, vi } from 'vitest';

const { mockDynamicCalls, loaderPromises } = vi.hoisted(() => ({
  mockDynamicCalls: vi.fn(),
  loaderPromises: [] as Array<Promise<unknown>>,
}));

vi.mock('next/dynamic', () => ({
  default: (
    loader: () => Promise<unknown>,
    options?: { ssr?: boolean },
  ): React.ComponentType => {
    mockDynamicCalls(options);
    loaderPromises.push(loader());

    const MockDynamicComponent = () => <div data-testid='motion-highlight' />;
    MockDynamicComponent.displayName = 'MockMotionHighlight';
    return MockDynamicComponent;
  },
}));

vi.mock('../theme-switcher-highlight', () => ({
  ThemeSwitcherHighlight: () => <div data-testid='theme-switcher-highlight' />,
}));

describe('ThemeSwitcher', () => {
  it('registers MotionHighlight dynamic import with ssr disabled', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
    });

    const { ThemeSwitcher } = await import('../theme-switcher');

    render(<ThemeSwitcher data-testid='theme-switcher' />);

    await Promise.all(loaderPromises);
    await waitFor(() => {
      expect(mockDynamicCalls).toHaveBeenCalledWith(
        expect.objectContaining({ ssr: false }),
      );
    });

    // When mounted, the active theme should render the highlight
    expect(await screen.findByTestId('motion-highlight')).toBeInTheDocument();
  });

  it('calls setTheme when selecting a theme', async () => {
    const user = userEvent.setup();
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
    });

    const { ThemeSwitcher } = await import('../theme-switcher');

    render(<ThemeSwitcher data-testid='theme-switcher' />);

    // Wait for mounted state (skeleton renders disabled buttons first)
    await screen.findByTestId('motion-highlight');

    const darkButton = screen.getByRole('button', { name: 'Dark theme' });
    await user.click(darkButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('defaults data-testid to theme-toggle when not provided', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
    });

    const { ThemeSwitcher } = await import('../theme-switcher');

    render(<ThemeSwitcher />);

    await Promise.all(loaderPromises);
    expect(await screen.findByTestId('theme-toggle')).toBeInTheDocument();
  });
});
