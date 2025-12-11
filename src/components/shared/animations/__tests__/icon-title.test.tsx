/**
 * @vitest-environment jsdom
 * Tests for icon-title animation components
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnimatedHeroIcon, AnimatedTitle } from '../icon-title';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Zap: ({ className }: { className?: string }) => (
      <span
        data-testid='zap-icon'
        className={className}
      />
    ),
    Clock: ({ className }: { className?: string }) => (
      <span
        data-testid='clock-icon'
        className={className}
      />
    ),
  };
});

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('AnimatedHeroIcon', () => {
  it('renders the hero icon', () => {
    render(<AnimatedHeroIcon />);

    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  it('renders the clock icon in badge', () => {
    render(<AnimatedHeroIcon />);

    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('renders the status badge text', () => {
    render(<AnimatedHeroIcon />);

    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AnimatedHeroIcon className='custom-class' />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has flex layout', () => {
    const { container } = render(<AnimatedHeroIcon />);

    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('justify-center');
  });
});

describe('AnimatedTitle', () => {
  it('renders children', () => {
    render(<AnimatedTitle>Test Title</AnimatedTitle>);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders as h1 element', () => {
    render(<AnimatedTitle>Heading</AnimatedTitle>);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AnimatedTitle className='custom-title'>Title</AnimatedTitle>);

    const heading = screen.getByRole('heading');
    expect(heading.className).toContain('custom-title');
  });

  it('applies animation classes', () => {
    render(<AnimatedTitle>Animated</AnimatedTitle>);

    const heading = screen.getByRole('heading');
    expect(heading.className).toContain('animate-in');
    expect(heading.className).toContain('fade-in');
  });

  it('renders gradient text span', () => {
    render(<AnimatedTitle>Gradient</AnimatedTitle>);

    const span = screen.getByText('Gradient');
    expect(span.className).toContain('bg-gradient-to-r');
    expect(span.className).toContain('text-transparent');
    expect(span.className).toContain('bg-clip-text');
  });
});
