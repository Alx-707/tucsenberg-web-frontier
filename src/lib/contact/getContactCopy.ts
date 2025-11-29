import { cacheLife } from 'next/cache';
import type { Locale } from '@/types/i18n';
import { getTranslationsCached } from '@/lib/i18n/server/getTranslationsCached';

export interface ContactHeaderCopy {
  title: string;
  description: string;
}

export interface ContactPanelContactCopy {
  title: string;
  emailLabel: string;
  phoneLabel: string;
}

export interface ContactPanelHoursCopy {
  title: string;
  weekdaysLabel: string;
  saturdayLabel: string;
  sundayLabel: string;
  closedLabel: string;
}

export interface ContactCopyModel {
  header: ContactHeaderCopy;
  panel: {
    contact: ContactPanelContactCopy;
    hours: ContactPanelHoursCopy;
  };
}

/**
 * Server-side helper to build a structured copy model for the contact page.
 *
 * In P1-3 this function is implemented as a data-level Cache Component:
 * - "use cache" + cacheLife('days') at the data-function level.
 * - Depends only on the explicit `locale` parameter and the
 *   `underConstruction.pages.contact` i18n namespace.
 *
 * Constraints:
 * - MUST NOT call headers(), cookies(), requestLocale() or other
 *   request-scoped APIs so it stays safe to cache.
 */
export async function getContactCopy(
  locale: Locale,
): Promise<ContactCopyModel> {
  'use cache';

  // Contact copy is treated as营销/支持类内容，通常更新频率不高：
  // - cacheLife('days') => stale: 5min, revalidate: 1 day, expire: 1 week
  // - 依赖 next-intl 消息 + 显式 locale 参数，不访问 runtime API。
  cacheLife('days');

  const t = await getTranslationsCached({
    locale,
    namespace: 'underConstruction.pages.contact',
  });

  return {
    header: {
      title: t('title'),
      description: t('description'),
    },
    panel: {
      contact: {
        title: t('panel.contactTitle'),
        emailLabel: t('panel.email'),
        phoneLabel: t('panel.phone'),
      },
      hours: {
        title: t('panel.hoursTitle'),
        weekdaysLabel: t('panel.weekdays'),
        saturdayLabel: t('panel.saturday'),
        sundayLabel: t('panel.sunday'),
        closedLabel: t('panel.closed'),
      },
    },
  };
}
