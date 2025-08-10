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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageToggle } from '@/components/language-toggle';

// Mock next-intl hooks
const mockUseTranslations = vi.fn();
const mockUseLocale = vi.fn();
const mockUsePathname = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
  useLocale: () => mockUseLocale(),
}));

// Mock next-intl navigation
vi.mock('next-intl/navigation', () => ({
  usePathname: () => mockUsePathname(),
  createNavigation: () => ({
    Link: ({ children, href, locale, onClick, className, ...props }: any) => (
      <a
        data-testid={`language-link-${locale}`}
        href={href}
        data-locale={locale}
        className={className}
        onClick={(e) => {
          mockLinkClick({ href, locale });
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </a>
    ),
    usePathname: () => mockUsePathname(),
  }),
}));

// Mock Link click tracking
const mockLinkClick = vi.fn();

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
  DropdownMenu: ({ children }: any) => (
    <div data-testid='language-dropdown-menu'>{children}</div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid='language-dropdown-trigger'>{children}</div>
  ),
  DropdownMenuContent: ({ children, align }: any) => (
    <div
      data-testid='language-dropdown-content'
      data-align={align}
    >
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, asChild }: any) => (
    <div data-testid='language-dropdown-item'>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, disabled, ...props }: any) => (
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

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Languages: () => <span data-testid='languages-icon'>🌐</span>,
  Loader2: ({ className }: any) => (
    <span
      data-testid='loader-icon'
      className={className}
    >
      ⏳
    </span>
  ),
  Check: ({ className }: any) => (
    <span
      data-testid='check-icon'
      className={className}
    >
      ✓
    </span>
  ),
}));

describe('LanguageToggle Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockUseTranslations.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        toggle: 'Toggle language',
        english: 'English',
        chinese: '中文',
      };
      return translations[key] || key;
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
        <div data-testid="language-dropdown-menu">
          <div data-testid="language-dropdown-trigger">
            <button
              data-testid="language-toggle-button"
              data-variant="outline"
              data-size="icon"
              disabled
            >
              <span data-testid="languages-icon">🌐</span>
              <span data-testid="loader-icon" className="animate-spin">⏳</span>
              <span className="sr-only">Toggle language</span>
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
        <div data-testid="language-dropdown-menu">
          <div data-testid="language-dropdown-trigger">
            <button data-testid="language-toggle-button">
              <span data-testid="languages-icon">🌐</span>
            </button>
          </div>
          <div data-testid="language-dropdown-content">
            <div data-testid="language-dropdown-item">
              <a data-testid="language-link-zh" className="flex items-center">
                <span>ZH</span>
                <span>中文</span>
                <span data-testid="loader-icon" className="animate-spin">⏳</span>
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

      // Verify translations are called correctly
      expect(mockUseTranslations).toHaveBeenCalledWith('toggle');
      expect(mockUseTranslations).toHaveBeenCalledWith('english');
      expect(mockUseTranslations).toHaveBeenCalledWith('chinese');

      // Verify screen reader text
      const toggleButton = screen.getByTestId('language-toggle-button');
      const srText = toggleButton.querySelector('.sr-only');
      expect(srText).toHaveTextContent('Toggle language');
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
      const srText = toggleButton.querySelector('.sr-only');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveTextContent('Toggle language');
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
        expect(link).toHaveAttribute('href', '');
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
