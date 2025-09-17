import type { KeyboardEvent } from 'react';
import { THEME_OPTIONS } from '@/components/theme/horizontal-theme-toggle/theme-config';
import { ONE, ZERO } from '@/constants';

/**
 * 处理键盘导航
 */
export const createKeyboardHandler = (
  theme: string | undefined,
  handleThemeChange: (
    newTheme: string,
    buttonElement?: HTMLButtonElement,
  ) => void,
) => {
  const optionsLength = THEME_OPTIONS.length;

  const moveToIndex = (
    targetIndex: number,
    buttonElement: HTMLButtonElement,
  ) => {
    if (targetIndex < ZERO || targetIndex >= optionsLength) {
      return;
    }
    const option = THEME_OPTIONS.find((_, index) => index === targetIndex);
    if (option) {
      handleThemeChange(option.value, buttonElement);
    }
  };

  return (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = THEME_OPTIONS.findIndex(
      (option) => option.value === theme,
    );
    const buttonElement = event.currentTarget;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveToIndex(
          currentIndex > ZERO ? currentIndex - ONE : optionsLength - ONE,
          buttonElement,
        );
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveToIndex(
          currentIndex < optionsLength - ONE ? currentIndex + ONE : ZERO,
          buttonElement,
        );
        break;
      case 'Home':
        event.preventDefault();
        moveToIndex(ZERO, buttonElement);
        break;
      case 'End':
        event.preventDefault();
        moveToIndex(optionsLength - ONE, buttonElement);
        break;
      default:
        break;
    }
  };
};
