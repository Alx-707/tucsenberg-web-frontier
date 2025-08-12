#!/usr/bin/env node

/**
 * Web Eval Agent 测试脚本
 * 用于验证 Web Eval Agent MCP 服务器的功能
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class WebEvalAgentTester {
  constructor() {
    this.baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
    };
  }

  /**
   * 添加测试结果
   */
  addTestResult(name, passed, details = '', error = null) {
    const result = {
      name,
      passed,
      details,
      error: error ? error.message : null,
      timestamp: new Date().toISOString(),
    };

    this.testResults.tests.push(result);
    this.testResults.summary.total++;

    if (passed) {
      this.testResults.summary.passed++;
      console.log(`✅ ${name}: ${details}`);
    } else {
      this.testResults.summary.failed++;
      console.log(`❌ ${name}: ${details}`);
      if (error) {
        console.log(`   Error: ${error.message}`);
      }
    }
  }

  /**
   * 检查开发服务器是否运行
   */
  async checkDevServer() {
    console.log('🔍 检查开发服务器状态...');

    try {
      const response = await fetch(this.baseUrl);
      const isRunning = response.ok;

      this.addTestResult(
        '开发服务器检查',
        isRunning,
        isRunning ? `服务器运行在 ${this.baseUrl}` : '服务器未响应'
      );

      return isRunning;
    } catch (error) {
      this.addTestResult('开发服务器检查', false, '无法连接到服务器', error);
      return false;
    }
  }

  /**
   * 检查 Playwright 安装
   */
  checkPlaywrightInstallation() {
    console.log('🔍 检查 Playwright 安装状态...');

    try {
      // 检查 Playwright 包
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const hasPlaywright = packageJson.devDependencies &&
        (packageJson.devDependencies['@playwright/test'] || packageJson.devDependencies['playwright']);

      this.addTestResult(
        'Playwright 包安装检查',
        hasPlaywright,
        hasPlaywright ? 'Playwright 已安装' : 'Playwright 未安装'
      );

      // 检查 Playwright 配置文件
      const hasConfig = fs.existsSync('playwright.config.ts') || fs.existsSync('playwright.config.js');
      this.addTestResult(
        'Playwright 配置文件检查',
        hasConfig,
        hasConfig ? '配置文件存在' : '配置文件不存在'
      );

      // 检查测试目录
      const hasTestDir = fs.existsSync('tests/e2e');
      this.addTestResult(
        'E2E 测试目录检查',
        hasTestDir,
        hasTestDir ? '测试目录存在' : '测试目录不存在'
      );

      return hasPlaywright && hasConfig && hasTestDir;
    } catch (error) {
      this.addTestResult('Playwright 安装检查', false, '检查过程出错', error);
      return false;
    }
  }

  /**
   * 运行基础 Playwright 测试
   */
  async runBasicPlaywrightTests() {
    console.log('🧪 运行基础 Playwright 测试...');

    try {
      const result = execSync('npx playwright test --reporter=json', {
        encoding: 'utf8',
        timeout: 60000,
      });

      const testResults = JSON.parse(result);
      const passed = testResults.stats.failed === 0;

      this.addTestResult(
        'Playwright 基础测试',
        passed,
        `通过: ${testResults.stats.passed}, 失败: ${testResults.stats.failed}`
      );

      return passed;
    } catch (error) {
      this.addTestResult('Playwright 基础测试', false, '测试执行失败', error);
      return false;
    }
  }

  /**
   * 测试 Web Eval Agent 兼容性
   */
  async testWebEvalAgentCompatibility() {
    console.log('🔍 测试 Web Eval Agent 兼容性...');

    try {
      // 检查是否可以访问必要的浏览器 API
      const testScript = `
        const { chromium } = require('${process.cwd()}/node_modules/playwright');

        (async () => {
          const browser = await chromium.launch();
          const context = await browser.newContext();
          const page = await context.newPage();

          // 测试基本功能
          await page.goto('${this.baseUrl}');
          const title = await page.title();

          // 测试网络监控
          const responses = [];
          page.on('response', response => {
            responses.push({
              url: response.url(),
              status: response.status(),
            });
          });

          await page.reload();

          // 测试控制台日志捕获
          const consoleLogs = [];
          page.on('console', msg => {
            consoleLogs.push({
              type: msg.type(),
              text: msg.text(),
            });
          });

          await page.evaluate(() => console.log('Test log'));

          await browser.close();

          console.log(JSON.stringify({
            title,
            responseCount: responses.length,
            consoleLogCount: consoleLogs.length,
          }));
        })();
      `;

      fs.writeFileSync('/tmp/web-eval-test.js', testScript);
      const result = execSync('node /tmp/web-eval-test.js', { encoding: 'utf8' });
      const data = JSON.parse(result.trim());

      const passed = data.title && data.responseCount > 0;
      this.addTestResult(
        'Web Eval Agent 兼容性测试',
        passed,
        `页面标题: ${data.title}, 网络请求: ${data.responseCount}, 控制台日志: ${data.consoleLogCount}`
      );

      // 清理临时文件
      fs.unlinkSync('/tmp/web-eval-test.js');

      return passed;
    } catch (error) {
      this.addTestResult('Web Eval Agent 兼容性测试', false, '兼容性测试失败', error);
      return false;
    }
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 生成测试报告...');

    const reportPath = path.join('reports', 'web-eval-agent-test-report.json');

    // 确保报告目录存在
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }

    // 写入 JSON 报告
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

    // 生成 Markdown 报告
    const markdownReport = this.generateMarkdownReport();
    const markdownPath = path.join('reports', 'web-eval-agent-test-report.md');
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`📄 报告已生成:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${markdownPath}`);
  }

  /**
   * 生成 Markdown 报告
   */
  generateMarkdownReport() {
    const { summary, tests } = this.testResults;
    const successRate = ((summary.passed / summary.total) * 100).toFixed(1);

    let markdown = `# Web Eval Agent 测试报告\n\n`;
    markdown += `**生成时间**: ${this.testResults.timestamp}\n\n`;
    markdown += `## 测试摘要\n\n`;
    markdown += `- **总测试数**: ${summary.total}\n`;
    markdown += `- **通过**: ${summary.passed}\n`;
    markdown += `- **失败**: ${summary.failed}\n`;
    markdown += `- **成功率**: ${successRate}%\n\n`;

    markdown += `## 测试详情\n\n`;

    tests.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      markdown += `### ${index + 1}. ${test.name} ${status}\n\n`;
      markdown += `**详情**: ${test.details}\n\n`;

      if (test.error) {
        markdown += `**错误**: \`${test.error}\`\n\n`;
      }

      markdown += `**时间**: ${test.timestamp}\n\n`;
      markdown += `---\n\n`;
    });

    return markdown;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始 Web Eval Agent 测试...\n');

    // 1. 检查 Playwright 安装
    const playwrightOk = this.checkPlaywrightInstallation();

    if (!playwrightOk) {
      console.log('❌ Playwright 安装检查失败，跳过后续测试');
      this.generateReport();
      return false;
    }

    // 2. 检查开发服务器
    const serverOk = await this.checkDevServer();

    if (!serverOk) {
      console.log('❌ 开发服务器未运行，跳过需要服务器的测试');
    } else {
      // 3. 运行基础测试
      await this.runBasicPlaywrightTests();

      // 4. 测试 Web Eval Agent 兼容性
      await this.testWebEvalAgentCompatibility();
    }

    // 5. 生成报告
    this.generateReport();

    // 6. 输出总结
    const { summary } = this.testResults;
    const successRate = ((summary.passed / summary.total) * 100).toFixed(1);

    console.log(`\n🎯 测试完成!`);
    console.log(`   成功率: ${successRate}% (${summary.passed}/${summary.total})`);

    return summary.failed === 0;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new WebEvalAgentTester();
  tester.runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ 测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = WebEvalAgentTester;
