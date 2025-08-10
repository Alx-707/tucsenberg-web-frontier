#!/usr/bin/env node

/**
 * Tier 3任务配置缺口分析脚本
 *
 * 功能：
 * 1. 识别Tier 3任务中配置不完整的任务
 * 2. 分析任务重要性，评估层级升级可能性
 * 3. 验证Phase 2/3任务配置
 * 4. 生成改进建议
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const TASKS_FILE = path.join(process.cwd(), 'docs/data/tasks.json');

// 分层任务定义
const TIER_DEFINITIONS = {
  tier1: [
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
  tier2: [
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
  ],
};

// Phase 2/3任务
const PHASE_TASKS = {
  phase2: [
    'p2-cross-browser-testing-001',
    'p2-responsive-testing-002',
    'p2-accessibility-enhanced-003',
    'p2-i18n-enhanced-testing-004',
    'p2-seo-automation-005',
    'p2-form-interaction-testing-006',
  ],
  phase3: [
    'p3-error-boundary-testing-001',
    'p3-network-failure-testing-002',
    'p3-advanced-performance-003',
    'p3-security-penetration-004',
  ],
};

/**
 * 分析Tier 3任务配置缺口
 */
function analyzeTier3Gaps() {
  console.log('🔍 分析Tier 3任务配置缺口...\n');

  try {
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    const tasks = tasksData.tasks;

    // 识别Tier 3任务
    const tier3Tasks = tasks.filter(
      (task) =>
        !TIER_DEFINITIONS.tier1.includes(task.id) &&
        !TIER_DEFINITIONS.tier2.includes(task.id),
    );

    console.log(`📊 Tier 3任务总数: ${tier3Tasks.length}`);

    // 分析配置完整性
    const incompleteT3Tasks = [];
    const completeT3Tasks = [];

    tier3Tasks.forEach((task) => {
      const qa = task.qualityAssurance;
      const hasAutomatedChecks = qa && qa.automatedChecks;
      const hasHumanConfirmation = qa && qa.humanConfirmation;

      if (hasAutomatedChecks && hasHumanConfirmation) {
        completeT3Tasks.push(task);
      } else {
        incompleteT3Tasks.push({
          task,
          missing: [
            !hasAutomatedChecks ? 'automatedChecks' : null,
            !hasHumanConfirmation ? 'humanConfirmation' : null,
          ].filter(Boolean),
        });
      }
    });

    console.log(`✅ 配置完整的Tier 3任务: ${completeT3Tasks.length}`);
    console.log(`❌ 配置不完整的Tier 3任务: ${incompleteT3Tasks.length}`);

    // 输出不完整任务详情
    if (incompleteT3Tasks.length > 0) {
      console.log('\n❌ 配置不完整的Tier 3任务详情:');
      incompleteT3Tasks.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.task.name}`);
        console.log(`   ID: ${item.task.id}`);
        console.log(`   缺失配置: ${item.missing.join(', ')}`);
        console.log(`   状态: ${item.task.status}`);
      });
    }

    return {
      tier3Tasks,
      completeT3Tasks,
      incompleteT3Tasks,
    };
  } catch (error) {
    console.error('❌ 分析过程中出现错误:', error.message);
    process.exit(1);
  }
}

/**
 * 评估任务层级升级可能性
 */
function evaluateTaskUpgrades(tier3Tasks) {
  console.log('\n🎯 评估任务层级升级可能性...\n');

  // 升级评估标准
  const upgradeCandidate = [];

  tier3Tasks.forEach((task) => {
    let score = 0;
    let reasons = [];

    // 技术复杂度评估
    if (task.name.includes('测试') || task.name.includes('Test')) {
      score += 2;
      reasons.push('测试相关任务，影响质量保障');
    }

    if (task.name.includes('安全') || task.name.includes('Security')) {
      score += 3;
      reasons.push('安全相关任务，影响系统安全');
    }

    if (task.name.includes('性能') || task.name.includes('Performance')) {
      score += 2;
      reasons.push('性能相关任务，影响用户体验');
    }

    if (task.name.includes('监控') || task.name.includes('Monitor')) {
      score += 2;
      reasons.push('监控相关任务，影响运维质量');
    }

    // 业务重要性评估
    if (task.name.includes('部署') || task.name.includes('Deploy')) {
      score += 2;
      reasons.push('部署相关任务，影响发布流程');
    }

    if (task.name.includes('CI/CD')) {
      score += 2;
      reasons.push('CI/CD相关任务，影响开发效率');
    }

    // 依赖关系评估
    if (task.dependencies && task.dependencies.length > 2) {
      score += 1;
      reasons.push('依赖关系复杂，影响项目进度');
    }

    // Phase 2/3任务特殊评估
    if (
      PHASE_TASKS.phase2.includes(task.id) ||
      PHASE_TASKS.phase3.includes(task.id)
    ) {
      score += 1;
      reasons.push('Phase 2/3工具链任务，影响测试体系');
    }

    if (score >= 3) {
      upgradeCandidate.push({
        task,
        score,
        reasons,
        recommendedTier: score >= 4 ? 'tier2' : 'tier2-candidate',
      });
    }
  });

  // 排序并输出建议
  upgradeCandidate.sort((a, b) => b.score - a.score);

  console.log(`📈 发现 ${upgradeCandidate.length} 个升级候选任务:`);

  upgradeCandidate.forEach((candidate, index) => {
    console.log(`\n${index + 1}. ${candidate.task.name}`);
    console.log(`   评分: ${candidate.score}/5`);
    console.log(`   建议层级: ${candidate.recommendedTier}`);
    console.log(`   升级理由:`);
    candidate.reasons.forEach((reason) => {
      console.log(`     - ${reason}`);
    });
  });

  return upgradeCandidate;
}

/**
 * 验证Phase 2/3任务配置
 */
function verifyPhaseTasksConfig(tasks) {
  console.log('\n🔍 验证Phase 2/3任务配置...\n');

  const phaseTasksAll = [...PHASE_TASKS.phase2, ...PHASE_TASKS.phase3];
  const phaseTasksFound = tasks.filter((task) =>
    phaseTasksAll.includes(task.id),
  );

  console.log(`📊 Phase 2/3任务总数: ${phaseTasksAll.length}`);
  console.log(`📊 找到的Phase任务: ${phaseTasksFound.length}`);

  const configIssues = [];

  phaseTasksFound.forEach((task) => {
    const qa = task.qualityAssurance;
    const issues = [];

    if (!qa) {
      issues.push('完全缺少QA配置');
    } else {
      if (!qa.automatedChecks) issues.push('缺少automatedChecks');
      if (!qa.humanConfirmation) issues.push('缺少humanConfirmation');

      // Phase 2高优先级任务应该有更完整的配置
      if (
        [
          'p2-cross-browser-testing-001',
          'p2-responsive-testing-002',
          'p2-seo-automation-005',
          'p3-error-boundary-testing-001',
          'p3-security-penetration-004',
        ].includes(task.id)
      ) {
        if (!qa.aiTechnicalReview)
          issues.push('缺少aiTechnicalReview (建议Tier 2)');
        if (!qa.userInterface) issues.push('缺少userInterface (建议Tier 2)');
      }
    }

    if (issues.length > 0) {
      configIssues.push({
        task,
        issues,
      });
    }
  });

  if (configIssues.length > 0) {
    console.log('❌ Phase任务配置问题:');
    configIssues.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.task.name}`);
      console.log(`   问题: ${item.issues.join(', ')}`);
    });
  } else {
    console.log('✅ 所有Phase任务配置正确');
  }

  return configIssues;
}

/**
 * 生成改进建议
 */
function generateImprovementSuggestions(
  incompleteT3Tasks,
  upgradeCandidate,
  phaseConfigIssues,
) {
  console.log('\n💡 改进建议:\n');

  console.log('1️⃣ Tier 3任务配置完整性提升:');
  if (incompleteT3Tasks.length > 0) {
    console.log(`   - 需要修复 ${incompleteT3Tasks.length} 个Tier 3任务的配置`);
    console.log(`   - 主要缺失: automatedChecks 和 humanConfirmation`);
    console.log(
      `   - 修复后Tier 3完整性将达到: ${(((21 + incompleteT3Tasks.length) / (21 + incompleteT3Tasks.length)) * 100).toFixed(1)}%`,
    );
  } else {
    console.log('   ✅ 所有Tier 3任务配置已完整');
  }

  console.log('\n2️⃣ 任务层级升级建议:');
  if (upgradeCandidate.length > 0) {
    const tier2Candidates = upgradeCandidate
      .filter((c) => c.recommendedTier === 'tier2')
      .slice(0, 3);
    console.log(`   - 建议升级到Tier 2: ${tier2Candidates.length} 个任务`);
    tier2Candidates.forEach((candidate) => {
      console.log(`     * ${candidate.task.name} (评分: ${candidate.score}/5)`);
    });
  } else {
    console.log('   - 暂无明显的升级候选任务');
  }

  console.log('\n3️⃣ Phase 2/3任务配置优化:');
  if (phaseConfigIssues.length > 0) {
    console.log(`   - 需要修复 ${phaseConfigIssues.length} 个Phase任务的配置`);
  } else {
    console.log('   ✅ 所有Phase任务配置正确');
  }

  console.log('\n4️⃣ 新工具集成建议:');
  console.log(
    '   - 可访问性测试工具: @axe-core/playwright, axe-core, jest-axe',
  );
  console.log('   - SEO自动化工具: lighthouse, lighthouse-ci, @lhci/cli');
  console.log('   - 链接和图片检查: broken-link-checker, imagemin-cli, sharp');
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 Tier 3任务配置缺口分析\n');
  console.log('='.repeat(60));

  try {
    // 分析Tier 3配置缺口
    const { tier3Tasks, completeT3Tasks, incompleteT3Tasks } =
      analyzeTier3Gaps();

    // 评估任务层级升级可能性
    const upgradeCandidate = evaluateTaskUpgrades(tier3Tasks);

    // 验证Phase 2/3任务配置
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    const phaseConfigIssues = verifyPhaseTasksConfig(tasksData.tasks);

    // 生成改进建议
    generateImprovementSuggestions(
      incompleteT3Tasks,
      upgradeCandidate,
      phaseConfigIssues,
    );

    console.log('\n' + '='.repeat(60));
    console.log('📊 分析完成');

    return {
      incompleteT3Tasks,
      upgradeCandidate,
      phaseConfigIssues,
    };
  } catch (error) {
    console.error('❌ 分析过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 执行分析
if (require.main === module) {
  main();
}

module.exports = {
  analyzeTier3Gaps,
  evaluateTaskUpgrades,
  verifyPhaseTasksConfig,
};
