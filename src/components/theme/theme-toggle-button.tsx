'use client';

import { forwardRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThemeToggleButtonProps {
  'ariaAttributes': Record<string, string>;
  'prefersHighContrast': boolean;
  'prefersReducedMotion': boolean;
  'onKeyDown': (_e: React.KeyboardEvent) => void;
  'onClick'?: (_e: React.MouseEvent) => void;
  'title'?: string;
  'data-testid'?: string;
}

export const ThemeToggleButton = forwardRef<
  HTMLButtonElement,
  ThemeToggleButtonProps
>(
  (
    {
      ariaAttributes,
      prefersHighContrast,
      prefersReducedMotion,
      onKeyDown,
      onClick,
      title,
      'data-testid': dataTestId,
    },
    ref,
  ) => {
    const {
      'aria-label': ariaLabel,
      'aria-pressed': ariaPressed,
      'aria-expanded': ariaExpanded,
      'aria-describedby': ariaDescribedBy,
      'aria-controls': ariaControls,
      role,
    } = ariaAttributes;

    const ariaPressedBool =
      ariaPressed === 'true'
        ? true
        : ariaPressed === 'false'
          ? false
          : undefined;
    const ariaExpandedBool =
      ariaExpanded === 'true'
        ? true
        : ariaExpanded === 'false'
          ? false
          : undefined;

    return (
      <Button
        ref={ref}
        variant='outline'
        size='icon'
        data-testid={dataTestId}
        title={title}
        aria-label={ariaLabel}
        aria-pressed={ariaPressedBool}
        aria-expanded={ariaExpandedBool}
        aria-describedby={ariaDescribedBy}
        aria-controls={ariaControls}
        role={role}
        onKeyDown={onKeyDown}
        onClick={onClick}
        className={`focus:ring-2 focus:ring-ring focus:ring-offset-2 ${prefersHighContrast ? 'border-2 border-foreground' : ''} ${prefersReducedMotion ? '' : 'transition-all duration-200'} `}
      >
        <Sun
          className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 dark:-rotate-90 dark:scale-0 ${
            prefersReducedMotion ? '' : 'transition-all'
          }`}
          aria-hidden='true'
        />
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 dark:rotate-0 dark:scale-100 ${
            prefersReducedMotion ? '' : 'transition-all'
          }`}
          aria-hidden='true'
        />
        <span className='sr-only'>主题切换按钮</span>
      </Button>
    );
  },
);

ThemeToggleButton.displayName = 'ThemeToggleButton';
