'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentProps,
} from 'react';
import { Check, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ANIMATION_DURATION_VERY_SLOW } from '@/constants';
import { MAGIC_2000 } from '@/constants/count';
import { Link, usePathname } from '@/i18n/routing';

const TRANSITION_TIMEOUT = ANIMATION_DURATION_VERY_SLOW; // 1 second timeout for language switch

// Extract href type from Link component
type LinkProps = ComponentProps<typeof Link>;
type LinkHref = LinkProps['href'];

// Dynamic route patterns for matching actual URLs to route patterns
const DYNAMIC_ROUTE_PATTERNS = [
  {
    pattern: /^\/blog\/([^/]+)$/,
    buildHref: (slug: string): LinkHref => ({
      pathname: '/blog/[slug]',
      params: { slug },
    }),
  },
  {
    pattern: /^\/products\/([^/]+)$/,
    buildHref: (slug: string): LinkHref => ({
      pathname: '/products/[slug]',
      params: { slug },
    }),
  },
] as const;

// NOTE: When adding new locales, update this regex pattern to include them
const LOCALE_PREFIX_RE = /^\/(en|zh)(?=\/|$)/;

/**
 * Normalizes pathname by stripping locale prefix and handling edge cases
 * Ensures consistent pathname format for Link href construction
 *
 * @param pathname - Pathname from usePathname() (no query/hash, may have locale prefix)
 * @returns Normalized pathname without locale prefix (guaranteed to start with '/' or be '/')
 */
function normalizePathnameForLink(pathname: string): string {
  const normalized = pathname === '' ? '/' : pathname;
  const stripped = normalized.replace(LOCALE_PREFIX_RE, '');
  return stripped === '' ? '/' : stripped;
}

/**
 * Parses current pathname to build the appropriate href for Link
 * Handles both static routes (returns pathname string) and dynamic routes
 * (returns object with pathname pattern and params)
 */
function parsePathnameForLink(currentPathname: string): LinkHref {
  const pathname = normalizePathnameForLink(currentPathname);
  for (const { pattern, buildHref } of DYNAMIC_ROUTE_PATTERNS) {
    const match = pathname.match(pattern);
    if (match?.[1]) {
      return buildHref(match[1]);
    }
  }

  // Static routes - cast required because usePathname returns runtime string
  // Safe because usePathname only returns valid configured pathnames
  return pathname as LinkHref;
}

// Custom hook for language switching logic
const useLanguageSwitch = () => {
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  type TimeoutHandle = ReturnType<typeof setTimeout>;

  const transitionTimeoutRef = useRef<TimeoutHandle | null>(null);
  const successResetRef = useRef<TimeoutHandle | null>(null);

  const clearTimers = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (successResetRef.current !== null) {
      clearTimeout(successResetRef.current);
      successResetRef.current = null;
    }
  }, []);

  const resetSuccessState = useCallback(() => {
    setSwitchSuccess(false);
    successResetRef.current = null;
  }, []);

  const scheduleSuccessReset = useCallback(() => {
    successResetRef.current = setTimeout(resetSuccessState, MAGIC_2000);
  }, [resetSuccessState]);

  const finalizeSwitch = useCallback(() => {
    setSwitchingTo(null);
    setSwitchSuccess(true);
    scheduleSuccessReset();
    transitionTimeoutRef.current = null;
  }, [scheduleSuccessReset]);

  const scheduleTransition = useCallback(() => {
    transitionTimeoutRef.current = setTimeout(
      finalizeSwitch,
      TRANSITION_TIMEOUT,
    );
  }, [finalizeSwitch]);

  const handleLanguageSwitch = useCallback(
    (newLocale: string) => {
      clearTimers();
      setSwitchingTo(newLocale);
      setSwitchSuccess(false);
      startTransition(scheduleTransition);
    },
    [clearTimers, scheduleTransition],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return {
    switchingTo,
    switchSuccess,
    isPending,
    handleLanguageSwitch,
  };
};

export const LanguageToggle = memo(({ locale }: { locale?: 'en' | 'zh' }) => {
  const pathname = usePathname();
  // Derive locale from <html lang> when not provided
  const effectiveLocale: 'en' | 'zh' =
    locale ||
    (typeof document !== 'undefined' && document.documentElement?.lang === 'zh'
      ? 'zh'
      : 'en');
  const { switchingTo, isPending, handleLanguageSwitch } = useLanguageSwitch();
  const [isOpen, setIsOpen] = useState(false);

  // Parse pathname once and memoize for performance
  const linkHref = useMemo(() => parsePathnameForLink(pathname), [pathname]);

  // Get current language display name
  const currentLanguageName = effectiveLocale === 'en' ? 'English' : '简体中文';

  return (
    <div data-testid='language-switcher'>
      <DropdownMenu
        data-testid='language-dropdown-menu'
        onOpenChange={setIsOpen}
      >
        <DropdownMenuTrigger
          asChild
          data-testid='language-dropdown-trigger'
        >
          <Button
            variant='ghost'
            disabled={isPending}
            data-testid='language-toggle-button'
            aria-label={currentLanguageName}
            className={cn(
              'h-8 gap-1.5 rounded-full px-3',
              'border border-border',
              'bg-background hover:bg-muted/60',
              'text-muted-foreground hover:text-foreground',
              'transition-colors duration-150 ease-out',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            )}
          >
            <Globe
              className='h-3.5 w-3.5 text-foreground/70'
              data-testid='globe-icon'
            />
            <span className='text-xs font-medium text-foreground/70'>
              {currentLanguageName}
            </span>
            {isPending ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin text-foreground/70' />
            ) : (
              <svg
                className={cn(
                  'h-3.5 w-3.5 text-foreground/70',
                  // 箭头旋转：展开180°，收起0°，160ms过渡
                  'transition-transform duration-150 ease-in-out',
                  isOpen && 'rotate-180',
                )}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          data-testid='language-dropdown-content'
          className={cn(
            'min-w-[180px] px-0 py-2.5',
            'rounded-xl border border-border',
            'bg-popover text-popover-foreground',
            'shadow-lg',
          )}
        >
          <DropdownMenuItem
            asChild
            data-testid='language-dropdown-item'
            className='p-0'
          >
            <Link
              href={linkHref}
              locale='en'
              className={cn(
                // 列表项：左对齐，行高24-28px，行间距6-8px
                'flex w-full items-center justify-between px-3.5 py-2',
                // Vercel 风格：浅灰文字 + 椭圆灰色背景悬停
                'font-medium text-muted-foreground',
                'hover:bg-muted hover:text-foreground dark:hover:bg-foreground/10',
                'rounded-md',
                // 过渡：120ms
                'transition-all duration-150 ease-in-out',
                'cursor-pointer',
              )}
              onClick={() => {
                setIsOpen(false);
                handleLanguageSwitch('en');
              }}
              data-testid='language-link-en'
              data-locale='en'
              role='menuitem'
            >
              <span className='text-xs'>English</span>
              {switchingTo === 'en' && (
                <Loader2 className='h-4 w-4 animate-spin' />
              )}
              {effectiveLocale === 'en' && switchingTo !== 'en' && (
                <Check
                  className='h-4 w-4 text-foreground'
                  data-testid='check-icon'
                />
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            data-testid='language-dropdown-item'
            className='p-0'
          >
            <Link
              href={linkHref}
              locale='zh'
              className={cn(
                // 列表项：左对齐，行高24-28px，行间距6-8px
                'flex w-full items-center justify-between px-3.5 py-2',
                // Vercel 风格：浅灰文字 + 椭圆灰色背景悬停
                'font-medium text-muted-foreground',
                'hover:bg-muted hover:text-foreground dark:hover:bg-foreground/10',
                'rounded-md',
                // 过渡：120ms
                'transition-all duration-150 ease-in-out',
                'cursor-pointer',
              )}
              onClick={() => {
                setIsOpen(false);
                handleLanguageSwitch('zh');
              }}
              data-testid='language-link-zh'
              data-locale='zh'
              role='menuitem'
            >
              <span className='text-xs'>简体中文</span>
              {switchingTo === 'zh' && (
                <Loader2 className='h-4 w-4 animate-spin' />
              )}
              {effectiveLocale === 'zh' && switchingTo !== 'zh' && (
                <Check
                  className='h-4 w-4 text-foreground'
                  data-testid='check-icon'
                />
              )}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

LanguageToggle.displayName = 'LanguageToggle';
