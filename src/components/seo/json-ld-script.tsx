import 'server-only';
import { generateJSONLD } from '@/lib/structured-data';

interface JsonLdScriptProps {
  readonly data: unknown;
}

/**
 * Server Component for rendering JSON-LD structured data.
 *
 * Encapsulates the dangerouslySetInnerHTML usage in a single,
 * auditable location with proper XSS escaping via generateJSONLD.
 *
 * Security: generateJSONLD escapes < to \u003c to prevent script injection.
 *
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
export function JsonLdScript({ data }: JsonLdScriptProps) {
  let jsonLd: string;

  try {
    jsonLd = generateJSONLD(data);
  } catch {
    // Silently fail - structured data is enhancement, not critical
    return null;
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: jsonLd,
      }}
    />
  );
}
