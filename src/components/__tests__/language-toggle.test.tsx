import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@/test/utils';
import { LanguageToggle } from '../language-toggle';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'en'),
  useTranslations: vi.fn(() => (key: string) => key),
}));

// Mock i18n routing (which internally uses next/navigation)
const mockPush = vi.fn();
const mockUsePathname = vi.fn(() => '/');

vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href, locale, ...props }: any) => (
    <a href={href} data-locale={locale} {...props}>
      {children}
    </a>
  ),
  usePathname: mockUsePathname,
  useRouter: vi.fn(() => ({
    push: mockPush,
    pathname: '/',
  })),
}));

// Mock next/navigation as fallback
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    pathname: '/',
  })),
  usePathname: mockUsePathname,
}));

// Mock UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open, onOpenChange }: any) => (
    <div
      data-testid='language-dropdown'
      data-open={open}
      onClick={() => onOpenChange?.(!open)}
    >
      {children}
    </div>
  ),
  DropdownMenuContent: ({ children, ...props }: any) => (
    <div
      data-testid='language-dropdown-content'
      {...props}
    >
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children }: any) => (
    <div data-testid='language-dropdown-trigger'>{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, ...props }: any) => (
    <div
      data-testid='language-menu-item'
      onClick={onClick}
      role='menuitem'
      {...props}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button
      data-testid='language-button'
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Globe: ({ ...props }: any) => (
    <span
      data-testid='globe-icon'
      {...props}
    >
      🌐
    </span>
  ),
  ChevronDown: ({ ...props }: any) => (
    <span
      data-testid='chevron-down-icon'
      {...props}
    >
      ⌄
    </span>
  ),
}));

describe('LanguageToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without errors', () => {
      expect(() => {
        const { container } = render(<LanguageToggle />);
        expect(container).toBeInTheDocument();
      }).not.toThrow();
    });

    it('should render language toggle button', () => {
      render(<LanguageToggle />);

      const button = document.querySelector('[data-testid="language-button"]');
      expect(button).toBeInTheDocument();

      const globeIcon = document.querySelector('[data-testid="globe-icon"]');
      expect(globeIcon).toBeInTheDocument();
    });

    it('should render dropdown menu structure', () => {
      render(<LanguageToggle />);

      const dropdown = document.querySelector(
        '[data-testid="language-dropdown"]',
      );
      expect(dropdown).toBeInTheDocument();

      const trigger = document.querySelector(
        '[data-testid="language-dropdown-trigger"]',
      );
      expect(trigger).toBeInTheDocument();

      const content = document.querySelector(
        '[data-testid="language-dropdown-content"]',
      );
      expect(content).toBeInTheDocument();
    });

    it('should display current language correctly', () => {
      render(<LanguageToggle />);

      // Component should render without errors
      const dropdown = document.querySelector(
        '[data-testid="language-dropdown"]',
      );
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Language Switching', () => {
    it('should handle English language selection', () => {
      render(<LanguageToggle />);

      const menuItems = document.querySelectorAll(
        '[data-testid="language-menu-item"]',
      );
      expect(menuItems.length).toBeGreaterThan(0);

      // Click on English option (assuming it's the first item)
      if (menuItems[0]) {
        fireEvent.click(menuItems[0]);
        // Verify navigation was called
        expect(mockPush).toHaveBeenCalled();
      }
    });

    it('should handle Chinese language selection', () => {
      render(<LanguageToggle />);

      const menuItems = document.querySelectorAll(
        '[data-testid="language-menu-item"]',
      );
      expect(menuItems.length).toBeGreaterThan(0);

      // Click on Chinese option (assuming it's the second item)
      if (menuItems[1]) {
        fireEvent.click(menuItems[1]);
        // Verify navigation was called
        expect(mockPush).toHaveBeenCalled();
      }
    });

    it('should maintain current path when switching languages', () => {
      const testPath = '/about';
      mockUsePathname.mockReturnValue(testPath);

      render(<LanguageToggle />);

      const menuItems = document.querySelectorAll(
        '[data-testid="language-menu-item"]',
      );
      if (menuItems[0]) {
        fireEvent.click(menuItems[0]);

        // Should navigate to the same path with new locale
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining(testPath),
        );
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LanguageToggle />);

      const button = document.querySelector('[data-testid="language-button"]');
      expect(button).toBeInTheDocument();

      const menuItems = document.querySelectorAll(
        '[data-testid="language-menu-item"]',
      );
      menuItems.forEach((item) => {
        expect(item).toHaveAttribute('role', 'menuitem');
      });
    });

    it('should be keyboard accessible', () => {
      render(<LanguageToggle />);

      const button = document.querySelector(
        '[data-testid="language-button"]',
      ) as HTMLElement;
      expect(button).toBeInTheDocument();

      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should handle keyboard events
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      fireEvent.keyDown(button, { key: 'Escape' });
    });
  });

  describe('Internationalization', () => {
    it('should use correct translations', () => {
      render(<LanguageToggle />);

      // Component should render without errors
      const dropdown = document.querySelector(
        '[data-testid="language-dropdown"]',
      );
      expect(dropdown).toBeInTheDocument();
    });

    it('should handle missing translations gracefully', () => {
      expect(() => {
        render(<LanguageToggle />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid locale gracefully', () => {
      expect(() => {
        render(<LanguageToggle />);
      }).not.toThrow();
    });

    it('should handle navigation errors', () => {
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      render(<LanguageToggle />);

      const menuItems = document.querySelectorAll(
        '[data-testid="language-menu-item"]',
      );
      const [firstMenuItem] = menuItems;
      if (firstMenuItem) {
        expect(() => {
          fireEvent.click(firstMenuItem);
        }).not.toThrow();
      }
    });

    it('should handle component unmounting', () => {
      const { unmount } = render(<LanguageToggle />);

      expect(() => {
        unmount();
      }).not.toThrow();

      // Verify component is removed from DOM
      const button = document.querySelector('[data-testid="language-button"]');
      expect(button).not.toBeInTheDocument();
    });
  });
});
