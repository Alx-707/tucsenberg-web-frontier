import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

// 基础 metadata 配置
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  title: 'Tucsenberg Web Frontier',
  description: 'Modern B2B Enterprise Web Platform with Next.js 15',
};

// Root layout - only contains html and body tags
// All application logic is in [locale]/layout.tsx
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
