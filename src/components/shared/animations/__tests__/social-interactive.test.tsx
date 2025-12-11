/**
 * @vitest-environment jsdom
 * Tests for social-interactive animation components
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AnimatedCollapsible,
  AnimatedSkeleton,
  AnimatedSocialLink,
} from '../social-interactive';

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) =>
    classes.filter((c) => typeof c === 'string' && c).join(' '),
}));

describe('AnimatedSocialLink', () => {
  const MockIcon = ({ className }: { className?: string }) => (
    <span
      data-testid='mock-icon'
      className={className}
    />
  );

  it('renders link with icon', () => {
    render(
      <AnimatedSocialLink
        icon={MockIcon}
        href='https://example.com'
        label='Example'
      />,
    );

    expect(screen.getByRole('link', { name: 'Example' })).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('opens link in new tab', () => {
    render(
      <AnimatedSocialLink
        icon={MockIcon}
        href='https://twitter.com'
        label='Twitter'
      />,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has correct href', () => {
    render(
      <AnimatedSocialLink
        icon={MockIcon}
        href='https://github.com'
        label='GitHub'
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://github.com',
    );
  });

  it('has accessible label', () => {
    render(
      <AnimatedSocialLink
        icon={MockIcon}
        href='https://linkedin.com'
        label='LinkedIn'
      />,
    );

    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
  });
});

describe('AnimatedCollapsible', () => {
  it('renders children', () => {
    render(
      <AnimatedCollapsible isOpen>
        <div>Content</div>
      </AnimatedCollapsible>,
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies open state classes when isOpen is true', () => {
    const { container } = render(
      <AnimatedCollapsible isOpen>
        <div>Open Content</div>
      </AnimatedCollapsible>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('max-h-96');
    expect(wrapper.className).toContain('opacity-100');
  });

  it('applies closed state classes when isOpen is false', () => {
    const { container } = render(
      <AnimatedCollapsible isOpen={false}>
        <div>Closed Content</div>
      </AnimatedCollapsible>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('max-h-0');
    expect(wrapper.className).toContain('opacity-0');
  });

  it('applies transition classes', () => {
    const { container } = render(
      <AnimatedCollapsible isOpen>
        <div>Transition</div>
      </AnimatedCollapsible>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('transition-all');
    expect(wrapper.className).toContain('duration-300');
  });

  it('applies translate classes based on isOpen', () => {
    const { container: openContainer } = render(
      <AnimatedCollapsible isOpen>
        <div>Open</div>
      </AnimatedCollapsible>,
    );

    const openInner = openContainer.querySelector('.transition-transform');
    expect(openInner?.className).toContain('translate-y-0');

    const { container: closedContainer } = render(
      <AnimatedCollapsible isOpen={false}>
        <div>Closed</div>
      </AnimatedCollapsible>,
    );

    const closedInner = closedContainer.querySelector('.transition-transform');
    expect(closedInner?.className).toContain('-translate-y-4');
  });
});

describe('AnimatedSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<AnimatedSkeleton />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedSkeleton className='custom-skeleton' />,
    );

    expect(container.firstChild).toHaveClass('custom-skeleton');
  });

  it('has space-y-3 layout', () => {
    const { container } = render(<AnimatedSkeleton />);

    expect(container.firstChild).toHaveClass('space-y-3');
  });

  it('renders multiple skeleton lines', () => {
    const { container } = render(<AnimatedSkeleton />);

    const skeletons = container.querySelectorAll('.rounded-md');
    expect(skeletons.length).toBe(3);
  });

  it('applies different widths to skeleton lines', () => {
    const { container } = render(<AnimatedSkeleton />);

    const skeletons = container.querySelectorAll('.rounded-md');
    expect(skeletons[0].className).toContain('w-[250px]');
    expect(skeletons[1].className).toContain('w-[200px]');
    expect(skeletons[2].className).toContain('w-[150px]');
  });
});
