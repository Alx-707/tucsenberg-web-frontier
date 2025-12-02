# UI Design System

## Component Library

- **Base**: shadcn/ui (Radix UI + Tailwind CSS)
- **Location**: `src/components/ui/`
- **Add component**: `pnpm dlx shadcn@latest add <component>`

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

### Tailwind First
- Use `cn()` to merge conditional classes
- Prefer Tailwind over custom CSS
- Colors use CSS variables (defined in `src/app/globals.css`)

### Dynamic Class Names Forbidden

**Never** build class names dynamically. Tailwind will purge them:

```typescript
// ❌ Dangerous
<span className={`bg-${color}-100`} />

// ✅ Use literal mapping
const colors = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
} as const;
<span className={colors[status]} />
```

## Responsive Design

- Mobile-first approach
- Breakpoints: `sm`(640) `md`(768) `lg`(1024) `xl`(1280)

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
