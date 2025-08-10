import type { ReactNode } from 'react';
import './globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

// Minimal root layout required by Next.js
// The actual layout logic is in [locale]/layout.tsx
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
