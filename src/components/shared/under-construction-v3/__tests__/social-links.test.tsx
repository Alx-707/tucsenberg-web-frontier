/**
 * @vitest-environment jsdom
 * Tests for SocialLinks component
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SocialLinks } from '../social-links';

describe('SocialLinks', () => {
  describe('rendering', () => {
    it('renders GitHub link', () => {
      render(<SocialLinks />);

      expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    });

    it('renders Twitter link', () => {
      render(<SocialLinks />);

      expect(screen.getByRole('link', { name: 'Twitter' })).toBeInTheDocument();
    });

    it('renders exactly two social links', () => {
      render(<SocialLinks />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('has accessible labels for all links', () => {
      render(<SocialLinks />);

      expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    });

    it('renders icons inside links', () => {
      const { container } = render(<SocialLinks />);

      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(2);
    });
  });

  describe('links', () => {
    it('has href attribute on all links', () => {
      render(<SocialLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('styling', () => {
    it('applies hover styles to links', () => {
      render(<SocialLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.className).toContain('transition-colors');
        expect(link.className).toContain('hover:text-foreground');
      });
    });

    it('applies muted foreground color to links', () => {
      render(<SocialLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.className).toContain('text-muted-foreground');
      });
    });
  });
});
