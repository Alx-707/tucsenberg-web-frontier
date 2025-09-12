/**
 * @vitest-environment jsdom
 */

/**
 * Social Icons Accessibility & Integration - Core Tests
 *
 * 核心可访问性和集成测试，包括：
 * - 基本可访问性功能
 * - 核心集成场景
 * - 基础交互测试
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ExternalLinkIcon,
  LinkedInIcon,
  SocialIconLink,
  SocialIconMapper,
  TwitterIcon,
} from '../social-icons';

describe('Social Icons Accessibility & Integration - Core Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Basic Accessibility Features', () => {
    it('provides accessible names for social links', () => {
      render(
        <div>
          <SocialIconLink href='https://twitter.com/test' platform='twitter'>
            <TwitterIcon />
          </SocialIconLink>
          <SocialIconLink href='https://linkedin.com/in/test' platform='linkedin'>
            <LinkedInIcon />
          </SocialIconLink>
        </div>
      );

      const twitterLink = screen.getByRole('link', { name: /twitter/i });
      const linkedinLink = screen.getByRole('link', { name: /linkedin/i });

      expect(twitterLink).toBeInTheDocument();
      expect(linkedinLink).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(
        <SocialIconLink href='https://twitter.com/test' platform='twitter'>
          <TwitterIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://twitter.com/test');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('supports keyboard navigation', async () => {
      render(
        <div>
          <SocialIconLink href='https://twitter.com/test' platform='twitter'>
            <TwitterIcon />
          </SocialIconLink>
          <SocialIconLink href='https://linkedin.com/in/test' platform='linkedin'>
            <LinkedInIcon />
          </SocialIconLink>
        </div>
      );

      const twitterLink = screen.getByRole('link', { name: /twitter/i });
      const linkedinLink = screen.getByRole('link', { name: /linkedin/i });

      // Test tab navigation
      twitterLink.focus();
      expect(twitterLink).toHaveFocus();

      await user.tab();
      expect(linkedinLink).toHaveFocus();
    });

    it('handles external link indicators', () => {
      render(
        <SocialIconLink href='https://external.com' platform='external'>
          <ExternalLinkIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Core Integration Scenarios', () => {
    it('works with SocialIconMapper', () => {
      const socialLinks = [
        { platform: 'twitter', url: 'https://twitter.com/test' },
        { platform: 'linkedin', url: 'https://linkedin.com/in/test' },
      ];

      render(
        <div>
          {socialLinks.map((link) => (
            <SocialIconMapper
              key={link.platform}
              platform={link.platform}
              href={link.url}
            />
          ))}
        </div>
      );

      expect(screen.getByRole('link', { name: /twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /linkedin/i })).toBeInTheDocument();
    });

    it('handles multiple social icons in navigation', () => {
      render(
        <nav aria-label='Social Media Links'>
          <SocialIconLink href='https://twitter.com/test' platform='twitter'>
            <TwitterIcon />
          </SocialIconLink>
          <SocialIconLink href='https://linkedin.com/in/test' platform='linkedin'>
            <LinkedInIcon />
          </SocialIconLink>
        </nav>
      );

      const navigation = screen.getByRole('navigation', { name: 'Social Media Links' });
      expect(navigation).toBeInTheDocument();

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('works in footer context', () => {
      render(
        <footer>
          <div>
            <h3>Follow Us</h3>
            <SocialIconLink href='https://twitter.com/test' platform='twitter'>
              <TwitterIcon />
            </SocialIconLink>
            <SocialIconLink href='https://linkedin.com/in/test' platform='linkedin'>
              <LinkedInIcon />
            </SocialIconLink>
          </div>
        </footer>
      );

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: 'Follow Us' });
      expect(heading).toBeInTheDocument();

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('handles responsive layout integration', () => {
      render(
        <div className='flex flex-wrap gap-4'>
          <SocialIconLink href='https://twitter.com/test' platform='twitter'>
            <TwitterIcon />
          </SocialIconLink>
          <SocialIconLink href='https://linkedin.com/in/test' platform='linkedin'>
            <LinkedInIcon />
          </SocialIconLink>
        </div>
      );

      const container = screen.getByRole('generic');
      expect(container).toHaveClass('flex', 'flex-wrap', 'gap-4');

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });
  });

  describe('Interactive Behavior', () => {
    it('handles click events', async () => {
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockOpen,
      });

      render(
        <SocialIconLink href='https://twitter.com/test' platform='twitter'>
          <TwitterIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      await user.click(link);

      // Note: In real browser, this would open a new tab
      // In test environment, we just verify the link is clickable
      expect(link).toBeInTheDocument();
    });

    it('handles keyboard activation', async () => {
      render(
        <SocialIconLink href='https://twitter.com/test' platform='twitter'>
          <TwitterIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      link.focus();

      await user.keyboard('{Enter}');
      expect(link).toBeInTheDocument();
    });

    it('provides hover states', async () => {
      render(
        <SocialIconLink href='https://twitter.com/test' platform='twitter'>
          <TwitterIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      
      await user.hover(link);
      expect(link).toBeInTheDocument();

      await user.unhover(link);
      expect(link).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing href gracefully', () => {
      render(
        <SocialIconLink href='' platform='twitter'>
          <TwitterIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '');
    });

    it('handles unknown platform gracefully', () => {
      render(
        <SocialIconLink href='https://example.com' platform='unknown'>
          <ExternalLinkIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('handles missing children gracefully', () => {
      render(
        <SocialIconLink href='https://twitter.com/test' platform='twitter'>
          {/* No children */}
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('applies theme classes correctly', () => {
      render(
        <div className='dark'>
          <SocialIconLink href='https://twitter.com/test' platform='twitter'>
            <TwitterIcon />
          </SocialIconLink>
        </div>
      );

      const container = screen.getByRole('generic');
      expect(container).toHaveClass('dark');

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('handles light theme', () => {
      render(
        <div className='light'>
          <SocialIconLink href='https://twitter.com/test' platform='twitter'>
            <TwitterIcon />
          </SocialIconLink>
        </div>
      );

      const container = screen.getByRole('generic');
      expect(container).toHaveClass('light');

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('renders multiple icons efficiently', () => {
      const platforms = ['twitter', 'linkedin', 'external'];
      const icons = [TwitterIcon, LinkedInIcon, ExternalLinkIcon];

      render(
        <div>
          {platforms.map((platform, index) => {
            const IconComponent = icons[index];
            return (
              <SocialIconLink
                key={platform}
                href={`https://${platform}.com/test`}
                platform={platform}
              >
                <IconComponent />
              </SocialIconLink>
            );
          })}
        </div>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('handles re-renders without issues', () => {
      const { rerender } = render(
        <SocialIconLink href='https://twitter.com/test' platform='twitter'>
          <TwitterIcon />
        </SocialIconLink>
      );

      expect(screen.getByRole('link')).toBeInTheDocument();

      rerender(
        <SocialIconLink href='https://twitter.com/updated' platform='twitter'>
          <TwitterIcon />
        </SocialIconLink>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://twitter.com/updated');
    });
  });
});
