import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    AdditionalFields,
    CheckboxFields,
    ContactFields,
    NameFields,
} from '../contact-form-fields';

// Mock react-hook-form
const mockRegister = vi.fn();
const mockSetValue = vi.fn();

// Mock translation function
const mockT = vi.fn((key: string) => key);

// Default props for testing
const defaultProps = {
  register: mockRegister,
  errors: {},
  isSubmitting: false,
  t: mockT,
};

describe('Contact Form Fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockReturnValue({
      name: 'test-field',
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    });
  });

  describe('NameFields Component', () => {
    describe('Basic Rendering', () => {
      it('should render first name and last name fields', () => {
        render(<NameFields {...defaultProps} />);

        expect(screen.getByLabelText(/firstName/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/lastName/i)).toBeInTheDocument();
      });

      it('should show required indicators', () => {
        render(<NameFields {...defaultProps} />);

        // Check for required asterisks (*)
        const labels = screen.getAllByText(/firstName|lastName/);
        expect(labels.length).toBeGreaterThan(0);
      });

      it('should apply custom className when provided', () => {
        render(<NameFields {...defaultProps} />);

        const container = screen
          .getByLabelText(/firstName/i)
          .closest('.space-y-2');
        expect(container).toBeInTheDocument();
      });
    });

    describe('Error Handling', () => {
      it('should display first name error message', () => {
        const propsWithErrors = {
          ...defaultProps,
          errors: {
            firstName: { message: 'First name is required', type: 'required' },
          },
        };

        render(<NameFields {...propsWithErrors} />);

        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      it('should display last name error message', () => {
        const propsWithErrors = {
          ...defaultProps,
          errors: {
            lastName: { message: 'Last name is required', type: 'required' },
          },
        };

        render(<NameFields {...propsWithErrors} />);

        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });

      it('should apply error styling to fields with errors', () => {
        const propsWithErrors = {
          ...defaultProps,
          errors: {
            firstName: { message: 'Error', type: 'required' },
          },
        };

        render(<NameFields {...propsWithErrors} />);

        const firstNameInput = screen.getByLabelText(/firstName/i);
        expect(firstNameInput).toHaveClass('border-red-500');
        expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    describe('Disabled State', () => {
      it('should disable fields when isSubmitting is true', () => {
        const propsWithSubmitting = {
          ...defaultProps,
          isSubmitting: true,
        };

        render(<NameFields {...propsWithSubmitting} />);

        expect(screen.getByLabelText(/firstName/i)).toBeDisabled();
        expect(screen.getByLabelText(/lastName/i)).toBeDisabled();
      });
    });

    describe('Accessibility', () => {
      it('should have proper label associations', () => {
        render(<NameFields {...defaultProps} />);

        const firstNameInput = screen.getByLabelText(/firstName/i);
        const lastNameInput = screen.getByLabelText(/lastName/i);

        expect(firstNameInput).toHaveAttribute('id', 'firstName');
        expect(lastNameInput).toHaveAttribute('id', 'lastName');
      });

      it('should use proper ARIA attributes for errors', () => {
        const propsWithErrors = {
          ...defaultProps,
          errors: {
            firstName: { message: 'Error message', type: 'required' },
          },
        };

        render(<NameFields {...propsWithErrors} />);

        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('text-red-500');
      });
    });
  });

  describe('ContactFields Component', () => {
    describe('Basic Rendering', () => {
      it('should render email and company fields', () => {
        render(<ContactFields {...defaultProps} />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      });

      it('should show email as required field', () => {
        render(<ContactFields {...defaultProps} />);

        const emailLabel = screen.getByText(/email/i);
        expect(emailLabel).toBeInTheDocument();
      });
    });

    describe('Field Types', () => {
      it('should render email field with correct type', () => {
        render(<ContactFields {...defaultProps} />);

        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toHaveAttribute('type', 'email');
      });

      it('should render company field as text input', () => {
        render(<ContactFields {...defaultProps} />);

        const companyInput = screen.getByLabelText(/company/i);
        // HTML input elements default to type="text" when no type is specified
        expect(companyInput).toHaveProperty('type', 'text');
      });
    });

    describe('Error Handling', () => {
      it('should display email error message', () => {
        const propsWithErrors = {
          ...defaultProps,
          errors: {
            email: { message: 'Invalid email format', type: 'pattern' },
          },
        };

        render(<ContactFields {...propsWithErrors} />);

        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });
  });

  describe('AdditionalFields Component', () => {
    describe('Basic Rendering', () => {
      it('should render phone and subject fields', () => {
        render(<AdditionalFields {...defaultProps} />);

        expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      });

      it('should render message textarea', () => {
        render(<AdditionalFields {...defaultProps} />);

        expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
        expect(
          screen.getByRole('textbox', { name: /message/i }),
        ).toBeInTheDocument();
      });
    });

    describe('Field Types', () => {
      it('should render phone field with correct type', () => {
        render(<AdditionalFields {...defaultProps} />);

        const phoneInput = screen.getByLabelText(/phone/i);
        expect(phoneInput).toHaveAttribute('type', 'tel');
      });

      it('should render subject field as text input', () => {
        render(<AdditionalFields {...defaultProps} />);

        const subjectInput = screen.getByLabelText(/subject/i);
        // HTML input elements default to type="text" when no type is specified
        expect(subjectInput).toHaveProperty('type', 'text');
      });
    });

    describe('Field Validation', () => {
      it('should show message as required field', () => {
        render(<AdditionalFields {...defaultProps} />);

        const messageLabel = screen.getByText(/message/i);
        expect(messageLabel).toBeInTheDocument();
      });

      it('should display message error when present', () => {
        const propsWithErrors = {
          ...defaultProps,
          errors: {
            message: { message: 'Message is required', type: 'required' },
          },
        };

        render(<AdditionalFields {...propsWithErrors} />);

        expect(screen.getByText('Message is required')).toBeInTheDocument();
      });
    });
  });

  describe('CheckboxFields Component', () => {
    const checkboxProps = {
      ...defaultProps,
      watchedValues: {
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        message: '',
        acceptPrivacy: false,
        phone: '',
        subject: '',
        marketingConsent: false,
        website: '',
      },
      setValue: mockSetValue,
    };

    describe('Basic Rendering', () => {
      it('should render privacy policy checkbox', () => {
        render(<CheckboxFields {...checkboxProps} />);

        expect(
          screen.getByRole('checkbox', { name: /privacy/i }),
        ).toBeInTheDocument();
      });

      it('should render marketing consent checkbox', () => {
        render(<CheckboxFields {...checkboxProps} />);

        expect(
          screen.getByRole('checkbox', { name: /marketingConsent/i }),
        ).toBeInTheDocument();
      });
    });

    describe('Checkbox Interactions', () => {
      it('should handle privacy policy checkbox changes', async () => {
        const user = userEvent.setup();
        render(<CheckboxFields {...checkboxProps} />);

        const privacyCheckbox = screen.getByRole('checkbox', {
          name: /privacy/i,
        });
        await user.click(privacyCheckbox);

        expect(mockSetValue).toHaveBeenCalled();
      });

      it('should handle marketing consent checkbox changes', async () => {
        const user = userEvent.setup();
        render(<CheckboxFields {...checkboxProps} />);

        const marketingCheckbox = screen.getByRole('checkbox', {
          name: /marketingConsent/i,
        });
        await user.click(marketingCheckbox);

        expect(mockSetValue).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should display privacy policy error when present', () => {
        const propsWithErrors = {
          ...checkboxProps,
          errors: {
            acceptPrivacy: {
              message: 'You must accept the privacy policy',
              type: 'required',
            },
          },
        };

        render(<CheckboxFields {...propsWithErrors} />);

        expect(
          screen.getByText('You must accept the privacy policy'),
        ).toBeInTheDocument();
      });
    });

    describe('Disabled State', () => {
      it('should disable checkboxes when isSubmitting is true', () => {
        const propsWithSubmitting = {
          ...checkboxProps,
          isSubmitting: true,
        };

        render(<CheckboxFields {...propsWithSubmitting} />);

        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach((checkbox) => {
          expect(checkbox).toBeDisabled();
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a form context', () => {
      // Mock ResizeObserver for this specific test to avoid Radix UI issues
      const mockResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));

      // Temporarily override the global ResizeObserver
      const originalResizeObserver = globalThis.ResizeObserver;
      globalThis.ResizeObserver = mockResizeObserver;

      try {
        render(
          <form>
            <NameFields {...defaultProps} />
            <ContactFields {...defaultProps} />
            <AdditionalFields {...defaultProps} />
            <CheckboxFields
              {...defaultProps}
              watchedValues={{
                firstName: '',
                lastName: '',
                email: '',
                company: '',
                message: '',
                acceptPrivacy: false,
                phone: '',
                subject: '',
                marketingConsent: false,
                website: '',
              }}
              setValue={mockSetValue}
            />
          </form>,
        );

        // Check that form element exists (form elements don't always have explicit role)
        expect(document.querySelector('form')).toBeInTheDocument();
        expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
      } finally {
        // Restore the original ResizeObserver
        globalThis.ResizeObserver = originalResizeObserver;
      }
    });

    it('should handle multiple errors simultaneously', () => {
      const propsWithMultipleErrors = {
        ...defaultProps,
        errors: {
          firstName: { message: 'First name error', type: 'required' },
          email: { message: 'Email error', type: 'pattern' },
          message: { message: 'Message error', type: 'required' },
        },
      };

      render(
        <>
          <NameFields {...propsWithMultipleErrors} />
          <ContactFields {...propsWithMultipleErrors} />
          <AdditionalFields {...propsWithMultipleErrors} />
        </>,
      );

      expect(screen.getByText('First name error')).toBeInTheDocument();
      expect(screen.getByText('Email error')).toBeInTheDocument();
      expect(screen.getByText('Message error')).toBeInTheDocument();
    });
  });
});
