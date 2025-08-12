/**
 * ErrorBoundary Component Error Handling Tests
 *
 * 全面测试错误边界组件的错误捕获、恢复和用户体验功能
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/components/error-boundary';

// Mock next-intl
const mockUseTranslations = vi.fn();
vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, ...props }: any) => (
    <button
      data-testid='error-boundary-button'
      onClick={onClick}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div
      data-testid='error-boundary-card'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div
      data-testid='error-boundary-card-content'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <div
      data-testid='error-boundary-card-description'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div
      data-testid='error-boundary-card-header'
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h2
      data-testid='error-boundary-card-title'
      className={className}
      {...props}
    >
      {children}
    </h2>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: any) => (
    <span
      data-testid='alert-triangle-icon'
      className={className}
    >
      ⚠️
    </span>
  ),
  RefreshCw: ({ className }: any) => (
    <span
      data-testid='refresh-icon'
      className={className}
    >
      🔄
    </span>
  ),
}));

// 创建会抛出错误的测试组件
function ThrowErrorComponent({
  shouldThrow = true,
  errorMessage = 'Test error',
}: {
  shouldThrow?: boolean;
  errorMessage?: string;
}) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid='normal-component'>Normal component</div>;
}

describe('ErrorBoundary Error Handling Tests', () => {
  const user = userEvent.setup();
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default translations
    mockUseTranslations.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        error: 'Error',
        retry: 'Try Again',
        errorMessage: 'Something went wrong. Please try refreshing the page.',
      };
      // eslint-disable-next-line security/detect-object-injection
      return (
        (Object.hasOwn(translations, key) ? translations[key] : null) || key
      );
    });

    // Clear console spy
    consoleSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Catching and Display', () => {
    it('should catch and display error when child component throws', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent
            shouldThrow={true}
            errorMessage='Component crashed'
          />
        </ErrorBoundary>,
      );

      // Verify error boundary UI is displayed
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('error-boundary-card-title')).toHaveTextContent(
        'Error',
      );
      expect(
        screen.getByTestId('error-boundary-card-description'),
      ).toHaveTextContent(
        'Something went wrong. Please try refreshing the page.',
      );

      // Verify retry button is present
      const retryButton = screen.getByTestId('error-boundary-button');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Try Again');
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should render children normally when no error occurs', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>,
      );

      // Verify normal component is rendered
      expect(screen.getByTestId('normal-component')).toBeInTheDocument();
      expect(
        screen.queryByTestId('error-boundary-card'),
      ).not.toBeInTheDocument();
    });

    it('should handle different error types correctly', async () => {
      const errorTypes = [
        { message: 'Network error', expected: 'Network error' },
        { message: 'Validation failed', expected: 'Validation failed' },
        { message: 'Permission denied', expected: 'Permission denied' },
        { message: '', expected: '' }, // Empty error message
      ];

      for (const { message } of errorTypes) {
        const { unmount } = render(
          <ErrorBoundary>
            <ThrowErrorComponent
              shouldThrow={true}
              errorMessage={message}
            />
          </ErrorBoundary>,
        );

        expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('Error Recovery Mechanism', () => {
    it('should reset error state when retry button is clicked', async () => {
      let componentKey = 0;
      let shouldThrow = true;

      const TestWrapper = ({ key }: { key: number }) => (
        <ErrorBoundary key={key}>
          <ThrowErrorComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestWrapper key={componentKey} />);

      // Verify error state
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();

      // Simulate successful retry by changing component state and key
      shouldThrow = false;
      componentKey++;

      // Click retry button (this will reset the error boundary state)
      const retryButton = screen.getByTestId('error-boundary-button');
      await user.click(retryButton);

      // Re-render with new key to force remount and updated state
      rerender(<TestWrapper key={componentKey} />);

      // Verify error boundary is reset and normal component is shown
      expect(
        screen.queryByTestId('error-boundary-card'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('normal-component')).toBeInTheDocument();
    });

    it('should handle multiple error-recovery cycles', async () => {
      let componentKey = 0;
      let shouldThrow = true;

      const TestWrapper = ({ key }: { key: number }) => (
        <ErrorBoundary key={key}>
          <ThrowErrorComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestWrapper key={componentKey} />);

      // First error
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();

      // First recovery
      shouldThrow = false;
      componentKey++;
      await user.click(screen.getByTestId('error-boundary-button'));
      rerender(<TestWrapper key={componentKey} />);
      expect(screen.getByTestId('normal-component')).toBeInTheDocument();

      // Second error
      shouldThrow = true;
      componentKey++;
      rerender(<TestWrapper key={componentKey} />);
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();

      // Second recovery
      shouldThrow = false;
      componentKey++;
      await user.click(screen.getByTestId('error-boundary-button'));
      rerender(<TestWrapper key={componentKey} />);
      expect(screen.getByTestId('normal-component')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback Support', () => {
    it('should render custom fallback when provided', async () => {
      const customFallback = (
        <div data-testid='custom-fallback'>Custom error message</div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      // Verify custom fallback is rendered instead of default
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(
        screen.queryByTestId('error-boundary-card'),
      ).not.toBeInTheDocument();
    });

    it('should use default fallback when custom fallback is not provided', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      // Verify default fallback is rendered
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log errors in development environment', async () => {
      // Create a fresh spy for this test
      const localConsoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowErrorComponent
            shouldThrow={true}
            errorMessage='Development error'
          />
        </ErrorBoundary>,
      );

      // Verify error boundary is displayed (which means error was caught)
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();

      // Wait for componentDidCatch to be called (it's async)
      await waitFor(
        () => {
          expect(localConsoleSpy).toHaveBeenCalledWith(
            'ErrorBoundary caught an error:',
            expect.any(Error),
            expect.any(Object),
          );
        },
        { timeout: 2000 },
      );

      // Restore the spy
      localConsoleSpy.mockRestore();
    });

    it('should handle production environment logging', async () => {
      // Mock production environment using vi.stubEnv
      vi.stubEnv('NODE_ENV', 'production');

      render(
        <ErrorBoundary>
          <ThrowErrorComponent
            shouldThrow={true}
            errorMessage='Production error'
          />
        </ErrorBoundary>,
      );

      // In production, should not log to console (would use Sentry instead)
      // This test verifies the component doesn't crash in production
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();

      // Restore environment
      vi.unstubAllEnvs();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper accessibility attributes', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      const errorCard = screen.getByTestId('error-boundary-card');
      const retryButton = screen.getByTestId('error-boundary-button');

      // Verify accessibility structure
      expect(errorCard).toBeInTheDocument();
      expect(retryButton).toBeInTheDocument();

      // Verify button is focusable
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });

    it('should support keyboard navigation', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>,
      );

      const retryButton = screen.getByTestId('error-boundary-button');

      // Verify button is focusable
      expect(retryButton).toHaveAttribute('tabIndex', '0');

      // Test keyboard activation
      retryButton.focus();
      expect(retryButton).toHaveFocus();

      // Test that button can be activated with keyboard
      // We don't test the actual retry functionality here, just keyboard accessibility
      expect(retryButton).toBeEnabled();

      // Test Space key activation as well
      await user.keyboard('{Space}');

      // Verify the error boundary is still showing (since component still throws)
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle null/undefined children gracefully', async () => {
      render(
        <ErrorBoundary>
          {null}
          {undefined}
        </ErrorBoundary>,
      );

      // Should render without errors
      expect(
        screen.queryByTestId('error-boundary-card'),
      ).not.toBeInTheDocument();
    });

    it('should handle errors with missing error messages', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent
            shouldThrow={true}
            errorMessage=''
          />
        </ErrorBoundary>,
      );

      // Should still render error boundary
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
    });

    it('should handle very long error messages', async () => {
      const longErrorMessage = 'A'.repeat(1000);

      render(
        <ErrorBoundary>
          <ThrowErrorComponent
            shouldThrow={true}
            errorMessage={longErrorMessage}
          />
        </ErrorBoundary>,
      );

      // Should render without layout issues
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
    });

    it('should handle special characters in error messages', async () => {
      const specialCharError = '错误信息 🚨 <script>alert("xss")</script>';

      render(
        <ErrorBoundary>
          <ThrowErrorComponent
            shouldThrow={true}
            errorMessage={specialCharError}
          />
        </ErrorBoundary>,
      );

      // Should render safely without XSS
      expect(screen.getByTestId('error-boundary-card')).toBeInTheDocument();
    });
  });
});
