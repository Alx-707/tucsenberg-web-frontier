/**
 * Blur placeholder utilities for Next.js Image component.
 *
 * For static local images, Next.js automatically generates blurDataURL at build time
 * when using static imports. For dynamic paths (e.g., from MDX frontmatter), we provide
 * a lightweight shimmer placeholder as a fallback.
 *
 * Performance strategy:
 * - Prefer static imports for critical above-the-fold images when possible
 * - Use shimmer placeholder for dynamic/remote images to improve perceived LCP
 * - CSS-based blur filter provides instant visual feedback while image loads
 */

/**
 * Shimmer placeholder with gradient animation.
 * Provides visual feedback during image loading without requiring pre-computation.
 *
 * Uses a base64-encoded SVG with animated gradient for a modern loading effect.
 * The 10x10 dimension is intentional - Next.js will scale it and apply blur.
 */
const SHIMMER_SVG_TEMPLATE = `
<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(229,231,235);stop-opacity:1">
        <animate attributeName="offset" values="-2;1" dur="1.5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" style="stop-color:rgb(243,244,246);stop-opacity:1">
        <animate attributeName="offset" values="-1;2" dur="1.5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:rgb(229,231,235);stop-opacity:1">
        <animate attributeName="offset" values="0;3" dur="1.5s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
  </defs>
  <rect width="10" height="10" fill="url(#g)"/>
</svg>
`;

/** Static shimmer placeholder encoded as data URL */
export const SHIMMER_BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(SHIMMER_SVG_TEMPLATE.trim()).toString('base64')}`;

/**
 * Neutral gray blur placeholder for product/blog images.
 * Simpler and lighter than shimmer, appropriate when animation isn't desired.
 */
const NEUTRAL_SVG = `
<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
  <rect width="10" height="10" fill="rgb(229,231,235)"/>
</svg>
`;

/** Static neutral gray placeholder */
export const NEUTRAL_BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(NEUTRAL_SVG.trim()).toString('base64')}`;

/**
 * Image placeholder configuration for Next.js Image component.
 */
export interface BlurPlaceholderConfig {
  placeholder: 'blur';
  blurDataURL: string;
}

/**
 * Get blur placeholder configuration for dynamic image paths.
 *
 * @param variant - Placeholder style: 'shimmer' for animated, 'neutral' for static
 * @returns Configuration object to spread into Next.js Image props
 *
 * @example
 * ```tsx
 * <Image
 *   src={dynamicImagePath}
 *   alt="Product image"
 *   {...getBlurPlaceholder('shimmer')}
 * />
 * ```
 */
export function getBlurPlaceholder(
  variant: 'shimmer' | 'neutral' = 'neutral',
): BlurPlaceholderConfig {
  return {
    placeholder: 'blur',
    blurDataURL:
      variant === 'shimmer' ? SHIMMER_BLUR_DATA_URL : NEUTRAL_BLUR_DATA_URL,
  };
}
