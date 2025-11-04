import { expect, test } from '@playwright/test';
import { waitForLoadWithFallback } from './test-environment-setup';

test.describe('Web Eval Agent - Basic Functionality', () => {
  test('should load homepage and capture basic metrics', async ({ page }) => {
    // Start timing
    const startTime = Date.now();

    // Navigate to homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForLoadWithFallback(page, {
      context: 'web-eval basic metrics',
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });

    const loadTime = Date.now() - startTime;

    // Basic assertions
    await expect(page).toHaveTitle(/Tucsenberg/);
    expect(loadTime).toBeLessThan(5000); // 5 seconds max

    console.log(`✅ Homepage loaded in ${loadTime}ms`);
  });

  test('should capture network requests', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForLoadWithFallback(page, {
      context: 'web-eval network capture',
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });

    expect(requests.length).toBeGreaterThan(0);
    console.log(`✅ Captured ${requests.length} network requests`);
  });

  test('should capture console messages', async ({ page }) => {
    const messages: Array<{ type: string; text: string }> = [];

    page.on('console', (msg) => {
      messages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForLoadWithFallback(page, {
      context: 'web-eval console capture',
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });

    // Trigger a test console message
    await page.evaluate(() => {
      console.log('Web Eval Agent test message');
    });

    const testMessage = messages.find((m) =>
      m.text.includes('Web Eval Agent test message'),
    );
    expect(testMessage).toBeDefined();

    console.log(`✅ Captured ${messages.length} console messages`);
  });

  test('should work with different viewport sizes', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForLoadWithFallback(page, {
      context: 'web-eval responsive desktop',
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });

    let title = await page.title();
    expect(title).toContain('Tucsenberg');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForLoadWithFallback(page, {
      context: 'web-eval responsive tablet',
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });

    title = await page.title();
    expect(title).toContain('Tucsenberg');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForLoadWithFallback(page, {
      context: 'web-eval responsive mobile',
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });

    title = await page.title();
    expect(title).toContain('Tucsenberg');

    console.log('✅ Responsive design verified across viewports');
  });

  test('should measure basic performance metrics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForLoadWithFallback(page, {
      context: 'web-eval performance metrics',
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;

      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstByte: navigation.responseStart - navigation.fetchStart,
      };
    });

    expect(performanceMetrics.domContentLoaded).toBeGreaterThan(0);
    expect(performanceMetrics.loadComplete).toBeGreaterThan(0);
    expect(performanceMetrics.firstByte).toBeGreaterThan(0);

    console.log('✅ Performance metrics:', performanceMetrics);
  });
});
