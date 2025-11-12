'use client';

import { Phone } from 'lucide-react';

export interface WhatsAppFloatingButtonProps {
  number: string;
  label?: string;
  className?: string;
}

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return digits;
};

export function WhatsAppFloatingButton({
  number,
  label = 'Chat with us on WhatsApp',
  className = '',
}: WhatsAppFloatingButtonProps) {
  const normalizedNumber = normalizePhoneNumber(number);
  if (!normalizedNumber) return null;

  const href = `https://wa.me/${normalizedNumber}`;

  return (
    <a
      aria-label={label}
      className={`fixed right-6 bottom-6 z-[1100] flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 ${className}`}
      href={href}
      rel='noreferrer'
      target='_blank'
    >
      <Phone
        className='h-4 w-4'
        aria-hidden='true'
      />
      <span>{label}</span>
    </a>
  );
}
