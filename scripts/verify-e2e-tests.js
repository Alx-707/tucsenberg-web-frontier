#!/usr/bin/env node

/**
 * E2E测试验证脚本
 * 
 * 验证新创建的Playwright端到端测试文件是否正确配置
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 验证Playwright端到端测试配置...\n');

// 检查必需的测试文件
const requiredTestFiles = [
  'tests/e2e/homepage.spec.ts',
  'tests/e2e/navigation.spec.ts', 
  'tests/e2e/i18n.spec.ts'
];

let allFilesExist = true;

console.log('📁 检查测试文件是否存在:');
requiredTestFiles.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${filePath}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ 部分测试文件缺失，请检查文件创建是否成功');
  process.exit(1);
}

// 检查playwright配置
console.log('\n⚙️  检查Playwright配置:');
const playwrightConfigExists = fs.existsSync('playwright.config.ts');
console.log(`   ${playwrightConfigExists ? '✅' : '❌'} playwright.config.ts`);

if (!playwrightConfigExists) {
  console.log('\n❌ Playwright配置文件缺失');
  process.exit(1);
}

// 检查package.json中的脚本
console.log('\n📦 检查package.json脚本:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'test:e2e',
  'test:e2e:ui', 
  'test:e2e:debug',
  'test:e2e:headed',
  'test:e2e:report'
];

requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`   ${exists ? '✅' : '❌'} ${script}`);
});

// 检查依赖
console.log('\n📚 检查关键依赖:');
const requiredDeps = [
  '@playwright/test',
  'axe-playwright'
];

requiredDeps.forEach(dep => {
  const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
  console.log(`   ${exists ? '✅' : '❌'} ${dep}`);
});

// 验证测试文件内容
console.log('\n🔍 验证测试文件内容:');

requiredTestFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查基本结构
    const hasImports = content.includes("import { test, expect") && content.includes("@playwright/test");
    const hasDescribe = content.includes("test.describe");
    const hasTests = content.includes("test(");
    const hasAxe = content.includes("axe-playwright") || content.includes("injectAxe");
    
    console.log(`   📄 ${path.basename(filePath)}:`);
    console.log(`      ${hasImports ? '✅' : '❌'} Playwright导入`);
    console.log(`      ${hasDescribe ? '✅' : '❌'} 测试套件结构`);
    console.log(`      ${hasTests ? '✅' : '❌'} 测试用例`);
    console.log(`      ${hasAxe ? '✅' : '❌'} 无障碍测试集成`);
    
  } catch (error) {
    console.log(`   ❌ 无法读取 ${filePath}: ${error.message}`);
  }
});

// 检查测试环境设置
console.log('\n🛠️  检查测试环境设置:');
const testEnvFiles = [
  'tests/e2e/test-environment-setup.ts',
  'tests/e2e/global-setup.ts',
  'tests/e2e/global-teardown.ts'
];

testEnvFiles.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${filePath}`);
});

console.log('\n📊 测试覆盖范围验证:');

// 验证homepage.spec.ts覆盖范围
const homepageContent = fs.readFileSync('tests/e2e/homepage.spec.ts', 'utf8');
const homepageFeatures = [
  { name: '页面加载测试', pattern: /load.*homepage|homepage.*load/i },
  { name: '响应式设计测试', pattern: /responsive|viewport|mobile|desktop/i },
  { name: '性能测试', pattern: /performance|vitals|load.*time/i },
  { name: '无障碍测试', pattern: /accessibility|a11y|axe/i }
];

console.log('   📄 homepage.spec.ts:');
homepageFeatures.forEach(feature => {
  const covered = feature.pattern.test(homepageContent);
  console.log(`      ${covered ? '✅' : '❌'} ${feature.name}`);
});

// 验证navigation.spec.ts覆盖范围  
const navigationContent = fs.readFileSync('tests/e2e/navigation.spec.ts', 'utf8');
const navigationFeatures = [
  { name: '桌面导航测试', pattern: /desktop.*nav|main.*nav/i },
  { name: '移动导航测试', pattern: /mobile.*nav|hamburger|menu.*button/i },
  { name: '路由处理测试', pattern: /route|navigation|redirect/i },
  { name: '键盘导航测试', pattern: /keyboard|tab|focus/i }
];

console.log('   📄 navigation.spec.ts:');
navigationFeatures.forEach(feature => {
  const covered = feature.pattern.test(navigationContent);
  console.log(`      ${covered ? '✅' : '❌'} ${feature.name}`);
});

// 验证i18n.spec.ts覆盖范围
const i18nContent = fs.readFileSync('tests/e2e/i18n.spec.ts', 'utf8');
const i18nFeatures = [
  { name: '语言切换测试', pattern: /language.*switch|switch.*language/i },
  { name: '翻译内容验证', pattern: /translation|content.*validation/i },
  { name: '主题本地化测试', pattern: /theme.*local|local.*theme/i },
  { name: 'URL国际化测试', pattern: /url.*locale|locale.*url/i }
];

console.log('   📄 i18n.spec.ts:');
i18nFeatures.forEach(feature => {
  const covered = feature.pattern.test(i18nContent);
  console.log(`      ${covered ? '✅' : '❌'} ${feature.name}`);
});

console.log('\n🎯 任务完成度验证:');

// 检查任务要求的文件是否都已创建
const taskRequiredFiles = [
  'playwright.config.ts',
  'tests/e2e',
  'tests/e2e/homepage.spec.ts', 
  'tests/e2e/navigation.spec.ts',
  'tests/e2e/i18n.spec.ts'
];

let taskCompletionScore = 0;
const totalRequirements = taskRequiredFiles.length;

taskRequiredFiles.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  if (exists) taskCompletionScore++;
  console.log(`   ${exists ? '✅' : '❌'} ${filePath}`);
});

const completionPercentage = Math.round((taskCompletionScore / totalRequirements) * 100);
console.log(`\n📈 任务完成度: ${taskCompletionScore}/${totalRequirements} (${completionPercentage}%)`);

if (completionPercentage === 100) {
  console.log('\n🎉 Playwright端到端测试配置验证通过！');
  console.log('\n📋 后续步骤:');
  console.log('   1. 启动开发服务器: pnpm dev');
  console.log('   2. 运行测试: pnpm test:e2e');
  console.log('   3. 查看测试报告: pnpm test:e2e:report');
  console.log('   4. 调试测试: pnpm test:e2e:debug');
  
  process.exit(0);
} else {
  console.log('\n⚠️  测试配置不完整，请检查缺失的文件和配置');
  process.exit(1);
}
