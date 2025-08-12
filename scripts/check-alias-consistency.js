#!/usr/bin/env node

/**
 * 路径别名一致性检查脚本
 * 验证 tsconfig.json、next.config.ts 和 ESLint 配置中的路径别名一致性
 * 确保 @/ 别名在所有配置文件中都正确指向 ./src/*
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始路径别名一致性检查...\n');

/**
 * 检查路径别名一致性
 */
function checkAliasConsistency() {
  let hasErrors = false;

  try {
    // 1. 检查 tsconfig.json
    console.log('📋 检查 tsconfig.json...');
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');

    if (!fs.existsSync(tsconfigPath)) {
      console.error('❌ tsconfig.json 文件不存在');
      hasErrors = true;
    } else {
      let tsconfigAlias;
      try {
        const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');

        // More robust comment and trailing comma removal
        let cleanContent = tsconfigContent
          // Remove single-line comments (but not URLs)
          .replace(/(?<!:)\/\/.*$/gm, '')
          // Remove multi-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // Remove trailing commas before closing brackets/braces
          .replace(/,(\s*[}\]])/g, '$1')
          // Clean up extra whitespace
          .replace(/\s+/g, ' ')
          .trim();

        const tsconfig = JSON.parse(cleanContent);
        tsconfigAlias = tsconfig.compilerOptions?.paths?.['@/*'];
      } catch (parseError) {
        // If JSON parsing fails, try to extract the alias info manually
        console.warn('⚠️  JSON 解析失败，尝试手动提取别名信息...');
        const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
        const aliasMatch = tsconfigContent.match(
          /"@\/\*":\s*\[\s*"([^"]+)"\s*\]/,
        );
        if (aliasMatch) {
          tsconfigAlias = [aliasMatch[1]];
          console.log('✅ 手动提取到别名配置');
        } else {
          console.error('❌ 无法提取别名配置');
          hasErrors = true;
          return;
        }
      }

      if (!tsconfigAlias || tsconfigAlias[0] !== './src/*') {
        console.error('❌ tsconfig.json: @/ 别名必须解析到 ./src/*');
        console.error(
          `   当前配置: ${tsconfigAlias ? tsconfigAlias[0] : '未配置'}`,
        );
        hasErrors = true;
      } else {
        console.log('✅ tsconfig.json: @/ 别名配置正确');
      }
    }

    // 2. 检查 next.config.ts
    console.log('📋 检查 next.config.ts...');
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts');

    if (!fs.existsSync(nextConfigPath)) {
      console.error('❌ next.config.ts 文件不存在');
      hasErrors = true;
    } else {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

      // 检查是否包含正确的别名配置
      const hasCorrectAlias =
        nextConfig.includes("'@': path.resolve(__dirname, 'src')") ||
        nextConfig.includes('"@": path.resolve(__dirname, "src")') ||
        nextConfig.includes("'@': path.join(__dirname, 'src')") ||
        nextConfig.includes('"@": path.join(__dirname, "src")');

      if (!hasCorrectAlias) {
        console.error('❌ next.config.ts: @/ 别名必须解析到 src 目录');
        console.error('   期望配置: "@": path.resolve(__dirname, "src")');
        hasErrors = true;
      } else {
        console.log('✅ next.config.ts: @/ 别名配置正确');
      }
    }

    // 3. 检查 ESLint 配置
    console.log('📋 检查 ESLint 配置...');
    const eslintConfigPath = path.join(process.cwd(), 'eslint.config.mjs');

    if (!fs.existsSync(eslintConfigPath)) {
      console.warn('⚠️  eslint.config.mjs 文件不存在，跳过 ESLint 别名检查');
    } else {
      const eslintConfig = fs.readFileSync(eslintConfigPath, 'utf8');

      // 检查是否包含 import resolver 配置
      const hasImportResolver =
        eslintConfig.includes('eslint-import-resolver-typescript') ||
        eslintConfig.includes('import/resolver') ||
        eslintConfig.includes('@typescript-eslint');

      if (hasImportResolver) {
        console.log('✅ ESLint: 检测到 import resolver 配置');
      } else {
        console.warn(
          '⚠️  ESLint: 未检测到 import resolver 配置，可能影响别名解析',
        );
      }
    }

    // 4. 验证实际文件结构
    console.log('📋 验证文件结构...');
    const srcPath = path.join(process.cwd(), 'src');

    if (!fs.existsSync(srcPath)) {
      console.error('❌ src/ 目录不存在');
      hasErrors = true;
    } else {
      console.log('✅ src/ 目录存在');
    }

    // 5. 总结结果
    console.log('\n' + '='.repeat(50));
    if (hasErrors) {
      console.error('❌ 路径别名一致性检查失败');
      console.error('\n修复建议:');
      console.error('1. 确保 tsconfig.json 中 @/* 映射到 ./src/*');
      console.error('2. 确保 next.config.ts 中 @ 映射到 src 目录');
      console.error('3. 确保 src/ 目录存在');
      process.exit(1);
    } else {
      console.log('✅ 路径别名一致性检查通过');
      console.log('🎉 所有配置文件中的 @/ 别名都正确指向 src/ 目录');
    }
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 执行检查
checkAliasConsistency();
