/**
 * @vitest-environment jsdom
 * Tests for card-button animation components
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnimatedButton, AnimatedCard } from '../card-button';

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Loader2: ({ className }: { className?: string }) => (
      <span
        data-testid='loader-icon'
        className={className}
      />
    ),
  };
});

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) =>
    classes.filter((c) => typeof c === 'string' && c).join(' '),
}));

describe('AnimatedCard', () => {
  it('renders children', () => {
    render(<AnimatedCard>Card Content</AnimatedCard>);

    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedCard className='custom-card'>Content</AnimatedCard>,
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-card');
  });

  it('applies hover animation classes', () => {
    const { container } = render(<AnimatedCard>Content</AnimatedCard>);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('hover:-translate-y-1');
    expect(card.className).toContain('hover:shadow-lg');
    expect(card.className).toContain('transition-all');
  });

  it('applies backdrop blur', () => {
    const { container } = render(<AnimatedCard>Content</AnimatedCard>);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('backdrop-blur-sm');
  });
});

describe('AnimatedButton', () => {
  it('renders children', () => {
    render(<AnimatedButton>Click Me</AnimatedButton>);

    expect(
      screen.getByRole('button', { name: 'Click Me' }),
    ).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<AnimatedButton isLoading>Submit</AnimatedButton>);

    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByText('处理中...')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<AnimatedButton onClick={handleClick}>Click</AnimatedButton>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when isLoading is true', () => {
    render(<AnimatedButton isLoading>Loading</AnimatedButton>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables button when disabled prop is true', () => {
    render(<AnimatedButton disabled>Disabled</AnimatedButton>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('supports different variants', () => {
    const { rerender } = render(
      <AnimatedButton variant='default'>Default</AnimatedButton>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<AnimatedButton variant='outline'>Outline</AnimatedButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<AnimatedButton variant='ghost'>Ghost</AnimatedButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('supports type attribute', () => {
    render(<AnimatedButton type='submit'>Submit</AnimatedButton>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('supports title attribute', () => {
    render(<AnimatedButton title='Button Title'>Titled</AnimatedButton>);

    expect(screen.getByRole('button')).toHaveAttribute('title', 'Button Title');
  });

  it('supports data-testid attribute', () => {
    render(<AnimatedButton data-testid='test-btn'>Test</AnimatedButton>);

    expect(screen.getByTestId('test-btn')).toBeInTheDocument();
  });

  it('applies hover scale classes', () => {
    render(<AnimatedButton>Hover Me</AnimatedButton>);

    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:scale-105');
    expect(button.className).toContain('active:scale-95');
  });

  it('applies custom className', () => {
    render(<AnimatedButton className='my-button'>Custom</AnimatedButton>);

    const button = screen.getByRole('button');
    expect(button.className).toContain('my-button');
  });
});
