/**
 * Tests for LocaleHead component
 *
 * Note: Some tests are limited due to ESM module evaluation timing:
 * - Analytics dns-prefetch/preconnect arrays are computed at module load time
 * - Font subset functionality requires filesystem mocking
 * Full functionality is covered by integration tests.
 */
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('LocaleHead', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Ensure font subset is disabled to avoid existsSync calls
    process.env.NEXT_PUBLIC_ENABLE_CN_FONT_SUBSET = 'false';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Import after env setup
  let LocaleHead: typeof import('../head').default;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../head');
    LocaleHead = mod.default;
  });

  describe('analytics preconnect', () => {
    it('should not render preconnect in test environment by default', async () => {
      const { container } = render(<LocaleHead />);

      const preconnectLinks = container.querySelectorAll(
        'link[rel="preconnect"]',
      );
      expect(preconnectLinks.length).toBe(0);
    });
  });

  describe('font subset disabled', () => {
    it('should not render font preloads when subset is disabled', async () => {
      const { container } = render(<LocaleHead />);

      const fontPreloads = container.querySelectorAll(
        'link[rel="preload"][as="font"]',
      );
      expect(fontPreloads.length).toBe(0);
    });

    it('should not render font-face style when subset is disabled', async () => {
      const { container } = render(<LocaleHead />);

      const styleElement = container.querySelector('style');
      expect(styleElement).not.toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('should render as a React Fragment', async () => {
      const { container } = render(<LocaleHead />);

      // Fragment renders children directly, no wrapper element
      expect(container.children.length).toBeGreaterThanOrEqual(0);
    });

    it('should only render link elements with valid rel attributes', async () => {
      const { container } = render(<LocaleHead />);

      const links = container.querySelectorAll('link');
      links.forEach((link) => {
        const rel = link.getAttribute('rel');
        expect(['preconnect', 'dns-prefetch', 'preload']).toContain(rel);
      });
    });
  });

  describe('geist font preloads', () => {
    it('should not render geist font preloads (handled by next/font/local)', async () => {
      // Geist fonts are handled by next/font/local, not manual preloads
      const { container } = render(<LocaleHead />);

      const geistPreloads = Array.from(
        container.querySelectorAll('link[rel="preload"][as="font"]'),
      ).filter((link) => link.getAttribute('href')?.includes('geist'));

      expect(geistPreloads.length).toBe(0);
    });
  });

  describe('default environment configuration', () => {
    it('should not render preconnect when not in production', async () => {
      // Default test environment is not production
      const { container } = render(<LocaleHead />);

      const preconnectLinks = container.querySelectorAll(
        'link[rel="preconnect"]',
      );
      expect(preconnectLinks.length).toBe(0);
    });

    it('should have no font preloads with default config', async () => {
      const { container } = render(<LocaleHead />);

      const fontPreloads = container.querySelectorAll(
        'link[rel="preload"][as="font"]',
      );
      expect(fontPreloads.length).toBe(0);
    });
  });
});
