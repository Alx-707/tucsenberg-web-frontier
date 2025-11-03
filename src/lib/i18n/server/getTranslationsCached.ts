import { cache } from 'react';
import { getTranslations } from 'next-intl/server';

/**
 * Cached wrapper around next-intl/server getTranslations to avoid
 * repeated locale/namespace lookups within a single request lifecycle.
 */
export const getTranslationsCached = cache(getTranslations);
