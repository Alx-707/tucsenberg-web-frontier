#!/usr/bin/env node

/**
 * 质量保障配置报告生成脚本
 *
 * 功能：
 * 1. 生成详细的QA配置统计报告
 * 2. 分析配置覆盖率和完整性
 * 3. 展示分层配置策略的执行效果
 * 4. 提供配置质量评估
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const TASKS_FILE = path.join(process.cwd(), 'docs/data/tasks.json');

/**
 * 生成详细的QA配置报告
 */
function generateQAConfigReport() {
  console.log('📊 质量保障配置完整性报告\n');
  console.log('='.repeat(60));

  try {
    // 读取任务文件
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    const tasks = tasksData.tasks;

    // 基础统计
    const stats = {
      total: tasks.length,
      withQA: 0,
      withAutomatedChecks: 0,
      withAiTechnicalReview: 0,
      withProjectAggregation: 0,
      withHumanConfirmation: 0,
      withUserInterface: 0,
      tier1: { total: 0, complete: 0 },
      tier2: { total: 0, complete: 0 },
      tier3: { total: 0, complete: 0 },
    };

    // 分层任务定义
    const tier1Tasks = [
      'b51718cc-9669-4284-8520-1c082964f30b', // 项目初始化
      'b917caf6-5050-44a6-aaa0-54f918cb9842', // 核心依赖
      '95af7988-2481-45b9-9090-1afb4db2d43a', // ESLint配置
      '1ea07a45-4606-4217-bb3f-7cd5d26272cf', // 架构检查
      '03e8d12a-7bce-4cd8-8a2f-a0b2e97c84f4', // 安全扫描
      '78fe619b-179a-44d1-af4d-a1787178f163', // 性能预算
      '8f8754b6-c724-4022-b630-847f68a0c791', // 代码重复度
      '6cb7bebc-0c94-4903-8246-bd2c0a0059b4', // 国际化系统
      '005fc1bd-fbab-472f-bdab-40221ff780f1', // Playwright测试
    ];

    const tier2Tasks = [
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
    ];

    // 配置模式统计
    const configPatterns = {};

    // 分析每个任务
    tasks.forEach((task) => {
      const qa = task.qualityAssurance;

      if (qa) {
        stats.withQA++;

        // 统计各配置组件
        if (qa.automatedChecks) stats.withAutomatedChecks++;
        if (qa.aiTechnicalReview) stats.withAiTechnicalReview++;
        if (qa.humanConfirmation?.projectAggregation)
          stats.withProjectAggregation++;
        if (qa.humanConfirmation) stats.withHumanConfirmation++;
        if (qa.userInterface) stats.withUserInterface++;

        // 生成配置模式
        const pattern = [
          qa.automatedChecks ? 'A' : '',
          qa.aiTechnicalReview ? 'T' : '',
          qa.humanConfirmation?.projectAggregation ? 'P' : '',
          qa.humanConfirmation ? 'H' : '',
          qa.userInterface ? 'U' : '',
        ].join('');

        configPatterns[pattern] = (configPatterns[pattern] || 0) + 1;

        // 分层统计
        if (tier1Tasks.includes(task.id)) {
          stats.tier1.total++;
          if (pattern === 'ATPHU') stats.tier1.complete++;
        } else if (tier2Tasks.includes(task.id)) {
          stats.tier2.total++;
          if (pattern === 'ATHU') stats.tier2.complete++;
        } else {
          stats.tier3.total++;
          if (pattern === 'AH') stats.tier3.complete++;
        }
      }
    });

    // 输出报告
    console.log('\n📈 整体配置统计:');
    console.log(`总任务数: ${stats.total}`);
    console.log(
      `有QA配置: ${stats.withQA}/${stats.total} (${((stats.withQA / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `配置完整性: ${stats.withQA === stats.total ? '✅ 100%' : '❌ 不完整'}`,
    );

    console.log('\n🔧 配置组件覆盖率:');
    console.log(
      `automatedChecks: ${stats.withAutomatedChecks}/${stats.total} (${((stats.withAutomatedChecks / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `aiTechnicalReview: ${stats.withAiTechnicalReview}/${stats.total} (${((stats.withAiTechnicalReview / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `projectAggregation: ${stats.withProjectAggregation}/${stats.total} (${((stats.withProjectAggregation / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `humanConfirmation: ${stats.withHumanConfirmation}/${stats.total} (${((stats.withHumanConfirmation / stats.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `userInterface: ${stats.withUserInterface}/${stats.total} (${((stats.withUserInterface / stats.total) * 100).toFixed(1)}%)`,
    );

    console.log('\n🎯 分层配置策略执行情况:');

    console.log(`\nTier 1 (关键任务) - 期望: ATPHU (5层配置)`);
    console.log(`  任务数: ${stats.tier1.total}`);
    console.log(
      `  完整配置: ${stats.tier1.complete}/${stats.tier1.total} (${((stats.tier1.complete / stats.tier1.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  状态: ${stats.tier1.complete === stats.tier1.total ? '✅ 完成' : '❌ 未完成'}`,
    );

    console.log(`\nTier 2 (重要任务) - 期望: ATHU (4层配置)`);
    console.log(`  任务数: ${stats.tier2.total}`);
    console.log(
      `  完整配置: ${stats.tier2.complete}/${stats.tier2.total} (${((stats.tier2.complete / stats.tier2.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  状态: ${stats.tier2.complete === stats.tier2.total ? '✅ 完成' : '❌ 未完成'}`,
    );

    console.log(`\nTier 3 (一般任务) - 期望: AH (2层配置)`);
    console.log(`  任务数: ${stats.tier3.total}`);
    console.log(
      `  完整配置: ${stats.tier3.complete}/${stats.tier3.total} (${((stats.tier3.complete / stats.tier3.total) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  状态: ${stats.tier3.complete === stats.tier3.total ? '✅ 完成' : '❌ 未完成'}`,
    );

    console.log('\n📋 配置模式分布:');
    const sortedPatterns = Object.entries(configPatterns).sort(
      ([, a], [, b]) => b - a,
    );

    sortedPatterns.forEach(([pattern, count]) => {
      const description = getPatternDescription(pattern);
      console.log(`  ${pattern} (${description}): ${count}个任务`);
    });

    console.log('\n🎉 修复成果总结:');
    const totalCompliance =
      ((stats.tier1.complete + stats.tier2.complete + stats.tier3.complete) /
        stats.total) *
      100;
    console.log(`✅ 分层配置策略执行完成度: ${totalCompliance.toFixed(1)}%`);
    console.log(`✅ 关键配置组件覆盖率:`);
    console.log(
      `   - projectAggregation: ${((stats.withProjectAggregation / stats.total) * 100).toFixed(1)}% (修复前: 0%)`,
    );
    console.log(
      `   - userInterface: ${((stats.withUserInterface / stats.total) * 100).toFixed(1)}% (修复前: 0%)`,
    );
    console.log(
      `✅ 整体质量保障体系: ${stats.withQA === stats.total ? '完整建立' : '部分建立'}`,
    );

    console.log('\n💡 配置质量评估:');
    if (totalCompliance >= 95) {
      console.log('🌟 优秀 - 质量保障配置体系完整，符合企业级标准');
    } else if (totalCompliance >= 85) {
      console.log('✅ 良好 - 质量保障配置基本完整，有少量改进空间');
    } else if (totalCompliance >= 70) {
      console.log('⚠️  一般 - 质量保障配置部分完整，需要进一步改进');
    } else {
      console.log('❌ 需要改进 - 质量保障配置不完整，需要大幅改进');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 报告生成完成');
  } catch (error) {
    console.error('❌ 生成报告时出现错误:', error.message);
    process.exit(1);
  }
}

/**
 * 获取配置模式描述
 */
function getPatternDescription(pattern) {
  const descriptions = {
    ATPHU: 'AutoChecks+TechReview+ProjectAgg+HumanConf+UserInterface',
    ATHU: 'AutoChecks+TechReview+HumanConf+UserInterface',
    ATH: 'AutoChecks+TechReview+HumanConf',
    AH: 'AutoChecks+HumanConf',
    A: 'AutoChecks Only',
    H: 'HumanConf Only',
  };

  return descriptions[pattern] || 'Custom Pattern';
}

/**
 * 主函数
 */
function main() {
  generateQAConfigReport();
}

// 执行报告生成
if (require.main === module) {
  main();
}

module.exports = {
  generateQAConfigReport,
};
