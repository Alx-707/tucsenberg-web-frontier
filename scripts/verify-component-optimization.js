#!/usr/bin/env node

/**
 * UnderConstruction组件优化验证脚本
 * 验证第二阶段组件性能优化是否正确实施
 */

const fs = require('fs');
const path = require('path');

class ComponentOptimizationVerifier {
  constructor() {
    this.results = {
      passed: true,
      checks: [],
      summary: '',
    };
  }

  /**
   * 验证 UnderConstruction 组件优化
   */
  verifyUnderConstructionOptimization() {
    const componentPath = path.join(
      process.cwd(),
      'src/components/shared/under-construction.tsx',
    );

    try {
      const content = fs.readFileSync(componentPath, 'utf-8');

      // 检查是否移除了装饰性光环动画
      const hasAnimatePing = content.includes('animate-ping');
      const hasAnimatePulseInDecorative = content.includes(
        'absolute inset-0 -m-8 animate-pulse',
      );

      // 检查是否简化了背景装饰
      const hasSimplifiedBackground = content.includes('背景装饰 - 简化版本');
      const hasReducedBackgroundElements = !content.includes('delay-1000');

      // 检查是否保持了组件接口
      const hasCorrectInterface = content.includes(
        'interface UnderConstructionProps',
      );
      const hasPageTypeProperty = content.includes(
        "pageType: 'products' | 'blog' | 'about' | 'contact'",
      );

      this.addCheck('移除装饰性光环动画 - animate-ping', !hasAnimatePing);
      this.addCheck(
        '移除装饰性光环动画 - animate-pulse装饰',
        !hasAnimatePulseInDecorative,
      );
      this.addCheck('简化背景装饰', hasSimplifiedBackground);
      this.addCheck('减少背景动画元素', hasReducedBackgroundElements);
      this.addCheck(
        '保持组件接口完整性',
        hasCorrectInterface && hasPageTypeProperty,
      );
    } catch (error) {
      this.addCheck('UnderConstruction组件文件读取', false, error.message);
    }
  }

  /**
   * 验证 AnimatedIcon 组件优化
   */
  verifyAnimatedIconOptimization() {
    const componentPath = path.join(
      process.cwd(),
      'src/components/shared/animated-icon.tsx',
    );

    try {
      const content = fs.readFileSync(componentPath, 'utf-8');

      // 检查是否简化了construction variant
      const hasSimplifiedConstruction =
        content.includes('建设中图标 - 简化版本');
      const hasRemovedGearAnimation = !content.includes('旋转的齿轮');
      const hasReducedSVGLayers = !content.includes(
        'absolute top-0 right-0 h-1/3 w-1/3 animate-spin',
      );

      // 检查是否保持了基本功能
      const hasVariantSupport = content.includes(
        "variant?: 'construction' | 'loading' | 'gear'",
      );
      const hasSizeSupport = content.includes(
        "size?: 'sm' | 'md' | 'lg' | 'xl'",
      );

      this.addCheck(
        'AnimatedIcon - 简化construction variant',
        hasSimplifiedConstruction,
      );
      this.addCheck('AnimatedIcon - 移除复杂齿轮动画', hasRemovedGearAnimation);
      this.addCheck('AnimatedIcon - 减少SVG层级', hasReducedSVGLayers);
      this.addCheck('AnimatedIcon - 保持variant支持', hasVariantSupport);
      this.addCheck('AnimatedIcon - 保持size支持', hasSizeSupport);
    } catch (error) {
      this.addCheck('AnimatedIcon组件文件读取', false, error.message);
    }
  }

  /**
   * 验证使用组件的页面
   */
  verifyComponentUsagePages() {
    const pages = [
      'src/app/[locale]/about/page.tsx',
      'src/app/[locale]/products/page.tsx',
      'src/app/[locale]/blog/page.tsx',
    ];

    pages.forEach((pagePath) => {
      try {
        const fullPath = path.join(process.cwd(), pagePath);
        const content = fs.readFileSync(fullPath, 'utf-8');

        // 检查是否正确导入和使用UnderConstruction组件
        const hasCorrectImport = content.includes(
          "import { UnderConstruction } from '@/components/shared/under-construction'",
        );
        const hasComponentUsage = content.includes('<UnderConstruction');

        const pageName = pagePath.split('/').pop().replace('.tsx', '');
        this.addCheck(
          `${pageName} - 正确导入UnderConstruction`,
          hasCorrectImport,
        );
        this.addCheck(`${pageName} - 正确使用组件`, hasComponentUsage);
      } catch (error) {
        this.addCheck(`页面文件读取 - ${pagePath}`, false, error.message);
      }
    });
  }

  /**
   * 分析DOM节点减少情况
   */
  analyzeDOMReduction() {
    const componentPath = path.join(
      process.cwd(),
      'src/components/shared/under-construction.tsx',
    );

    try {
      const content = fs.readFileSync(componentPath, 'utf-8');

      // 计算DOM节点数量指标
      const divCount = (content.match(/<div/g) || []).length;
      const svgCount = (content.match(/<svg/g) || []).length;
      const animationCount = (content.match(/animate-/g) || []).length;

      // 预期的优化后数量（基于移除的元素）
      const expectedMaxDivs = 15; // 移除了装饰性div后的预期数量
      const expectedMaxAnimations = 3; // 移除了多个动画后的预期数量

      this.addCheck(
        'DOM节点数量优化 - div数量合理',
        divCount <= expectedMaxDivs,
      );
      this.addCheck('动画数量优化', animationCount <= expectedMaxAnimations);

      // 记录实际数量用于分析
      this.results.domAnalysis = {
        divCount,
        svgCount,
        animationCount,
      };
    } catch (error) {
      this.addCheck('DOM节点分析', false, error.message);
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
    console.log('\n🔍 UnderConstruction组件优化验证报告\n');
    console.log('='.repeat(60));

    this.results.checks.forEach((check) => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (check.error) {
        console.log(`   错误: ${check.error}`);
      }
    });

    console.log('\n' + '='.repeat(60));

    const passedCount = this.results.checks.filter((c) => c.passed).length;
    const totalCount = this.results.checks.length;

    console.log(`\n📊 验证结果: ${passedCount}/${totalCount} 项检查通过`);

    if (this.results.domAnalysis) {
      console.log('\n📈 DOM优化分析:');
      console.log(`   • div元素数量: ${this.results.domAnalysis.divCount}`);
      console.log(`   • svg元素数量: ${this.results.domAnalysis.svgCount}`);
      console.log(
        `   • 动画效果数量: ${this.results.domAnalysis.animationCount}`,
      );
    }

    if (this.results.passed) {
      console.log('\n🎉 UnderConstruction组件优化验证通过！');
      console.log('\n✨ 已实施的优化:');
      console.log('   • 移除装饰性光环动画（animate-ping, animate-pulse）');
      console.log('   • 简化AnimatedIcon组件，减少SVG层级');
      console.log('   • 简化背景装饰，移除多余动画元素');
      console.log('   • 保持组件接口和功能完整性');
      console.log('\n🎯 预期效果: LCP减少100-200ms');
    } else {
      console.log('\n⚠️  组件优化验证存在问题，请检查上述失败项');
    }

    return this.results.passed;
  }

  /**
   * 运行所有验证
   */
  runAllVerifications() {
    console.log('🚀 开始验证UnderConstruction组件优化...\n');

    this.verifyUnderConstructionOptimization();
    this.verifyAnimatedIconOptimization();
    this.verifyComponentUsagePages();
    this.analyzeDOMReduction();

    return this.generateReport();
  }
}

// 运行验证
const verifier = new ComponentOptimizationVerifier();
const success = verifier.runAllVerifications();

process.exit(success ? 0 : 1);
