import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Tucsenberg/);
    
    // Check if main navigation is present
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to different pages
    const aboutLink = page.locator('a[href*="/about"]').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.url()).toContain('/about');
    }
  });

  test('should handle language switching', async ({ page }) => {
    await page.goto('/');
    
    // Look for language switcher
    const languageSwitcher = page.locator('[data-testid="language-switcher"]').or(
      page.locator('button:has-text("EN")').or(
        page.locator('button:has-text("中文")')
      )
    );
    
    if (await languageSwitcher.first().isVisible()) {
      await languageSwitcher.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify language change
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(en|zh)\//);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile navigation works
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]').or(
      page.locator('button[aria-label*="menu"]').or(
        page.locator('.hamburger')
      )
    );
    
    if (await mobileMenuButton.first().isVisible()) {
      await mobileMenuButton.first().click();
      
      // Check if mobile menu opens
      const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(
        page.locator('.mobile-menu')
      );
      await expect(mobileMenu.first()).toBeVisible();
    }
  });
});
