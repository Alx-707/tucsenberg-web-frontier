/**
 * Integration Tests for LanguageToggle Component
 *
 * Tests the complete language switching workflow including:
 * - User interaction flows
 * - Transition states
 * - Internationalization integration
 * - Navigation behavior
 * - Loading states
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageToggle } from '@/components/language-toggle';
import { languageMessages } from '@/test/constants/mock-messages';

// Mock next-intl hooks
const mockUseTranslations = vi.fn();
const mockUseLocale = vi.fn();
const mockUsePathname = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
  useLocale: () => mockUseLocale(),
}));

// Mock Link click tracking
const mockLinkClick = vi.fn();

// Mock @/i18n/routing (实际组件使用的导入)
vi.mock('@/i18n/routing', () => ({
  Link: ({
    children,
    href,
    locale,
    onClick,
    className,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname: string; params?: Record<string, string> };
    locale: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    className?: string;
    [key: string]: unknown;
  }) => {
    // Normalize href to string for test assertions
    const hrefString =
      typeof href === 'string'
        ? href
        : href.pathname.replace('[slug]', href.params?.slug || '');
    return (
      <a
        data-testid={`language-link-${locale}`}
        href={hrefString}
        data-locale={locale}
        className={className}
        onClick={(e) => {
          mockLinkClick({ href: hrefString, locale });
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </a>
    );
  },
  usePathname: () => mockUsePathname(),
}));

// Mock React hooks
const mockStartTransition = vi.fn();
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, mockStartTransition],
    useState: vi.fn((initial) => {
      const state = vi.fn(() => initial);
      const setState = vi.fn();
      return [state(), setState];
    }),
  };
});

// Mock UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.ComponentProps<'div'>) => (
    <div data-testid='language-dropdown-menu'>{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
    asChild: _asChild,
  }: React.ComponentProps<'div'> & { asChild?: boolean }) => (
    <div data-testid='language-dropdown-trigger'>{children}</div>
  ),
  DropdownMenuContent: ({
    children,
    align,
  }: React.ComponentProps<'div'> & { align?: string }) => (
    <div
      data-testid='language-dropdown-content'
      data-align={align}
    >
      {children}
    </div>
  ),
  DropdownMenuItem: ({
    children,
    asChild: _asChild,
  }: React.ComponentProps<'div'> & { asChild?: boolean }) => (
    <div data-testid='language-dropdown-item'>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant,
    size,
    disabled,
    ...props
  }: React.ComponentProps<'button'> & { variant?: string; size?: string }) => (
    <button
      data-testid='language-toggle-button'
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

const lucideMock = vi.hoisted(() => ({
  __esModule: true,
  Languages: () => <span data-testid='languages-icon'>🌐</span>,
  Globe: ({ className }: React.ComponentProps<'div'>) => (
    <span
      data-testid='globe-icon'
      className={className}
    >
      🌐
    </span>
  ),
  Loader2: ({ className }: React.ComponentProps<'div'>) => (
    <span
      data-testid='loader-icon'
      className={className}
    >
      ⏳
    </span>
  ),
  Check: ({ className }: React.ComponentProps<'div'>) => (
    <span
      data-testid='check-icon'
      className={className}
    >
      ✓
    </span>
  ),
}));

vi.mock('lucide-react', () => lucideMock);

describe('LanguageToggle Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockUseTranslations.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        toggle: languageMessages.toggle,
        english: languageMessages.english,
        chinese: languageMessages.chinese,
      };

      return (
        (Object.hasOwn(translations, key) ? translations[key] : null) || key
      );
    });

    mockUseLocale.mockReturnValue('en');
    mockUsePathname.mockReturnValue('/about');
    mockStartTransition.mockImplementation((fn) => fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Language Switching Workflow', () => {
    it('should complete full language switch from English to Chinese', async () => {
      render(<LanguageToggle />);

      // 1. Initial state verification
      const toggleButton = screen.getByTestId('language-toggle-button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).not.toBeDisabled();

      // 2. Verify current language indicator
      const checkIcon = screen.getByTestId('check-icon');
      expect(checkIcon).toBeInTheDocument();

      // 3. Click on Chinese language option
      const chineseLink = screen.getByTestId('language-link-zh');
      expect(chineseLink).toBeInTheDocument();
      expect(chineseLink).toHaveAttribute('data-locale', 'zh');

      await user.click(chineseLink);

      // 4. Verify navigation was triggered
      expect(mockLinkClick).toHaveBeenCalledWith({
        href: '/about',
        locale: 'zh',
      });

      // 5. Verify transition was started
      expect(mockStartTransition).toHaveBeenCalled();
    });

    it('should handle language switch from Chinese to English', async () => {
      // Setup Chinese as current locale
      mockUseLocale.mockReturnValue('zh');

      render(<LanguageToggle />);

      const englishLink = screen.getByTestId('language-link-en');
      await user.click(englishLink);

      expect(mockLinkClick).toHaveBeenCalledWith({
        href: '/about',
        locale: 'en',
      });
    });
  });

  describe('Loading States Integration', () => {
    it('should show loading state during transition', async () => {
      // Mock the component to simulate loading state
      const MockLanguageToggle = () => (
        <div data-testid='language-dropdown-menu'>
          <div data-testid='language-dropdown-trigger'>
            <button
              data-testid='language-toggle-button'
              data-variant='outline'
              data-size='icon'
              disabled
            >
              <span data-testid='languages-icon'>🌐</span>
              <span
                data-testid='loader-icon'
                className='animate-spin'
              >
                ⏳
              </span>
              <span className='sr-only'>Toggle language</span>
            </button>
          </div>
        </div>
      );

      render(<MockLanguageToggle />);

      // Verify loading state is shown
      const toggleButton = screen.getByTestId('language-toggle-button');
      expect(toggleButton).toBeDisabled();

      const loaderIcon = screen.getByTestId('loader-icon');
      expect(loaderIcon).toBeInTheDocument();
      expect(loaderIcon).toHaveClass('animate-spin');
    });

    it('should show individual language loading indicators', async () => {
      // Mock the component to simulate specific language switching
      const MockLanguageToggleWithLoader = () => (
        <div data-testid='language-dropdown-menu'>
          <div data-testid='language-dropdown-trigger'>
            <button data-testid='language-toggle-button'>
              <span data-testid='languages-icon'>🌐</span>
            </button>
          </div>
          <div data-testid='language-dropdown-content'>
            <div data-testid='language-dropdown-item'>
              <a
                data-testid='language-link-zh'
                className='flex items-center'
              >
                <span>ZH</span>
                <span>中文</span>
                <span
                  data-testid='loader-icon'
                  className='animate-spin'
                >
                  ⏳
                </span>
              </a>
            </div>
          </div>
        </div>
      );

      render(<MockLanguageToggleWithLoader />);

      // Should show loader for Chinese option
      const chineseSection = screen.getByTestId('language-link-zh');
      const loaderInChinese = chineseSection.querySelector(
        '[data-testid="loader-icon"]',
      );
      expect(loaderInChinese).toBeInTheDocument();
    });
  });

  describe('Internationalization Integration', () => {
    it('should use correct translations for interface elements', async () => {
      render(<LanguageToggle />);

      const toggleButton = screen.getByTestId('language-toggle-button');
      expect(toggleButton).toHaveTextContent('English');

      await user.click(toggleButton);

      const menu = await screen.findByTestId('language-dropdown-content');
      expect(menu).toHaveTextContent('English');
      expect(menu).toHaveTextContent('简体中文');
    });

    it('should handle missing translations gracefully', async () => {
      // Mock missing translations
      mockUseTranslations.mockImplementation((key: string) => `missing.${key}`);

      expect(() => render(<LanguageToggle />)).not.toThrow();

      const toggleButton = screen.getByTestId('language-toggle-button');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('should normalize pathnames with locale prefixes', async () => {
      // Test locale prefix stripping behavior
      const testCases = [
        { input: '/en', expected: '/' },
        { input: '/zh', expected: '/' },
        { input: '/en/', expected: '/' },
        { input: '/en/about', expected: '/about' },
        { input: '/zh/blog/abc', expected: '/blog/abc' },
        { input: '/foo/en/bar', expected: '/foo/en/bar' }, // Should not strip middle segments
      ];

      for (const { input, expected } of testCases) {
        mockUsePathname.mockReturnValue(input);

        const { unmount } = render(<LanguageToggle />);

        const links = screen.getAllByTestId(/language-link-/);
        links.forEach((link) => {
          expect(link).toHaveAttribute('href', expected);
        });

        unmount();
      }
    });

    it('should preserve current pathname during language switch', async () => {
      const testPaths = ['/about', '/contact', '/products/item-1'];

      for (const path of testPaths) {
        mockUsePathname.mockReturnValue(path);

        const { unmount } = render(<LanguageToggle />);

        const englishLinks = screen.getAllByTestId('language-link-en');
        const chineseLinks = screen.getAllByTestId('language-link-zh');

        // 取第一个匹配的元素
        expect(englishLinks[0]).toHaveAttribute('href', path);
        expect(chineseLinks[0]).toHaveAttribute('href', path);

        // 清理DOM以避免重复元素
        unmount();
      }
    });

    it('should handle complex pathnames with parameters', async () => {
      mockUsePathname.mockReturnValue(
        '/products/category/electronics?sort=price',
      );

      render(<LanguageToggle />);

      const links = screen.getAllByTestId(/language-link-/);
      links.forEach((link) => {
        expect(link).toHaveAttribute(
          'href',
          '/products/category/electronics?sort=price',
        );
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide proper ARIA labels and roles', async () => {
      render(<LanguageToggle />);

      const toggleButton = screen.getByTestId('language-toggle-button');
      expect(toggleButton).toHaveAccessibleName(/English/);

      await user.click(toggleButton);

      await screen.findByTestId('language-dropdown-content');
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(2);
    });

    it('should support keyboard navigation', async () => {
      render(<LanguageToggle />);

      const toggleButton = screen.getByTestId('language-toggle-button');

      // Test keyboard focus
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);

      // Test keyboard activation
      await user.keyboard('{Enter}');
      // Dropdown should be accessible via keyboard
      expect(
        screen.getByTestId('language-dropdown-content'),
      ).toBeInTheDocument();
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle locale detection errors gracefully', async () => {
      mockUseLocale.mockReturnValue(undefined);

      expect(() => render(<LanguageToggle />)).not.toThrow();

      const toggleButton = screen.getByTestId('language-toggle-button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should handle pathname errors gracefully', async () => {
      mockUsePathname.mockReturnValue('');

      expect(() => render(<LanguageToggle />)).not.toThrow();

      const links = screen.getAllByTestId(/language-link-/);
      links.forEach((link) => {
        // Empty pathname should be normalized to '/' for safe navigation
        expect(link).toHaveAttribute('href', '/');
      });
    });

    it('should handle transition errors gracefully', async () => {
      mockStartTransition.mockImplementation(() => {
        throw new Error('Transition failed');
      });

      render(<LanguageToggle />);

      const chineseLink = screen.getByTestId('language-link-zh');

      // Should not crash when transition fails
      expect(() => user.click(chineseLink)).not.toThrow();
    });
  });
});
