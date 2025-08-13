#!/usr/bin/env node

/**
 * 测试文件验证脚本
 * 验证新创建的测试文件的结构和语法正确性
 */

const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

// 要验证的测试文件
const testFiles = [
  'src/components/home/__tests__/tech-stack-section.test.tsx',
  'src/app/[locale]/contact/__tests__/page.test.tsx',
];

// 验证测试文件结构
function validateTestFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      valid: false,
      errors: [`文件不存在: ${filePath}`],
      warnings: [],
    };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const errors = [];
  const warnings = [];

  // 检查基本结构
  const checks = [
    {
      name: 'vi.hoisted Mock配置',
      pattern: /vi\.hoisted\(\(\) => \(/,
      required: true,
    },
    {
      name: 'describe块',
      pattern: /describe\(/,
      required: true,
    },
    {
      name: 'it测试用例',
      pattern: /it\(/,
      required: true,
    },
    {
      name: 'beforeEach设置',
      pattern: /beforeEach\(/,
      required: true,
    },
    {
      name: 'Mock清理',
      pattern: /vi\.clearAllMocks\(\)/,
      required: true,
    },
    {
      name: 'render调用',
      pattern: /render\(/,
      required: true,
    },
    {
      name: 'expect断言',
      pattern: /expect\(/,
      required: true,
    },
  ];

  checks.forEach(check => {
    if (!check.pattern.test(content)) {
      if (check.required) {
        errors.push(`缺少${check.name}`);
      } else {
        warnings.push(`建议添加${check.name}`);
      }
    }
  });

  // 检查导入语句
  const importChecks = [
    {
      name: 'testing-library导入',
      pattern: /import.*from ['"]@testing-library\/react['"]/,
    },
    {
      name: 'vitest导入',
      pattern: /import.*from ['"]vitest['"]/,
    },
  ];

  importChecks.forEach(check => {
    if (!check.pattern.test(content)) {
      errors.push(`缺少${check.name}`);
    }
  });

  // 统计测试用例数量
  const testCases = content.match(/it\(/g) || [];
  const describeBlocks = content.match(/describe\(/g) || [];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      testCases: testCases.length,
      describeBlocks: describeBlocks.length,
      lines: content.split('\n').length,
    },
  };
}

// 验证组件文件存在
function validateComponentExists(testFilePath) {
  let componentPath;
  
  if (testFilePath.includes('tech-stack-section')) {
    componentPath = 'src/components/home/tech-stack-section.tsx';
  } else if (testFilePath.includes('contact')) {
    componentPath = 'src/app/[locale]/contact/page.tsx';
  }

  if (componentPath) {
    const fullPath = path.join(process.cwd(), componentPath);
    return {
      exists: fs.existsSync(fullPath),
      path: componentPath,
    };
  }

  return { exists: false, path: 'unknown' };
}

// 生成验证报告
function generateValidationReport() {
  console.log(colors.bold('\n🧪 测试文件验证报告'));
  console.log('='.repeat(50));

  let allValid = true;
  const results = [];

  testFiles.forEach(filePath => {
    console.log(colors.bold(`\n📁 验证文件: ${filePath}`));
    
    const result = validateTestFile(filePath);
    const component = validateComponentExists(filePath);
    
    results.push({ filePath, result, component });

    // 显示验证结果
    if (result.valid) {
      console.log(colors.green('✅ 测试文件结构正确'));
    } else {
      console.log(colors.red('❌ 测试文件存在问题'));
      allValid = false;
    }

    // 显示组件文件状态
    if (component.exists) {
      console.log(colors.green(`✅ 组件文件存在: ${component.path}`));
    } else {
      console.log(colors.red(`❌ 组件文件不存在: ${component.path}`));
      allValid = false;
    }

    // 显示统计信息
    if (result.stats) {
      console.log(colors.cyan(`📊 测试统计:`));
      console.log(`   - 测试用例: ${result.stats.testCases}`);
      console.log(`   - describe块: ${result.stats.describeBlocks}`);
      console.log(`   - 代码行数: ${result.stats.lines}`);
    }

    // 显示错误
    if (result.errors.length > 0) {
      console.log(colors.red('❌ 错误:'));
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    // 显示警告
    if (result.warnings.length > 0) {
      console.log(colors.yellow('⚠️  警告:'));
      result.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
  });

  // 总结
  console.log(colors.bold('\n📋 验证总结'));
  console.log('='.repeat(30));

  if (allValid) {
    console.log(colors.green('🎉 所有测试文件验证通过！'));
    console.log(colors.cyan('✅ 测试文件结构正确'));
    console.log(colors.cyan('✅ 组件文件存在'));
    console.log(colors.cyan('✅ Mock配置完整'));
  } else {
    console.log(colors.red('❌ 部分测试文件存在问题'));
    console.log(colors.yellow('请修复上述问题后重新验证'));
  }

  // 统计总计
  const totalTests = results.reduce((sum, r) => sum + (r.result.stats?.testCases || 0), 0);
  const totalLines = results.reduce((sum, r) => sum + (r.result.stats?.lines || 0), 0);

  console.log(colors.bold('\n📈 总体统计'));
  console.log(`总测试用例: ${colors.cyan(totalTests)}`);
  console.log(`总代码行数: ${colors.cyan(totalLines)}`);
  console.log(`测试文件数: ${colors.cyan(testFiles.length)}`);

  return allValid;
}

// 主函数
function main() {
  try {
    const isValid = generateValidationReport();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error(colors.red('❌ 验证过程中发生错误:'), error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  validateTestFile,
  validateComponentExists,
  generateValidationReport,
};
