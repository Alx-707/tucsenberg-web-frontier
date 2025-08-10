#!/usr/bin/env node

/**
 * 新工具集成脚本
 *
 * 功能：
 * 1. 将新安装的工具集成到相关任务的automatedChecks配置中
 * 2. 更新相关任务的verificationCriteria
 * 3. 确保工具配置与任务的技术要求匹配
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const TASKS_FILE = path.join(process.cwd(), 'docs/data/tasks.json');
const BACKUP_DIR = path.join(process.cwd(), 'docs/data/backups');

// 新工具配置映射
const NEW_TOOLS_MAPPING = {
  // 可访问性测试工具
  accessibility: {
    tools: ['axe-core', '@axe-core/playwright', 'jest-axe'],
    taskPatterns: ['可访问性', 'accessibility', 'a11y', 'WCAG'],
    taskIds: ['p2-accessibility-enhanced-003'],
  },

  // SEO自动化检查工具
  seo: {
    tools: ['lighthouse', 'lighthouse-ci', '@lhci/cli'],
    taskPatterns: ['SEO', 'lighthouse', '搜索引擎', 'metadata'],
    taskIds: ['p2-seo-automation-005'],
  },

  // 性能监控工具
  performance: {
    tools: ['lighthouse', 'lighthouse-ci'],
    taskPatterns: ['性能', 'performance', 'Web Vitals', '监控'],
    taskIds: [
      'p3-advanced-performance-003',
      '78fe619b-179a-44d1-af4d-a1787178f163',
    ],
  },

  // 链接和图片优化检查工具
  optimization: {
    tools: ['broken-link-checker', 'imagemin-cli', 'sharp'],
    taskPatterns: ['链接', 'link', '图片', 'image', '优化', 'optimization'],
    taskIds: ['p2-seo-automation-005'],
  },

  // 跨浏览器测试工具
  crossBrowser: {
    tools: ['@playwright/test'],
    taskPatterns: ['跨浏览器', 'cross-browser', '浏览器兼容'],
    taskIds: [
      'p2-cross-browser-testing-001',
      '005fc1bd-fbab-472f-bdab-40221ff780f1',
    ],
  },

  // 响应式测试工具
  responsive: {
    tools: ['@playwright/test'],
    taskPatterns: ['响应式', 'responsive', '视口', 'viewport'],
    taskIds: ['p2-responsive-testing-002'],
  },
};

/**
 * 创建备份
 */
function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(
    BACKUP_DIR,
    `tasks-tools-integration-${timestamp}.json`,
  );

  const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  fs.writeFileSync(backupFile, JSON.stringify(tasksData, null, 2));

  console.log(`📦 备份已创建: ${backupFile}`);
  return backupFile;
}

/**
 * 检查任务是否匹配工具类型
 */
function isTaskMatchingToolType(task, toolType) {
  const config = NEW_TOOLS_MAPPING[toolType];

  // 检查任务ID是否在指定列表中
  if (config.taskIds.includes(task.id)) {
    return true;
  }

  // 检查任务名称或描述是否包含相关关键词
  const taskText = `${task.name} ${task.description}`.toLowerCase();
  return config.taskPatterns.some((pattern) =>
    taskText.includes(pattern.toLowerCase()),
  );
}

/**
 * 集成工具到任务配置
 */
function integrateToolsToTask(task, toolType) {
  const config = NEW_TOOLS_MAPPING[toolType];

  if (!task.qualityAssurance || !task.qualityAssurance.automatedChecks) {
    return false;
  }

  const automatedChecks = task.qualityAssurance.automatedChecks;
  let toolsAdded = 0;

  // 添加新工具到tools数组
  config.tools.forEach((tool) => {
    if (!automatedChecks.tools.includes(tool)) {
      automatedChecks.tools.push(tool);
      toolsAdded++;
    }
  });

  // 根据工具类型调整配置
  if (toolsAdded > 0) {
    switch (toolType) {
      case 'accessibility':
        automatedChecks.estimatedTime = '90-150秒';
        break;
      case 'seo':
        automatedChecks.estimatedTime = '120-180秒';
        break;
      case 'performance':
        automatedChecks.estimatedTime = '90-150秒';
        break;
      case 'optimization':
        automatedChecks.estimatedTime = '60-120秒';
        break;
      case 'crossBrowser':
      case 'responsive':
        automatedChecks.estimatedTime = '120-240秒';
        break;
    }
  }

  return toolsAdded > 0;
}

/**
 * 更新任务的验证标准
 */
function updateVerificationCriteria(task, toolTypes) {
  if (!task.verificationCriteria) {
    return false;
  }

  let updated = false;
  let criteria = task.verificationCriteria;

  toolTypes.forEach((toolType) => {
    switch (toolType) {
      case 'accessibility':
        if (!criteria.includes('axe-core')) {
          criteria +=
            '\n\n**可访问性工具验证**：\n- [ ] axe-core自动化检查通过\n- [ ] @axe-core/playwright集成正常\n- [ ] jest-axe单元测试通过';
          updated = true;
        }
        break;

      case 'seo':
        if (!criteria.includes('lighthouse-ci')) {
          criteria +=
            '\n\n**SEO工具验证**：\n- [ ] lighthouse评分≥90分\n- [ ] lighthouse-ci自动化检查通过\n- [ ] @lhci/cli配置正确';
          updated = true;
        }
        break;

      case 'performance':
        if (!criteria.includes('Web Vitals')) {
          criteria +=
            '\n\n**性能工具验证**：\n- [ ] lighthouse性能评分≥90分\n- [ ] Web Vitals指标达标\n- [ ] 性能回归检测正常';
          updated = true;
        }
        break;

      case 'optimization':
        if (!criteria.includes('broken-link-checker')) {
          criteria +=
            '\n\n**优化工具验证**：\n- [ ] broken-link-checker链接检查通过\n- [ ] imagemin-cli图片优化正常\n- [ ] sharp图片处理功能正常';
          updated = true;
        }
        break;

      case 'crossBrowser':
        if (!criteria.includes('跨浏览器兼容性')) {
          criteria +=
            '\n\n**跨浏览器工具验证**：\n- [ ] Playwright多浏览器测试通过\n- [ ] 跨浏览器兼容性100%\n- [ ] 浏览器特定问题数量=0';
          updated = true;
        }
        break;

      case 'responsive':
        if (!criteria.includes('响应式设计')) {
          criteria +=
            '\n\n**响应式工具验证**：\n- [ ] Playwright视口测试通过\n- [ ] 响应式设计兼容性100%\n- [ ] 布局一致性检查通过';
          updated = true;
        }
        break;
    }
  });

  if (updated) {
    task.verificationCriteria = criteria;
  }

  return updated;
}

/**
 * 主集成函数
 */
function integrateNewTools() {
  console.log('🔧 开始集成新工具到QA配置...\n');

  try {
    // 创建备份
    createBackup();

    // 读取任务文件
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    const tasks = tasksData.tasks;

    const integrationResults = {
      totalTasks: tasks.length,
      tasksModified: 0,
      toolsAdded: 0,
      criteriaUpdated: 0,
      details: [],
    };

    // 遍历所有任务
    tasks.forEach((task) => {
      const matchingToolTypes = [];
      let taskModified = false;
      let toolsAddedToTask = 0;

      // 检查任务匹配哪些工具类型
      Object.keys(NEW_TOOLS_MAPPING).forEach((toolType) => {
        if (isTaskMatchingToolType(task, toolType)) {
          matchingToolTypes.push(toolType);
        }
      });

      if (matchingToolTypes.length > 0) {
        // 集成工具
        matchingToolTypes.forEach((toolType) => {
          if (integrateToolsToTask(task, toolType)) {
            taskModified = true;
            toolsAddedToTask += NEW_TOOLS_MAPPING[toolType].tools.length;
          }
        });

        // 更新验证标准
        if (updateVerificationCriteria(task, matchingToolTypes)) {
          taskModified = true;
          integrationResults.criteriaUpdated++;
        }

        if (taskModified) {
          integrationResults.tasksModified++;
          integrationResults.toolsAdded += toolsAddedToTask;
          integrationResults.details.push({
            taskName: task.name,
            taskId: task.id,
            toolTypes: matchingToolTypes,
            toolsAdded: toolsAddedToTask,
          });
        }
      }
    });

    // 保存修改后的文件
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksData, null, 2));

    // 输出结果
    console.log('📊 工具集成结果:');
    console.log(
      `✅ 修改任务数: ${integrationResults.tasksModified}/${integrationResults.totalTasks}`,
    );
    console.log(`🔧 添加工具数: ${integrationResults.toolsAdded}`);
    console.log(`📝 更新验证标准: ${integrationResults.criteriaUpdated}个任务`);

    if (integrationResults.details.length > 0) {
      console.log('\n📋 详细修改列表:');
      integrationResults.details.forEach((detail, index) => {
        console.log(`\n${index + 1}. ${detail.taskName}`);
        console.log(`   工具类型: ${detail.toolTypes.join(', ')}`);
        console.log(`   添加工具: ${detail.toolsAdded}个`);
      });
    }

    console.log('\n✅ 工具集成完成!');
    return integrationResults;
  } catch (error) {
    console.error('❌ 工具集成过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 执行集成
if (require.main === module) {
  integrateNewTools();
}

module.exports = {
  integrateNewTools,
  NEW_TOOLS_MAPPING,
};
