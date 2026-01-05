import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { generateNonce, getSecurityHeaders } from '@/config/security';
import { routing } from '@/i18n/routing-config';

const intlMiddleware = createMiddleware(routing);
const SUPPORTED_LOCALES = new Set(['en', 'zh']);

function addSecurityHeaders(response: NextResponse, nonce: string): void {
  const securityHeaders = getSecurityHeaders(nonce);
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value);
  });
}

function extractLocaleCandidate(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const candidate = segments[0];
  return candidate && SUPPORTED_LOCALES.has(candidate) ? candidate : undefined;
}

function setLocaleCookie(resp: NextResponse, locale: string): void {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    resp.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    });
    resp.headers.append(
      'set-cookie',
      `NEXT_LOCALE=${locale}; Path=/; SameSite=Lax; HttpOnly${isProduction ? '; Secure' : ''}`,
    );
  } catch {
    // ignore cookie errors
  }
}

function tryHandleExplicitLocalizedRequest(
  request: NextRequest,
  nonce: string,
): NextResponse | null {
  const locale = extractLocaleCandidate(request.nextUrl.pathname);
  const existingLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (locale && existingLocale !== locale) {
    const resp = NextResponse.next();
    setLocaleCookie(resp, locale);
    addSecurityHeaders(resp, nonce);
    return resp;
  }
  return null;
}

function tryHandleInvalidLocalePrefix(
  request: NextRequest,
  nonce: string,
): NextResponse | null {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const [first, ...rest] = segments;

  if (first && SUPPORTED_LOCALES.has(first)) {
    return null;
  }

  const candidatePath = `/${rest.join('/')}`;
  const pathnames = routing.pathnames as Record<string, unknown> | undefined;
  const isKnownPath = Boolean(
    pathnames && Object.prototype.hasOwnProperty.call(pathnames, candidatePath),
  );

  if (!isKnownPath) {
    return null;
  }

  const targetUrl = request.nextUrl.clone();
  targetUrl.pathname = `/${routing.defaultLocale}${candidatePath}`;

  const resp = NextResponse.redirect(targetUrl);
  setLocaleCookie(resp, routing.defaultLocale);
  addSecurityHeaders(resp, nonce);

  return resp;
}

export default function middleware(request: NextRequest) {
  const nonce = generateNonce();

  const invalidLocaleHandled = tryHandleInvalidLocalePrefix(request, nonce);
  if (invalidLocaleHandled) return invalidLocaleHandled;

  const early = tryHandleExplicitLocalizedRequest(request, nonce);
  if (early) return early;

  const response = intlMiddleware(request);
  const locale = extractLocaleCandidate(request.nextUrl.pathname);
  const existingLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (response && locale && existingLocale !== locale)
    setLocaleCookie(response, locale);
  if (response) addSecurityHeaders(response, nonce);
  return response;
}

export const config = {
  // Root path (/) is handled by src/app/page.tsx due to Turbopack matcher inconsistency
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)', '/(en|zh)/:path*'],
};
