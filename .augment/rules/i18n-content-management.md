---
type: "auto"
description: "next-intl i18n with strictMessageTypeSafety, messages/[locale].json, getRequestConfig, Providers composition, ICU message arguments, TinaCMS + MDX content, en/zh synchronization, Front Matter validation, Git-based CMS"
---

# Internationalization & Content Management

## Internationalization Guidelines

- Use **next-intl** as the i18n framework
- Use the `useTranslations` hook inside components
- Store translations in `messages/[locale].json`
- Define a global `AppConfig.Messages` type to enforce ICU arguments at compile time.

- **Strict ICU typing**: enable `strictMessageTypeSafety` in `getRequestConfig` and declare `AppConfig.Messages` in `global.ts` to get compile-time checks for message arguments
- **Provider composition**: create a single `'use client'` `Providers` component that combines `NextIntlClientProvider` with other context providers to avoid double hydration; keep providers minimal and colocated to the app entry to prevent re-renders

### next-intl Configuration

```typescript
// src/i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
  strictMessageTypeSafety: true,
}));

### Caching and Fallbacks

- Use a caching layer for messages to reduce load time where possible; on failure, fall back to direct `messages/${locale}.json` import.
- In responses, include simple metadata (load time, cache used) to aid diagnostics and performance tracking.

```

### Translation Usage

- **Server Components**: Use `getTranslations()` for async translation loading
- **Client Components**: Use `useTranslations()` hook for reactive translations
- **Parameterized messages**: Support ICU message format with variables

### Provider Setup

- Create single `'use client'` Providers component
- Combine `NextIntlClientProvider` with other context providers
- Avoid double hydration by proper provider composition

## Multi-language File Synchronization Rules

- **Always update both languages**: When modifying content in `content/*/en/`, must also update corresponding `content/*/zh/` files
- **UI translations sync**: Changes to `messages/en.json` must be reflected in `messages/zh.json`
- **Document synchronization**: Updates to `public/documents/*/en/` require corresponding updates to `public/documents/*/zh/`
- **Route structure consistency**: Maintain identical file structure across language directories
- **Metadata alignment**: Ensure Front Matter metadata is consistent across language versions

### File Structure Requirements

- Mirror identical structure between `en/` and `zh/` directories
- Maintain consistent file naming across languages
- Organize content by type: `blog/`, `pages/`, `documents/`

### Translation File Synchronization

- Maintain identical JSON structure between `messages/en.json` and `messages/zh.json`
- Use nested objects for logical grouping (HomePage, Navigation, etc.)
- Ensure all translation keys exist in both language files

### Metadata Consistency Requirements

- Keep identical frontmatter structure across language versions
- Maintain same `publishedAt`, `author`, and `tags` values
- Translate only `title` and `description` fields

## Content Management Guidelines

### Hybrid CMS: TinaCMS + MDX System

#### TinaCMS Visual Editing (Primary for Content Editors)

- Use **TinaCMS 2.8.2+** as the primary visual content management system
- **Git-based workflow** - all changes automatically committed to version control
- **Real-time preview** - WYSIWYG editing with instant visual feedback
- **Type-safe schema** - TypeScript-first content validation and structure
- **Multi-language support** - unified interface for managing en/zh content
- **Team collaboration** - role-based permissions and conflict prevention

#### MDX Direct Editing (For Developers)

- Use **MDX files** for complex technical content requiring custom components
- Store MDX files in `content/` directory with language-specific subdirectories
- Implement **frontmatter validation** using Zod schemas
- Use **@next/mdx** for native Next.js 15 MDX rendering with custom components
- **Git-based workflow** - version control integrated content management
- **No database architecture** - simplified deployment and maintenance

#### Content Management Strategy

- **Simple content** (blog posts, pages): Use TinaCMS visual editor
- **Complex content** (technical docs, custom components): Direct MDX editing
- **Both approaches** use the same file structure and frontmatter schema
- **Seamless integration** - TinaCMS reads/writes standard MDX files

### Content Directory Structure

```
content/
├── posts/          # Blog articles
│   ├── en/        # English content
│   └── zh/        # Chinese content
├── pages/          # Static pages
│   ├── en/        # English pages
│   └── zh/        # Chinese pages
├── documents/      # PDF documents (≤20MB)
│   ├── en/        # English documents
│   └── zh/        # Chinese documents
└── config/         # Global configuration
    └── content.json # Content management config
```

### Content Strategy

- **All content types**: Use MDX files with frontmatter metadata
- **Dynamic updates**: Git-based workflow triggers automatic deployment
- **Content validation**: TypeScript interfaces ensure data integrity
- **Multi-language sync**: Enforced synchronization between en/zh versions

### TinaCMS Configuration Standards

#### Schema Definition Requirements

```typescript
// tina/config.ts - Multi-language schema configuration
export default defineConfig({
  collections: [
    {
      name: 'posts',
      path: 'content/posts',
      format: 'mdx',
      fields: [
        // Language identification (required)
        {
          type: 'string',
          name: 'locale',
          label: 'Language',
          options: ['en', 'zh'],
          required: true,
        },
        // Standard frontmatter fields
        {
          type: 'string',
          name: 'title',
          label: 'Title',
          isTitle: true,
          required: true,
        },
        // SEO configuration object
        {
          type: 'object',
          name: 'seo',
          label: 'SEO Settings',
          fields: [
            { type: 'string', name: 'title', label: 'SEO Title' },
            { type: 'string', name: 'description', label: 'SEO Description' },
            { type: 'string', name: 'keywords', label: 'Keywords', list: true },
          ],
        },
        // Rich text content
        {
          type: 'rich-text',
          name: 'body',
          label: 'Content',
          isBody: true,
        },
      ],
      ui: {
        filename: {
          slugify: (values) => `${values.locale}/${values.slug}`,
        },
      },
    },
  ],
});
```

#### Multi-language Content Management Rules

- **Locale field mandatory** - Every content item must have a `locale` field
- **Consistent schema** - Same field structure across all language versions
- **File path mapping** - Automatic mapping to `content/[collection]/[locale]/[slug].mdx`
- **Synchronized updates** - Changes in one language should prompt updates in others

### Data Management Services

- **Airtable 0.12.2** - Cloud database for contact form data storage and management
- **Resend 4.7.0** - Modern email delivery service for transactional emails

### Content Configuration

```typescript
// content/config/content.json
{
  "defaultLocale": "en",
  "supportedLocales": ["en", "zh"],
  "postsPerPage": 12,
  "enableDrafts": true,
  "enableSearch": true,
  "autoGenerateExcerpt": true,
  "excerptLength": 160,
  "dateFormat": "YYYY-MM-DD",
  "timeZone": "UTC"
}
```

## Routing and URL Structure

### Internationalized Routing Pattern

- Use `src/app/[locale]/` structure for internationalized routing
- Support locales: `['en', 'zh']` with English as default
- Implement proper locale validation and fallbacks
- Generate metadata with locale-specific translations

### Dynamic Content Routes

- Blog posts: `/[locale]/blog/[slug]`
- Static pages: `/[locale]/[page-slug]`
- Use `notFound()` for invalid slugs or missing content
- Implement proper error boundaries for content loading

## Content Synchronization Automation

### Git Hooks for Content Validation

```bash
#!/bin/sh
# .lefthook/pre-commit/content-sync-check.sh

echo "Checking content synchronization..."

# Check if English content has corresponding Chinese content
for file in content/*/en/*.mdx; do
  zh_file="${file/\/en\//\/zh\/}"
  if [ ! -f "$zh_file" ]; then
    echo "Error: Missing Chinese translation for $file"
    exit 1
  fi
done

echo "Content synchronization check passed!"
```

### Translation Validation

- **Automated validation**: Use Git hooks to check translation completeness
- **Key synchronization**: Ensure all translation keys exist in both languages
- **Content structure**: Maintain identical file structure across language directories
- **CI/CD integration**: Fail builds on missing translations or content mismatches

## Translation Quality Assurance

### Translation Validation and Testing

```typescript
// src/lib/i18n-validation.ts
import { z } from 'zod';

// Define translation schema for type safety
const translationSchema = z.object({
  common: z.object({
    loading: z.string(),
    error: z.string(),
    success: z.string(),
    cancel: z.string(),
    confirm: z.string(),
    save: z.string(),
    delete: z.string(),
  }),
  navigation: z.object({
    home: z.string(),
    about: z.string(),
    services: z.string(),
    contact: z.string(),
    blog: z.string(),
  }),
  forms: z.object({
    name: z.string(),
    email: z.string(),
    message: z.string(),
    submit: z.string(),
    required: z.string(),
  }),
  errors: z.object({
    required: z.string(),
    invalid_email: z.string(),
    network_error: z.string(),
    server_error: z.string(),
  }),
});

export type TranslationSchema = z.infer<typeof translationSchema>;

export function validateTranslations(translations: unknown): TranslationSchema {
  try {
    return translationSchema.parse(translations);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Translation validation failed:', error.errors);
      throw new Error(`Invalid translation structure: ${error.errors.map(e => e.path.join('.')).join(', ')}`);
    }
    throw error;
  }
}

// Translation completeness check
export function checkTranslationCompleteness(
  baseTranslations: Record<string, any>,
  targetTranslations: Record<string, any>,
  locale: string
): { missingKeys: string[]; extraKeys: string[] } {
  const missingKeys: string[] = [];
  const extraKeys: string[] = [];

  function checkKeys(base: any, target: any, path = '') {
    for (const key in base) {
      const currentPath = path ? `${path}.${key}` : key;

      if (!(key in target)) {
        missingKeys.push(currentPath);
      } else if (typeof base[key] === 'object' && base[key] !== null) {
        if (typeof target[key] === 'object' && target[key] !== null) {
          checkKeys(base[key], target[key], currentPath);
        } else {
          missingKeys.push(currentPath);
        }
      }
    }

    // Check for extra keys in target
    for (const key in target) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in base)) {
        extraKeys.push(currentPath);
      }
    }
  }

  checkKeys(baseTranslations, targetTranslations);

  if (missingKeys.length > 0) {
    console.warn(`Missing translation keys in ${locale}:`, missingKeys);
  }

  if (extraKeys.length > 0) {
    console.warn(`Extra translation keys in ${locale}:`, extraKeys);
  }

  return { missingKeys, extraKeys };
}

// Translation quality metrics
export function analyzeTranslationQuality(
  baseTranslations: Record<string, any>,
  targetTranslations: Record<string, any>
): {
  completeness: number;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
} {
  let totalKeys = 0;
  let translatedKeys = 0;

  function countKeys(base: any, target: any) {
    for (const key in base) {
      if (typeof base[key] === 'object' && base[key] !== null) {
        countKeys(base[key], target[key] || {});
      } else {
        totalKeys++;
        if (key in target && target[key] && target[key].trim() !== '') {
          translatedKeys++;
        }
      }
    }
  }

  countKeys(baseTranslations, targetTranslations);

  const completeness = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;
  const missingKeys = totalKeys - translatedKeys;

  return {
    completeness: Math.round(completeness * 100) / 100,
    totalKeys,
    translatedKeys,
    missingKeys,
  };
}
```

### Fallback Language Configuration

```typescript
// src/i18n.ts - Enhanced fallback configuration
import { getRequestConfig } from 'next-intl/server';
import { validateTranslations, checkTranslationCompleteness } from '@/lib/i18n-validation';

export const locales = ['en', 'zh'] as const;
export const defaultLocale = 'en' as const;

export default getRequestConfig(async ({ locale }) => {
  let messages;
  let fallbackMessages;

  try {
    // Load primary locale messages
    messages = (await import(`../messages/${locale}.json`)).default;

    // Validate translation structure
    validateTranslations(messages);

    // Load fallback messages (English) for completeness check
    if (locale !== defaultLocale) {
      fallbackMessages = (await import(`../messages/${defaultLocale}.json`)).default;

      // Check translation completeness
      const { missingKeys } = checkTranslationCompleteness(
        fallbackMessages,
        messages,
        locale
      );

      // Merge missing keys from fallback
      if (missingKeys.length > 0) {
        console.warn(`Using fallback for missing keys in ${locale}:`, missingKeys);
        messages = mergeWithFallback(messages, fallbackMessages, missingKeys);
      }
    }

  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);

    // Fallback to English if locale file is missing or invalid
    if (locale !== defaultLocale) {
      console.warn(`Translation file for ${locale} not found or invalid, falling back to English`);
      messages = (await import(`../messages/${defaultLocale}.json`)).default;
    } else {
      throw new Error('Default locale translations are missing or invalid');
    }
  }

  return {
    messages,
    strictMessageTypeSafety: true,
    defaultTranslationValues: {
      b: (chunks) => `<strong>${chunks}</strong>`,
      i: (chunks) => `<em>${chunks}</em>`,
      br: () => '<br/>',
    },
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          weekday: 'long',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: locale === 'zh' ? 'CNY' : 'USD',
        },
      },
    },
  };
});

// Helper function to merge missing keys with fallback
function mergeWithFallback(
  target: Record<string, any>,
  fallback: Record<string, any>,
  missingKeys: string[]
): Record<string, any> {
  const result = { ...target };

  missingKeys.forEach(keyPath => {
    const keys = keyPath.split('.');
    let fallbackValue = fallback;
    let targetRef = result;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      fallbackValue = fallbackValue[keys[i]];
      if (!targetRef[keys[i]]) {
        targetRef[keys[i]] = {};
      }
      targetRef = targetRef[keys[i]];
    }

    // Set the missing value
    const lastKey = keys[keys.length - 1];
    if (fallbackValue && fallbackValue[lastKey]) {
      targetRef[lastKey] = fallbackValue[lastKey];
    }
  });

  return result;
}
```

### Multi-language Testing Utilities

```typescript
// src/lib/test-utils-i18n.tsx
import React, { ReactElement } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { render, RenderOptions, fireEvent } from '@testing-library/react';
import { expect, describe, it } from 'vitest';

// Mock messages for testing
const mockMessages = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success!',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
    },
    navigation: {
      home: 'Home',
      about: 'About',
      services: 'Services',
      contact: 'Contact',
      blog: 'Blog',
    },
    forms: {
      name: 'Name',
      email: 'Email',
      message: 'Message',
      submit: 'Submit',
      required: 'This field is required',
    },
  },
  zh: {
    common: {
      loading: '加载中...',
      error: '发生错误',
      success: '成功！',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      delete: '删除',
    },
    navigation: {
      home: '首页',
      about: '关于我们',
      services: '服务',
      contact: '联系我们',
      blog: '博客',
    },
    forms: {
      name: '姓名',
      email: '邮箱',
      message: '消息',
      submit: '提交',
      required: '此字段为必填项',
    },
  },
};

interface RenderWithLocaleOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'en' | 'zh';
  messages?: Record<string, any>;
}

export function renderWithLocale(
  ui: ReactElement,
  { locale = 'en', messages, ...renderOptions }: RenderWithLocaleOptions = {}
) {
  const localeMessages = messages || mockMessages[locale];

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={localeMessages}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Test component with multiple locales
export function testWithAllLocales(
  component: ReactElement,
  testFn: (locale: 'en' | 'zh', messages: Record<string, any>) => void
) {
  const locales: Array<'en' | 'zh'> = ['en', 'zh'];

  locales.forEach(locale => {
    describe(`Locale: ${locale}`, () => {
      testFn(locale, mockMessages[locale]);
    });
  });
}

// Locale-specific test utilities
export const i18nTestUtils = {
  // Test that component renders correctly in all locales
  testAllLocales: (component: ReactElement, testName: string) => {
    testWithAllLocales(component, (locale) => {
      it(`${testName} (${locale})`, () => {
        const { container } = renderWithLocale(component, { locale });
        expect(container).toBeInTheDocument();
      });
    });
  },

  // Test specific translation keys
  testTranslationKeys: (
    component: ReactElement,
    expectedKeys: Array<{ key: string; en: string; zh: string }>
  ) => {
    expectedKeys.forEach(({ key, en, zh }) => {
      it(`should display correct translation for ${key}`, () => {
        const { getByText: getByTextEn } = renderWithLocale(component, { locale: 'en' });
        const { getByText: getByTextZh } = renderWithLocale(component, { locale: 'zh' });

        expect(getByTextEn(en)).toBeInTheDocument();
        expect(getByTextZh(zh)).toBeInTheDocument();
      });
    });
  },

  // Test component behavior with missing translations
  testMissingTranslations: (component: ReactElement) => {
    it('should handle missing translations gracefully', () => {
      const incompleteMessages = {
        common: {
          loading: 'Loading...',
          // Missing other keys
        },
      };

      expect(() => {
        renderWithLocale(component, {
          locale: 'en',
          messages: incompleteMessages
        });
      }).not.toThrow();
    });
  },
};

// Example usage in tests
describe('ContactForm', () => {
  // Mock ContactForm component for testing
  const ContactForm = () => (
    <form>
      <label htmlFor="name">Name</label>
      <input id="name" type="text" />
      <button type="submit">Submit</button>
    </form>
  );

  const contactForm = <ContactForm />;

  // Test all locales
  i18nTestUtils.testAllLocales(contactForm, 'should render contact form');

  // Test specific translations
  i18nTestUtils.testTranslationKeys(contactForm, [
    { key: 'forms.name', en: 'Name', zh: '姓名' },
    { key: 'forms.email', en: 'Email', zh: '邮箱' },
    { key: 'forms.submit', en: 'Submit', zh: '提交' },
  ]);

  // Test missing translations
  i18nTestUtils.testMissingTranslations(contactForm);

  // Custom locale-specific tests
  testWithAllLocales(contactForm, (locale, messages) => {
    it(`should validate form in ${locale}`, () => {
      const { getByRole, getByText } = renderWithLocale(contactForm, { locale });

      const submitButton = getByRole('button', { name: messages.forms.submit });
      fireEvent.click(submitButton);

      expect(getByText(messages.forms.required)).toBeInTheDocument();
    });
  });
});
```

### Translation Performance Testing

```typescript
// src/lib/i18n-performance.ts
export async function measureTranslationLoadTime(locale: string): Promise<number> {
  const startTime = performance.now();

  try {
    await import(`../messages/${locale}.json`);
    const endTime = performance.now();
    return endTime - startTime;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    return -1;
  }
}

export async function benchmarkAllLocales(): Promise<Record<string, number>> {
  const locales = ['en', 'zh'];
  const results: Record<string, number> = {};

  for (const locale of locales) {
    results[locale] = await measureTranslationLoadTime(locale);
  }

  return results;
}

// Usage in tests
describe('Translation Performance', () => {
  it('should load translations within acceptable time', async () => {
    const results = await benchmarkAllLocales();

    Object.entries(results).forEach(([locale, loadTime]) => {
      expect(loadTime).toBeGreaterThan(0);
      expect(loadTime).toBeLessThan(100); // Should load within 100ms
    });
  });
});
```
