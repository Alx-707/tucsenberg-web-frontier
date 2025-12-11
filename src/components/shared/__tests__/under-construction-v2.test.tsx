/**
 * @vitest-environment jsdom
 * Tests for UnderConstructionV2 component
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnderConstructionV2 } from '../under-construction-v2';

// Mock dependencies
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

vi.mock('@/constants', () => ({
  ONE: 1,
}));

describe('UnderConstructionV2', () => {
  describe('basic rendering', () => {
    it('renders with products pageType', () => {
      render(<UnderConstructionV2 pageType='products' />);

      expect(screen.getByText(/Header Section - products/)).toBeInTheDocument();
      expect(
        screen.getByText(/Contact Section - products/),
      ).toBeInTheDocument();
    });

    it('renders with blog pageType', () => {
      render(<UnderConstructionV2 pageType='blog' />);

      expect(screen.getByText(/Header Section - blog/)).toBeInTheDocument();
    });

    it('renders with about pageType', () => {
      render(<UnderConstructionV2 pageType='about' />);

      expect(screen.getByText(/Header Section - about/)).toBeInTheDocument();
    });

    it('renders with contact pageType', () => {
      render(<UnderConstructionV2 pageType='contact' />);

      expect(screen.getByText(/Header Section - contact/)).toBeInTheDocument();
    });
  });

  describe('progress section', () => {
    it('shows progress enabled by default', () => {
      render(<UnderConstructionV2 pageType='products' />);

      expect(
        screen.getByText(/Progress Section - Enabled/),
      ).toBeInTheDocument();
    });

    it('shows progress disabled when showProgress is false', () => {
      render(
        <UnderConstructionV2
          pageType='products'
          showProgress={false}
        />,
      );

      expect(
        screen.getByText(/Progress Section - Disabled/),
      ).toBeInTheDocument();
    });

    it('shows current step as 1 by default', () => {
      render(<UnderConstructionV2 pageType='products' />);

      expect(screen.getByText(/Step 1/)).toBeInTheDocument();
    });

    it('shows custom current step', () => {
      render(
        <UnderConstructionV2
          pageType='products'
          currentStep={3}
        />,
      );

      expect(screen.getByText(/Step 3/)).toBeInTheDocument();
    });
  });

  describe('expected date', () => {
    it('shows default expected date', () => {
      render(<UnderConstructionV2 pageType='products' />);

      expect(screen.getByText(/2024年第二季度/)).toBeInTheDocument();
    });

    it('shows custom expected date', () => {
      render(
        <UnderConstructionV2
          pageType='products'
          expectedDate='2025年第一季度'
        />,
      );

      expect(screen.getByText(/2025年第一季度/)).toBeInTheDocument();
    });
  });

  describe('feature preview', () => {
    it('shows feature preview enabled by default', () => {
      render(<UnderConstructionV2 pageType='products' />);

      expect(screen.getByText(/Feature Preview - Enabled/)).toBeInTheDocument();
    });

    it('shows feature preview disabled when prop is false', () => {
      render(
        <UnderConstructionV2
          pageType='products'
          showFeaturePreview={false}
        />,
      );

      expect(
        screen.getByText(/Feature Preview - Disabled/),
      ).toBeInTheDocument();
    });
  });

  describe('email subscription', () => {
    it('shows email subscription enabled by default', () => {
      render(<UnderConstructionV2 pageType='products' />);

      expect(
        screen.getByText(/Email Subscription - Enabled/),
      ).toBeInTheDocument();
    });

    it('shows email subscription disabled when prop is false', () => {
      render(
        <UnderConstructionV2
          pageType='products'
          showEmailSubscription={false}
        />,
      );

      expect(
        screen.getByText(/Email Subscription - Disabled/),
      ).toBeInTheDocument();
    });
  });

  describe('social links', () => {
    it('shows social links enabled by default', () => {
      render(<UnderConstructionV2 pageType='products' />);

      expect(screen.getByText(/Social Links - Enabled/)).toBeInTheDocument();
    });

    it('shows social links disabled when prop is false', () => {
      render(
        <UnderConstructionV2
          pageType='products'
          showSocialLinks={false}
        />,
      );

      expect(screen.getByText(/Social Links - Disabled/)).toBeInTheDocument();
    });
  });

  describe('custom styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <UnderConstructionV2
          pageType='products'
          className='custom-class'
        />,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });

    it('applies gradient background classes', () => {
      const { container } = render(<UnderConstructionV2 pageType='products' />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('bg-gradient-to-br');
    });
  });

  describe('background decorations', () => {
    it('renders background decoration elements', () => {
      const { container } = render(<UnderConstructionV2 pageType='products' />);

      // Check for blur decoration elements
      const blurElements = container.querySelectorAll('.blur-3xl');
      expect(blurElements.length).toBeGreaterThan(0);
    });
  });
});
