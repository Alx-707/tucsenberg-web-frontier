import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { generateNonce, getSecurityHeaders } from '@/config/security';
import { routing } from '@/i18n/routing';

// 创建 next-intl 中间件
const intlMiddleware = createMiddleware(routing);

// 辅助函数：添加安全头到响应
function addSecurityHeaders(response: NextResponse, nonce: string): void {
  const securityHeaders = getSecurityHeaders(nonce);
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value);
  });
  response.headers.set('x-csp-nonce', nonce);
}

export default function middleware(request: NextRequest) {
  // Generate nonce for CSP
  const nonce = generateNonce();

  // 调用 next-intl 中间件（完全依赖其内置语言检测）
  const response = intlMiddleware(request);

  // 添加安全headers到响应
  if (response) {
    addSecurityHeaders(response, nonce);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // - … the root path (handled by root page.tsx)
  // - … the `/admin` path (TinaCMS admin interface)
  matcher: '/((?!api|_next|_vercel|admin|^$|.*\\..*).*)',
};
