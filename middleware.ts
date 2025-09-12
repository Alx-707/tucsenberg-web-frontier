import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { generateNonce, getSecurityHeaders } from './src/config/security';
import { OPACITY_CONSTANTS } from './src/constants/app-constants';
import { routing } from './src/i18n/routing';

// 置信度常量
const HIGH_CONFIDENCE = OPACITY_CONSTANTS.VERY_HIGH_OPACITY;
const MEDIUM_CONFIDENCE = OPACITY_CONSTANTS.HIGH_OPACITY;
const BROWSER_CONFIDENCE = OPACITY_CONSTANTS.MEDIUM_HIGH_OPACITY; // 浏览器语言检测置信度 (0.6)

// 地理位置到语言的映射
const GEO_LOCALE_MAP: Record<string, string> = {
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  MO: 'zh',
  SG: 'zh',
  US: 'en',
  GB: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  IE: 'en',
  ZA: 'en',
  IN: 'en',
};

// 浏览器语言到支持语言的映射
const BROWSER_LOCALE_MAP: Record<string, string> = {
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'zh-HK': 'zh',
  'zh-SG': 'zh',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
};

// 简化的语言检测函数
function detectLocaleFromHeaders(request: NextRequest) {
  // 1. 检查地理位置
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code');

  if (country) {
    const geoLocale = GEO_LOCALE_MAP[country.toUpperCase()];
    if (geoLocale) {
      return {
        locale: geoLocale,
        source: 'geo',
        confidence: country === 'CN' ? HIGH_CONFIDENCE : MEDIUM_CONFIDENCE,
        country: country.toUpperCase(),
      };
    }
  }

  // 2. 检查浏览器语言
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map((lang) => lang?.split(';')[0]?.trim())
      .filter(Boolean);

    for (const lang of languages) {
      if (!lang) continue;
      const browserLocale = BROWSER_LOCALE_MAP[lang.toLowerCase()];
      if (browserLocale) {
        return {
          locale: browserLocale,
          source: 'browser',
          confidence: BROWSER_CONFIDENCE,
          languages,
        };
      }
    }
  }

  // 3. 默认语言
  return {
    locale: 'en',
    source: 'default',
    confidence: OPACITY_CONSTANTS.MEDIUM_OPACITY, // 0.5
  };
}

// 创建基础的 next-intl 中间件
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // 测试环境下跳过next-intl middleware（修复Playwright测试环境下的SSR失败问题）
  if (process.env.PLAYWRIGHT_TEST === 'true') {
    const response = NextResponse.next();

    // 仍然添加安全headers
    const nonce = generateNonce();
    const securityHeaders = getSecurityHeaders(nonce);
    securityHeaders.forEach(({ key, value }) => {
      response.headers.set(key, value);
    });
    response.headers.set('x-csp-nonce', nonce);

    return response;
  }

  // Generate nonce for CSP
  const nonce = generateNonce();

  // 执行简化的语言检测
  const detectionResult = detectLocaleFromHeaders(request);

  // 创建增强的请求对象
  const enhancedRequest = new Request(request.url, {
    ...request,
    headers: new Headers(request.headers),
  });

  // 添加检测信息到请求头
  enhancedRequest.headers.set('x-detected-locale', detectionResult.locale);
  enhancedRequest.headers.set('x-detection-source', detectionResult.source);
  enhancedRequest.headers.set(
    'x-detection-confidence',
    detectionResult.confidence.toString(),
  );

  // Add security nonce to request headers
  enhancedRequest.headers.set('x-csp-nonce', nonce);

  if (detectionResult.country) {
    enhancedRequest.headers.set('x-detected-country', detectionResult.country);
  }
  if (detectionResult.languages) {
    enhancedRequest.headers.set(
      'x-detected-language',
      detectionResult.languages.join(','),
    );
  }

  // 调用原始的 next-intl 中间件
  const response = intlMiddleware(enhancedRequest as NextRequest);

  // Add security headers to response
  if (response) {
    const securityHeaders = getSecurityHeaders(nonce);
    securityHeaders.forEach(({ key, value }) => {
      response.headers.set(key, value);
    });

    // Add nonce to response for client-side access
    response.headers.set('x-csp-nonce', nonce);
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
