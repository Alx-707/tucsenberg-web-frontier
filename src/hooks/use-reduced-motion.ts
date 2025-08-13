'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR or missing window support
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      // Safe window access - check if window and matchMedia exist
      if (!window || typeof window.matchMedia !== 'function') {
        return false;
      }

      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      // Handle case where matchMedia returns null (some SSR scenarios)
      return mediaQuery?.matches ?? false;
    } catch {
      // Fallback for any matchMedia errors or window access issues
      return false;
    }
  });

  useEffect(() => {
    // Check if we're in the browser and matchMedia is available
    if (typeof window === 'undefined') {
      return undefined;
    }

    let mediaQuery: MediaQueryList | null = null;

    try {
      // Safe window access - double check window exists and has matchMedia
      if (!window || typeof window.matchMedia !== 'function') {
        return undefined;
      }

      // Create media query
      mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      // Handle case where matchMedia returns null
      if (!mediaQuery) {
        return undefined;
      }

      // Create event listener with enhanced malformed event handling
      const handleChange = (event: MediaQueryListEvent) => {
        // Handle malformed events gracefully - check for event existence and matches property
        if (event && typeof event === 'object' && typeof event.matches === 'boolean') {
          setPrefersReducedMotion(event.matches);
        } else {
          // Fallback: re-query the media query if event is malformed
          try {
            if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
              setPrefersReducedMotion(mediaQuery.matches);
            }
          } catch {
            // Ignore errors in fallback
          }
        }
      };

      // Add listener if addEventListener is available
      if (mediaQuery.addEventListener && typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
      }

      // Cleanup
      return () => {
        if (mediaQuery?.removeEventListener && typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', handleChange);
        }
      };
    } catch {
      // Fallback for any matchMedia errors or window access issues
      return undefined;
    }
  }, []);

  return prefersReducedMotion;
}
