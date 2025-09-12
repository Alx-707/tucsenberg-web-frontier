import { useState, useTransition } from 'react';
import type { Locale } from '@/types/i18n';
;
import { useLocaleStorage } from '@/lib/locale-storage';
import { TRANSITION_TIMEOUT } from './config';

export const useLanguageSwitch = () => {
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
