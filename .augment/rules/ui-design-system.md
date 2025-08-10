---
type: "auto"
description: "shadcn/ui design system, Tailwind CSS, clsx + tailwind-merge, dynamic class safelist patterns, accessibility (a11y), responsive components, next/image, Next.js 15 Metadata API, hreflang, JSON-LD"
---

# UI Design System Guidelines

## UI Component Guidelines

- Prefer components provided by **shadcn/ui**
- Use Tailwind CSS utility-first styling
- Custom components live under `components/ui`; **do not modify library code**
- Reuse styles with `@apply` in CSS/PostCSS
- Manage conditional class names with **clsx** + **tailwind-merge**; keep logic simple
- **Tailwind dynamic classes**: avoid building class names via template literals. Use literal mappings or configure `safelist` patterns in `tailwind.config.js` to prevent purging.

### shadcn/ui Component Usage

- Use shadcn/ui components as primary UI building blocks
- Import from `@/components/ui/` for consistent design system
- Combine components for complex layouts (Card + Button + Input)

### Custom Component Development

- Build custom components in `components/ui/` directory
- Use `cn()` utility for conditional class merging
- Extend shadcn/ui base components with additional functionality

## Code Style Guidelines (UI-Related)

- **Functional style**: favor functional/declarative programming and use _early returns_ for readability
- Follow the **DRY** principle to avoid duplication
- Ensure **Accessibility (a11y)** compliance
- Implement complete features that include all necessary code
- For performance-sensitive components, explicitly optimize with `React.memo`, `useMemo`, and `useCallback`

### Accessibility Guidelines

- Use proper semantic HTML elements and ARIA attributes
- Associate labels with form inputs using `htmlFor` and `id`
- Provide descriptive text for screen readers with `aria-describedby`
- Ensure keyboard navigation and focus management

### Automated Accessibility Testing

```typescript
// src/lib/test-utils-a11y.tsx - A11y testing utilities
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, describe, it } from 'vitest';

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

// Axe configuration interface
interface AxeConfig {
  rules?: Record<string, { enabled: boolean }>;
  tags?: string[];
  exclude?: string[];
}

export const renderWithA11yCheck = async (ui: React.ReactElement) => {
  const { container } = render(ui);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
  return { container };
};

// Enhanced render with custom axe configuration
export const renderWithCustomA11yCheck = async (
  ui: React.ReactElement,
  axeConfig?: AxeConfig
) => {
  const { container } = render(ui);
  const results = await axe(container, {
    rules: {
      // Default rules for component testing
      'color-contrast': { enabled: true },
      'landmark-one-main': { enabled: true },
      'page-has-heading-one': { enabled: false }, // Disable for component tests
      ...axeConfig?.rules,
    },
    tags: axeConfig?.tags,
    exclude: axeConfig?.exclude,
  });
  expect(results).toHaveNoViolations();
  return { container };
};

// Usage in component tests
describe('ContactForm', () => {
  it('should be accessible', async () => {
    await renderWithA11yCheck(<ContactForm />);
  });

  it('should be accessible with custom config', async () => {
    await renderWithCustomA11yCheck(<ContactForm />, {
      rules: {
        'color-contrast': { enabled: false }, // Skip for this test
      },
    });
  });
});
```

### Keyboard Navigation Patterns

```typescript
// src/components/AccessibleDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';

interface AccessibleDropdownProps {
  items: Array<{ id: string; label: string; value: string }>;
  onSelect: (item: { id: string; label: string; value: string }) => void;
  placeholder?: string;
}

function AccessibleDropdown({ items, onSelect, placeholder = 'Select an option' }: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev =>
            prev < items.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev =>
            prev > 0 ? prev - 1 : items.length - 1
          );
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          const selectedItem = items[focusedIndex];
          onSelect(selectedItem);
          setSelectedItem(selectedItem.label);
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;

      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const focusedElement = listRef.current?.children[focusedIndex] as HTMLElement;
      focusedElement?.focus();
    }
  }, [isOpen, focusedIndex]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="dropdown-label"
        onKeyDown={handleKeyDown}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItem || placeholder}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby="dropdown-label"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none"
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={focusedIndex === index}
              className={`px-4 py-2 cursor-pointer ${
                focusedIndex === index
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => {
                onSelect(item);
                setSelectedItem(item.label);
                setIsOpen(false);
                setFocusedIndex(-1);
                buttonRef.current?.focus();
              }}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### WCAG Compliance Patterns

```typescript
// Accessible form component with proper labeling and error handling
interface AccessibleFormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  description?: string;
}

function AccessibleFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  description,
}: AccessibleFormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${description ? descriptionId : ''} ${error ? errorId : ''}`.trim()}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500'
        }`}
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible modal component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function AccessibleModal({ isOpen, onClose, title, children }: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the modal
      modalRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus to the previously focused element
      previousFocusRef.current?.focus();

      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
```

## Tailwind CSS Patterns

### Responsive Design Patterns

```typescript
// Mobile-first responsive design
function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        <FeatureCard title="Feature 1" description="Description" />
      </div>
    </div>
  );
}

// Responsive typography
function ResponsiveTypography() {
  return (
    <div>
      <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold">
        Responsive Heading
      </h1>
      <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
        Responsive paragraph text
      </p>
    </div>
  );
}
```

### Dynamic Class Management

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children: React.ReactNode;
}

function CustomButton({ variant = 'default', size = 'default', className, children }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
        },
        className
      )}
    >
      {children}
    </button>
  );
}
```

### Safe Dynamic Classes

```typescript
// Safe dynamic classes with literal mappings
const statusColors = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
} as const;

function StatusBadge({ status }: { status: keyof typeof statusColors }) {
  return (
    <span className={cn('px-2 py-1 rounded-md border text-sm', statusColors[status])}>
      {status}
    </span>
  );
}

// ❌ Avoid: Dynamic class construction
function BadStatusBadge({ color }: { color: string }) {
  return (
    <span className={`bg-${color}-100 text-${color}-800`}>
      {/* This may not work due to Tailwind purging */}
    </span>
  );
}
```

## Tailwind CSS Configuration Best Practices

### Enhanced Tailwind Configuration

```javascript
// tailwind.config.ts - Organized and optimized configuration
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Dark mode configuration
  darkMode: ['class'],

  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },

    extend: {
      // Brand colors with semantic naming
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },

        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // Custom spacing scale for consistent layouts
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },

      // Enhanced typography scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },

      // Custom border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // Animation and transitions
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
      },
    },
  },

  // Safelist for dynamic classes
  safelist: [
    // Status colors
    'bg-green-100', 'text-green-800', 'border-green-200',
    'bg-yellow-100', 'text-yellow-800', 'border-yellow-200',
    'bg-red-100', 'text-red-800', 'border-red-200',
    'bg-blue-100', 'text-blue-800', 'border-blue-200',

    // Grid columns for dynamic layouts
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
    'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',

    // Common dynamic spacing
    'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8',
    'm-1', 'm-2', 'm-3', 'm-4', 'm-6', 'm-8',
  ],

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};

export default config;
```

### Mobile-First Responsive Strategy

```typescript
// src/components/responsive/ResponsiveContainer.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      // Base mobile styles
      'w-full mx-auto',

      // Max width responsive
      {
        'max-w-sm': maxWidth === 'sm',
        'max-w-md': maxWidth === 'md',
        'max-w-lg': maxWidth === 'lg',
        'max-w-xl': maxWidth === 'xl',
        'max-w-2xl': maxWidth === '2xl',
        'max-w-none': maxWidth === 'full',
      },

      // Responsive padding
      {
        'px-0': padding === 'none',
        'px-4 sm:px-6': padding === 'sm',
        'px-4 sm:px-6 lg:px-8': padding === 'md',
        'px-6 sm:px-8 lg:px-12': padding === 'lg',
      },

      className
    )}>
      {children}
    </div>
  );
}

// Mobile-first responsive grid system
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile: 1 | 2;
    tablet: 1 | 2 | 3 | 4;
    desktop: 1 | 2 | 3 | 4 | 5 | 6;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className
}: ResponsiveGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={cn(
      'grid',

      // Mobile-first grid columns (using safe class mapping)
      gridCols[cols.mobile],
      cols.tablet === 1 ? 'md:grid-cols-1' :
      cols.tablet === 2 ? 'md:grid-cols-2' :
      cols.tablet === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4',

      cols.desktop === 1 ? 'lg:grid-cols-1' :
      cols.desktop === 2 ? 'lg:grid-cols-2' :
      cols.desktop === 3 ? 'lg:grid-cols-3' :
      cols.desktop === 4 ? 'lg:grid-cols-4' :
      cols.desktop === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-6',

      // Gap spacing
      {
        'gap-2': gap === 'sm',
        'gap-4 md:gap-6': gap === 'md',
        'gap-6 md:gap-8 lg:gap-10': gap === 'lg',
      },

      className
    )}>
      {children}
    </div>
  );
}
```

### Advanced Responsive Patterns

```typescript
// src/components/responsive/ResponsiveCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  title: string;
  content: string;
  image?: string;
  layout?: 'vertical' | 'horizontal-mobile' | 'horizontal-always';
  className?: string;
}

export function ResponsiveCard({
  title,
  content,
  image,
  layout = 'vertical',
  className
}: ResponsiveCardProps) {
  return (
    <div className={cn(
      // Base card styles
      'bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden',

      // Layout-specific responsive classes
      {
        // Vertical layout (mobile-first)
        'flex flex-col': layout === 'vertical',

        // Horizontal on mobile, vertical on larger screens
        'flex flex-row md:flex-col': layout === 'horizontal-mobile',

        // Always horizontal
        'flex flex-row': layout === 'horizontal-always',
      },

      className
    )}>
      {image && (
        <div className={cn(
          'relative overflow-hidden',
          {
            // Vertical layout image
            'aspect-video w-full': layout === 'vertical',

            // Horizontal mobile layout image
            'w-24 h-24 md:aspect-video md:w-full md:h-auto flex-shrink-0': layout === 'horizontal-mobile',

            // Always horizontal layout image
            'w-32 h-32 flex-shrink-0': layout === 'horizontal-always',
          }
        )}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={cn(
        'p-4',
        {
          // Vertical layout content
          'flex-1': layout === 'vertical',

          // Horizontal mobile layout content
          'flex-1 md:flex-none': layout === 'horizontal-mobile',

          // Always horizontal layout content
          'flex-1': layout === 'horizontal-always',
        }
      )}>
        <h3 className={cn(
          'font-semibold mb-2',
          {
            // Responsive typography based on layout
            'text-lg md:text-xl': layout === 'vertical',
            'text-sm md:text-lg': layout === 'horizontal-mobile',
            'text-base': layout === 'horizontal-always',
          }
        )}>
          {title}
        </h3>

        <p className={cn(
          'text-muted-foreground',
          {
            'text-sm md:text-base': layout === 'vertical',
            'text-xs md:text-sm': layout === 'horizontal-mobile',
            'text-sm': layout === 'horizontal-always',
          }
        )}>
          {content}
        </p>
      </div>
    </div>
  );
}
```

### Dynamic Class Management with Safelist

```typescript
// src/lib/dynamic-classes.ts
import React from 'react';
import { cn } from '@/lib/utils';

// Safe dynamic class generation with safelist support

// Status color mappings (included in safelist)
export const statusColorMap = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
} as const;

// Grid column mappings (included in safelist)
export const gridColsMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;

// Responsive grid column mappings
export const responsiveGridMap = {
  1: { base: 'grid-cols-1', md: 'md:grid-cols-1', lg: 'lg:grid-cols-1' },
  2: { base: 'grid-cols-1', md: 'md:grid-cols-2', lg: 'lg:grid-cols-2' },
  3: { base: 'grid-cols-1', md: 'md:grid-cols-2', lg: 'lg:grid-cols-3' },
  4: { base: 'grid-cols-1', md: 'md:grid-cols-2', lg: 'lg:grid-cols-4' },
} as const;

// Spacing mappings (included in safelist)
export const spacingMap = {
  1: { p: 'p-1', m: 'm-1' },
  2: { p: 'p-2', m: 'm-2' },
  3: { p: 'p-3', m: 'm-3' },
  4: { p: 'p-4', m: 'm-4' },
  6: { p: 'p-6', m: 'm-6' },
  8: { p: 'p-8', m: 'm-8' },
} as const;

// Safe dynamic class builder
export function buildDynamicClasses({
  status,
  gridCols,
  spacing,
  responsive = false,
}: {
  status?: keyof typeof statusColorMap;
  gridCols?: keyof typeof gridColsMap;
  spacing?: keyof typeof spacingMap;
  responsive?: boolean;
}) {
  const classes: string[] = [];

  if (status) {
    classes.push(statusColorMap[status]);
  }

  if (gridCols) {
    if (responsive) {
      const responsiveGrid = responsiveGridMap[gridCols];
      classes.push(responsiveGrid.base, responsiveGrid.md, responsiveGrid.lg);
    } else {
      classes.push(gridColsMap[gridCols]);
    }
  }

  if (spacing) {
    classes.push(spacingMap[spacing].p);
  }

  return classes.join(' ');
}

// Usage examples
export function DynamicStatusBadge({ status }: { status: keyof typeof statusColorMap }) {
  return (
    <span className={cn(
      'px-2 py-1 rounded-md border text-sm',
      statusColorMap[status]
    )}>
      {status}
    </span>
  );
}

export function DynamicGrid({
  children,
  cols,
  responsive = true
}: {
  children: React.ReactNode;
  cols: keyof typeof gridColsMap;
  responsive?: boolean;
}) {
  const gridClasses = responsive
    ? `${responsiveGridMap[cols].base} ${responsiveGridMap[cols].md} ${responsiveGridMap[cols].lg}`
    : gridColsMap[cols];

  return (
    <div className={cn('grid gap-4', gridClasses)}>
      {children}
    </div>
  );
}
```

## Theme System

- Use `next-themes` for dark/light mode implementation
- Configure `ThemeProvider` with system preference detection
- Implement theme toggle component with smooth transitions
- Use CSS variables for theme-aware styling

**📋 Cross-References:**
- **Component architecture**: See `nextjs-architecture.md` for Server/Client component patterns
- **Internationalization**: See `i18n-content-management.md` for multi-language content setup
- **Performance monitoring**: See `service-integration.md` for analytics integration

## SEO Optimization Guidelines

- Use **Next.js 15 Metadata API** for native SEO optimization
- Generate `sitemap.xml` and `robots.txt` automatically with **next-sitemap**
- Enable multi-language **hreflang** tags for international SEO
- Use **static OG images** for consistent brand presentation, with **@vercel/og** as optional dynamic generation for specific use cases
- Use **next/image** for images and **next/font** for fonts; lazy load by default
- **Structured data integration** - Schema.org JSON-LD support

### Next.js 15 Metadata API Implementation

```typescript
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { generateLocalizedMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return generateLocalizedMetadata({
    locale,
    title: 'Company Name',
    description: 'Company description',
    path: '/',
  });
}
```

### Localized Metadata Generation

```typescript
// src/lib/metadata.ts
import type { Metadata } from 'next';

interface MetadataParams {
  locale: string;
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function generateLocalizedMetadata({
  locale,
  title,
  description,
  path,
  image = '/og-image.jpg'
}: MetadataParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const canonicalUrl = `${baseUrl}/${locale}${path}`;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en${path}`,
        'zh': `${baseUrl}/zh${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Company Name',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
```

### Sitemap Generation with next-sitemap

```javascript
// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  alternateRefs: [
    {
      href: 'https://example.com/en',
      hreflang: 'en',
    },
    {
      href: 'https://example.com/zh',
      hreflang: 'zh',
    },
  ],
  transform: async (config, path) => {
    // Custom transformation logic
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
};
```

### Structured Data (JSON-LD) Implementation

```typescript
// src/lib/structured-data.ts
export function generateOrganizationSchema(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Company Name',
    url: `https://example.com/${locale}`,
    logo: 'https://example.com/logo.png',
    description: locale === 'zh' ? '公司描述' : 'Company description',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Street Address',
      addressLocality: 'City',
      addressCountry: locale === 'zh' ? 'CN' : 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-555-5555',
      contactType: 'customer service',
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Usage in layout or page components
export default function Layout({ children }: { children: React.ReactNode }) {
  const organizationSchema = generateOrganizationSchema('en');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      {children}
    </>
  );
}
```

### Image Optimization

- Always use `next/image` with proper sizing and lazy loading
- Set `priority` for above-the-fold images
- Configure responsive `sizes` attribute for different viewports
- Use `fill` prop for container-based layouts

```typescript
// Optimized image component
import Image from 'next/image';

function OptimizedImage({ src, alt, priority = false }: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={630}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="rounded-lg"
    />
  );
}
```

## Performance Optimization

### Component Optimization

- Use `React.memo` for expensive components to prevent unnecessary re-renders
- Apply `useMemo` and `useCallback` for performance-critical calculations
- Implement proper key props for list rendering optimization

### Performance Best Practices

- **Dynamic imports**: Use `next/dynamic` for code splitting large components
- **React.memo**: Memoize expensive components to prevent unnecessary re-renders
- **Image optimization**: Always use `next/image` with proper sizing and lazy loading
- **Bundle analysis**: Monitor bundle size with `@next/bundle-analyzer`

## Optional UI Extensions (Appendix)

### Priority-Based UI Module Recommendations

| Priority | Modules                                           | Typical Scenarios                                    |
| -------- | ------------------------------------------------- | ---------------------------------------------------- |
| High     | `recharts`, `@tremor/react`, `@react-three/fiber` | Data visualization, dashboards, 3D product showcases |
| Medium   | `react-leaflet`, `@tanstack/react-table`          | Maps, scalable tables                                |
| Low      | `react-player`, `react-pdf`                       | Media playback, PDF previews                         |

### High Priority Extensions

#### Data Visualization with Recharts
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function PerformanceChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  );
}
```

#### Business Dashboard with Tremor
```typescript
import { Card, Metric, Text, AreaChart } from '@tremor/react';

function DashboardCard({ title, metric, data }: {
  title: string;
  metric: string;
  data: Array<{ date: string; value: number }>;
}) {
  return (
    <Card>
      <Text>{title}</Text>
      <Metric>{metric}</Metric>
      <AreaChart
        className="h-72 mt-4"
        data={data}
        index="date"
        categories={['value']}
        colors={['blue']}
      />
    </Card>
  );
}
```

### Medium Priority Extensions

#### Interactive Maps with React Leaflet
```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function LocationMap({ center, markers }: {
  center: [number, number];
  markers: Array<{ position: [number, number]; popup: string }>;
}) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position}>
          <Popup>{marker.popup}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

#### Advanced Tables with TanStack Table
```typescript
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

function DataTable({ data, columns }: { data: any[]; columns: any[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Implementation Guidelines for Extensions

- **Lazy loading**: Always use `next/dynamic` for optional UI extensions
- **Bundle impact**: Monitor bundle size when adding visualization libraries
- **Accessibility**: Ensure all extensions meet a11y standards
- **Performance**: Use React.memo for expensive chart components
- **Responsive design**: Ensure extensions work across all device sizes
