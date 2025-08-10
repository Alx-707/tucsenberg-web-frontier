#!/usr/bin/env node

/**
 * 国际化系统测试脚本
 * 验证next-intl配置和功能完整性
 */

const fs = require('fs');
const path = require('path');

console.log('🌍 开始国际化系统测试...\n');

let testsPassed = 0;
let testsTotal = 0;
let errors = [];

function test(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    errors.push({ test: name, error: error.message });
  }
}

// 测试1: 验证配置文件存在
test('验证国际化配置文件存在', () => {
  const requiredFiles = [
    'src/i18n/routing.ts',
    'src/i18n/request.ts',
    'middleware.ts',
    'messages/en.json',
    'messages/zh.json',
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`缺少配置文件: ${file}`);
    }
  }
});

// 测试2: 验证翻译文件结构一致性
test('验证翻译文件结构一致性', () => {
  const enMessages = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
  const zhMessages = JSON.parse(fs.readFileSync('messages/zh.json', 'utf8'));

  function compareStructure(obj1, obj2, path = '') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    for (const key of keys1) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in obj2)) {
        throw new Error(`中文翻译缺少键: ${currentPath}`);
      }

      if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        if (typeof obj2[key] !== 'object' || obj2[key] === null) {
          throw new Error(`翻译结构不匹配: ${currentPath}`);
        }
        compareStructure(obj1[key], obj2[key], currentPath);
      }
    }

    for (const key of keys2) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in obj1)) {
        throw new Error(`英文翻译缺少键: ${currentPath}`);
      }
    }
  }

  compareStructure(enMessages, zhMessages);
});

// 测试3: 验证next.config.ts集成
test('验证next.config.ts集成next-intl', () => {
  const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
  if (!nextConfig.includes('next-intl/plugin')) {
    throw new Error('next.config.ts未集成next-intl插件');
  }
  if (!nextConfig.includes('withNextIntl')) {
    throw new Error('next.config.ts未使用withNextIntl包装');
  }
});

// 测试4: 验证App Router结构
test('验证App Router国际化结构', () => {
  const requiredDirs = ['src/app/[locale]'];

  const requiredFiles = [
    'src/app/layout.tsx',
    'src/app/[locale]/layout.tsx',
    'src/app/[locale]/page.tsx',
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(`缺少目录: ${dir}`);
    }
  }

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`缺少文件: ${file}`);
    }
  }
});

// 测试5: 验证根布局HTML结构
test('验证根布局HTML结构', () => {
  const rootLayout = fs.readFileSync('src/app/layout.tsx', 'utf8');
  if (!rootLayout.includes('<html>') || !rootLayout.includes('<body>')) {
    throw new Error('根布局缺少必要的HTML结构');
  }
});

// 测试6: 验证locale布局国际化集成
test('验证locale布局国际化集成', () => {
  const localeLayout = fs.readFileSync('src/app/[locale]/layout.tsx', 'utf8');
  if (!localeLayout.includes('NextIntlClientProvider')) {
    throw new Error('locale布局未集成NextIntlClientProvider');
  }
  if (!localeLayout.includes('getMessages')) {
    throw new Error('locale布局未使用getMessages');
  }
});

// 测试7: 验证翻译内容质量
test('验证翻译内容质量', () => {
  const enMessages = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
  const zhMessages = JSON.parse(fs.readFileSync('messages/zh.json', 'utf8'));

  // 检查必要的翻译键
  const requiredKeys = [
    'common.loading',
    'navigation.home',
    'theme.toggle',
    'language.toggle',
    'home.title',
  ];

  for (const key of requiredKeys) {
    const keys = key.split('.');
    let enValue = enMessages;
    let zhValue = zhMessages;

    for (const k of keys) {
      enValue = enValue[k];
      zhValue = zhValue[k];
      if (enValue === undefined || zhValue === undefined) {
        throw new Error(`缺少必要翻译键: ${key}`);
      }
    }

    if (typeof enValue !== 'string' || typeof zhValue !== 'string') {
      throw new Error(`翻译值类型错误: ${key}`);
    }

    if (enValue.trim() === '' || zhValue.trim() === '') {
      throw new Error(`翻译值为空: ${key}`);
    }
  }
});

// 输出测试结果
console.log('\n📊 测试结果:');
console.log(`✅ 通过: ${testsPassed}/${testsTotal}`);
console.log(`❌ 失败: ${testsTotal - testsPassed}/${testsTotal}`);

if (errors.length > 0) {
  console.log('\n🚨 失败详情:');
  errors.forEach(({ test, error }) => {
    console.log(`  • ${test}: ${error}`);
  });
}

const success = testsPassed === testsTotal;
console.log(`\n🎯 测试结果: ${success ? '✅ 全部通过' : '❌ 存在失败'}`);

process.exit(success ? 0 : 1);
