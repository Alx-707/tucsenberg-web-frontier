#!/usr/bin/env node

/**
 * 验证所有qualityAssurance配置中的工具命令是否可执行
 * Verification script for all qualityAssurance tool commands
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 需要验证的命令列表
const commandsToVerify = [
  // 基础命令
  'pnpm type-check:strict',
  'pnpm lint:check',
  'pnpm format:check',
  'pnpm build',
  'pnpm test',

  // P0级质量保障命令
  'pnpm arch:validate',
  'pnpm security:check',
  'pnpm duplication:check',
  'pnpm size:check',

  // 新添加的命令
  'pnpm ui:test',
  'pnpm docs:validate',
  'pnpm deploy:test',
  'pnpm analytics:test',
  'pnpm integration:test',
  'pnpm dev:test',
  'pnpm a11y:test',
  'pnpm wcag:validate',
  'pnpm quality:report',
  'pnpm complexity:check',
  'pnpm test:ai-validation',
  'pnpm test:architecture',
  'pnpm test:security-boundaries',
  'pnpm type-safety:check',
  'pnpm unsafe:detect',
  'pnpm quality:monitor',
  'pnpm performance:check',
  'pnpm lighthouse:ci',
  'pnpm renovate:validate',
];

console.log('🔍 开始验证qualityAssurance工具命令...\n');

let passedCommands = 0;
let failedCommands = 0;
const results = [];

for (const command of commandsToVerify) {
  try {
    console.log(`⏳ 测试: ${command}`);

    // 对于某些命令，我们只验证它们是否存在，而不实际执行
    if (command.includes('build') || command.includes('security:check')) {
      // 检查命令是否在package.json中定义
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scriptName = command.replace('pnpm ', '');

      if (packageJson.scripts[scriptName]) {
        console.log(`✅ ${command} - 命令已定义`);
        passedCommands++;
        results.push({ command, status: 'PASS', note: '命令已定义' });
      } else {
        console.log(`❌ ${command} - 命令未定义`);
        failedCommands++;
        results.push({ command, status: 'FAIL', note: '命令未定义' });
      }
    } else {
      // 实际执行命令（使用超时）
      execSync(command, {
        stdio: 'pipe',
        timeout: 30000,
        cwd: process.cwd(),
      });
      console.log(`✅ ${command} - 执行成功`);
      passedCommands++;
      results.push({ command, status: 'PASS', note: '执行成功' });
    }
  } catch (error) {
    console.log(`❌ ${command} - 执行失败: ${error.message.split('\n')[0]}`);
    failedCommands++;
    results.push({
      command,
      status: 'FAIL',
      note: error.message.split('\n')[0],
    });
  }
}

console.log('\n📊 验证结果汇总:');
console.log(`✅ 通过: ${passedCommands}/${commandsToVerify.length}`);
console.log(`❌ 失败: ${failedCommands}/${commandsToVerify.length}`);
console.log(
  `📈 成功率: ${Math.round((passedCommands / commandsToVerify.length) * 100)}%`,
);

// 生成详细报告
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: commandsToVerify.length,
    passed: passedCommands,
    failed: failedCommands,
    successRate: Math.round((passedCommands / commandsToVerify.length) * 100),
  },
  results: results,
};

fs.writeFileSync(
  'quality-commands-verification-report.json',
  JSON.stringify(report, null, 2),
);
console.log('\n📄 详细报告已保存到: quality-commands-verification-report.json');

if (failedCommands === 0) {
  console.log('\n🎉 所有qualityAssurance工具命令验证通过！');
  process.exit(0);
} else {
  console.log('\n⚠️  部分命令验证失败，请检查上述错误信息。');
  process.exit(1);
}
