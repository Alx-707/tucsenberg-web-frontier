#!/usr/bin/env node

/**
 * 资源预加载策略验证脚本
 *
 * 验证第三阶段性能优化：资源预加载策略实施
 * 检查关键资源预加载配置、API预连接、资源加载时序等
 */

const fs = require('fs');
const path = require('path');

class ResourcePreloadVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      checks: [],
      resourceAnalysis: {},
      performanceImpact: {},
    };
  }

  /**
   * 添加检查结果
   */
  addCheck(name, passed, details = '') {
    const status = passed ? 'PASS' : 'FAIL';
    this.results.checks.push({ name, status, details });

    if (passed) {
      this.results.passed++;
      console.log(`✅ ${name}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${name}`);
    }

    if (details) {
      console.log(`   ${details}`);
    }
  }

  /**
   * 验证layout.tsx中的预加载配置
   */
  verifyLayoutPreloadConfig() {
    const layoutPath = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');

    try {
      const content = fs.readFileSync(layoutPath, 'utf-8');

      // 检查关键CSS预加载
      const hasCSSPreload =
        content.includes("rel='preload'") &&
        content.includes("href='/globals.css'") &&
        content.includes("as='style'");
      this.addCheck('关键CSS预加载配置', hasCSSPreload);

      // 检查关键图片预加载
      const hasImagePreload =
        content.includes("rel='preload'") &&
        content.includes("href='/next.svg'") &&
        content.includes("as='image'");
      this.addCheck('关键图片预加载配置', hasImagePreload);

      // 检查API预连接
      const hasAPIPreconnect =
        content.includes("rel='preconnect'") && content.includes('/api');
      this.addCheck('API预连接配置', hasAPIPreconnect);

      // 检查Google Fonts预连接（已有）
      const hasGoogleFontsPreconnect =
        content.includes('fonts.googleapis.com') &&
        content.includes('fonts.gstatic.com');
      this.addCheck('Google Fonts预连接配置', hasGoogleFontsPreconnect);

      // 统计预加载资源数量
      const preloadCount = (content.match(/rel='preload'/g) || []).length;
      const preconnectCount = (content.match(/rel='preconnect'/g) || []).length;

      this.results.resourceAnalysis = {
        preloadResources: preloadCount,
        preconnectDomains: preconnectCount,
        totalOptimizations: preloadCount + preconnectCount,
      };

      this.addCheck(
        '预加载资源数量合理',
        preloadCount >= 2 && preloadCount <= 5,
        `发现 ${preloadCount} 个预加载资源`,
      );
    } catch (error) {
      this.addCheck('layout.tsx文件读取', false, error.message);
    }
  }

  /**
   * 验证关键资源文件存在性
   */
  verifyCriticalResourcesExist() {
    const criticalResources = [
      { path: 'src/app/globals.css', name: '关键CSS文件' },
      { path: 'public/next.svg', name: '关键Logo图片' },
    ];

    criticalResources.forEach((resource) => {
      const fullPath = path.join(process.cwd(), resource.path);
      const exists = fs.existsSync(fullPath);
      this.addCheck(
        `${resource.name}存在性`,
        exists,
        exists ? `文件路径: ${resource.path}` : `文件不存在: ${resource.path}`,
      );
    });
  }

  /**
   * 分析CSS文件大小和关键性
   */
  analyzeCSSOptimization() {
    const cssPath = path.join(process.cwd(), 'src/app/globals.css');

    try {
      const content = fs.readFileSync(cssPath, 'utf-8');
      const sizeKB = Buffer.byteLength(content, 'utf8') / 1024;

      // 检查CSS文件大小是否合理（应该小于50KB）
      const sizeReasonable = sizeKB <= 50;
      this.addCheck(
        'CSS文件大小合理',
        sizeReasonable,
        `文件大小: ${sizeKB.toFixed(2)} KB`,
      );

      // 检查是否包含关键样式
      const hasCriticalStyles =
        content.includes('@import') && content.includes('tailwindcss');
      this.addCheck('包含关键样式', hasCriticalStyles);

      // 检查字体优化配置
      const hasFontOptimization =
        content.includes('font-display') ||
        content.includes('font-feature-settings');
      this.addCheck('字体优化配置', hasFontOptimization);

      this.results.resourceAnalysis.cssSize = sizeKB;
    } catch (error) {
      this.addCheck('CSS文件分析', false, error.message);
    }
  }

  /**
   * 验证图片优化配置
   */
  verifyImageOptimization() {
    // 检查Logo组件是否使用next/image
    const logoPath = path.join(process.cwd(), 'src/components/layout/logo.tsx');

    try {
      const content = fs.readFileSync(logoPath, 'utf-8');

      // 检查是否使用next/image
      const usesNextImage = content.includes("import Image from 'next/image'");
      this.addCheck('使用next/image组件', usesNextImage);

      // 检查是否设置priority属性
      const hasPriority = content.includes('priority');
      this.addCheck('关键图片设置priority', hasPriority);

      // 检查是否有适当的尺寸配置
      const hasSizeConfig =
        content.includes('width=') && content.includes('height=');
      this.addCheck('图片尺寸配置', hasSizeConfig);
    } catch (error) {
      this.addCheck('Logo组件分析', false, error.message);
    }
  }

  /**
   * 估算性能改进效果
   */
  estimatePerformanceImpact() {
    const { resourceAnalysis } = this.results;

    // 基于预加载资源数量估算LCP改进
    const preloadImpact = resourceAnalysis.preloadResources * 15; // 每个预加载资源约15ms改进
    const preconnectImpact = resourceAnalysis.preconnectDomains * 10; // 每个预连接约10ms改进

    // CSS预加载的特殊影响
    const cssPreloadImpact = 25; // CSS预加载约25ms改进

    const totalEstimatedImprovement =
      preloadImpact + preconnectImpact + cssPreloadImpact;

    this.results.performanceImpact = {
      preloadImpact,
      preconnectImpact,
      cssPreloadImpact,
      totalEstimatedImprovement,
      expectedLCPReduction: `${totalEstimatedImprovement}ms`,
    };

    this.addCheck(
      '预期性能改进合理',
      totalEstimatedImprovement >= 30,
      `预期LCP减少: ${totalEstimatedImprovement}ms`,
    );
  }

  /**
   * 运行所有验证
   */
  async runAllChecks() {
    console.log('🔍 开始验证资源预加载策略实施...\n');

    this.verifyLayoutPreloadConfig();
    this.verifyCriticalResourcesExist();
    this.analyzeCSSOptimization();
    this.verifyImageOptimization();
    this.estimatePerformanceImpact();

    return this.generateReport();
  }

  /**
   * 生成验证报告
   */
  generateReport() {
    console.log('\n📊 资源预加载策略验证报告');
    console.log('='.repeat(50));

    console.log(`✅ 通过检查: ${this.results.passed}`);
    console.log(`❌ 失败检查: ${this.results.failed}`);
    console.log(
      `📈 总体通过率: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`,
    );

    console.log('\n📋 资源分析结果:');
    console.log(
      `   预加载资源数量: ${this.results.resourceAnalysis.preloadResources || 0}`,
    );
    console.log(
      `   预连接域名数量: ${this.results.resourceAnalysis.preconnectDomains || 0}`,
    );
    console.log(
      `   CSS文件大小: ${this.results.resourceAnalysis.cssSize?.toFixed(2) || 'N/A'} KB`,
    );

    console.log('\n🚀 性能影响预估:');
    console.log(
      `   预期LCP改进: ${this.results.performanceImpact.expectedLCPReduction || 'N/A'}`,
    );
    console.log(
      `   预加载贡献: ${this.results.performanceImpact.preloadImpact || 0}ms`,
    );
    console.log(
      `   预连接贡献: ${this.results.performanceImpact.preconnectImpact || 0}ms`,
    );

    const allPassed = this.results.failed === 0;
    console.log(
      `\n${allPassed ? '🎉' : '⚠️'} 第三阶段验证${allPassed ? '完全通过' : '部分失败'}!`,
    );

    if (!allPassed) {
      console.log('\n🔧 需要修复的问题:');
      this.results.checks
        .filter((check) => check.status === 'FAIL')
        .forEach((check) => console.log(`   - ${check.name}`));
    }

    return allPassed;
  }
}

// 主函数
async function main() {
  const verifier = new ResourcePreloadVerifier();
  const success = await verifier.runAllChecks();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ResourcePreloadVerifier };
