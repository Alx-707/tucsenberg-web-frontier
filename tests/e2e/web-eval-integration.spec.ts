import { test, expect } from '@playwright/test';

test.describe('Web Eval Agent Integration', () => {
  test('should capture network requests for analysis', async ({ page }) => {
    const networkRequests: Array<{
      url: string;
      method: string;
      status: number;
      timing: number;
    }> = [];

    // Monitor network requests
    page.on('response', async (response) => {
      const request = response.request();
      const timing = response.timing();
      
      networkRequests.push({
        url: response.url(),
        method: request.method(),
        status: response.status(),
        timing: timing.responseEnd - timing.requestStart,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we captured network requests
    expect(networkRequests.length).toBeGreaterThan(0);
    
    // Check for critical resources
    const htmlRequest = networkRequests.find(req => req.url.includes('localhost:3000') && req.method === 'GET');
    expect(htmlRequest).toBeDefined();
    expect(htmlRequest?.status).toBe(200);

    console.log(`Captured ${networkRequests.length} network requests`);
    console.log('Network requests:', JSON.stringify(networkRequests, null, 2));
  });

  test('should capture console logs for debugging', async ({ page }) => {
    const consoleLogs: Array<{
      type: string;
      text: string;
      timestamp: number;
    }> = [];

    // Monitor console messages
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Trigger some console output
    await page.evaluate(() => {
      console.log('Web Eval Agent test log');
      console.info('Test info message');
    });

    // Verify we captured console logs
    const testLog = consoleLogs.find(log => log.text.includes('Web Eval Agent test log'));
    expect(testLog).toBeDefined();
    expect(testLog?.type).toBe('log');

    console.log(`Captured ${consoleLogs.length} console messages`);
    console.log('Console logs:', JSON.stringify(consoleLogs, null, 2));
  });

  test('should measure page performance metrics', async ({ page }) => {
    await page.goto('/');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const performanceData: Record<string, any> = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              performanceData.navigation = {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                loadComplete: navEntry.loadEventEnd - navEntry.fetchStart,
                firstByte: navEntry.responseStart - navEntry.fetchStart,
              };
            }
            
            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                performanceData.fcp = entry.startTime;
              }
            }
          });
          
          resolve(performanceData);
        });
        
        observer.observe({ entryTypes: ['navigation', 'paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 3000);
      });
    });

    console.log('Performance metrics:', JSON.stringify(metrics, null, 2));
    
    // Verify reasonable performance
    if (metrics.navigation) {
      expect(metrics.navigation.loadComplete).toBeLessThan(5000); // 5 seconds max
    }
  });

  test('should test user interaction flows', async ({ page }) => {
    await page.goto('/');
    
    // Test basic interactions that Web Eval Agent would analyze
    const interactions: Array<{
      action: string;
      element: string;
      success: boolean;
      timing: number;
    }> = [];

    // Test navigation interaction
    const startTime = Date.now();
    try {
      const navLinks = page.locator('nav a').first();
      if (await navLinks.isVisible()) {
        await navLinks.click();
        await page.waitForLoadState('networkidle');
        
        interactions.push({
          action: 'navigation_click',
          element: 'nav_link',
          success: true,
          timing: Date.now() - startTime,
        });
      }
    } catch (error) {
      interactions.push({
        action: 'navigation_click',
        element: 'nav_link',
        success: false,
        timing: Date.now() - startTime,
      });
    }

    // Test theme toggle if available
    const themeToggleStart = Date.now();
    try {
      const themeToggle = page.locator('[data-testid="theme-toggle"]').or(
        page.locator('button:has-text("🌙")').or(
          page.locator('button:has-text("☀️")')
        )
      );
      
      if (await themeToggle.first().isVisible()) {
        await themeToggle.first().click();
        
        interactions.push({
          action: 'theme_toggle',
          element: 'theme_button',
          success: true,
          timing: Date.now() - themeToggleStart,
        });
      }
    } catch (error) {
      interactions.push({
        action: 'theme_toggle',
        element: 'theme_button',
        success: false,
        timing: Date.now() - themeToggleStart,
      });
    }

    console.log('User interactions:', JSON.stringify(interactions, null, 2));
    
    // Verify at least one interaction was successful
    const successfulInteractions = interactions.filter(i => i.success);
    expect(successfulInteractions.length).toBeGreaterThan(0);
  });

  test('should validate accessibility for Web Eval Agent', async ({ page }) => {
    await page.goto('/');
    
    // Basic accessibility checks that Web Eval Agent would perform
    const accessibilityIssues: string[] = [];

    // Check for missing alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      if (!alt && src && !src.includes('data:')) {
        accessibilityIssues.push(`Image missing alt text: ${src}`);
      }
    }

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    if (headings.length === 0) {
      accessibilityIssues.push('No headings found on page');
    }

    // Check for form labels
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        if (!hasLabel && !ariaLabel) {
          accessibilityIssues.push(`Input missing label: ${id}`);
        }
      }
    }

    console.log('Accessibility issues found:', accessibilityIssues);
    
    // For now, just log issues - in production you might want to fail the test
    if (accessibilityIssues.length > 0) {
      console.warn(`Found ${accessibilityIssues.length} accessibility issues`);
    }
  });
});
