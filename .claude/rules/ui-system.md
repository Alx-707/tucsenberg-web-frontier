---
paths: "src/components/**/*.tsx"
---

# UI Design System

## Component Library

- **Base**: shadcn/ui (Radix UI + Tailwind CSS)
- **Location**: `src/components/ui/`
- **Add component**: `pnpm dlx shadcn@latest add <component>`

shadcn/ui is a **code distribution system** — you own the code completely and can customize freely.

## Component Organization

```
src/components/
├── ui/              # Base primitives (button, card, input)
├── layout/          # Header, footer, navigation
├── forms/           # Form components
├── home/            # Homepage sections
├── products/        # Product-specific
├── blog/            # Blog-specific
└── shared/          # Cross-cutting
```

## Styling Rules

### Tailwind CSS v4 (CSS-first)

This project uses **Tailwind CSS v4** with CSS-first configuration:
- No `tailwind.config.ts` file — configuration is in `src/app/globals.css` via `@theme inline`
- CSS variables for colors defined in `globals.css`
- Use `cn()` to merge conditional classes

### The `cn()` Utility

Combines `clsx` + `tailwind-merge` for smart class merging:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage examples
cn("px-4", "px-6")                    // → "px-6" (merge conflicts)
cn("bg-red-500", isActive && "bg-blue-500")
cn({ "opacity-50": isDisabled })      // Object syntax
```

### Dynamic Class Names Forbidden

**Never** build class names dynamically. Tailwind will purge them:

```typescript
// ❌ Dangerous - gets purged
<span className={`bg-${color}-100`} />

// ✅ Use literal mapping
const colors = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
} as const;
<span className={colors[status]} />

// ✅ For truly dynamic values, use inline styles
<button
  style={{ backgroundColor: dynamicColor }}
  className="rounded-md px-3 py-1.5"
>
```

## Responsive Design

- Mobile-first approach
- Breakpoints (rem-based in Tailwind v4):

| Prefix | Min-width | Pixels |
|--------|-----------|--------|
| `sm` | 40rem | 640px |
| `md` | 48rem | 768px |
| `lg` | 64rem | 1024px |
| `xl` | 80rem | 1280px |
| `2xl` | 96rem | 1536px |

### Range Variants
```html
<!-- Only between md and xl -->
<div class="md:max-xl:flex">...</div>

<!-- Custom breakpoint -->
<div class="min-[320px]:text-center">...</div>
```

## Accessibility

- All interactive elements must be keyboard accessible
- Use semantic HTML
- Color contrast ≥ 4.5:1
- Forms must have `label` + `aria-invalid` + `aria-describedby`

## Icons

- Use Lucide React
- Import individually: `import { ChevronRight } from 'lucide-react'`

## SEO & Metadata

### generateMetadata
- `params` must be `await`ed (Next.js 16 Async Request APIs)
- Configure `alternates.languages` for multi-language support

### OG Image
- File: `opengraph-image.tsx`
- Both `params` and `id` must be `await`ed

### JSON-LD
- Use `src/lib/structured-data.ts`
- Inject in layout via `<script type="application/ld+json">`

## Image Optimization

- Use `next/image`
- Set `priority` for above-fold images
- Must set `sizes` attribute for responsive loading
