'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR or missing matchMedia support
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      // Handle case where matchMedia returns null (some SSR scenarios)
      return mediaQuery?.matches ?? false;
    } catch {
      // Fallback for any matchMedia errors
      return false;
    }
  });

  useEffect(() => {
    // Check if we're in the browser and matchMedia is available
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    let mediaQuery: MediaQueryList | null = null;

    try {
      // Create media query
      mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      // Handle case where matchMedia returns null
      if (!mediaQuery) {
        return undefined;
      }

      // Create event listener
      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      // Add listener if addEventListener is available
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      }

      // Cleanup
      return () => {
        if (mediaQuery?.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        }
      };
    } catch {
      // Fallback for any matchMedia errors
      return undefined;
    }
  }, []);

  return prefersReducedMotion;
}
