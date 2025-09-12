import { test } from '@playwright/test';

test.describe('Debug Language Dropdown', () => {
  test('should debug language dropdown rendering', async ({ page }) => {
    // 测试根路径重定向 - 直接访问根路径看是否能正确重定向到/en
    console.log('Testing root path redirect...');
    await page.goto('http://localhost:3000/');

    // 等待页面加载和可能的重定向
    await page.waitForLoadState('networkidle');

    // 检查当前URL是否正确重定向到/en
    const currentUrl = page.url();
    console.log('Current URL after redirect:', currentUrl);

    // 检查页面HTML结构
    const html = await page.content();
    console.log('=== PAGE HTML ===');
    console.log(html.substring(0, 2000)); // 只显示前2000个字符

    // 检查是否有我们的组件
    const languageDropdown = await page
      .locator('[data-testid="language-dropdown-trigger"]')
      .count();
    console.log('Language dropdown count:', languageDropdown);

    // 检查是否有任何按钮
    const allButtons = await page.locator('button').count();
    console.log('Total buttons on page:', allButtons);

    // 列出所有按钮的内容
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i]?.textContent();
      const testId = await buttons[i]?.getAttribute('data-testid');
      console.log(`Button ${i}: "${text}" (testid: ${testId})`);
    }

    // 检查header是否存在
    const header = await page.locator('header').count();
    console.log('Header count:', header);

    if (header > 0) {
      const headerContent = await page.locator('header').textContent();
      console.log('Header content:', headerContent);
    }

    // 检查是否有任何包含"Language"或"语言"的元素
    const languageElements = await page
      .locator('text=/Language|语言|中文|English/i')
      .count();
    console.log('Elements containing language text:', languageElements);

    // 截图保存
    await page.screenshot({
      path: 'debug-language-dropdown.png',
      fullPage: true,
    });
  });
});
