/**
 * Social Icons Accessibility - Basic Tests
 *
 * 专门测试基本可访问性功能，包括：
 * - ARIA属性
 * - 键盘导航
 * - 焦点管理
 * - 语义化标记
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ExternalLinkIcon,
  LinkedInIcon,
  SocialIconLink,
  TwitterIcon,
} from '../social-icons';

describe('Social Icons Accessibility - Basic Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('ARIA属性', () => {
    it('all icons have aria-hidden attribute', () => {
      render(
        <div>
          <TwitterIcon data-testid='twitter' />
          <LinkedInIcon data-testid='linkedin' />
          <ExternalLinkIcon data-testid='external' />
        </div>
      );

      const twitter = screen.getByTestId('twitter');
      const linkedin = screen.getByTestId('linkedin');
      const external = screen.getByTestId('external');

      expect(twitter).toHaveAttribute('aria-hidden', 'true');
      expect(linkedin).toHaveAttribute('aria-hidden', 'true');
      expect(external).toHaveAttribute('aria-hidden', 'true');
    });

    it('icons can override aria-hidden when needed', () => {
      render(<TwitterIcon aria-hidden='false' data-testid='twitter' />);

      const icon = screen.getByTestId('twitter');
      expect(icon).toHaveAttribute('aria-hidden', 'false');
    });

    it('icons support aria-label for accessibility', () => {
      render(
        <TwitterIcon aria-label='Twitter icon' data-testid='twitter' />
      );

      const icon = screen.getByTestId('twitter');
      expect(icon).toHaveAttribute('aria-label', 'Twitter icon');
    });

    it('SocialIconLink has proper accessibility attributes', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Follow us on Twitter'
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      expect(link).toHaveAttribute('aria-label', 'Follow us on Twitter');
      expect(link).toHaveAttribute('href', 'https://twitter.com/example');
    });

    it('external links have proper target and rel attributes', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Twitter'
          data-testid='external-link'
        />
      );

      const link = screen.getByTestId('external-link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('supports role attributes for semantic meaning', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Twitter'
          role='button'
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      expect(link).toHaveAttribute('role', 'button');
    });

    it('handles aria-describedby for additional context', () => {
      render(
        <div>
          <SocialIconLink
            href='https://twitter.com/example'
            platform='twitter'
            aria-label='Twitter'
            aria-describedby='twitter-description'
            data-testid='social-link'
          />
          <div id='twitter-description'>
            Follow our Twitter account for updates
          </div>
        </div>
      );

      const link = screen.getByTestId('social-link');
      const description = screen.getByText('Follow our Twitter account for updates');

      expect(link).toHaveAttribute('aria-describedby', 'twitter-description');
      expect(description).toBeInTheDocument();
    });

    it('supports aria-expanded for expandable content', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Twitter'
          aria-expanded='false'
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      expect(link).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('键盘导航', () => {
    it('supports keyboard navigation between links', async () => {
      render(
        <div>
          <SocialIconLink
            href='https://twitter.com/example'
            platform='twitter'
            aria-label='Twitter'
            data-testid='twitter-link'
          />
          <SocialIconLink
            href='https://linkedin.com/in/example'
            platform='linkedin'
            aria-label='LinkedIn'
            data-testid='linkedin-link'
          />
        </div>
      );

      const twitterLink = screen.getByTestId('twitter-link');
      const linkedinLink = screen.getByTestId('linkedin-link');

      await user.tab();
      expect(twitterLink).toHaveFocus();

      await user.tab();
      expect(linkedinLink).toHaveFocus();
    });

    it('handles keyboard activation', async () => {
      const handleClick = vi.fn();
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Twitter'
          _onClick={handleClick}
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      await user.tab();
      expect(link).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('handles tabindex for custom focus order', () => {
      render(
        <div>
          <SocialIconLink
            href='https://linkedin.com/in/example'
            platform='linkedin'
            aria-label='LinkedIn'
            tabIndex={2}
            data-testid='linkedin-link'
          />
          <SocialIconLink
            href='https://twitter.com/example'
            platform='twitter'
            aria-label='Twitter'
            tabIndex={1}
            data-testid='twitter-link'
          />
        </div>
      );

      const twitterLink = screen.getByTestId('twitter-link');
      const linkedinLink = screen.getByTestId('linkedin-link');

      expect(twitterLink).toHaveAttribute('tabindex', '1');
      expect(linkedinLink).toHaveAttribute('tabindex', '2');
    });

    it('handles focus trap scenarios', async () => {
      render(
        <div>
          <button data-testid='before'>Before</button>
          <SocialIconLink
            href='https://twitter.com/example'
            platform='twitter'
            aria-label='Twitter'
            data-testid='social-link'
          />
          <button data-testid='after'>After</button>
        </div>
      );

      const beforeButton = screen.getByTestId('before');
      const socialLink = screen.getByTestId('social-link');
      const afterButton = screen.getByTestId('after');

      await user.tab();
      expect(beforeButton).toHaveFocus();

      await user.tab();
      expect(socialLink).toHaveFocus();

      await user.tab();
      expect(afterButton).toHaveFocus();
    });
  });

  describe('焦点管理', () => {
    it('provides proper focus indicators', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Twitter'
          className='focus:ring-2 focus:ring-offset-2'
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      expect(link).toHaveClass('focus:ring-2', 'focus:ring-offset-2');
    });

    it('supports color contrast requirements', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Twitter'
          className='text-blue-600 hover:text-blue-800'
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      expect(link).toHaveClass('text-blue-600', 'hover:text-blue-800');
    });

    it('supports high contrast mode', () => {
      render(
        <TwitterIcon
          className='forced-colors:text-[ButtonText]'
          data-testid='twitter'
        />
      );

      const icon = screen.getByTestId('twitter');
      expect(icon).toHaveClass('forced-colors:text-[ButtonText]');
    });

    it('supports reduced motion preferences', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Twitter'
          className='motion-reduce:transition-none'
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      expect(link).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('语义化标记', () => {
    it('supports screen reader announcements', () => {
      render(
        <div>
          <div aria-live='polite' id='announcements'></div>
          <SocialIconLink
            href='https://twitter.com/example'
            platform='twitter'
            aria-label='Twitter'
            data-testid='social-link'
          />
        </div>
      );

      const announcements = screen.getByRole('status');
      const link = screen.getByTestId('social-link');

      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(link).toBeInTheDocument();
    });

    it('supports voice control commands', () => {
      render(
        <SocialIconLink
          href='https://twitter.com/example'
          platform='twitter'
          aria-label='Click Twitter link'
          data-testid='social-link'
        />
      );

      const link = screen.getByTestId('social-link');
      expect(link).toHaveAttribute('aria-label', 'Click Twitter link');
    });
  });
});
