#!/usr/bin/env node

/**
 * 字体优化配置验证脚本
 * 验证第一阶段字体加载优化配置是否正确实施
 */

const fs = require('fs');
const path = require('path');

class FontOptimizationVerifier {
  constructor() {
    this.results = {
      passed: true,
      checks: [],
      summary: '',
    };
  }

  /**
   * 验证 layout.tsx 字体配置
   */
  verifyLayoutFontConfig() {
    const layoutPath = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');

    try {
      const content = fs.readFileSync(layoutPath, 'utf-8');

      // 检查 Geist 字体配置
      const hasDisplaySwap = content.includes("display: 'swap'");
      const hasPreload = content.includes('preload: true');
      const hasPreconnect = content.includes("rel='preconnect'");
      const hasFontsGoogleapis = content.includes(
        'https://fonts.googleapis.com',
      );

      this.addCheck('Layout字体配置 - display: swap', hasDisplaySwap);
      this.addCheck('Layout字体配置 - preload: true', hasPreload);
      this.addCheck(
        'Layout字体配置 - Google Fonts预连接',
        hasPreconnect && hasFontsGoogleapis,
      );
    } catch (error) {
      this.addCheck('Layout文件读取', false, error.message);
    }
  }

  /**
   * 验证 globals.css 字体优化
   */
  verifyGlobalsCSSConfig() {
    const cssPath = path.join(process.cwd(), 'src/app/globals.css');

    try {
      const content = fs.readFileSync(cssPath, 'utf-8');

      // 检查中文字体优化
      const hasFontFace = content.includes('@font-face');
      const hasPingFangSC = content.includes('PingFang SC');
      const hasFontDisplaySwap = content.includes('font-display: swap');
      const hasUnicodeRange = content.includes('unicode-range: U+4E00-9FFF');
      const hasFontFeatures = content.includes('font-feature-settings');
      const hasTextRendering = content.includes(
        'text-rendering: optimizeLegibility',
      );

      this.addCheck('CSS字体配置 - @font-face声明', hasFontFace);
      this.addCheck('CSS字体配置 - PingFang SC字体', hasPingFangSC);
      this.addCheck('CSS字体配置 - font-display: swap', hasFontDisplaySwap);
      this.addCheck('CSS字体配置 - 中文字符范围', hasUnicodeRange);
      this.addCheck('CSS字体配置 - 字体特性优化', hasFontFeatures);
      this.addCheck('CSS字体配置 - 文本渲染优化', hasTextRendering);
    } catch (error) {
      this.addCheck('CSS文件读取', false, error.message);
    }
  }

  /**
   * 验证 next.config.ts 配置
   */
  verifyNextConfig() {
    const configPath = path.join(process.cwd(), 'next.config.ts');

    try {
      const content = fs.readFileSync(configPath, 'utf-8');

      // Next.js 15 默认启用字体优化，不需要显式配置
      const hasOptimizePackageImports = content.includes(
        'optimizePackageImports',
      );

      this.addCheck('Next.js配置 - 包导入优化', hasOptimizePackageImports);
    } catch (error) {
      this.addCheck('Next.js配置文件读取', false, error.message);
    }
  }

  /**
   * 添加检查结果
   */
  addCheck(name, passed, error = null) {
    this.results.checks.push({
      name,
      passed,
      error,
    });

    if (!passed) {
      this.results.passed = false;
    }
  }

  /**
   * 生成验证报告
   */
  generateReport() {
    console.log('\n🔍 字体优化配置验证报告\n');
    console.log('='.repeat(50));

    this.results.checks.forEach((check) => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (check.error) {
        console.log(`   错误: ${check.error}`);
      }
    });

    console.log('\n' + '='.repeat(50));

    const passedCount = this.results.checks.filter((c) => c.passed).length;
    const totalCount = this.results.checks.length;

    console.log(`\n📊 验证结果: ${passedCount}/${totalCount} 项检查通过`);

    if (this.results.passed) {
      console.log('🎉 字体优化配置验证通过！');
      console.log('\n✨ 已实施的优化:');
      console.log('   • Geist字体配置了display: swap和preload');
      console.log('   • 添加了Google Fonts预连接');
      console.log('   • 优化了中文字体CSS配置');
      console.log('   • 配置了字体特性和渲染优化');
      console.log('\n🎯 预期效果: LCP减少45-65ms');
    } else {
      console.log('⚠️  字体优化配置存在问题，请检查上述失败项');
    }

    return this.results.passed;
  }

  /**
   * 运行所有验证
   */
  runAllVerifications() {
    console.log('🚀 开始验证字体优化配置...\n');

    this.verifyLayoutFontConfig();
    this.verifyGlobalsCSSConfig();
    this.verifyNextConfig();

    return this.generateReport();
  }
}

// 运行验证
const verifier = new FontOptimizationVerifier();
const success = verifier.runAllVerifications();

process.exit(success ? 0 : 1);
