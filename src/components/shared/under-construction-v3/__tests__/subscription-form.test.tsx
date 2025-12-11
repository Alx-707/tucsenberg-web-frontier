/**
 * @vitest-environment jsdom
 * Tests for SubscriptionForm component
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SubscriptionForm } from '../subscription-form';

const defaultProps = {
  email: '',
  setEmail: vi.fn(),
  isSubscribed: false,
  isSubmitting: false,
  onSubmit: vi.fn(),
  tPage: (key: string) => key,
};

describe('SubscriptionForm', () => {
  describe('normal state', () => {
    it('renders email input', () => {
      render(<SubscriptionForm {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<SubscriptionForm {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /订阅更新/i }),
      ).toBeInTheDocument();
    });

    it('renders mail icon and title', () => {
      render(<SubscriptionForm {...defaultProps} />);

      expect(screen.getByText('邮件订阅')).toBeInTheDocument();
    });

    it('displays placeholder text in input', () => {
      render(<SubscriptionForm {...defaultProps} />);

      expect(
        screen.getByPlaceholderText('请输入您的邮箱地址'),
      ).toBeInTheDocument();
    });
  });

  describe('subscribed state', () => {
    it('shows success message when subscribed', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          isSubscribed
        />,
      );

      expect(screen.getByText('订阅成功！')).toBeInTheDocument();
    });

    it('does not show form when subscribed', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          isSubscribed
        />,
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows check circle icon when subscribed', () => {
      const { container } = render(
        <SubscriptionForm
          {...defaultProps}
          isSubscribed
        />,
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('submitting state', () => {
    it('disables input when submitting', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          isSubmitting
        />,
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables button when submitting', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          email='test@example.com'
          isSubmitting
        />,
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading text when submitting', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          email='test@example.com'
          isSubmitting
        />,
      );

      expect(screen.getByText('订阅中...')).toBeInTheDocument();
    });
  });

  describe('button disabled state', () => {
    it('disables button when email is empty', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          email=''
        />,
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables button when email has value', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          email='test@example.com'
        />,
      );

      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('interactions', () => {
    it('calls setEmail when input changes', async () => {
      const setEmail = vi.fn();
      const user = userEvent.setup();

      render(
        <SubscriptionForm
          {...defaultProps}
          setEmail={setEmail}
        />,
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 't');

      expect(setEmail).toHaveBeenCalled();
    });

    it('calls onSubmit when form is submitted', async () => {
      const onSubmit = vi.fn((e) => e.preventDefault());

      render(
        <SubscriptionForm
          {...defaultProps}
          email='test@example.com'
          onSubmit={onSubmit}
        />,
      );

      const form = screen.getByRole('textbox').closest('form');
      fireEvent.submit(form!);

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('input attributes', () => {
    it('has type email', () => {
      render(<SubscriptionForm {...defaultProps} />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('has required attribute', () => {
      render(<SubscriptionForm {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('displays current email value', () => {
      render(
        <SubscriptionForm
          {...defaultProps}
          email='existing@example.com'
        />,
      );

      expect(screen.getByRole('textbox')).toHaveValue('existing@example.com');
    });
  });

  describe('card structure', () => {
    it('wraps content in a card', () => {
      const { container } = render(<SubscriptionForm {...defaultProps} />);

      // Card should have the expected structure
      const card = container.querySelector('.mx-auto.max-w-md');
      expect(card).toBeInTheDocument();
    });
  });
});
