#!/usr/bin/env node

/**
 * 质量保障配置修复脚本
 *
 * 功能：
 * 1. 分析当前tasks.json中的QA配置状况
 * 2. 根据任务重要性分层配置QA体系
 * 3. 添加缺失的projectAggregation和userInterface配置
 * 4. 标准化配置结构
 *
 * 使用方法：
 * node scripts/fix-qa-config.js [--dry-run] [--tier=1|2|3] [--validate-only]
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const TASKS_FILE = path.join(process.cwd(), 'docs/data/tasks.json');
const BACKUP_DIR = path.join(process.cwd(), 'docs/data/backups');

// 命令行参数解析
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const validateOnly = args.includes('--validate-only');
const tierFilter = args.find((arg) => arg.startsWith('--tier='))?.split('=')[1];

// 任务分层配置
const TASK_TIERS = {
  // Tier 1: 关键任务 - 完整四层配置
  tier1: [
    'b51718cc-9669-4284-8520-1c082964f30b', // 项目初始化
    'b917caf6-5050-44a6-aaa0-54f918cb9842', // 核心依赖
    'c0fa19a7-8bc1-48a6-881f-3989314eb4bc', // Sentry监控
    '95af7988-2481-45b9-9090-1afb4db2d43a', // ESLint配置
    '1ea07a45-4606-4217-bb3f-7cd5d26272cf', // 架构检查
    '03e8d12a-7bce-4cd8-8a2f-a0b2e97c84f4', // 安全扫描
    '78fe619b-179a-44d1-af4d-a1787178f163', // 性能预算
    '8f8754b6-c724-4022-b630-847f68a0c791', // 代码重复度
    'e9b5a652-2186-4215-8be1-efabbaab4c6a', // Git工作流
  ],

  // Tier 2: 重要任务 - 三层配置
  tier2: [
    '2439241a-b71e-40a9-a017-3fc27366b026', // shadcn/ui
    '6cb7bebc-0c94-4903-8246-bd2c0a0059b4', // next-intl
    '4d62487f-6109-427f-83ec-c36a876f1286', // Vitest测试
    '005fc1bd-fbab-472f-bdab-40221ff780f1', // Playwright E2E
    'fc0cc328-33ac-461d-a8c2-776d2554005f', // next-intl监控
    '561e9445-2086-46b3-ac7c-42e502d843d7', // AI代码测试
    '4656dc68-52e8-4bf9-b0b0-51e4c820c6c4', // TypeScript严格模式
    // Phase 2 关键任务
    'p2-cross-browser-testing-001',
    'p2-responsive-testing-002',
    'p2-seo-automation-005',
    // Phase 3 关键任务
    'p3-error-boundary-testing-001',
    'p3-security-penetration-004',
    'p3-advanced-performance-003', // 升级到Tier 2
  ],

  // Tier 3: 一般任务 - 两层配置
  tier3: [
    // 其他所有任务
  ],
};

// QA配置模板
const QA_TEMPLATES = {
  // Tier 1: 完整四层配置
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
    humanConfirmation: {
      timeLimit: '≤8分钟',
      method: '完整功能验证',
      items: ['核心功能验证', '质量标准确认', '集成测试通过'],
      prerequisite: '自动化检查100%通过 + AI审查≥90分',
    },
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

  // Tier 2: 三层配置 (包含userInterface)
  tier2: {
    automatedChecks: {
      tools: [
        'pnpm type-check',
        'pnpm lint:check',
        'pnpm build',
        'pnpm test:specific',
      ],
      executionMode: 'sequential',
      failFast: true,
      threshold: '100%通过率',
      estimatedTime: '60-120秒',
    },
    aiTechnicalReview: {
      threshold: '≥85分',
      focusAreas: ['技术实现', '最佳实践', '用户体验'],
    },
    humanConfirmation: {
      timeLimit: '≤6分钟',
      method: '功能验证和用户体验测试',
      prerequisite: '自动化检查100%通过 + AI审查≥85分',
    },
    userInterface: {
      enableHealthQuery: true,
      enableReadinessQuery: true,
      enableReportQuery: true,
      healthDisplayMode: 'simple',
      reportFormats: ['console', 'json'],
      queryTimeout: '30秒',
      cacheResults: true,
    },
  },

  // Tier 3: 两层配置
  tier3: {
    automatedChecks: {
      tools: ['pnpm type-check', 'pnpm lint:check', 'pnpm test:specific'],
      executionMode: 'sequential',
      threshold: '100%通过率',
      estimatedTime: '45-90秒',
    },
    humanConfirmation: {
      timeLimit: '≤4分钟',
      method: '功能验证和基础测试',
      prerequisite: '自动化检查100%通过',
    },
  },
};

/**
 * 分析当前QA配置状况
 */
function analyzeCurrentQAConfig(tasks) {
  const analysis = {
    totalTasks: tasks.length,
    hasQA: 0,
    hasAutomatedChecks: 0,
    hasAiTechnicalReview: 0,
    hasProjectAggregation: 0,
    hasHumanConfirmation: 0,
    hasUserInterface: 0,
    missingQA: [],
    incompleteQA: [],
    configPatterns: {},
  };

  tasks.forEach((task) => {
    const qa = task.qualityAssurance;

    if (!qa) {
      analysis.missingQA.push({
        id: task.id,
        name: task.name,
      });
      return;
    }

    analysis.hasQA++;

    // 检查各个配置组件
    if (qa.automatedChecks) analysis.hasAutomatedChecks++;
    if (qa.aiTechnicalReview) analysis.hasAiTechnicalReview++;
    if (qa.projectAggregation) analysis.hasProjectAggregation++;
    if (qa.humanConfirmation) analysis.hasHumanConfirmation++;
    if (qa.userInterface || qa.humanConfirmation?.userInterface)
      analysis.hasUserInterface++;

    // 记录配置模式
    const pattern = [
      qa.automatedChecks ? 'A' : '',
      qa.aiTechnicalReview ? 'T' : '',
      qa.projectAggregation ? 'P' : '',
      qa.humanConfirmation ? 'H' : '',
      qa.userInterface || qa.humanConfirmation?.userInterface ? 'U' : '',
    ].join('');

    analysis.configPatterns[pattern] =
      (analysis.configPatterns[pattern] || 0) + 1;

    // 检查不完整的配置
    if (qa && (!qa.automatedChecks || !qa.humanConfirmation)) {
      analysis.incompleteQA.push({
        id: task.id,
        name: task.name,
        missing: [
          !qa.automatedChecks ? 'automatedChecks' : null,
          !qa.humanConfirmation ? 'humanConfirmation' : null,
        ].filter(Boolean),
      });
    }
  });

  return analysis;
}

/**
 * 确定任务层级
 */
function determineTaskTier(taskId) {
  if (TASK_TIERS.tier1.includes(taskId)) return 'tier1';
  if (TASK_TIERS.tier2.includes(taskId)) return 'tier2';
  return 'tier3';
}

/**
 * 生成QA配置
 */
function generateQAConfig(task, tier) {
  const template = QA_TEMPLATES[tier];
  const config = JSON.parse(JSON.stringify(template)); // 深拷贝

  // 根据任务特性调整配置
  if (task.name.includes('测试') || task.name.includes('Test')) {
    // 测试相关任务调整
    if (
      config.automatedChecks &&
      !config.automatedChecks.tools.includes('pnpm test:specific')
    ) {
      config.automatedChecks.tools.push('pnpm test:specific');
    }
  }

  if (task.name.includes('安全') || task.name.includes('Security')) {
    // 安全相关任务调整
    if (config.aiTechnicalReview) {
      config.aiTechnicalReview.focusAreas = ['安全性', '代码质量', '最佳实践'];
    }
  }

  return config;
}

/**
 * 修复任务QA配置
 */
function fixTaskQAConfig(task) {
  const tier = determineTaskTier(task.id);
  const newQAConfig = generateQAConfig(task, tier);

  // 保留现有的有效配置，只添加缺失的部分
  const existingQA = task.qualityAssurance || {};

  return {
    ...task,
    qualityAssurance: {
      ...newQAConfig,
      // 如果现有配置更完整，保留现有配置
      ...(existingQA.automatedChecks &&
      Object.keys(existingQA.automatedChecks).length > 3
        ? { automatedChecks: existingQA.automatedChecks }
        : {}),
      ...(existingQA.aiTechnicalReview &&
      Object.keys(existingQA.aiTechnicalReview).length > 2
        ? { aiTechnicalReview: existingQA.aiTechnicalReview }
        : {}),
      ...(existingQA.humanConfirmation &&
      Object.keys(existingQA.humanConfirmation).length > 2
        ? {
            humanConfirmation: {
              ...newQAConfig.humanConfirmation,
              ...existingQA.humanConfirmation,
            },
          }
        : {}),
    },
  };
}

/**
 * 创建备份
 */
function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `tasks-backup-${timestamp}.json`);

  fs.copyFileSync(TASKS_FILE, backupFile);
  console.log(`✅ 备份已创建: ${backupFile}`);

  return backupFile;
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 质量保障配置修复脚本启动...\n');

  // 读取任务文件
  if (!fs.existsSync(TASKS_FILE)) {
    console.error(`❌ 任务文件不存在: ${TASKS_FILE}`);
    process.exit(1);
  }

  let tasksData;
  try {
    tasksData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch (error) {
    console.error(`❌ 解析任务文件失败: ${error.message}`);
    process.exit(1);
  }

  const tasks = tasksData.tasks;
  console.log(`📊 发现 ${tasks.length} 个任务\n`);

  // 分析当前配置状况
  const analysis = analyzeCurrentQAConfig(tasks);

  console.log('📈 当前QA配置分析:');
  console.log(`  总任务数: ${analysis.totalTasks}`);
  console.log(
    `  有QA配置: ${analysis.hasQA} (${((analysis.hasQA / analysis.totalTasks) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  有automatedChecks: ${analysis.hasAutomatedChecks} (${((analysis.hasAutomatedChecks / analysis.totalTasks) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  有aiTechnicalReview: ${analysis.hasAiTechnicalReview} (${((analysis.hasAiTechnicalReview / analysis.totalTasks) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  有projectAggregation: ${analysis.hasProjectAggregation} (${((analysis.hasProjectAggregation / analysis.totalTasks) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  有humanConfirmation: ${analysis.hasHumanConfirmation} (${((analysis.hasHumanConfirmation / analysis.totalTasks) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  有userInterface: ${analysis.hasUserInterface} (${((analysis.hasUserInterface / analysis.totalTasks) * 100).toFixed(1)}%)`,
  );

  console.log('\n📋 配置模式分布:');
  Object.entries(analysis.configPatterns).forEach(([pattern, count]) => {
    const desc = pattern
      .split('')
      .map((char) => {
        switch (char) {
          case 'A':
            return 'AutoChecks';
          case 'T':
            return 'TechReview';
          case 'P':
            return 'ProjectAgg';
          case 'H':
            return 'HumanConf';
          case 'U':
            return 'UserInterface';
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('+');
    console.log(
      `  ${pattern || '无配置'} (${desc || '无配置'}): ${count}个任务`,
    );
  });

  if (validateOnly) {
    console.log('\n✅ 验证完成，退出');
    return;
  }

  // 创建备份
  if (!isDryRun) {
    createBackup();
  }

  // 修复配置
  console.log('\n🔧 开始修复QA配置...');

  const fixedTasks = tasks.map((task) => {
    if (tierFilter && determineTaskTier(task.id) !== tierFilter) {
      return task; // 跳过不匹配的层级
    }

    return fixTaskQAConfig(task);
  });

  const fixedTasksData = {
    ...tasksData,
    tasks: fixedTasks,
  };

  if (isDryRun) {
    console.log('\n🔍 干运行模式 - 显示修复后的配置统计:');
    const newAnalysis = analyzeCurrentQAConfig(fixedTasks);
    console.log(
      `  有projectAggregation: ${newAnalysis.hasProjectAggregation} (${((newAnalysis.hasProjectAggregation / newAnalysis.totalTasks) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  有userInterface: ${newAnalysis.hasUserInterface} (${((newAnalysis.hasUserInterface / newAnalysis.totalTasks) * 100).toFixed(1)}%)`,
    );
  } else {
    // 写入修复后的文件
    try {
      fs.writeFileSync(TASKS_FILE, JSON.stringify(fixedTasksData, null, 2));
      console.log(`✅ QA配置修复完成: ${TASKS_FILE}`);

      // 验证修复结果
      const newAnalysis = analyzeCurrentQAConfig(fixedTasks);
      console.log('\n📊 修复后配置统计:');
      console.log(
        `  有projectAggregation: ${newAnalysis.hasProjectAggregation} (${((newAnalysis.hasProjectAggregation / newAnalysis.totalTasks) * 100).toFixed(1)}%)`,
      );
      console.log(
        `  有userInterface: ${newAnalysis.hasUserInterface} (${((newAnalysis.hasUserInterface / newAnalysis.totalTasks) * 100).toFixed(1)}%)`,
      );
    } catch (error) {
      console.error(`❌ 写入文件失败: ${error.message}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 质量保障配置修复完成!');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  analyzeCurrentQAConfig,
  determineTaskTier,
  generateQAConfig,
  fixTaskQAConfig,
  TASK_TIERS,
  QA_TEMPLATES,
};
