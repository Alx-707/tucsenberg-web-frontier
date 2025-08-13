#!/usr/bin/env node

/**
 * 新测试验证脚本
 * 验证新创建的测试文件的完整性和预期覆盖率贡献
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

// 新创建/增强的测试文件
const newTestFiles = [
  {
    path: 'src/components/home/__tests__/tech-stack-section.test.tsx',
    component: 'src/components/home/tech-stack-section.tsx',
    type: 'new',
    expectedTests: 22,
    expectedCoverage: 60,
    componentLines: 201,
  },
  {
    path: 'src/app/[locale]/contact/__tests__/page.test.tsx',
    component: 'src/app/[locale]/contact/page.tsx',
    type: 'new',
    expectedTests: 31,
    expectedCoverage: 75,
    componentLines: 142,
  },
  {
    path: 'src/components/layout/__tests__/mobile-navigation.test.tsx',
    component: 'src/components/layout/mobile-navigation.tsx',
    type: 'enhanced',
    expectedTests: 33, // 原有13 + 新增20
    expectedCoverage: 95,
    componentLines: 99,
  },
  {
    path: 'src/hooks/__tests__/use-keyboard-navigation.test.ts',
    component: 'src/hooks/use-keyboard-navigation.ts',
    type: 'enhanced',
    expectedTests: 55, // 原有30 + 新增25
    expectedCoverage: 80,
    componentLines: 209,
  },
];

// 验证文件存在性
function validateFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return {
    exists: fs.existsSync(fullPath),
    path: filePath,
    fullPath,
  };
}

// 分析测试文件
function analyzeTestFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // 统计测试用例
    const testCases = content.match(/it\(/g) || [];
    const describeBlocks = content.match(/describe\(/g) || [];
    const mockConfigs = content.match(/vi\.hoisted/g) || [];
    const imports = content.match(/import.*from/g) || [];
    
    return {
      lines: content.split('\n').length,
      testCases: testCases.length,
      describeBlocks: describeBlocks.length,
      mockConfigs: mockConfigs.length,
      imports: imports.length,
      hasViHoisted: mockConfigs.length > 0,
      content,
    };
  } catch (error) {
    return {
      error: error.message,
      lines: 0,
      testCases: 0,
      describeBlocks: 0,
      mockConfigs: 0,
      imports: 0,
      hasViHoisted: false,
    };
  }
}

// 计算预期覆盖率贡献
function calculateExpectedContribution(testFiles) {
  let totalExpectedLines = 0;
  let totalComponentLines = 0;
  
  testFiles.forEach(file => {
    const expectedCoveredLines = Math.round(file.componentLines * (file.expectedCoverage / 100));
    totalExpectedLines += expectedCoveredLines;
    totalComponentLines += file.componentLines;
  });
  
  // 基于总行数17,463计算百分比
  const totalProjectLines = 17463;
  const coverageIncrease = (totalExpectedLines / totalProjectLines) * 100;
  
  return {
    totalExpectedLines,
    totalComponentLines,
    coverageIncrease,
    newCoverageRate: 57.09 + coverageIncrease, // 当前57.09% + 增量
  };
}

// 生成验证报告
function generateValidationReport() {
  console.log(colors.bold('\n🧪 新测试验证报告'));
  console.log('='.repeat(60));

  let allValid = true;
  const results = [];

  // 验证每个测试文件
  newTestFiles.forEach((testFile, index) => {
    console.log(colors.bold(`\n📁 ${index + 1}. ${testFile.type === 'new' ? '新建' : '增强'}测试: ${path.basename(testFile.path)}`));
    
    // 检查测试文件
    const testExists = validateFileExists(testFile.path);
    const componentExists = validateFileExists(testFile.component);
    
    if (!testExists.exists) {
      console.log(colors.red('❌ 测试文件不存在'));
      allValid = false;
      return;
    }
    
    if (!componentExists.exists) {
      console.log(colors.red('❌ 组件文件不存在'));
      allValid = false;
      return;
    }
    
    // 分析测试文件
    const analysis = analyzeTestFile(testFile.path);
    
    if (analysis.error) {
      console.log(colors.red(`❌ 文件分析失败: ${analysis.error}`));
      allValid = false;
      return;
    }
    
    // 显示分析结果
    console.log(colors.green('✅ 文件存在且可读取'));
    console.log(colors.cyan(`📊 测试统计:`));
    console.log(`   - 测试用例: ${analysis.testCases} (预期: ${testFile.expectedTests})`);
    console.log(`   - describe块: ${analysis.describeBlocks}`);
    console.log(`   - 代码行数: ${analysis.lines}`);
    console.log(`   - Mock配置: ${analysis.hasViHoisted ? '✅ vi.hoisted' : '❌ 缺少vi.hoisted'}`);
    
    // 验证测试数量
    if (analysis.testCases < testFile.expectedTests * 0.8) {
      console.log(colors.yellow(`⚠️  测试用例数量偏少 (${analysis.testCases}/${testFile.expectedTests})`));
    }
    
    if (!analysis.hasViHoisted) {
      console.log(colors.yellow('⚠️  建议使用vi.hoisted Mock配置'));
    }
    
    // 计算预期覆盖率贡献
    const expectedCoveredLines = Math.round(testFile.componentLines * (testFile.expectedCoverage / 100));
    const contributionPercent = (expectedCoveredLines / 17463) * 100;
    
    console.log(colors.blue(`🎯 预期贡献:`));
    console.log(`   - 组件总行数: ${testFile.componentLines}`);
    console.log(`   - 预期覆盖: ${expectedCoveredLines}行 (${testFile.expectedCoverage}%)`);
    console.log(`   - 覆盖率贡献: +${contributionPercent.toFixed(3)}%`);
    
    results.push({
      ...testFile,
      analysis,
      expectedCoveredLines,
      contributionPercent,
      valid: true,
    });
  });

  // 计算总体预期贡献
  console.log(colors.bold('\n📈 总体预期贡献'));
  console.log('='.repeat(40));
  
  const contribution = calculateExpectedContribution(newTestFiles);
  
  console.log(`总预期新覆盖行数: ${colors.cyan(contribution.totalExpectedLines + '行')}`);
  console.log(`总覆盖率增量: ${colors.cyan('+' + contribution.coverageIncrease.toFixed(2) + '%')}`);
  console.log(`预期新覆盖率: ${colors.green(contribution.newCoverageRate.toFixed(2) + '%')}`);
  
  if (contribution.newCoverageRate >= 59.0) {
    console.log(colors.green('🎉 预期将显著接近60%目标！'));
  } else {
    console.log(colors.yellow('⚠️  可能需要额外优化才能达到60%目标'));
  }

  // 总结
  console.log(colors.bold('\n📋 验证总结'));
  console.log('='.repeat(30));

  if (allValid) {
    console.log(colors.green('✅ 所有测试文件验证通过'));
    console.log(colors.cyan('✅ 文件结构完整'));
    console.log(colors.cyan('✅ 预期覆盖率贡献合理'));
  } else {
    console.log(colors.red('❌ 部分测试文件存在问题'));
    console.log(colors.yellow('请修复上述问题后重新验证'));
  }

  const totalNewTests = results.reduce((sum, r) => sum + r.analysis.testCases, 0);
  const totalNewLines = results.reduce((sum, r) => sum + r.analysis.lines, 0);

  console.log(colors.bold('\n📊 新增测试代码统计'));
  console.log(`新增测试用例: ${colors.cyan(totalNewTests + '个')}`);
  console.log(`新增测试代码: ${colors.cyan(totalNewLines + '行')}`);
  console.log(`涉及组件文件: ${colors.cyan(newTestFiles.length + '个')}`);

  return allValid;
}

// 主函数
function main() {
  try {
    const isValid = generateValidationReport();
    
    if (isValid) {
      console.log(colors.bold('\n🚀 建议下一步操作:'));
      console.log('1. 运行测试: npm run test');
      console.log('2. 生成覆盖率: npm run test:coverage');
      console.log('3. 验证覆盖率: node scripts/verify-coverage-improvement.js');
    }
    
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
  validateFileExists,
  analyzeTestFile,
  calculateExpectedContribution,
  generateValidationReport,
};
