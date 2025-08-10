#!/usr/bin/env node

/**
 * SEO修复验证脚本
 * 验证next-intl SEO增强配置的修复效果
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 next-intl SEO 修复效果...\n');

// 验证项目列表
const verifications = [
  {
    name: '✅ XSS安全漏洞修复',
    check: () => {
      const structuredDataPath = path.join(
        process.cwd(),
        'src/lib/structured-data.ts',
      );
      const content = fs.readFileSync(structuredDataPath, 'utf8');

      // 检查是否移除了eslint-disable
      const hasEslintDisable = content.includes(
        '/* eslint-disable @typescript-eslint/no-explicit-any */',
      );

      // 检查是否移除了...data扩展运算符（排除注释）
      const lines = content.split('\n');
      const hasSpreadOperator = lines.some(
        (line) =>
          line.includes('...data') &&
          !line.trim().startsWith('//') &&
          !line.includes('移除'),
      );

      // 检查是否定义了严格接口
      const hasStrictInterfaces =
        content.includes('interface OrganizationData') &&
        content.includes('interface ArticleData') &&
        content.includes('interface ProductData');

      return {
        passed: !hasEslintDisable && !hasSpreadOperator && hasStrictInterfaces,
        details: [
          `ESLint disable 移除: ${!hasEslintDisable ? '✅' : '❌'}`,
          `扩展运算符移除: ${!hasSpreadOperator ? '✅' : '❌'}`,
          `严格接口定义: ${hasStrictInterfaces ? '✅' : '❌'}`,
        ],
      };
    },
  },

  {
    name: '✅ URL生成逻辑修复',
    check: () => {
      const seoMetadataPath = path.join(
        process.cwd(),
        'src/lib/seo-metadata.ts',
      );
      const content = fs.readFileSync(seoMetadataPath, 'utf8');

      // 检查是否有本地化路径处理
      const hasLocalizedPath = content.includes('getLocalizedPath');

      // 检查是否处理中文路径
      const hasChinesePaths =
        content.includes('guanyu') && content.includes('lianxi');

      return {
        passed: hasLocalizedPath && hasChinesePaths,
        details: [
          `本地化路径函数: ${hasLocalizedPath ? '✅' : '❌'}`,
          `中文路径支持: ${hasChinesePaths ? '✅' : '❌'}`,
        ],
      };
    },
  },

  {
    name: '✅ Sitemap配置修复',
    check: () => {
      const sitemapConfigPath = path.join(
        process.cwd(),
        'next-sitemap.config.js',
      );
      const content = fs.readFileSync(sitemapConfigPath, 'utf8');

      // 检查是否有additionalPaths配置
      const hasAdditionalPaths = content.includes('additionalPaths');

      // 检查是否有本地化路径配置
      const hasLocalizedConfig =
        content.includes('guanyu') && content.includes('lianxi');

      return {
        passed: hasAdditionalPaths && hasLocalizedConfig,
        details: [
          `额外路径配置: ${hasAdditionalPaths ? '✅' : '❌'}`,
          `本地化路径配置: ${hasLocalizedConfig ? '✅' : '❌'}`,
        ],
      };
    },
  },

  {
    name: '✅ 路径映射完整性',
    check: () => {
      const routingPath = path.join(process.cwd(), 'src/i18n/routing.ts');
      const content = fs.readFileSync(routingPath, 'utf8');

      // 检查是否有扩展的路径配置
      const hasExtendedPaths =
        content.includes('blog') &&
        content.includes('products') &&
        content.includes('services');

      return {
        passed: hasExtendedPaths,
        details: [`扩展路径配置: ${hasExtendedPaths ? '✅' : '❌'}`],
      };
    },
  },

  {
    name: '✅ 构建成功验证',
    check: () => {
      // 检查是否存在构建输出
      const buildPath = path.join(process.cwd(), '.next');
      const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');

      const buildExists = fs.existsSync(buildPath);
      const sitemapExists = fs.existsSync(sitemapPath);

      return {
        passed: buildExists && sitemapExists,
        details: [
          `构建输出存在: ${buildExists ? '✅' : '❌'}`,
          `Sitemap生成: ${sitemapExists ? '✅' : '❌'}`,
        ],
      };
    },
  },
];

// 执行验证
let allPassed = true;
verifications.forEach((verification, index) => {
  console.log(`${index + 1}. ${verification.name}`);

  try {
    const result = verification.check();

    if (result.passed) {
      console.log('   状态: ✅ 通过');
    } else {
      console.log('   状态: ❌ 失败');
      allPassed = false;
    }

    if (result.details) {
      result.details.forEach((detail) => {
        console.log(`   ${detail}`);
      });
    }
  } catch (error) {
    console.log(`   状态: ❌ 错误 - ${error.message}`);
    allPassed = false;
  }

  console.log('');
});

// 总结
console.log('📊 验证总结');
console.log('='.repeat(50));
if (allPassed) {
  console.log('🎉 所有验证项目都已通过！');
  console.log('✅ next-intl SEO增强配置修复成功');
  console.log('');
  console.log('🚀 建议下一步操作：');
  console.log('1. 部署到测试环境进行完整验证');
  console.log('2. 实施长期优化措施（缓存、统一配置等）');
  console.log('3. 添加SEO监控和性能追踪');
} else {
  console.log('⚠️  部分验证项目未通过，请检查上述失败项目');
  process.exit(1);
}
