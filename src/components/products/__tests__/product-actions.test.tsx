/**
 * @vitest-environment jsdom
 * Tests for ProductActions component
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductActions } from '../product-actions';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    (
      window as unknown as {
        intersectionCallback: IntersectionObserverCallback;
      }
    ).intersectionCallback = callback;
  }

  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
  root = null;
  rootMargin = '';
  thresholds = [0];
}

beforeEach(() => {
  window.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    target,
    rel,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    target?: string;
    rel?: string;
  }) => (
    <a
      href={href}
      target={target}
      rel={rel}
      data-testid='pdf-link'
      {...rest}
    >
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      data-testid='download-icon'
      {...props}
    />
  ),
  MessageSquare: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      data-testid='message-square-icon'
      {...props}
    />
  ),
}));

// Mock InquiryDrawer
vi.mock('@/components/products/inquiry-drawer', () => ({
  InquiryDrawer: ({
    open,
    onOpenChange,
    productSlug,
    productName,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productSlug: string;
    productName: string;
  }) => (
    <div
      data-testid='inquiry-drawer'
      data-open={String(open)}
      data-product-slug={productSlug}
      data-product-name={productName}
    >
      {open && (
        <button
          data-testid='close-drawer'
          onClick={() => onOpenChange(false)}
        >
          Close
        </button>
      )}
    </div>
  ),
}));

describe('ProductActions', () => {
  const defaultProps = {
    productSlug: 'test-product',
    productName: 'Test Product',
    requestQuoteLabel: 'Request Quote',
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders request quote buttons (main CTA and sticky bar)', () => {
      render(<ProductActions {...defaultProps} />);

      // Both main CTA and sticky bar render the button
      const buttons = screen.getAllByRole('button', { name: /Request Quote/i });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders message square icon in request quote button', () => {
      render(<ProductActions {...defaultProps} />);

      expect(
        screen.getAllByTestId('message-square-icon').length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('renders InquiryDrawer component', () => {
      render(<ProductActions {...defaultProps} />);

      expect(screen.getByTestId('inquiry-drawer')).toBeInTheDocument();
    });

    it('drawer is closed by default', () => {
      render(<ProductActions {...defaultProps} />);

      const drawer = screen.getByTestId('inquiry-drawer');
      expect(drawer).toHaveAttribute('data-open', 'false');
    });
  });

  describe('PDF download button', () => {
    it('renders PDF download button when pdfHref and label provided', () => {
      render(
        <ProductActions
          {...defaultProps}
          pdfHref='/product.pdf'
          downloadPdfLabel='Download PDF'
        />,
      );

      // Both main CTA and sticky bar may render the button
      expect(screen.getAllByText('Download PDF').length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('does not render PDF button when pdfHref is undefined', () => {
      render(
        <ProductActions
          {...defaultProps}
          downloadPdfLabel='Download PDF'
        />,
      );

      expect(screen.queryByText('Download PDF')).not.toBeInTheDocument();
    });

    it('does not render PDF button when downloadPdfLabel is undefined', () => {
      render(
        <ProductActions
          {...defaultProps}
          pdfHref='/product.pdf'
        />,
      );

      expect(screen.queryByTestId('pdf-link')).not.toBeInTheDocument();
    });

    it('PDF link has correct href', () => {
      render(
        <ProductActions
          {...defaultProps}
          pdfHref='/docs/product-spec.pdf'
          downloadPdfLabel='Download'
        />,
      );

      const links = screen.getAllByTestId('pdf-link');
      expect(links[0]).toHaveAttribute('href', '/docs/product-spec.pdf');
    });

    it('PDF link opens in new tab', () => {
      render(
        <ProductActions
          {...defaultProps}
          pdfHref='/product.pdf'
          downloadPdfLabel='Download'
        />,
      );

      const links = screen.getAllByTestId('pdf-link');
      expect(links[0]).toHaveAttribute('target', '_blank');
      expect(links[0]).toHaveAttribute('rel', 'noreferrer');
    });

    it('renders download icon in PDF button', () => {
      render(
        <ProductActions
          {...defaultProps}
          pdfHref='/product.pdf'
          downloadPdfLabel='Download'
        />,
      );

      expect(
        screen.getAllByTestId('download-icon').length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe('drawer interaction', () => {
    it('opens drawer when request quote button is clicked', () => {
      render(<ProductActions {...defaultProps} />);

      const buttons = screen.getAllByRole('button', { name: /Request Quote/i });
      fireEvent.click(buttons[0]);

      const drawer = screen.getByTestId('inquiry-drawer');
      expect(drawer).toHaveAttribute('data-open', 'true');
    });

    it('passes product info to drawer', () => {
      render(<ProductActions {...defaultProps} />);

      const drawer = screen.getByTestId('inquiry-drawer');
      expect(drawer).toHaveAttribute('data-product-slug', 'test-product');
      expect(drawer).toHaveAttribute('data-product-name', 'Test Product');
    });

    it('can close drawer after opening', () => {
      render(<ProductActions {...defaultProps} />);

      // Open drawer
      const buttons = screen.getAllByRole('button', { name: /Request Quote/i });
      fireEvent.click(buttons[0]);
      expect(screen.getByTestId('inquiry-drawer')).toHaveAttribute(
        'data-open',
        'true',
      );

      // Close drawer
      fireEvent.click(screen.getByTestId('close-drawer'));
      expect(screen.getByTestId('inquiry-drawer')).toHaveAttribute(
        'data-open',
        'false',
      );
    });
  });

  describe('IntersectionObserver', () => {
    it('sets up IntersectionObserver on mount', () => {
      render(<ProductActions {...defaultProps} />);

      expect(mockObserve).toHaveBeenCalled();
    });

    it('disconnects observer on unmount', () => {
      const { unmount } = render(<ProductActions {...defaultProps} />);

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('sticky bar', () => {
    it('renders sticky bar element', () => {
      const { container } = render(<ProductActions {...defaultProps} />);

      // Sticky bar should exist but be translated off-screen initially
      const stickyBar = container.querySelector('.fixed.inset-x-0.bottom-0');
      expect(stickyBar).toBeInTheDocument();
    });

    it('sticky bar shows product name', () => {
      render(
        <ProductActions
          {...defaultProps}
          productName='Widget Pro'
        />,
      );

      // Both main CTA and sticky bar should have product reference
      expect(screen.getAllByText(/Widget Pro/i).length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('sticky bar has translate-y-full class initially', () => {
      const { container } = render(<ProductActions {...defaultProps} />);

      const stickyBar = container.querySelector('.fixed.inset-x-0.bottom-0');
      expect(stickyBar).toHaveClass('translate-y-full');
    });
  });

  describe('custom className', () => {
    it('applies custom className to main CTA container', () => {
      const { container } = render(
        <ProductActions
          {...defaultProps}
          className='custom-actions-class'
        />,
      );

      const ctaContainer = container.querySelector('.custom-actions-class');
      expect(ctaContainer).toBeInTheDocument();
    });
  });

  describe('button icons', () => {
    it('request quote button has MessageSquare icon', () => {
      render(<ProductActions {...defaultProps} />);

      const icons = screen.getAllByTestId('message-square-icon');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });

    it('download button has Download icon when shown', () => {
      render(
        <ProductActions
          {...defaultProps}
          pdfHref='/test.pdf'
          downloadPdfLabel='Download'
        />,
      );

      const icons = screen.getAllByTestId('download-icon');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('handles special characters in product name', () => {
      render(
        <ProductActions
          {...defaultProps}
          productName='Product <Test> & "Special"'
        />,
      );

      expect(
        screen.getAllByText('Product <Test> & "Special"').length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('handles very long product names', () => {
      const longName =
        'This is a very long product name that should be displayed in the sticky bar';
      render(
        <ProductActions
          {...defaultProps}
          productName={longName}
        />,
      );

      expect(screen.getAllByText(longName).length).toBeGreaterThanOrEqual(1);
    });

    it('works without optional props', () => {
      render(<ProductActions {...defaultProps} />);

      const buttons = screen.getAllByRole('button', { name: /Request Quote/i });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('handles empty string for pdfHref', () => {
      render(
        <ProductActions
          {...defaultProps}
          pdfHref=''
          downloadPdfLabel='Download'
        />,
      );

      // Empty string is not undefined, so link renders (implementation detail)
      // There may be 2 links due to sticky bar
      const links = screen.getAllByTestId('pdf-link');
      expect(links.length).toBeGreaterThanOrEqual(1);
    });
  });
});
