import { expect, type Locator, type Page } from '@playwright/test';

const MAIN_NAV_ROLE_OPTIONS = {
  name: /main navigation/i,
} as const;

const HEADER_MOBILE_MENU_BUTTON_TESTID = 'header-mobile-menu-button';

/**
 * Wait for the html[lang] attribute to be updated after hydration.
 * In PPR mode, the initial HTML has lang="en" (default), and LangUpdater
 * corrects it client-side after hydration.
 */
export async function waitForHtmlLang(
  page: Page,
  expectedLang: string,
  timeout = process.env.CI ? 8000 : 10000,
): Promise<void> {
  await page.waitForFunction(
    (lang) => document.documentElement.lang === lang,
    expectedLang,
    { timeout },
  );
}

/**
 * Assert html[lang] attribute after waiting for hydration.
 * Use this instead of direct toHaveAttribute('lang', ...) assertions.
 */
export async function expectHtmlLang(
  page: Page,
  expectedLang: string,
): Promise<void> {
  await waitForHtmlLang(page, expectedLang);
  await expect(page.locator('html')).toHaveAttribute('lang', expectedLang);
}

/**
 * 获取主导航栏定位器，针对桌面/移动场景自动回退
 */
export function getNav(page: Page): Locator {
  const nav = page.getByRole('navigation', MAIN_NAV_ROLE_OPTIONS);
  return nav.first();
}

/**
 * Header mobile menu trigger (visible below desktop breakpoint).
 * Uses a stable data-testid to avoid coupling to translated labels.
 */
export function getHeaderMobileMenuButton(page: Page): Locator {
  return page.getByTestId(HEADER_MOBILE_MENU_BUTTON_TESTID).first();
}

/**
 * Determine whether the header is currently in "mobile/tablet" mode
 * based on which controls are actually visible.
 *
 * This avoids hardcoding breakpoint numbers in tests.
 */
export async function isHeaderInMobileMode(page: Page): Promise<boolean> {
  const button = getHeaderMobileMenuButton(page);
  try {
    return await button.isVisible();
  } catch {
    return false;
  }
}

export async function isHeaderInDesktopMode(page: Page): Promise<boolean> {
  const nav = getNav(page);
  try {
    return await nav.isVisible();
  } catch {
    return false;
  }
}

/**
 * 点击主导航栏中的指定链接。
 * @param page Playwright 页面实例
 * @param linkName 可访问名称（会处理英文/本地化文案）
 */
export async function clickNavLinkByName(
  page: Page,
  linkName: string,
): Promise<void> {
  const nav = getNav(page);
  const link = nav.getByRole('link', { name: linkName });
  await link.click();
}
