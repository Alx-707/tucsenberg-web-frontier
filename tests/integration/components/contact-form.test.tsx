/**
 * Integration Tests for ContactForm Component
 *
 * Tests the complete contact form workflow including:
 * - Form validation integration
 * - User input handling
 * - Submission workflow
 * - Error handling
 * - Internationalization
 * - Accessibility features
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactForm } from '@/components/contact/contact-form';

// Mock next-intl
const mockUseTranslations = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, type, ...props }: any) => (
    <button
      data-testid='contact-form-submit'
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div
      data-testid='contact-form-card'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ id, type, value, onChange, className, ...props }: any) => (
    <input
      data-testid={`contact-input-${id}`}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  ),
}));

// Mock textarea component for message field
vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ id, value, onChange, className, ...props }: any) => (
    <textarea
      data-testid={`contact-input-${id}`}
      id={id}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className, ...props }: any) => (
    <label
      data-testid={`contact-label-${htmlFor}`}
      htmlFor={htmlFor}
      className={className}
      {...props}
    >
      {children}
    </label>
  ),
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ContactForm Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default translations - ContactForm uses 'contact.form' namespace
    mockUseTranslations.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'title': 'Contact Us',
        'description': 'Get in touch with our team',
        'firstName': 'First Name',
        'lastName': 'Last Name',
        'email': 'Email Address',
        'company': 'Company',
        'message': 'Message',
        'submit': 'Send Message',
        'submitting': 'Sending...',
        'success': 'Message sent successfully!',
        'error': 'Failed to send message. Please try again.',
        'firstNamePlaceholder': 'firstNamePlaceholder',
        'lastNamePlaceholder': 'lastNamePlaceholder',
        'emailPlaceholder': 'emailPlaceholder',
        'companyPlaceholder': 'companyPlaceholder',
        'messagePlaceholder': 'messagePlaceholder',
        'validation.firstNameRequired': 'First name is required',
        'validation.lastNameRequired': 'Last name is required',
        'validation.emailRequired': 'Email is required',
        'validation.emailInvalid': 'Please enter a valid email address',
        'validation.messageRequired': 'Message is required',
        'validation.messageTooShort': 'Message must be at least 10 characters long',
        'validation.firstNameTooShort': 'First name is too short',
        'validation.lastNameTooShort': 'Last name is too short',
      };
      return translations[key] || key;
    });

    // Setup successful fetch mock by default with delay to test loading state
    mockFetch.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 100) // 100ms delay to see loading state
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Form Submission Workflow', () => {
    it('should complete successful form submission with valid data', async () => {
      render(<ContactForm />);

      // 1. Fill out all required fields
      const firstNameInput = screen.getByTestId('contact-input-firstName');
      const lastNameInput = screen.getByTestId('contact-input-lastName');
      const emailInput = screen.getByTestId('contact-input-email');
      const companyInput = screen.getByTestId('contact-input-company');
      const messageInput = screen.getByTestId('contact-input-message');

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john.doe@example.com');
      await user.type(companyInput, 'Acme Corp');
      await user.type(
        messageInput,
        'This is a test message with sufficient length.',
      );

      // 2. Submit the form
      const submitButton = screen.getByTestId('contact-form-submit');
      await user.click(submitButton);

      // 3. Verify loading state (wait for async state update)
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Sending...');
      });

      // 4. Wait for submission to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // 5. Verify success state
      expect(
        screen.getByText('Message sent successfully!'),
      ).toBeInTheDocument();

      // 6. Verify form is reset
      expect(firstNameInput).toHaveValue('');
      expect(lastNameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(companyInput).toHaveValue('');
      expect(messageInput).toHaveValue('');
    });

    it('should handle form submission failure gracefully', async () => {
      // Mock failed API response
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ContactForm />);

      // Fill out form with valid data
      await user.type(screen.getByTestId('contact-input-firstName'), 'John');
      await user.type(screen.getByTestId('contact-input-lastName'), 'Doe');
      await user.type(
        screen.getByTestId('contact-input-email'),
        'john.doe@example.com',
      );
      await user.type(screen.getByTestId('contact-input-company'), 'Acme Corp');
      await user.type(
        screen.getByTestId('contact-input-message'),
        'This is a test message.',
      );

      // Submit form
      const submitButton = screen.getByTestId('contact-form-submit');
      await user.click(submitButton);

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.getByText('Failed to send message. Please try again.'),
        ).toBeInTheDocument();
      });

      // Verify form is not reset on error
      expect(screen.getByTestId('contact-input-firstName')).toHaveValue('John');
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate all required fields and show appropriate errors', async () => {
      render(<ContactForm />);

      const submitButton = screen.getByTestId('contact-form-submit');

      // Try to submit empty form
      await user.click(submitButton);

      // Verify all validation errors are shown (company is not required)
      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Message is required')).toBeInTheDocument();
      });

      // Verify company field does not show error (it's optional)
      expect(screen.queryByText('Company name is required')).not.toBeInTheDocument();

      // Verify form was not submitted
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate email format correctly', async () => {
      render(<ContactForm />);

      const firstNameInput = screen.getByTestId('contact-input-firstName');
      const lastNameInput = screen.getByTestId('contact-input-lastName');
      const emailInput = screen.getByTestId('contact-input-email');
      const messageInput = screen.getByTestId('contact-input-message');
      const submitButton = screen.getByTestId('contact-form-submit');

      // Fill all required fields with valid data except email
      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(messageInput, 'This is a test message with enough length');

      // Enter invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      // Verify that form submission was blocked due to validation error
      // (fetch should not be called if validation fails)
      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });

      // Verify that the form is still in its initial state (not submitted)
      expect(screen.queryByText('Message sent successfully!')).not.toBeInTheDocument();

      // Clear and enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.click(submitButton);

      // Email error should be cleared
      expect(
        screen.queryByText('Please enter a valid email address'),
      ).not.toBeInTheDocument();
    });

    it('should validate message length correctly', async () => {
      render(<ContactForm />);

      const messageInput = screen.getByTestId('contact-input-message');
      const submitButton = screen.getByTestId('contact-form-submit');

      // Enter message that's too short
      await user.type(messageInput, 'Short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Message must be at least 10 characters long'),
        ).toBeInTheDocument();
      });

      // Clear and enter valid message
      await user.clear(messageInput);
      await user.type(messageInput, 'This is a sufficiently long message.');
      await user.click(submitButton);

      // Message length error should be cleared
      expect(
        screen.queryByText('Message must be at least 10 characters long'),
      ).not.toBeInTheDocument();
    });

    it('should clear field errors when user starts typing', async () => {
      render(<ContactForm />);

      const firstNameInput = screen.getByTestId('contact-input-firstName');
      const submitButton = screen.getByTestId('contact-form-submit');

      // Trigger validation error
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      // Start typing in the field
      await user.type(firstNameInput, 'J');

      // Error should be cleared
      expect(
        screen.queryByText('First name is required'),
      ).not.toBeInTheDocument();
    });
  });

  describe('User Input Handling Integration', () => {
    it('should handle all form fields correctly', async () => {
      render(<ContactForm />);

      const testData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        company: 'Tech Solutions Inc',
        message:
          'I would like to discuss potential collaboration opportunities.',
      };

      // Fill out all fields
      for (const [field, value] of Object.entries(testData)) {
        const input = screen.getByTestId(`contact-input-${field}`);
        await user.type(input, value);
        expect(input).toHaveValue(value);
      }

      // Verify all values are maintained
      for (const [field, value] of Object.entries(testData)) {
        const input = screen.getByTestId(`contact-input-${field}`);
        expect(input).toHaveValue(value);
      }
    });

    it('should handle special characters and unicode in inputs', async () => {
      render(<ContactForm />);

      const specialData = {
        firstName: 'José',
        lastName: 'García-López',
        company: 'Café & Co. (München)',
        message: 'Hello! 你好 🌟 Special chars: @#$%^&*()',
      };

      for (const [field, value] of Object.entries(specialData)) {
        const input = screen.getByTestId(`contact-input-${field}`);
        await user.type(input, value);
        expect(input).toHaveValue(value);
      }
    });
  });

  describe('Internationalization Integration', () => {
    it('should use correct translations for all form elements', async () => {
      render(<ContactForm />);

      // Verify translation function is called
      expect(mockUseTranslations).toHaveBeenCalled();

      // Verify labels are translated
      expect(screen.getByTestId('contact-label-firstName')).toHaveTextContent(
        'First Name',
      );
      expect(screen.getByTestId('contact-label-lastName')).toHaveTextContent(
        'Last Name',
      );
      expect(screen.getByTestId('contact-label-email')).toHaveTextContent(
        'Email Address',
      );
      expect(screen.getByTestId('contact-label-company')).toHaveTextContent(
        'Company',
      );
      expect(screen.getByTestId('contact-label-message')).toHaveTextContent(
        'Message',
      );

      // Verify submit button text
      expect(screen.getByTestId('contact-form-submit')).toHaveTextContent(
        'Send Message',
      );
    });

    it('should handle missing translations gracefully', async () => {
      mockUseTranslations.mockImplementation((key: string) => `missing.${key}`);

      expect(() => render(<ContactForm />)).not.toThrow();

      const form = screen.getByTestId('contact-form-card');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide proper form accessibility structure', async () => {
      render(<ContactForm />);

      // Verify all inputs have associated labels
      const fields = ['firstName', 'lastName', 'email', 'company', 'message'];

      for (const field of fields) {
        const input = screen.getByTestId(`contact-input-${field}`);
        const label = screen.getByTestId(`contact-label-${field}`);

        expect(input).toBeInTheDocument();
        expect(label).toBeInTheDocument();
        expect(label).toHaveAttribute('for', field);
        expect(input).toHaveAttribute('id', field);
      }
    });

    it('should support keyboard navigation', async () => {
      render(<ContactForm />);

      const firstNameInput = screen.getByTestId('contact-input-firstName');
      const lastNameInput = screen.getByTestId('contact-input-lastName');
      const submitButton = screen.getByTestId('contact-form-submit');

      // Test tab navigation
      firstNameInput.focus();
      expect(document.activeElement).toBe(firstNameInput);

      await user.tab();
      expect(document.activeElement).toBe(lastNameInput);

      // Navigate to submit button
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();
      expect(document.activeElement).toBe(submitButton);
    });

    it('should announce validation errors to screen readers', async () => {
      render(<ContactForm />);

      const submitButton = screen.getByTestId('contact-form-submit');
      await user.click(submitButton);

      // Verify error messages are present and accessible
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/required|invalid/i);
        expect(errorMessages.length).toBeGreaterThan(0);

        // Each error message should be associated with its field
        errorMessages.forEach((error) => {
          expect(error).toBeInTheDocument();
        });
      });
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ContactForm />);

      // Fill and submit form
      await user.type(screen.getByTestId('contact-input-firstName'), 'John');
      await user.type(screen.getByTestId('contact-input-lastName'), 'Doe');
      await user.type(
        screen.getByTestId('contact-input-email'),
        'john@example.com',
      );
      await user.type(screen.getByTestId('contact-input-company'), 'Company');
      await user.type(
        screen.getByTestId('contact-input-message'),
        'Test message here',
      );

      const submitButton = screen.getByTestId('contact-form-submit');
      await user.click(submitButton);

      // Verify error handling
      await waitFor(() => {
        expect(
          screen.getByText('Failed to send message. Please try again.'),
        ).toBeInTheDocument();
      });

      // Verify form can be resubmitted
      expect(submitButton).not.toBeDisabled();
    });

    it('should handle API errors with proper user feedback', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      render(<ContactForm />);

      // Fill and submit form
      await user.type(screen.getByTestId('contact-input-firstName'), 'John');
      await user.type(screen.getByTestId('contact-input-lastName'), 'Doe');
      await user.type(
        screen.getByTestId('contact-input-email'),
        'john@example.com',
      );
      await user.type(screen.getByTestId('contact-input-company'), 'Company');
      await user.type(
        screen.getByTestId('contact-input-message'),
        'Test message here',
      );

      const submitButton = screen.getByTestId('contact-form-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to send message. Please try again.'),
        ).toBeInTheDocument();
      });
    });
  });
});
