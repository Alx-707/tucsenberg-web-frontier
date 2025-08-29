#!/usr/bin/env node

/**
 * 组件测试覆盖率分析脚本
 * 分析当前组件测试覆盖率情况，识别未覆盖的组件，按重要性和使用频率排列优先级
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 组件重要性配置
const COMPONENT_PRIORITY_CONFIG = {
  // 核心UI组件（高优先级）
  coreUI: {
    priority: 1,
    description: '核心UI组件 - 用户交互频繁',
    components: [
      'button',
      'input',
      'card',
      'badge',
      'label',
      'separator',
      'dropdown-menu',
      'navigation-menu',
      'sheet',
      'tabs',
    ],
    targetCoverage: 90,
  },

  // 布局组件（高优先级）
  layout: {
    priority: 2,
    description: '布局组件 - 页面结构关键',
    components: ['header', 'footer', 'main-navigation', 'mobile-navigation'],
    targetCoverage: 85,
  },

  // 业务组件（中优先级）
  business: {
    priority: 3,
    description: '业务组件 - 功能实现重要',
    components: [
      'contact-form',
      'hero-section',
      'tech-stack-section',
      'project-overview',
      'enhanced-locale-switcher',
      'theme-toggle-button',
      'theme-menu-item',
    ],
    targetCoverage: 80,
  },

  // 工具组件（中优先级）
  utility: {
    priority: 4,
    description: '工具组件 - 辅助功能',
    components: [
      'animated-counter',
      'animated-icon',
      'progress-indicator',
      'social-icons',
    ],
    targetCoverage: 75,
  },

  // 展示组件（低优先级）
  showcase: {
    priority: 5,
    description: '展示组件 - 演示用途',
    components: ['ui-showcase', 'feature-sections', 'call-to-action'],
    targetCoverage: 60,
  },
};

// 报告文件路径
const ANALYSIS_REPORT_FILE = path.join(
  __dirname,
  '../reports/component-coverage-analysis.json',
);

/**
 * 确保报告目录存在
 */
function ensureReportsDirectory() {
  const reportsDir = path.dirname(ANALYSIS_REPORT_FILE);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

/**
 * 解析覆盖率报告
 * @returns {object} 解析后的覆盖率数据
 */
function parseCoverageReport() {
  const coverageSummaryPath = path.join(
    __dirname,
    '../coverage/coverage-summary.json',
  );

  if (!fs.existsSync(coverageSummaryPath)) {
    throw new Error('覆盖率报告文件不存在，请先运行 pnpm test:coverage');
  }

  const coverageSummary = JSON.parse(
    fs.readFileSync(coverageSummaryPath, 'utf8'),
  );
  return coverageSummary;
}

/**
 * 扫描组件文件
 * @returns {object} 组件文件信息
 */
function scanComponentFiles() {
  const componentsDir = path.join(__dirname, '../src/components');
  const componentFiles = {};

  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        // 跳过测试目录
        if (item !== '__tests__' && item !== 'tests') {
          scanDirectory(fullPath, itemRelativePath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        // 跳过测试文件和类型定义文件
        if (
          !item.includes('.test.') &&
          !item.includes('.spec.') &&
          !item.endsWith('.d.ts')
        ) {
          const componentName = path.basename(item, path.extname(item));
          const category = relativePath.split(path.sep)[0] || 'root';

          componentFiles[itemRelativePath] = {
            name: componentName,
            category: category,
            fullPath: fullPath,
            relativePath: itemRelativePath,
            size: fs.statSync(fullPath).size,
          };
        }
      }
    });
  }

  scanDirectory(componentsDir);
  return componentFiles;
}

/**
 * 分析组件覆盖率
 * @param {object} coverageData - 覆盖率数据
 * @param {object} componentFiles - 组件文件信息
 * @returns {object} 分析结果
 */
function analyzeComponentCoverage(coverageData, componentFiles) {
  const analysis = {
    summary: {
      totalComponents: 0,
      coveredComponents: 0,
      uncoveredComponents: 0,
      averageCoverage: 0,
    },
    categories: {},
    priorities: {},
    uncoveredComponents: [],
    lowCoverageComponents: [],
    recommendations: [],
  };

  // 初始化分类统计
  const categories = [
    'ui',
    'layout',
    'home',
    'i18n',
    'theme',
    'shared',
    'forms',
    'contact',
    'examples',
  ];
  categories.forEach((cat) => {
    analysis.categories[cat] = {
      total: 0,
      covered: 0,
      uncovered: 0,
      averageCoverage: 0,
      components: [],
    };
  });

  // 初始化优先级统计
  Object.keys(COMPONENT_PRIORITY_CONFIG).forEach((priority) => {
    analysis.priorities[priority] = {
      ...COMPONENT_PRIORITY_CONFIG[priority],
      total: 0,
      covered: 0,
      uncovered: 0,
      averageCoverage: 0,
      components: [],
    };
  });

  let totalCoverage = 0;
  let componentCount = 0;

  // 分析每个组件文件
  Object.entries(componentFiles).forEach(([filePath, fileInfo]) => {
    // 尝试多种路径格式匹配覆盖率数据
    const possibleKeys = [
      `src/components/${filePath}`,
      `/Users/Data/Warehouse/Focus/tucsenberg-web-frontier/src/components/${filePath}`,
      fileInfo.fullPath,
    ];

    let coverage = null;
    for (const key of possibleKeys) {
      if (coverageData[key]) {
        coverage = coverageData[key];
        break;
      }
    }

    analysis.summary.totalComponents++;
    componentCount++;

    const componentAnalysis = {
      ...fileInfo,
      coverage: coverage
        ? {
            lines: coverage.lines.pct,
            branches: coverage.branches.pct,
            functions: coverage.functions.pct,
            statements: coverage.statements.pct,
            average:
              (coverage.lines.pct +
                coverage.branches.pct +
                coverage.functions.pct +
                coverage.statements.pct) /
              4,
          }
        : null,
      hasCoverage: !!coverage,
      hasTests: checkIfHasTests(fileInfo.name, fileInfo.category),
      priority: getComponentPriority(fileInfo.name),
    };

    // 更新分类统计
    const category = fileInfo.category;
    if (analysis.categories[category]) {
      analysis.categories[category].total++;
      analysis.categories[category].components.push(componentAnalysis);

      if (componentAnalysis.hasCoverage) {
        analysis.categories[category].covered++;
        analysis.categories[category].averageCoverage +=
          componentAnalysis.coverage.average;
      } else {
        analysis.categories[category].uncovered++;
      }
    }

    // 更新优先级统计
    const priorityInfo = componentAnalysis.priority;
    if (priorityInfo && analysis.priorities[priorityInfo.category]) {
      analysis.priorities[priorityInfo.category].total++;
      analysis.priorities[priorityInfo.category].components.push(
        componentAnalysis,
      );

      if (componentAnalysis.hasCoverage) {
        analysis.priorities[priorityInfo.category].covered++;
        analysis.priorities[priorityInfo.category].averageCoverage +=
          componentAnalysis.coverage.average;
        totalCoverage += componentAnalysis.coverage.average;
      } else {
        analysis.priorities[priorityInfo.category].uncovered++;
      }
    }

    // 识别未覆盖和低覆盖组件
    if (!componentAnalysis.hasCoverage) {
      analysis.summary.uncoveredComponents++;
      analysis.uncoveredComponents.push(componentAnalysis);
    } else {
      analysis.summary.coveredComponents++;
      if (componentAnalysis.coverage.average < 60) {
        analysis.lowCoverageComponents.push(componentAnalysis);
      }
    }
  });

  // 计算平均覆盖率
  analysis.summary.averageCoverage =
    componentCount > 0 ? totalCoverage / componentCount : 0;

  // 计算分类平均覆盖率
  Object.keys(analysis.categories).forEach((category) => {
    const cat = analysis.categories[category];
    if (cat.covered > 0) {
      cat.averageCoverage = cat.averageCoverage / cat.covered;
    }
  });

  // 计算优先级平均覆盖率
  Object.keys(analysis.priorities).forEach((priority) => {
    const pri = analysis.priorities[priority];
    if (pri.covered > 0) {
      pri.averageCoverage = pri.averageCoverage / pri.covered;
    }
  });

  // 生成建议
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

/**
 * 检查组件是否有测试
 * @param {string} componentName - 组件名称
 * @param {string} category - 组件分类
 * @returns {boolean} 是否有测试
 */
function checkIfHasTests(componentName, category) {
  const testPaths = [
    path.join(
      __dirname,
      `../src/components/${category}/__tests__/${componentName}.test.tsx`,
    ),
    path.join(
      __dirname,
      `../src/components/${category}/__tests__/${componentName}.test.ts`,
    ),
    path.join(
      __dirname,
      `../src/components/${category}/__tests__/${componentName}.spec.tsx`,
    ),
    path.join(
      __dirname,
      `../src/components/${category}/__tests__/${componentName}.spec.ts`,
    ),
    path.join(
      __dirname,
      `../tests/components/${category}/${componentName}.test.tsx`,
    ),
    path.join(
      __dirname,
      `../tests/components/${category}/${componentName}.test.ts`,
    ),
  ];

  return testPaths.some((testPath) => fs.existsSync(testPath));
}

/**
 * 获取组件优先级
 * @param {string} componentName - 组件名称
 * @returns {object|null} 优先级信息
 */
function getComponentPriority(componentName) {
  for (const [category, config] of Object.entries(COMPONENT_PRIORITY_CONFIG)) {
    if (
      config.components.some(
        (comp) => componentName.includes(comp) || comp.includes(componentName),
      )
    ) {
      return {
        category: category,
        priority: config.priority,
        targetCoverage: config.targetCoverage,
        description: config.description,
      };
    }
  }

  return {
    category: 'other',
    priority: 6,
    targetCoverage: 50,
    description: '其他组件',
  };
}

/**
 * 生成改进建议
 * @param {object} analysis - 分析结果
 * @returns {array} 建议列表
 */
function generateRecommendations(analysis) {
  const recommendations = [];

  // 按优先级排序未覆盖组件
  const sortedUncovered = analysis.uncoveredComponents.sort((a, b) => {
    return a.priority.priority - b.priority.priority;
  });

  // 高优先级未覆盖组件建议
  const highPriorityUncovered = sortedUncovered.filter(
    (comp) => comp.priority.priority <= 2,
  );
  if (highPriorityUncovered.length > 0) {
    recommendations.push({
      type: 'critical',
      priority: 'high',
      title: '高优先级组件缺少测试',
      description: `${highPriorityUncovered.length}个高优先级组件缺少测试覆盖`,
      components: highPriorityUncovered.map((comp) => comp.name),
      action: '立即为这些核心组件添加测试用例',
    });
  }

  // 低覆盖率组件建议
  const criticalLowCoverage = analysis.lowCoverageComponents.filter(
    (comp) => comp.coverage.average < 40 && comp.priority.priority <= 3,
  );
  if (criticalLowCoverage.length > 0) {
    recommendations.push({
      type: 'warning',
      priority: 'medium',
      title: '重要组件覆盖率过低',
      description: `${criticalLowCoverage.length}个重要组件覆盖率低于40%`,
      components: criticalLowCoverage.map(
        (comp) => `${comp.name} (${comp.coverage.average.toFixed(1)}%)`,
      ),
      action: '增加测试用例以提高覆盖率',
    });
  }

  // 分类覆盖率建议
  Object.entries(analysis.categories).forEach(([category, data]) => {
    if (data.total > 0 && data.averageCoverage < 50) {
      recommendations.push({
        type: 'info',
        priority: 'low',
        title: `${category}分类覆盖率偏低`,
        description: `${category}分类平均覆盖率${data.averageCoverage.toFixed(1)}%，低于50%目标`,
        action: `重点关注${category}分类的测试补充`,
      });
    }
  });

  // 整体目标建议
  if (analysis.summary.averageCoverage < 60) {
    recommendations.push({
      type: 'goal',
      priority: 'medium',
      title: '组件整体覆盖率提升计划',
      description: `当前组件平均覆盖率${analysis.summary.averageCoverage.toFixed(1)}%，目标60%`,
      action: '按优先级逐步补充测试用例，预计需要新增50-80个测试用例',
    });
  }

  return recommendations;
}

/**
 * 生成优先级任务列表
 * @param {object} analysis - 分析结果
 * @returns {array} 任务列表
 */
function generatePriorityTasks(analysis) {
  const tasks = [];

  // 按优先级分组未覆盖组件
  const uncoveredByPriority = {};
  analysis.uncoveredComponents.forEach((comp) => {
    const priority = comp.priority.category;
    if (!uncoveredByPriority[priority]) {
      uncoveredByPriority[priority] = [];
    }
    uncoveredByPriority[priority].push(comp);
  });

  // 生成优先级任务
  Object.entries(COMPONENT_PRIORITY_CONFIG).forEach(([category, config]) => {
    const uncovered = uncoveredByPriority[category] || [];
    const covered =
      analysis.priorities[category]?.components.filter((c) => c.hasCoverage) ||
      [];
    const lowCoverage = covered.filter(
      (c) => c.coverage.average < config.targetCoverage,
    );

    if (uncovered.length > 0 || lowCoverage.length > 0) {
      tasks.push({
        category: category,
        priority: config.priority,
        description: config.description,
        targetCoverage: config.targetCoverage,
        uncoveredCount: uncovered.length,
        lowCoverageCount: lowCoverage.length,
        uncoveredComponents: uncovered.map((c) => c.name),
        lowCoverageComponents: lowCoverage.map((c) => ({
          name: c.name,
          currentCoverage: c.coverage.average.toFixed(1),
        })),
        estimatedEffort: calculateEffort(uncovered.length, lowCoverage.length),
      });
    }
  });

  return tasks.sort((a, b) => a.priority - b.priority);
}

/**
 * 计算预估工作量
 * @param {number} uncoveredCount - 未覆盖组件数量
 * @param {number} lowCoverageCount - 低覆盖率组件数量
 * @returns {object} 工作量估算
 */
function calculateEffort(uncoveredCount, lowCoverageCount) {
  const newTestsNeeded = uncoveredCount * 8; // 每个组件平均8个测试用例
  const additionalTestsNeeded = lowCoverageCount * 4; // 每个低覆盖率组件平均4个额外测试用例
  const totalTests = newTestsNeeded + additionalTestsNeeded;
  const estimatedHours = totalTests * 0.5; // 每个测试用例平均0.5小时

  return {
    newTests: newTestsNeeded,
    additionalTests: additionalTestsNeeded,
    totalTests: totalTests,
    estimatedHours: estimatedHours,
    estimatedDays: Math.ceil(estimatedHours / 8),
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始组件测试覆盖率分析...\n');

  ensureReportsDirectory();

  try {
    // 1. 解析覆盖率报告
    console.log('📊 解析覆盖率报告...');
    const coverageData = parseCoverageReport();

    // 2. 扫描组件文件
    console.log('📁 扫描组件文件...');
    const componentFiles = scanComponentFiles();

    // 3. 分析组件覆盖率
    console.log('🔬 分析组件覆盖率...');
    const analysis = analyzeComponentCoverage(coverageData, componentFiles);

    // 4. 生成优先级任务
    console.log('📋 生成优先级任务...');
    const priorityTasks = generatePriorityTasks(analysis);

    // 5. 生成完整报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: analysis.summary,
      categories: analysis.categories,
      priorities: analysis.priorities,
      uncoveredComponents: analysis.uncoveredComponents,
      lowCoverageComponents: analysis.lowCoverageComponents,
      recommendations: analysis.recommendations,
      priorityTasks: priorityTasks,
    };

    // 保存报告
    fs.writeFileSync(ANALYSIS_REPORT_FILE, JSON.stringify(report, null, 2));

    // 输出总结
    console.log('\n📋 组件覆盖率分析总结:');
    console.log(`   总组件数: ${analysis.summary.totalComponents}`);
    console.log(`   已覆盖: ${analysis.summary.coveredComponents}`);
    console.log(`   未覆盖: ${analysis.summary.uncoveredComponents}`);
    console.log(
      `   平均覆盖率: ${analysis.summary.averageCoverage.toFixed(1)}%`,
    );

    console.log('\n🎯 优先级任务:');
    priorityTasks.slice(0, 3).forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.description}`);
      console.log(
        `      未覆盖: ${task.uncoveredCount}个, 低覆盖: ${task.lowCoverageCount}个`,
      );
      console.log(
        `      预估工作量: ${task.estimatedEffort.estimatedDays}天 (${task.estimatedEffort.totalTests}个测试用例)`,
      );
    });

    console.log('\n💡 关键建议:');
    analysis.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(
        `   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`,
      );
      console.log(`      ${rec.description}`);
    });

    console.log(`\n📄 详细报告已保存到: ${ANALYSIS_REPORT_FILE}`);
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 组件覆盖率分析执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  parseCoverageReport,
  scanComponentFiles,
  analyzeComponentCoverage,
  generatePriorityTasks,
  COMPONENT_PRIORITY_CONFIG,
};
