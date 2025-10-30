import { type ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export async function TranslationsBoundary({
  children,
  locale,
}: {
  children: ReactNode;
  locale: 'en' | 'zh';
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
    >
      {children}
    </NextIntlClientProvider>
  );
}

export default TranslationsBoundary;
