#!/usr/bin/env node

const fs = require('fs');

console.log('🛠️ 实施分层质量保障配置');
console.log('='.repeat(50));

// 读取当前tasks.json
const tasksData = JSON.parse(fs.readFileSync('docs/data/tasks.json', 'utf8'));

// 定义任务分层策略
const taskTiers = {
  // Tier 1: 关键任务 - 完整四层配置
  tier1: [
    '项目初始化和基础环境搭建',
    '核心依赖包安装和版本管理',
    'P0级架构一致性检查配置',
    'P0级安全扫描强化配置',
    'ESLint 9生态和基础代码质量工具配置',
    'TypeScript严格模式和类型安全强化',
    'next-intl国际化系统配置',
    'P1级质量保障工具整合平台配置',
    'AI代码专项测试和验证体系',
  ],

  // Tier 2: 重要任务 - 三层配置
  tier2: [
    'shadcn/ui组件库和UI设计系统搭建',
    '主题系统和字体配置',
    'Vitest单元测试框架配置',
    'Playwright端到端测试配置',
    'next-intl企业级监控配置',
    'next-intl SEO增强配置',
    '响应式导航栏组件开发',
    '企业级页脚组件开发',
    '安全配置和环境变量管理',
  ],

  // Tier 3: 一般任务 - 两层配置
  tier3: [], // 其余所有任务
};

// 配置模板
const qaTemplates = {
  tier1: {
    automatedChecks: {
      tools: [
        'pnpm type-check:strict',
        'pnpm lint:strict',
        'pnpm format:check',
        'pnpm build',
      ],
      executionMode: 'sequential',
      failFast: true,
      threshold: '100%通过率',
      estimatedTime: '60-120秒',
    },
    aiTechnicalReview: {
      threshold: '≥90分',
      scoringCriteria: {
        技术实现质量: '30分',
        最佳实践遵循: '30分',
        企业级标准: '25分',
        项目整体影响: '15分',
      },
      focusAreas: ['架构设计', '代码质量', '安全性'],
    },
    projectAggregation: {
      updateHealthStatus: true,
      updateDeploymentReadiness: true,
      generateReports: ['quality', 'security', 'performance', 'architecture'],
      healthWeights: {
        codeQuality: 0.3,
        security: 0.3,
        performance: 0.2,
        architecture: 0.2,
      },
      deploymentCriteria: {
        minHealthScore: 85,
        maxCriticalIssues: 0,
        requiredPassRate: 100,
      },
    },
    humanConfirmation: {
      timeLimit: '≤8分钟',
      method: '完整功能验证',
      items: ['核心功能验证', '质量标准确认', '集成测试通过'],
      prerequisite: '自动化检查100%通过 + AI审查≥90分',
      userInterface: {
        enableHealthQuery: true,
        enableReadinessQuery: true,
        enableReportQuery: true,
        healthDisplayMode: 'simple',
        reportFormats: ['console', 'json', 'html'],
        queryTimeout: '30秒',
        cacheResults: true,
      },
    },
  },

  tier2: {
    automatedChecks: {
      tools: ['pnpm type-check', 'pnpm lint:check', 'pnpm build'],
      executionMode: 'sequential',
      failFast: true,
      threshold: '100%通过率',
      estimatedTime: '45-90秒',
    },
    aiTechnicalReview: {
      threshold: '≥85分',
      scoringCriteria: {
        技术实现质量: '35分',
        最佳实践遵循: '35分',
        企业级标准: '30分',
      },
      focusAreas: ['技术实现', '最佳实践'],
    },
    humanConfirmation: {
      timeLimit: '≤5分钟',
      method: '核心功能验证',
      items: ['功能正常工作', '基础质量确认'],
      prerequisite: '自动化检查100%通过 + AI审查≥85分',
      userInterface: {
        enableHealthQuery: true,
        reportFormats: ['console', 'json'],
        queryTimeout: '20秒',
      },
    },
  },

  tier3: {
    automatedChecks: {
      tools: ['pnpm type-check', 'pnpm lint:check'],
      executionMode: 'sequential',
      threshold: '100%通过率',
      estimatedTime: '30-60秒',
    },
    humanConfirmation: {
      timeLimit: '≤3分钟',
      method: '快速功能验证',
      items: ['基础功能验证'],
      prerequisite: '自动化检查100%通过',
    },
  },
};

// 应用分层配置
let updatedCount = 0;
let tier1Count = 0,
  tier2Count = 0,
  tier3Count = 0;

tasksData.tasks.forEach((task) => {
  const taskName = task.name;
  let tier = 'tier3'; // 默认为tier3

  // 确定任务层级
  if (taskTiers.tier1.some((name) => taskName.includes(name.split('（')[0]))) {
    tier = 'tier1';
    tier1Count++;
  } else if (
    taskTiers.tier2.some((name) => taskName.includes(name.split('（')[0]))
  ) {
    tier = 'tier2';
    tier2Count++;
  } else {
    tier3Count++;
  }

  // 应用对应的QA配置
  task.qualityAssurance = qaTemplates[tier];
  updatedCount++;
});

// 保存更新后的文件
fs.writeFileSync('docs/data/tasks.json', JSON.stringify(tasksData, null, 2));

console.log('✅ 分层配置完成！');
console.log(`📊 配置统计:`);
console.log(`   Tier 1 (完整四层): ${tier1Count}个任务`);
console.log(`   Tier 2 (三层配置): ${tier2Count}个任务`);
console.log(`   Tier 3 (两层配置): ${tier3Count}个任务`);
console.log(`   总计更新: ${updatedCount}个任务`);
console.log('');
console.log('🎯 配置策略:');
console.log('   Tier 1: 关键任务，最严格的质量保障');
console.log('   Tier 2: 重要任务，平衡质量与效率');
console.log('   Tier 3: 一般任务，基础质量保障');
