'use client';

import { memo, useMemo, useState, useTransition } from 'react';
import {
  Check,
  Globe,
  Languages,
  Loader2,
  MapPin,
  Monitor,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Locale } from '@/types/i18n';
import { useClientLocaleDetection } from '@/lib/locale-detection';
import { useLocaleStorage } from '@/lib/locale-storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePathname } from '@/i18n/routing';

const TRANSITION_TIMEOUT = 1000;

// 语言配置
const LANGUAGE_CONFIG = {
  en: {
    code: 'EN',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    region: 'Global',
  },
  zh: {
    code: 'ZH',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    region: 'China',
  },
} as const;

// 检测源图标映射
const SOURCE_ICONS = {
  user: Monitor,
  geo: MapPin,
  browser: Globe,
  default: Languages,
} as const;

// 语言项渲染组件
interface LanguageItemProps {
  targetLocale: Locale;
  currentLocale: Locale;
  switchingTo: Locale | null;
  pathname: string;
  compact: boolean;
  onLanguageSwitch: (locale: Locale) => void;
}

const LanguageItem = memo(
  ({
    targetLocale,
    currentLocale,
    switchingTo,
    pathname,
    compact,
    onLanguageSwitch,
  }: LanguageItemProps) => {
    const config = LANGUAGE_CONFIG[targetLocale];
    const isActive = currentLocale === targetLocale;
    const isSwitching = switchingTo === targetLocale;

    return (
      <DropdownMenuItem
        key={targetLocale}
        asChild
      >
        <Link
          href={pathname as '/' | '/about' | '/contact' | '/blog' | '/products'}
          locale={targetLocale}
          className='flex w-full items-center justify-between'
          onClick={() => onLanguageSwitch(targetLocale)}
        >
          <div className='flex items-center space-x-3'>
            <span className='text-lg'>{config.flag}</span>
            <div className='flex flex-col'>
              <div className='flex items-center space-x-2'>
                <span className='bg-muted rounded px-1.5 py-0.5 font-mono text-xs'>
                  {config.code}
                </span>
                <span className='font-medium'>{config.nativeName}</span>
              </div>
              {!compact && (
                <span className='text-muted-foreground text-xs'>
                  {config.name} • {config.region}
                </span>
              )}
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            {isSwitching && (
              <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
            )}
            {isActive && !isSwitching && (
              <Check className='h-4 w-4 text-green-500' />
            )}
          </div>
        </Link>
      </DropdownMenuItem>
    );
  },
);

LanguageItem.displayName = 'LanguageItem';

interface EnhancedLocaleSwitcherProps {
  /**
   * 是否显示检测信息
   */
  showDetectionInfo?: boolean;

  /**
   * 是否显示紧凑模式
   */
  compact?: boolean;

  /**
   * 自定义样式类名
   */
  className?: string;
}

// 语言切换逻辑Hook
const useLanguageSwitch = () => {
  const [switchingTo, setSwitchingTo] = useState<Locale | null>(null);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { setUserOverride } = useLocaleStorage();

  const handleLanguageSwitch = (newLocale: Locale) => {
    setSwitchingTo(newLocale);
    setSwitchSuccess(false);

    // 保存用户选择
    setUserOverride(newLocale);

    startTransition(() => {
      setTimeout(() => {
        setSwitchingTo(null);
        setSwitchSuccess(true);
        setTimeout(() => setSwitchSuccess(false), 2000);
      }, TRANSITION_TIMEOUT);
    });
  };

  return {
    switchingTo,
    switchSuccess,
    isPending,
    handleLanguageSwitch,
  };
};

const EnhancedLocaleSwitcherComponent = ({
  showDetectionInfo = false,
  compact = false,
  className = '',
}: EnhancedLocaleSwitcherProps) => {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  const { switchingTo, switchSuccess, isPending, handleLanguageSwitch } =
    useLanguageSwitch();
  const { getStats } = useLocaleStorage();
  const { detectClientLocale } = useClientLocaleDetection();

  // 计算检测信息 - 使用useMemo避免派生状态
  const detectionInfo = useMemo(() => {
    if (!showDetectionInfo) return null;

    const stats = getStats();
    const detection = detectClientLocale();

    return {
      source: stats.hasOverride ? 'user' : detection.source,
      confidence: detection.confidence,
      isUserOverride: stats.hasOverride,
    };
  }, [showDetectionInfo, getStats, detectClientLocale]);

  const renderDetectionInfo = () => {
    if (!showDetectionInfo || !detectionInfo) return null;

    const SourceIcon =
      SOURCE_ICONS[detectionInfo.source as keyof typeof SOURCE_ICONS] ||
      Languages;
    const confidenceColor =
      detectionInfo.confidence > 0.8
        ? 'green'
        : detectionInfo.confidence > 0.5
          ? 'yellow'
          : 'red';

    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className='text-muted-foreground text-xs'>
          Detection Info
        </DropdownMenuLabel>
        <div className='px-2 py-1 text-xs'>
          <div className='mb-1 flex items-center justify-between'>
            <div className='flex items-center space-x-1'>
              <SourceIcon className='h-3 w-3' />
              <span>Source: {detectionInfo.source}</span>
            </div>
            <Badge
              variant='outline'
              className={`text-xs ${
                confidenceColor === 'green'
                  ? 'border-green-500 text-green-700'
                  : confidenceColor === 'yellow'
                    ? 'border-yellow-500 text-yellow-700'
                    : 'border-red-500 text-red-700'
              }`}
            >
              {Math.round(detectionInfo.confidence * 100)}%
            </Badge>
          </div>
          {detectionInfo.isUserOverride && (
            <div className='text-xs text-blue-600'>✓ User preference saved</div>
          )}
        </div>
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={`relative ${className}`}
          disabled={isPending}
        >
          {compact ? (
            <div className='flex items-center space-x-1'>
              <span className='text-sm'>{LANGUAGE_CONFIG[locale].flag}</span>
              <span className='font-mono text-xs'>
                {LANGUAGE_CONFIG[locale].code}
              </span>
            </div>
          ) : (
            <div className='flex items-center space-x-2'>
              <Languages className='h-4 w-4' />
              <span className='hidden sm:inline'>
                {LANGUAGE_CONFIG[locale].nativeName}
              </span>
              <span className='font-mono text-xs sm:hidden'>
                {LANGUAGE_CONFIG[locale].code}
              </span>
            </div>
          )}

          {switchSuccess && (
            <div className='absolute -top-1 -right-1'>
              <div className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
            </div>
          )}

          <span className='sr-only'>{t('toggle')}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        className='w-56'
      >
        <DropdownMenuLabel className='flex items-center space-x-2'>
          <Languages className='h-4 w-4' />
          <span>{t('selectLanguage')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.keys(LANGUAGE_CONFIG).map((lang) => (
          <LanguageItem
            key={lang}
            targetLocale={lang as Locale}
            currentLocale={locale}
            switchingTo={switchingTo}
            pathname={pathname}
            compact={compact}
            onLanguageSwitch={handleLanguageSwitch}
          />
        ))}

        {renderDetectionInfo()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const EnhancedLocaleSwitcher = memo(EnhancedLocaleSwitcherComponent);
EnhancedLocaleSwitcher.displayName = 'EnhancedLocaleSwitcher';

/**
 * 简化版语言切换器 (向后兼容)
 */
export const SimpleLocaleSwitcher = memo(() => (
  <EnhancedLocaleSwitcher
    compact
    showDetectionInfo={false}
  />
));

SimpleLocaleSwitcher.displayName = 'SimpleLocaleSwitcher';

/**
 * 带检测信息的语言切换器
 */
export const LocaleSwitcherWithInfo = memo(() => (
  <EnhancedLocaleSwitcher showDetectionInfo />
));

LocaleSwitcherWithInfo.displayName = 'LocaleSwitcherWithInfo';
