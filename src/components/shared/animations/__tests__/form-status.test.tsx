/**
 * @vitest-environment jsdom
 * Tests for form-status animation components
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AnimatedInput,
  AnimatedProgress,
  AnimatedSuccess,
} from '../form-status';

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    CheckCircle: ({ className }: { className?: string }) => (
      <span
        data-testid='check-icon'
        className={className}
      />
    ),
  };
});

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) =>
    classes.filter((c) => typeof c === 'string' && c).join(' '),
}));

describe('AnimatedProgress', () => {
  it('renders progress bar', () => {
    render(<AnimatedProgress value={50} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders start and end labels', () => {
    render(<AnimatedProgress value={75} />);

    expect(screen.getByText('开始')).toBeInTheDocument();
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('renders correct percentage value', () => {
    render(<AnimatedProgress value={25} />);

    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedProgress
        value={50}
        className='custom-progress'
      />,
    );

    expect(container.firstChild).toHaveClass('custom-progress');
  });

  it('sets correct width style', () => {
    const { container } = render(<AnimatedProgress value={60} />);

    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });
});

describe('AnimatedInput', () => {
  it('renders input element', () => {
    render(<AnimatedInput data-testid='test-input' />);

    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  it('supports type attribute', () => {
    render(
      <AnimatedInput
        type='email'
        data-testid='email-input'
      />,
    );

    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
  });

  it('supports placeholder', () => {
    render(<AnimatedInput placeholder='Enter text' />);

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('supports disabled state', () => {
    render(
      <AnimatedInput
        disabled
        data-testid='disabled-input'
      />,
    );

    expect(screen.getByTestId('disabled-input')).toBeDisabled();
  });

  it('handles onChange event', () => {
    const handleChange = vi.fn();
    render(
      <AnimatedInput
        onChange={handleChange}
        data-testid='change-input'
      />,
    );

    fireEvent.change(screen.getByTestId('change-input'), {
      target: { value: 'test' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles onBlur event', () => {
    const handleBlur = vi.fn();
    render(
      <AnimatedInput
        onBlur={handleBlur}
        data-testid='blur-input'
      />,
    );

    fireEvent.blur(screen.getByTestId('blur-input'));
    expect(handleBlur).toHaveBeenCalled();
  });

  it('handles onFocus event', () => {
    const handleFocus = vi.fn();
    render(
      <AnimatedInput
        onFocus={handleFocus}
        data-testid='focus-input'
      />,
    );

    fireEvent.focus(screen.getByTestId('focus-input'));
    expect(handleFocus).toHaveBeenCalled();
  });

  it('supports value and name attributes', () => {
    render(
      <AnimatedInput
        name='username'
        value='test'
        data-testid='named-input'
      />,
    );

    const input = screen.getByTestId('named-input');
    expect(input).toHaveAttribute('name', 'username');
    expect(input).toHaveValue('test');
  });

  it('supports id attribute', () => {
    render(
      <AnimatedInput
        id='my-input'
        data-testid='id-input'
      />,
    );

    expect(screen.getByTestId('id-input')).toHaveAttribute('id', 'my-input');
  });

  it('supports title attribute', () => {
    render(
      <AnimatedInput
        title='Input Title'
        data-testid='titled-input'
      />,
    );

    expect(screen.getByTestId('titled-input')).toHaveAttribute(
      'title',
      'Input Title',
    );
  });

  it('supports aria attributes', () => {
    render(
      <AnimatedInput
        aria-label='Test Input'
        aria-describedby='description'
        data-testid='aria-input'
      />,
    );

    const input = screen.getByTestId('aria-input');
    expect(input).toHaveAttribute('aria-label', 'Test Input');
    expect(input).toHaveAttribute('aria-describedby', 'description');
  });

  it('supports autoComplete', () => {
    render(
      <AnimatedInput
        autoComplete='email'
        data-testid='autocomplete-input'
      />,
    );

    expect(screen.getByTestId('autocomplete-input')).toHaveAttribute(
      'autocomplete',
      'email',
    );
  });

  it('applies custom className', () => {
    render(
      <AnimatedInput
        className='custom-input'
        data-testid='custom-input'
      />,
    );

    expect(screen.getByTestId('custom-input').className).toContain(
      'custom-input',
    );
  });
});

describe('AnimatedSuccess', () => {
  it('renders message', () => {
    render(<AnimatedSuccess message='Operation successful!' />);

    expect(screen.getByText('Operation successful!')).toBeInTheDocument();
  });

  it('renders check icon', () => {
    render(<AnimatedSuccess message='Done' />);

    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('applies animation classes', () => {
    const { container } = render(<AnimatedSuccess message='Success' />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('animate-in');
    expect(wrapper.className).toContain('fade-in');
  });

  it('applies green color styling', () => {
    const { container } = render(<AnimatedSuccess message='Green' />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('text-green-600');
  });
});
