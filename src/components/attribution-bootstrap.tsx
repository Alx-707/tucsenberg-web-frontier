'use client';

import { useEffect } from 'react';
import { storeAttributionData } from '@/lib/utm';

/**
 * Attribution Bootstrap
 *
 * P1-1 Fix: Captures UTM parameters and click IDs on initial page load.
 * Uses first-touch attribution model - only stores if no existing data.
 * Renders nothing; exists solely for the side effect.
 *
 * This consolidates storeAttributionData() calls from 4 separate components
 * into a single location in the layout.
 */
export function AttributionBootstrap() {
  useEffect(() => {
    storeAttributionData();
  }, []);

  return null;
}
