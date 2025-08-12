#!/usr/bin/env node

/**
 * Web Eval Agent 集成验证脚本
 * 快速验证所有配置是否正确
 */

const fs = require('fs');
const path = require('path');

class IntegrationVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: [],
    };
  }

  /**
   * 记录检查结果
   */
  check(name, condition, details = '', isWarning = false) {
    const status = condition ? '✅' : (isWarning ? '⚠️' : '❌');
    const result = {
      name,
      passed: condition,
      isWarning,
      details,
      status,
    };

    this.results.details.push(result);
    
    if (condition) {
      this.results.passed++;
    } else if (isWarning) {
      this.results.warnings++;
    } else {
      this.results.failed++;
    }

    console.log(`${status} ${name}: ${details}`);
    return condition;
  }

  /**
   * 检查文件存在性
   */
  checkFileExists(filePath, description) {
    const exists = fs.existsSync(filePath);
    return this.check(
      `文件检查: ${description}`,
      exists,
      exists ? `${filePath} 存在` : `${filePath} 不存在`
    );
  }

  /**
   * 检查 package.json 依赖
   */
  checkDependencies() {
    console.log('\n📦 检查依赖安装...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const devDeps = packageJson.devDependencies || {};
    
    this.check(
      'Playwright 测试框架',
      devDeps['@playwright/test'] && devDeps['playwright'],
      devDeps['@playwright/test'] ? `版本: ${devDeps['@playwright/test']}` : '未安装'
    );
    
    this.check(
      'dotenv 配置工具',
      devDeps['dotenv'],
      devDeps['dotenv'] ? `版本: ${devDeps['dotenv']}` : '未安装'
    );
    
    this.check(
      'concurrently 并发工具',
      devDeps['concurrently'],
      devDeps['concurrently'] ? `版本: ${devDeps['concurrently']}` : '未安装'
    );

    // 检查脚本配置
    const scripts = packageJson.scripts || {};
    const expectedScripts = [
      'test:e2e',
      'test:e2e:safe',
      'test:web-eval-agent',
      'test:server:start',
      'playwright:install',
    ];

    expectedScripts.forEach(script => {
      this.check(
        `脚本配置: ${script}`,
        scripts[script],
        scripts[script] ? `已配置: ${scripts[script]}` : '未配置'
      );
    });
  }

  /**
   * 检查配置文件
   */
  checkConfigFiles() {
    console.log('\n⚙️  检查配置文件...');
    
    this.checkFileExists('playwright.config.ts', 'Playwright 主配置');
    this.checkFileExists('.env.test', '测试环境配置');
    this.checkFileExists('tests/e2e/test-environment-setup.ts', '测试环境设置');
    this.checkFileExists('tests/e2e/global-setup.ts', '全局测试设置');
    this.checkFileExists('tests/e2e/global-teardown.ts', '全局测试清理');
  }

  /**
   * 检查测试文件
   */
  checkTestFiles() {
    console.log('\n🧪 检查测试文件...');
    
    const testFiles = [
      'tests/e2e/safe-navigation.spec.ts',
      'tests/e2e/web-eval-basic.spec.ts',
      'tests/e2e/web-eval-integration.spec.ts',
      'tests/e2e/basic-navigation.spec.ts',
      'tests/e2e/performance.spec.ts',
    ];

    testFiles.forEach(file => {
      this.checkFileExists(file, path.basename(file));
    });
  }

  /**
   * 检查环境变量配置
   */
  checkEnvironmentConfig() {
    console.log('\n🌍 检查环境变量配置...');
    
    // 检查 .env.test 文件内容
    if (fs.existsSync('.env.test')) {
      const envTestContent = fs.readFileSync('.env.test', 'utf8');
      
      this.check(
        'React Scan 禁用配置',
        envTestContent.includes('NEXT_PUBLIC_DISABLE_REACT_SCAN=true'),
        '测试环境中 React Scan 被正确禁用'
      );
      
      this.check(
        '测试模式配置',
        envTestContent.includes('NEXT_PUBLIC_TEST_MODE=true'),
        '测试模式已启用'
      );
      
      this.check(
        'Playwright 配置',
        envTestContent.includes('PLAYWRIGHT_TEST=true'),
        'Playwright 测试标识已设置'
      );
    }

    // 检查 .env.example 更新
    if (fs.existsSync('.env.example')) {
      const envExampleContent = fs.readFileSync('.env.example', 'utf8');
      
      this.check(
        '.env.example 更新',
        envExampleContent.includes('WEB_EVAL_AGENT_API_KEY'),
        'Web Eval Agent 配置已添加到示例文件',
        true // 这是一个警告级别的检查
      );
    }
  }

  /**
   * 检查文档
   */
  checkDocumentation() {
    console.log('\n📚 检查文档...');
    
    const docFiles = [
      'docs/web-eval-agent-mcp-setup.md',
      'docs/web-eval-agent-integration-summary.md',
      'docs/performance-tools-coordination.md',
      'docs/react-scan-interference-analysis.md',
    ];

    docFiles.forEach(file => {
      this.checkFileExists(file, path.basename(file));
    });
  }

  /**
   * 检查 React Scan 配置
   */
  checkReactScanConfig() {
    console.log('\n🔍 检查 React Scan 配置...');
    
    const reactScanProviderPath = 'src/components/dev-tools/react-scan-provider.tsx';
    
    if (fs.existsSync(reactScanProviderPath)) {
      const content = fs.readFileSync(reactScanProviderPath, 'utf8');
      
      this.check(
        'React Scan 禁用机制',
        content.includes('NEXT_PUBLIC_DISABLE_REACT_SCAN'),
        'React Scan Provider 包含禁用检查'
      );
      
      this.check(
        'React Scan 环境检查',
        content.includes('NODE_ENV') && content.includes('production'),
        'React Scan 包含环境检查逻辑'
      );
    } else {
      this.check(
        'React Scan Provider',
        false,
        `${reactScanProviderPath} 不存在`
      );
    }
  }

  /**
   * 生成验证报告
   */
  generateReport() {
    console.log('\n📊 生成验证报告...');
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: `${successRate}%`,
      },
      details: this.results.details,
      status: this.results.failed === 0 ? 'SUCCESS' : 'NEEDS_ATTENTION',
    };

    // 保存 JSON 报告
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(
      'reports/web-eval-integration-verification.json',
      JSON.stringify(report, null, 2)
    );

    // 输出总结
    console.log('\n🎯 验证总结:');
    console.log(`   总检查项: ${total}`);
    console.log(`   通过: ${this.results.passed}`);
    console.log(`   失败: ${this.results.failed}`);
    console.log(`   警告: ${this.results.warnings}`);
    console.log(`   成功率: ${successRate}%`);
    console.log(`   状态: ${report.status}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ 需要注意的问题:');
      this.results.details
        .filter(d => !d.passed && !d.isWarning)
        .forEach(d => console.log(`   • ${d.name}: ${d.details}`));
    }
    
    if (this.results.warnings > 0) {
      console.log('\n⚠️  警告信息:');
      this.results.details
        .filter(d => d.isWarning)
        .forEach(d => console.log(`   • ${d.name}: ${d.details}`));
    }

    console.log(`\n📄 详细报告: reports/web-eval-integration-verification.json`);
    
    return report.status === 'SUCCESS';
  }

  /**
   * 运行完整验证
   */
  async runFullVerification() {
    console.log('🚀 开始 Web Eval Agent 集成验证...\n');
    
    this.checkDependencies();
    this.checkConfigFiles();
    this.checkTestFiles();
    this.checkEnvironmentConfig();
    this.checkDocumentation();
    this.checkReactScanConfig();
    
    const success = this.generateReport();
    
    if (success) {
      console.log('\n🎉 Web Eval Agent 集成验证通过！');
      console.log('   所有必要的配置和文件都已正确设置');
      console.log('   可以开始使用 Web Eval Agent 进行自动化测试');
    } else {
      console.log('\n⚠️  集成验证发现问题，请检查上述失败项');
    }
    
    return success;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const verifier = new IntegrationVerifier();
  verifier.runFullVerification()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ 验证过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = IntegrationVerifier;
