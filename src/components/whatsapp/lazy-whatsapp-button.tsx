'use client';

import dynamic from 'next/dynamic';

const WhatsAppButtonWithTranslations = dynamic(
  () =>
    import('@/components/whatsapp/whatsapp-button-with-translations').then(
      (mod) => mod.WhatsAppButtonWithTranslations,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface LazyWhatsAppButtonProps {
  number: string;
}

/**
 * Client-side lazy loader for WhatsApp button
 * Uses ssr: false to avoid MISSING_MESSAGE errors during SSG
 */
export function LazyWhatsAppButton({ number }: LazyWhatsAppButtonProps) {
  return <WhatsAppButtonWithTranslations number={number} />;
}
