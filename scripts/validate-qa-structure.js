#!/usr/bin/env node

/**
 * 质量保障配置结构验证脚本
 *
 * 功能：
 * 1. 验证QA配置的完整性和一致性
 * 2. 检查分层配置策略的执行情况
 * 3. 生成详细的配置报告
 * 4. 识别配置异常和改进建议
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const TASKS_FILE = path.join(process.cwd(), 'docs/data/tasks.json');

// 期望的分层配置
const EXPECTED_TIERS = {
  tier1: {
    name: '关键任务',
    expectedLayers: [
      'automatedChecks',
      'aiTechnicalReview',
      'humanConfirmation',
      'userInterface',
    ],
    tasks: [
      'b51718cc-9669-4284-8520-1c082964f30b', // 项目初始化
      'b917caf6-5050-44a6-aaa0-54f918cb9842', // 核心依赖
      '95af7988-2481-45b9-9090-1afb4db2d43a', // ESLint配置
      '1ea07a45-4606-4217-bb3f-7cd5d26272cf', // 架构检查
      '03e8d12a-7bce-4cd8-8a2f-a0b2e97c84f4', // 安全扫描
      '78fe619b-179a-44d1-af4d-a1787178f163', // 性能预算
      '8f8754b6-c724-4022-b630-847f68a0c791', // 代码重复度
      '6cb7bebc-0c94-4903-8246-bd2c0a0059b4', // 国际化系统
      '005fc1bd-fbab-472f-bdab-40221ff780f1', // Playwright测试
    ],
  },
  tier2: {
    name: '重要任务',
    expectedLayers: [
      'automatedChecks',
      'aiTechnicalReview',
      'humanConfirmation',
      'userInterface',
    ],
    tasks: [
      '2439241a-b71e-40a9-a017-3fc27366b026', // shadcn/ui
      '4d62487f-6109-427f-83ec-c36a876f1286', // Vitest测试
      'fc0cc328-33ac-461d-a8c2-776d2554005f', // next-intl监控
      '561e9445-2086-46b3-ac7c-42e502d843d7', // AI代码测试
      '4656dc68-52e8-4bf9-b0b0-51e4c820c6c4', // TypeScript严格模式
      'p2-cross-browser-testing-001',
      'p2-responsive-testing-002',
      'p2-seo-automation-005',
      'p3-error-boundary-testing-001',
      'p3-security-penetration-004',
      'p3-advanced-performance-003', // 升级到Tier 2
    ],
  },
  tier3: {
    name: '一般任务',
    expectedLayers: ['automatedChecks', 'humanConfirmation'],
    // 其他所有任务
  },
};

/**
 * 验证单个任务的QA配置
 */
function validateTaskQAConfig(task) {
  const validation = {
    taskId: task.id,
    taskName: task.name,
    tier: null,
    expectedLayers: [],
    actualLayers: [],
    missingLayers: [],
    extraLayers: [],
    isValid: false,
    issues: [],
  };

  // 确定任务层级
  if (EXPECTED_TIERS.tier1.tasks.includes(task.id)) {
    validation.tier = 'tier1';
    validation.expectedLayers = EXPECTED_TIERS.tier1.expectedLayers;
  } else if (EXPECTED_TIERS.tier2.tasks.includes(task.id)) {
    validation.tier = 'tier2';
    validation.expectedLayers = EXPECTED_TIERS.tier2.expectedLayers;
  } else {
    validation.tier = 'tier3';
    validation.expectedLayers = EXPECTED_TIERS.tier3.expectedLayers;
  }

  // 检查实际配置
  const qa = task.qualityAssurance;
  if (!qa) {
    validation.issues.push('完全缺少qualityAssurance配置');
    return validation;
  }

  // 获取实际配置层
  validation.actualLayers = Object.keys(qa);

  // 检查缺失的层
  validation.missingLayers = validation.expectedLayers.filter(
    (layer) => !validation.actualLayers.includes(layer),
  );

  // 检查额外的层
  validation.extraLayers = validation.actualLayers.filter(
    (layer) => !validation.expectedLayers.includes(layer),
  );

  // 验证各层配置的完整性
  validation.expectedLayers.forEach((layer) => {
    if (qa[layer]) {
      const layerValidation = validateLayerConfig(layer, qa[layer]);
      if (!layerValidation.isValid) {
        validation.issues.push(
          `${layer}配置不完整: ${layerValidation.issues.join(', ')}`,
        );
      }
    }
  });

  // 判断整体有效性
  validation.isValid =
    validation.missingLayers.length === 0 && validation.issues.length === 0;

  return validation;
}

/**
 * 验证单层配置的完整性
 */
function validateLayerConfig(layerName, config) {
  const validation = {
    isValid: true,
    issues: [],
  };

  switch (layerName) {
    case 'automatedChecks':
      if (
        !config.tools ||
        !Array.isArray(config.tools) ||
        config.tools.length === 0
      ) {
        validation.issues.push('缺少tools配置');
      }
      if (!config.threshold) {
        validation.issues.push('缺少threshold配置');
      }
      break;

    case 'aiTechnicalReview':
      if (!config.threshold) {
        validation.issues.push('缺少threshold配置');
      }
      if (!config.focusAreas || !Array.isArray(config.focusAreas)) {
        validation.issues.push('缺少focusAreas配置');
      }
      break;

    case 'projectAggregation':
      if (typeof config.updateHealthStatus !== 'boolean') {
        validation.issues.push('缺少updateHealthStatus配置');
      }
      if (!config.healthWeights) {
        validation.issues.push('缺少healthWeights配置');
      }
      break;

    case 'humanConfirmation':
      if (!config.timeLimit) {
        validation.issues.push('缺少timeLimit配置');
      }
      if (!config.method) {
        validation.issues.push('缺少method配置');
      }
      break;

    case 'userInterface':
      if (typeof config.enableHealthQuery !== 'boolean') {
        validation.issues.push('缺少enableHealthQuery配置');
      }
      if (!config.reportFormats || !Array.isArray(config.reportFormats)) {
        validation.issues.push('缺少reportFormats配置');
      }
      break;
  }

  validation.isValid = validation.issues.length === 0;
  return validation;
}

/**
 * 生成验证报告
 */
function generateValidationReport(validations) {
  const report = {
    summary: {
      totalTasks: validations.length,
      validTasks: 0,
      invalidTasks: 0,
      tier1Tasks: 0,
      tier2Tasks: 0,
      tier3Tasks: 0,
    },
    tierAnalysis: {
      tier1: { total: 0, valid: 0, issues: [] },
      tier2: { total: 0, valid: 0, issues: [] },
      tier3: { total: 0, valid: 0, issues: [] },
    },
    commonIssues: {},
    recommendations: [],
  };

  // 统计分析
  validations.forEach((validation) => {
    if (validation.isValid) {
      report.summary.validTasks++;
    } else {
      report.summary.invalidTasks++;
    }

    // 按层级统计
    report.summary[`${validation.tier}Tasks`]++;
    report.tierAnalysis[validation.tier].total++;

    if (validation.isValid) {
      report.tierAnalysis[validation.tier].valid++;
    } else {
      report.tierAnalysis[validation.tier].issues.push({
        taskId: validation.taskId,
        taskName: validation.taskName,
        missingLayers: validation.missingLayers,
        issues: validation.issues,
      });
    }

    // 统计常见问题
    validation.issues.forEach((issue) => {
      report.commonIssues[issue] = (report.commonIssues[issue] || 0) + 1;
    });
  });

  // 生成建议
  if (report.summary.invalidTasks > 0) {
    report.recommendations.push('运行修复脚本解决配置缺失问题');
  }

  const tier1Compliance =
    report.tierAnalysis.tier1.valid / report.tierAnalysis.tier1.total;
  if (tier1Compliance < 1.0) {
    report.recommendations.push('优先修复Tier 1关键任务的配置问题');
  }

  return report;
}

/**
 * 主验证函数
 */
function main() {
  console.log('🔍 开始验证质量保障配置结构...\n');

  try {
    // 读取任务文件
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    const tasks = tasksData.tasks;

    console.log(`📊 总任务数: ${tasks.length}`);

    // 验证每个任务
    const validations = tasks.map(validateTaskQAConfig);

    // 生成报告
    const report = generateValidationReport(validations);

    // 输出报告
    console.log('\n📈 验证结果摘要:');
    console.log(
      `✅ 有效配置: ${report.summary.validTasks}/${report.summary.totalTasks} (${((report.summary.validTasks / report.summary.totalTasks) * 100).toFixed(1)}%)`,
    );
    console.log(
      `❌ 无效配置: ${report.summary.invalidTasks}/${report.summary.totalTasks} (${((report.summary.invalidTasks / report.summary.totalTasks) * 100).toFixed(1)}%)`,
    );

    console.log('\n📋 分层分析:');
    Object.entries(report.tierAnalysis).forEach(([tier, analysis]) => {
      const tierName = EXPECTED_TIERS[tier].name;
      const compliance =
        analysis.total > 0
          ? ((analysis.valid / analysis.total) * 100).toFixed(1)
          : '0.0';
      console.log(
        `  ${tierName} (${tier}): ${analysis.valid}/${analysis.total} (${compliance}%)`,
      );

      if (analysis.issues.length > 0) {
        console.log(`    问题任务: ${analysis.issues.length}个`);
        analysis.issues.slice(0, 3).forEach((issue) => {
          console.log(
            `      - ${issue.taskName}: ${issue.missingLayers.join(', ')}`,
          );
        });
        if (analysis.issues.length > 3) {
          console.log(`      ... 还有${analysis.issues.length - 3}个问题任务`);
        }
      }
    });

    console.log('\n🔧 常见问题:');
    Object.entries(report.commonIssues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([issue, count]) => {
        console.log(`  ${issue}: ${count}个任务`);
      });

    console.log('\n💡 建议:');
    report.recommendations.forEach((rec) => {
      console.log(`  - ${rec}`);
    });

    // 如果有问题，输出详细信息
    if (report.summary.invalidTasks > 0) {
      console.log('\n❌ 详细问题列表:');
      validations
        .filter((v) => !v.isValid)
        .slice(0, 10)
        .forEach((validation) => {
          console.log(
            `\n  任务: ${validation.taskName} (${validation.taskId})`,
          );
          console.log(`  层级: ${validation.tier}`);
          if (validation.missingLayers.length > 0) {
            console.log(`  缺失层: ${validation.missingLayers.join(', ')}`);
          }
          if (validation.issues.length > 0) {
            console.log(`  问题: ${validation.issues.join('; ')}`);
          }
        });

      if (report.summary.invalidTasks > 10) {
        console.log(
          `\n  ... 还有${report.summary.invalidTasks - 10}个问题任务`,
        );
      }
    }

    console.log('\n✅ 验证完成!');

    // 返回验证结果
    process.exit(report.summary.invalidTasks > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 执行验证
if (require.main === module) {
  main();
}

module.exports = {
  validateTaskQAConfig,
  validateLayerConfig,
  generateValidationReport,
};
