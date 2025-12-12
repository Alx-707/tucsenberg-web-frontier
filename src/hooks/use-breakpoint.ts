'use client';

import { useEffect, useState } from 'react';
import {
  BREAKPOINT_2XL,
  BREAKPOINT_LG,
  BREAKPOINT_MD,
  BREAKPOINT_SM,
  BREAKPOINT_XL,
} from '@/constants/breakpoints';

/** Zero constant for SSR fallback */
const ZERO = 0;

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointConfig {
  'sm': number;
  'md': number;
  'lg': number;
  'xl': number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  'sm': BREAKPOINT_SM,
  'md': BREAKPOINT_MD,
  'lg': BREAKPOINT_LG,
  'xl': BREAKPOINT_XL,
  '2xl': BREAKPOINT_2XL,
};

function createBreakpointConfig(
  customBreakpoints?: Partial<BreakpointConfig>,
): BreakpointConfig {
  return {
    'sm': customBreakpoints?.sm ?? defaultBreakpoints.sm,
    'md': customBreakpoints?.md ?? defaultBreakpoints.md,
    'lg': customBreakpoints?.lg ?? defaultBreakpoints.lg,
    'xl': customBreakpoints?.xl ?? defaultBreakpoints.xl,
    '2xl': customBreakpoints?.['2xl'] ?? defaultBreakpoints['2xl'],
  };
}

function getBreakpointValue(
  breakpoint: Breakpoint,
  config: BreakpointConfig,
): number {
  switch (breakpoint) {
    case 'sm':
      return config.sm;
    case 'md':
      return config.md;
    case 'lg':
      return config.lg;
    case 'xl':
      return config.xl;
    case '2xl':
      return config['2xl'];
    default:
      return config.sm;
  }
}

function getNextBreakpoint(breakpoint: Breakpoint): Breakpoint | null {
  switch (breakpoint) {
    case 'sm':
      return 'md';
    case 'md':
      return 'lg';
    case 'lg':
      return 'xl';
    case 'xl':
      return '2xl';
    case '2xl':
      return null;
    default:
      return null;
  }
}

export interface UseBreakpointReturn {
  currentBreakpoint: Breakpoint;
  isAbove: (_breakpoint: Breakpoint) => boolean;
  isBelow: (_breakpoint: Breakpoint) => boolean;
  isExactly: (_breakpoint: Breakpoint) => boolean;
  width: number;
}

export function useBreakpoint(
  customBreakpoints?: Partial<BreakpointConfig>,
): UseBreakpointReturn {
  const breakpoints = createBreakpointConfig(customBreakpoints);
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return ZERO;
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWidth(window.innerWidth);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Return empty cleanup function for server-side rendering
    return undefined;
  }, []);

  const getCurrentBreakpoint = (currentWidth: number): Breakpoint => {
    if (currentWidth >= breakpoints['2xl']) return '2xl';
    if (currentWidth >= breakpoints.xl) return 'xl';
    if (currentWidth >= breakpoints.lg) return 'lg';
    if (currentWidth >= breakpoints.md) return 'md';
    return 'sm';
  };

  const currentBreakpoint = getCurrentBreakpoint(width);

  const isAbove = (breakpoint: Breakpoint): boolean => {
    const breakpointValue = getBreakpointValue(breakpoint, breakpoints);
    return width >= breakpointValue;
  };

  const isBelow = (breakpoint: Breakpoint): boolean => {
    const breakpointValue = getBreakpointValue(breakpoint, breakpoints);
    return width < breakpointValue;
  };

  const isExactly = (breakpoint: Breakpoint): boolean => {
    const currentValue = getBreakpointValue(breakpoint, breakpoints);
    const nextBreakpoint = getNextBreakpoint(breakpoint);
    const nextValue =
      nextBreakpoint !== null
        ? getBreakpointValue(nextBreakpoint, breakpoints)
        : Infinity;

    return width >= currentValue && width < nextValue;
  };

  return {
    currentBreakpoint,
    isAbove,
    isBelow,
    isExactly,
    width,
  };
}
