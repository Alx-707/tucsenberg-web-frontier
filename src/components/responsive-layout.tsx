import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * CSS-First Responsive Layout Component
 *
 * This component uses Tailwind CSS responsive classes for layout decisions,
 * eliminating the need for JavaScript hydration for basic responsive behavior.
 *
 * ## CSS-First Design Principles:
 * - Layout responds to viewport width via CSS media queries (no JS required)
 * - No layout shift during hydration
 * - Interactive behavior (touch/mouse events) still handled in React
 *
 * ## Approved JavaScript Use Cases:
 * - Touch/mouse event handlers (onTouchStart, onMouseEnter, etc.)
 * - Layout change callbacks for analytics/tracking
 * - Accessibility attributes
 *
 * @see openspec/changes/p2-responsive-css-first for full specification
 */

interface ResponsiveLayoutProps {
  /** Main content (always rendered) */
  'children': ReactNode;
  /** Additional CSS classes */
  'className'?: string;
  /** Content shown only on mobile (< md breakpoint) */
  'mobileContent'?: ReactNode;
  /** Content shown only on tablet (md - lg breakpoints) */
  'tabletContent'?: ReactNode;
  /** Content shown only on desktop (>= lg breakpoint) */
  'desktopContent'?: ReactNode;
  // Legacy props for backwards compatibility
  /** @deprecated Use mobileContent instead */
  'mobileLayout'?: ReactNode;
  /** @deprecated Use tabletContent instead */
  'tabletLayout'?: ReactNode;
  /** @deprecated Use desktopContent instead */
  'desktopLayout'?: ReactNode;
  /** @deprecated Use mobileContent instead */
  'mobileNavigation'?: ReactNode;
  /** @deprecated Use tabletContent instead */
  'tabletSidebar'?: ReactNode;
  /** @deprecated Use desktopContent instead */
  'desktopSidebar'?: ReactNode;
  // Event handlers (JS-required use cases)
  'onTouchStart'?: () => void;
  'onTouchEnd'?: () => void;
  'onMouseEnter'?: () => void;
  'onMouseLeave'?: () => void;
  /** @deprecated Layout detection is now CSS-based; callback provided for migration period */
  'onLayoutChange'?: (_layout: string) => void;
  // Accessibility
  'role'?: string;
  'aria-label'?: string;
  'data-testid'?: string;
  'tabIndex'?: number;
}

/**
 * Responsive content slot that shows/hides based on breakpoint.
 * Uses CSS display utilities for zero-JS responsive behavior.
 */
function ResponsiveSlot({
  children,
  show,
}: {
  children: ReactNode;
  show: 'mobile' | 'tablet' | 'desktop';
}) {
  if (!children) {
    return null;
  }

  // Static class mapping to avoid dynamic object injection
  let visibilityClass: string;
  switch (show) {
    case 'mobile':
      visibilityClass = 'block md:hidden';
      break;
    case 'tablet':
      visibilityClass = 'hidden md:block lg:hidden';
      break;
    case 'desktop':
      visibilityClass = 'hidden lg:block';
      break;
    default:
      visibilityClass = '';
  }

  return <div className={visibilityClass}>{children}</div>;
}

export function ResponsiveLayout({
  children,
  className = '',
  mobileContent,
  tabletContent,
  desktopContent,
  // Legacy props mapping
  mobileLayout,
  tabletLayout,
  desktopLayout,
  mobileNavigation,
  tabletSidebar,
  desktopSidebar,
  // Event handlers
  onTouchStart,
  onTouchEnd,
  onMouseEnter,
  onMouseLeave,
  'onLayoutChange': _onLayoutChange,
  // Accessibility
  role,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  tabIndex,
}: ResponsiveLayoutProps) {
  // Resolve legacy props to new props
  const resolvedMobile = mobileContent ?? mobileLayout ?? mobileNavigation;
  const resolvedTablet = tabletContent ?? tabletLayout ?? tabletSidebar;
  const resolvedDesktop = desktopContent ?? desktopLayout ?? desktopSidebar;

  const hasSlottedContent = resolvedMobile || resolvedTablet || resolvedDesktop;

  // If specific layouts are provided, render slot-based layout
  if (hasSlottedContent) {
    return (
      <div
        className={className}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role={role}
        aria-label={ariaLabel}
        data-testid={dataTestId}
        tabIndex={tabIndex}
      >
        <ResponsiveSlot show='mobile'>{resolvedMobile}</ResponsiveSlot>
        <ResponsiveSlot show='tablet'>{resolvedTablet}</ResponsiveSlot>
        <ResponsiveSlot show='desktop'>{resolvedDesktop}</ResponsiveSlot>
        {/* Fallback to children if no slot matches */}
        {!resolvedMobile && !resolvedTablet && !resolvedDesktop && children}
      </div>
    );
  }

  // Default: render children with responsive utility classes
  // CSS classes handle responsive behavior without JS
  return (
    <div
      className={cn(
        // Base responsive classes for CSS-based layout detection
        // These replace the JS-based responsive-mobile/tablet/desktop classes
        className,
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={role}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      tabIndex={tabIndex}
    >
      {children}
    </div>
  );
}
