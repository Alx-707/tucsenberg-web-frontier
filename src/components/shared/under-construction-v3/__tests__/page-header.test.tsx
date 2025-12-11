/**
 * @vitest-environment jsdom
 * Tests for PageHeader component
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '../page-header';

describe('PageHeader', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(
        <PageHeader
          title='Test Title'
          description='Test Description'
        />,
      );

      expect(
        screen.getByRole('heading', { name: 'Test Title' }),
      ).toBeInTheDocument();
    });

    it('renders description', () => {
      render(
        <PageHeader
          title='Test Title'
          description='Test Description'
        />,
      );

      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders Zap icon', () => {
      const { container } = render(
        <PageHeader
          title='Test Title'
          description='Test Description'
        />,
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('renders title with proper heading level', () => {
      render(
        <PageHeader
          title='Heading Test'
          description='Description'
        />,
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Heading Test');
    });

    it('applies responsive classes to title', () => {
      render(
        <PageHeader
          title='Responsive Title'
          description='Description'
        />,
      );

      const heading = screen.getByRole('heading');
      expect(heading.className).toContain('text-2xl');
      expect(heading.className).toContain('md:text-3xl');
      expect(heading.className).toContain('lg:text-4xl');
    });
  });

  describe('content', () => {
    it('renders with long title', () => {
      const longTitle = 'This is a very long title that spans multiple words';
      render(
        <PageHeader
          title={longTitle}
          description='Short description'
        />,
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('renders with long description', () => {
      const longDesc =
        'This is a very detailed description that explains everything about the page in great detail.';
      render(
        <PageHeader
          title='Title'
          description={longDesc}
        />,
      );

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('renders with special characters', () => {
      render(
        <PageHeader
          title='Title with 特殊字符 & symbols'
          description='Description with <html> entities'
        />,
      );

      expect(
        screen.getByText('Title with 特殊字符 & symbols'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Description with <html> entities'),
      ).toBeInTheDocument();
    });
  });
});
