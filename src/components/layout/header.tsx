/**
 * Header Component
 *
 * Main navigation header with responsive design, logo, navigation menus,
 * and utility controls (language switcher, theme toggle).
 */
'use client';

import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { Logo } from '@/components/layout/logo';
import { MainNavigation } from '@/components/layout/main-navigation';
import { MobileNavigation } from '@/components/layout/mobile-navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';

/**
 * Header Component
 *
 * Main navigation header with responsive design, logo, navigation menus,
 * and utility controls (language switcher, theme toggle).
 */

// Simplified header props interface
interface HeaderProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'transparent';
  sticky?: boolean;
}

export function Header({
  className,
  variant = 'default',
  sticky = true,
}: HeaderProps) {
  // Simplified logic: transparent headers are never sticky
  const isSticky = variant === 'transparent' ? false : sticky;
  const isMinimal = variant === 'minimal';
  const isTransparent = variant === 'transparent';

  return (
    <header
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 w-full border-b backdrop-blur',
        isSticky && 'sticky top-0 z-50',
        isTransparent && 'border-transparent bg-transparent',
        className,
      )}
    >
      <div className='container mx-auto px-4'>
        <div className='flex h-16 items-center justify-between'>
          {/* Left section: Logo + Mobile Menu */}
          <div className='flex items-center gap-4'>
            <MobileNavigation />
            <Logo />
          </div>

          {/* Center section: Main Navigation (Desktop) */}
          {!isMinimal && <MainNavigation className='flex-1 justify-center' />}

          {/* Right section: Utility Controls */}
          <div className='flex items-center gap-2'>
            <LanguageSwitcher />
            <Separator
              orientation='vertical'
              className='h-6'
            />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

// Simplified convenience components (only keep the most commonly used ones)
export function HeaderMinimal({ className }: { className?: string }) {
  return (
    <Header
      variant='minimal'
      {...(className && { className })}
    />
  );
}

export function HeaderTransparent({ className }: { className?: string }) {
  return (
    <Header
      variant='transparent'
      {...(className && { className })}
    />
  );
}
