/**
 * Cache Invalidation API Route
 *
 * Provides HTTP endpoints for triggering cache invalidation.
 * Protected by API key authentication for security.
 *
 * Usage:
 * POST /api/cache/invalidate
 * Authorization: Bearer <CACHE_INVALIDATION_SECRET>
 * Content-Type: application/json
 *
 * Body:
 * {
 *   "domain": "i18n" | "content" | "product",
 *   "locale"?: "en" | "zh",
 *   "entity"?: string,
 *   "identifier"?: string
 * }
 *
 * @see src/lib/cache/invalidate.ts - Core invalidation utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from '@/types/content';
import {
  CACHE_DOMAINS,
  invalidateContent,
  invalidateDomain,
  invalidateI18n,
  invalidateLocale,
  invalidateProduct,
} from '@/lib/cache';
import { logger } from '@/lib/logger';

const VALID_LOCALES = ['en', 'zh'] as const;

interface InvalidationRequest {
  domain: 'i18n' | 'content' | 'product' | 'all';
  locale?: Locale;
  entity?: string;
  identifier?: string;
}

function isValidLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && VALID_LOCALES.includes(locale as Locale);
}

function validateApiKey(request: NextRequest): boolean {
  const secret = process.env.CACHE_INVALIDATION_SECRET;

  // In development, allow without secret if not set
  if (!secret && process.env.NODE_ENV === 'development') {
    return true;
  }

  if (!secret) {
    logger.error('CACHE_INVALIDATION_SECRET not configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === secret;
}

export async function POST(request: NextRequest) {
  // Authenticate
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as InvalidationRequest;
    const { domain, locale, entity, identifier } = body;

    let result;

    switch (domain) {
      case 'i18n':
        if (locale && isValidLocale(locale)) {
          if (entity === 'critical') {
            result = invalidateI18n.critical(locale);
          } else if (entity === 'deferred') {
            result = invalidateI18n.deferred(locale);
          } else {
            result = invalidateI18n.locale(locale);
          }
        } else {
          result = invalidateI18n.all();
        }
        break;

      case 'content':
        if (!locale || !isValidLocale(locale)) {
          return NextResponse.json(
            { error: 'Locale required for content invalidation' },
            { status: 400 },
          );
        }
        if (entity === 'blog' && identifier) {
          result = invalidateContent.blogPost(identifier, locale);
        } else if (entity === 'page' && identifier) {
          result = invalidateContent.page(identifier, locale);
        } else {
          result = invalidateContent.locale(locale);
        }
        break;

      case 'product':
        if (!locale || !isValidLocale(locale)) {
          return NextResponse.json(
            { error: 'Locale required for product invalidation' },
            { status: 400 },
          );
        }
        if (entity === 'detail' && identifier) {
          result = invalidateProduct.detail(identifier, locale);
        } else if (entity === 'categories') {
          result = invalidateProduct.categories(locale);
        } else if (entity === 'featured') {
          result = invalidateProduct.featured(locale);
        } else {
          result = invalidateProduct.locale(locale);
        }
        break;

      case 'all':
        if (locale && isValidLocale(locale)) {
          result = invalidateLocale(locale);
        } else {
          // Invalidate all domains for all locales
          const results = [
            invalidateDomain(CACHE_DOMAINS.I18N),
            invalidateDomain(CACHE_DOMAINS.CONTENT),
            invalidateDomain(CACHE_DOMAINS.PRODUCT),
          ];
          const allTags = results.flatMap((r) => r.invalidatedTags);
          const allErrors = results.flatMap((r) => r.errors);
          result = {
            success: allErrors.length === 0,
            invalidatedTags: allTags,
            errors: allErrors,
          };
        }
        break;

      default:
        return NextResponse.json(
          { error: `Invalid domain: ${domain}` },
          { status: 400 },
        );
    }

    logger.info('Cache invalidation triggered', {
      domain,
      locale,
      entity,
      identifier,
      result,
    });

    return NextResponse.json({
      success: result.success,
      invalidatedTags: result.invalidatedTags,
      ...(result.errors.length > 0 && { errors: result.errors }),
    });
  } catch (error) {
    logger.error('Cache invalidation failed', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cache Invalidation API',
    usage: {
      method: 'POST',
      authentication: 'Bearer <CACHE_INVALIDATION_SECRET>',
      body: {
        domain: 'i18n | content | product | all',
        locale: 'en | zh (optional for i18n, required for others)',
        entity:
          'critical | deferred | blog | page | detail | categories | featured',
        identifier: 'slug or specific identifier',
      },
    },
  });
}
