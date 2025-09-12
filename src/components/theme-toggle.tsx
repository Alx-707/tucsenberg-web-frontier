'use client';

import { ThemeMenuItem } from '@/components/theme/theme-menu-item';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeToggle } from '@/hooks/use-theme-toggle';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const {
    theme,
    isOpen,
    setIsOpen,
    prefersReducedMotion,
    prefersHighContrast,
    supportsViewTransitions,
    handleThemeChange,
    handleKeyDown,
    ariaAttributes,
  } = useThemeToggle();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DropdownMenuTrigger asChild>
        <ThemeToggleButton
          ariaAttributes={ariaAttributes}
          prefersHighContrast={prefersHighContrast}
          prefersReducedMotion={prefersReducedMotion}
          onKeyDown={(e) => handleKeyDown(e, () => setIsOpen(!isOpen))}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className={` ${prefersHighContrast ? 'border-foreground border-2' : ''} ${prefersReducedMotion ? '' : 'animate-in fade-in-0 zoom-in-95'} `}
        role='menu'
        aria-label='主题选择菜单'
      >
        <ThemeMenuItem
          theme='light'
          currentTheme={theme || 'system'}
          label='明亮模式 Light'
          ariaLabel='切换到明亮模式'
          icon={Sun}
          supportsViewTransitions={supportsViewTransitions}
          prefersReducedMotion={prefersReducedMotion}
          onClick={(e) => handleThemeChange('light', e)}
          onKeyDown={(e) => handleKeyDown(e, () => handleThemeChange('light'))}
        />
        <ThemeMenuItem
          theme='dark'
          currentTheme={theme || 'system'}
          label='暗黑模式 Dark'
          ariaLabel='切换到暗黑模式'
          icon={Moon}
          supportsViewTransitions={supportsViewTransitions}
          prefersReducedMotion={prefersReducedMotion}
          onClick={(e) => handleThemeChange('dark', e)}
          onKeyDown={(e) => handleKeyDown(e, () => handleThemeChange('dark'))}
        />
        <ThemeMenuItem
          theme='system'
          currentTheme={theme || 'system'}
          label='系统模式 System'
          ariaLabel='切换到系统模式'
          icon={Monitor}
          supportsViewTransitions={supportsViewTransitions}
          prefersReducedMotion={prefersReducedMotion}
          onClick={(e) => handleThemeChange('system', e)}
          onKeyDown={(e) => handleKeyDown(e, () => handleThemeChange('system'))}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
