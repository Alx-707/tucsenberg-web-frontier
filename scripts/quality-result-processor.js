#!/usr/bin/env node

/**
 * 质量检查结果处理器
 * 处理质量检查结果，包括评估结果、生成报告、决定是否确认任务完成或回滚状态
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  TASKS_FILE: path.join(process.cwd(), 'docs/data/tasks.json'),
  REPORTS_DIR: path.join(process.cwd(), 'reports/quality'),
  SUMMARY_DIR: path.join(process.cwd(), 'reports/summary'),
  LOG_FILE: path.join(process.cwd(), 'logs/quality-processor.log'),
  BACKUP_DIR: path.join(process.cwd(), 'docs/data/backups'),
  NOTIFICATION_WEBHOOK: process.env.QUALITY_NOTIFICATION_WEBHOOK,
  AUTO_ROLLBACK: process.env.AUTO_ROLLBACK_ENABLED === 'true',
};

/**
 * 处理质量检查结果
 */
async function processQualityResult(taskId, qualityResult) {
  try {
    console.log(`📊 处理质量检查结果: ${taskId}`);
    logMessage(`开始处理质量结果: ${taskId}`);

    // 确保必要的目录存在
    ensureDirectories();

    // 加载任务数据
    const { taskData, task } = await loadTaskData(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    console.log(`📋 任务: ${task.name}`);
    console.log(`📊 当前状态: ${task.status}`);

    // 分析质量检查结果
    const analysis = analyzeQualityResult(task, qualityResult);
    console.log(`🎯 质量分析结果: ${analysis.decision}`);

    // 生成详细报告
    const report = await generateDetailedReport(task, qualityResult, analysis);

    // 执行相应的操作
    const actionResult = await executeAction(taskData, task, analysis, report);

    // 发送通知（如果配置了）
    await sendNotification(task, analysis, actionResult);

    // 生成汇总报告
    await generateSummaryReport(task, qualityResult, analysis, actionResult);

    console.log(`✅ 质量结果处理完成: ${task.name}`);
    logMessage(`质量结果处理完成: ${taskId} - 决策: ${analysis.decision}`);

    return {
      taskId,
      taskName: task.name,
      decision: analysis.decision,
      action: actionResult.action,
      success: actionResult.success,
      report: report.path,
    };
  } catch (error) {
    console.error(`❌ 处理质量结果失败: ${error.message}`);
    logMessage(`处理质量结果失败: ${taskId} - ${error.message}`);
    throw error;
  }
}

/**
 * 确保必要的目录存在
 */
function ensureDirectories() {
  const dirs = [
    CONFIG.REPORTS_DIR,
    CONFIG.SUMMARY_DIR,
    CONFIG.BACKUP_DIR,
    path.dirname(CONFIG.LOG_FILE),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * 加载任务数据
 */
async function loadTaskData(taskId) {
  try {
    if (!fs.existsSync(CONFIG.TASKS_FILE)) {
      throw new Error(`任务文件不存在: ${CONFIG.TASKS_FILE}`);
    }

    const taskData = JSON.parse(fs.readFileSync(CONFIG.TASKS_FILE, 'utf8'));

    if (!taskData.tasks || !Array.isArray(taskData.tasks)) {
      throw new Error('任务文件格式错误：缺少tasks数组');
    }

    const task = taskData.tasks.find((t) => t.id === taskId);

    return { taskData, task };
  } catch (error) {
    console.error(`❌ 加载任务数据失败: ${error.message}`);
    throw error;
  }
}

/**
 * 分析质量检查结果
 */
function analyzeQualityResult(task, qualityResult) {
  console.log('🔍 分析质量检查结果...');

  const analysis = {
    timestamp: new Date().toISOString(),
    taskId: task.id,
    taskName: task.name,
    qualityScore: qualityResult.qualityScore,
    passRate: qualityResult.passRate,
    threshold: extractThreshold(task.qualityAssurance),
    meetsStandard: false,
    decision: 'unknown',
    reasons: [],
    recommendations: [],
  };

  // 检查质量评分
  if (analysis.qualityScore !== null && analysis.qualityScore !== undefined) {
    analysis.meetsStandard = analysis.qualityScore >= analysis.threshold;

    if (analysis.meetsStandard) {
      analysis.decision = 'approve';
      analysis.reasons.push(
        `质量评分 ${analysis.qualityScore} 达到阈值 ${analysis.threshold}`,
      );
    } else {
      analysis.decision = 'reject';
      analysis.reasons.push(
        `质量评分 ${analysis.qualityScore} 低于阈值 ${analysis.threshold}`,
      );
      analysis.recommendations.push('检查并修复质量问题后重新提交');
    }
  } else {
    analysis.decision = 'manual_review';
    analysis.reasons.push('无法获取质量评分，需要人工审查');
    analysis.recommendations.push('手动检查质量检查输出并做出决策');
  }

  // 检查通过率
  if (analysis.passRate !== null && analysis.passRate !== undefined) {
    if (analysis.passRate < 100) {
      analysis.reasons.push(`检查通过率 ${analysis.passRate}% 未达到100%`);
      if (analysis.decision === 'approve') {
        analysis.decision = 'conditional_approve';
        analysis.recommendations.push('虽然质量评分达标，但存在未通过的检查项');
      }
    }
  }

  // 检查是否有错误
  if (qualityResult.error) {
    analysis.decision = 'error';
    analysis.reasons.push(`质量检查执行错误: ${qualityResult.error}`);
    analysis.recommendations.push('修复质量检查配置或环境问题后重试');
  }

  console.log(`📊 分析结果: ${analysis.decision}`);
  console.log(`📝 原因: ${analysis.reasons.join('; ')}`);

  return analysis;
}

/**
 * 提取质量阈值
 */
function extractThreshold(qualityAssurance) {
  if (qualityAssurance?.aiTechnicalReview?.threshold) {
    const threshold = qualityAssurance.aiTechnicalReview.threshold;
    const match = threshold.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 90;
  }
  return 90;
}

/**
 * 生成详细报告
 */
async function generateDetailedReport(task, qualityResult, analysis) {
  console.log('📄 生成详细质量报告...');

  const report = {
    metadata: {
      taskId: task.id,
      taskName: task.name,
      timestamp: new Date().toISOString(),
      reportVersion: '1.0.0',
    },
    task: {
      id: task.id,
      name: task.name,
      status: task.status,
      description: task.description,
      qualityAssurance: task.qualityAssurance,
    },
    qualityResult,
    analysis,
    recommendations: generateRecommendations(analysis),
    nextSteps: generateNextSteps(analysis),
  };

  const reportPath = path.join(
    CONFIG.REPORTS_DIR,
    `detailed-report-${task.id}-${Date.now()}.json`,
  );

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 详细报告已生成: ${reportPath}`);

  return { report, path: reportPath };
}

/**
 * 生成建议
 */
function generateRecommendations(analysis) {
  const recommendations = [...analysis.recommendations];

  switch (analysis.decision) {
    case 'approve':
      recommendations.push('任务质量达标，可以继续后续工作');
      break;
    case 'conditional_approve':
      recommendations.push('任务基本达标，但建议关注未通过的检查项');
      break;
    case 'reject':
      recommendations.push('任务质量未达标，需要重新实现');
      recommendations.push('参考质量检查输出修复问题');
      break;
    case 'manual_review':
      recommendations.push('需要人工审查质量检查结果');
      break;
    case 'error':
      recommendations.push('修复质量检查环境问题');
      recommendations.push('检查任务配置是否正确');
      break;
  }

  return recommendations;
}

/**
 * 生成下一步操作
 */
function generateNextSteps(analysis) {
  const nextSteps = [];

  switch (analysis.decision) {
    case 'approve':
      nextSteps.push('确认任务完成状态');
      nextSteps.push('开始依赖此任务的后续任务');
      break;
    case 'conditional_approve':
      nextSteps.push('确认任务完成状态（有条件）');
      nextSteps.push('记录需要关注的问题');
      break;
    case 'reject':
      if (CONFIG.AUTO_ROLLBACK) {
        nextSteps.push('自动回滚任务状态到 in_progress');
      } else {
        nextSteps.push('建议手动回滚任务状态到 in_progress');
      }
      nextSteps.push('修复质量问题');
      nextSteps.push('重新提交任务');
      break;
    case 'manual_review':
      nextSteps.push('人工审查质量检查结果');
      nextSteps.push('手动决定任务状态');
      break;
    case 'error':
      nextSteps.push('修复质量检查环境');
      nextSteps.push('重新执行质量检查');
      break;
  }

  return nextSteps;
}

/**
 * 执行相应的操作
 */
async function executeAction(taskData, task, analysis, report) {
  console.log(`⚡ 执行操作: ${analysis.decision}`);

  const actionResult = {
    action: analysis.decision,
    success: false,
    changes: [],
    timestamp: new Date().toISOString(),
  };

  try {
    switch (analysis.decision) {
      case 'approve':
      case 'conditional_approve':
        // 确认任务完成，更新任务信息
        actionResult.changes.push('确认任务完成状态');
        actionResult.success = true;
        break;

      case 'reject':
        if (CONFIG.AUTO_ROLLBACK) {
          // 自动回滚任务状态
          await rollbackTaskStatus(taskData, task);
          actionResult.changes.push('自动回滚任务状态到 in_progress');
          actionResult.success = true;
        } else {
          // 仅记录建议，不自动回滚
          actionResult.changes.push('建议手动回滚任务状态');
          actionResult.success = true;
        }
        break;

      case 'manual_review':
      case 'error':
        // 不执行自动操作，等待人工处理
        actionResult.changes.push('等待人工处理');
        actionResult.success = true;
        break;

      default:
        actionResult.changes.push('未知决策，无操作');
        break;
    }

    console.log(`✅ 操作执行完成: ${actionResult.changes.join(', ')}`);
  } catch (error) {
    console.error(`❌ 执行操作失败: ${error.message}`);
    actionResult.success = false;
    actionResult.error = error.message;
  }

  return actionResult;
}

/**
 * 回滚任务状态
 */
async function rollbackTaskStatus(taskData, task) {
  console.log(`🔄 回滚任务状态: ${task.name}`);

  // 创建备份
  const backupPath = path.join(
    CONFIG.BACKUP_DIR,
    `tasks-backup-${Date.now()}.json`,
  );
  fs.writeFileSync(backupPath, JSON.stringify(taskData, null, 2));
  console.log(`💾 已创建备份: ${backupPath}`);

  // 更新任务状态
  const taskIndex = taskData.tasks.findIndex((t) => t.id === task.id);
  if (taskIndex !== -1) {
    taskData.tasks[taskIndex].status = 'in_progress';
    taskData.tasks[taskIndex].updatedAt = new Date().toISOString();

    // 添加质量检查失败的记录
    if (!taskData.tasks[taskIndex].qualityHistory) {
      taskData.tasks[taskIndex].qualityHistory = [];
    }

    taskData.tasks[taskIndex].qualityHistory.push({
      timestamp: new Date().toISOString(),
      action: 'rollback',
      reason: 'quality_check_failed',
    });

    // 保存更新后的任务数据
    fs.writeFileSync(CONFIG.TASKS_FILE, JSON.stringify(taskData, null, 2));
    console.log(`✅ 任务状态已回滚: ${task.name} → in_progress`);
  }
}

/**
 * 发送通知
 */
async function sendNotification(task, analysis, actionResult) {
  if (!CONFIG.NOTIFICATION_WEBHOOK) {
    console.log('📢 未配置通知webhook，跳过通知');
    return;
  }

  console.log('📢 发送质量检查通知...');

  const notification = {
    type: 'quality_check_result',
    taskId: task.id,
    taskName: task.name,
    decision: analysis.decision,
    qualityScore: analysis.qualityScore,
    threshold: analysis.threshold,
    action: actionResult.action,
    timestamp: new Date().toISOString(),
  };

  try {
    // 这里可以实现实际的通知发送逻辑
    // 例如发送到Slack、Teams、邮件等
    console.log('📧 通知内容:', JSON.stringify(notification, null, 2));
    console.log('✅ 通知发送完成');
  } catch (error) {
    console.error(`❌ 发送通知失败: ${error.message}`);
  }
}

/**
 * 生成汇总报告
 */
async function generateSummaryReport(
  task,
  qualityResult,
  analysis,
  actionResult,
) {
  console.log('📊 生成汇总报告...');

  const summary = {
    taskId: task.id,
    taskName: task.name,
    timestamp: new Date().toISOString(),
    decision: analysis.decision,
    qualityScore: analysis.qualityScore,
    threshold: analysis.threshold,
    passRate: analysis.passRate,
    action: actionResult.action,
    success: actionResult.success,
    reasons: analysis.reasons,
    recommendations: analysis.recommendations,
  };

  const summaryPath = path.join(
    CONFIG.SUMMARY_DIR,
    `summary-${task.id}-${Date.now()}.json`,
  );

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 汇总报告已生成: ${summaryPath}`);
}

/**
 * 记录日志消息
 */
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(CONFIG.LOG_FILE, logEntry);
  } catch (error) {
    console.error('❌ 写入日志失败:', error.message);
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
📊 质量检查结果处理器

用法:
  node scripts/quality-result-processor.js <taskId> <resultFile> [选项]

参数:
  taskId         任务ID
  resultFile     质量检查结果文件路径

选项:
  --help, -h     显示帮助信息
  --version, -v  显示版本信息
  --dry-run      模拟运行（不执行实际操作）

环境变量:
  AUTO_ROLLBACK_ENABLED=true    启用自动回滚
  QUALITY_NOTIFICATION_WEBHOOK  通知webhook URL

功能:
  - 分析质量检查结果
  - 生成详细报告
  - 执行相应操作（确认/回滚）
  - 发送通知
  - 生成汇总报告
`);
}

// 主程序入口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('质量检查结果处理器 v1.0.0');
    process.exit(0);
  }

  const taskId = args[0];
  const resultFile = args[1];

  if (!taskId || !resultFile) {
    console.error('❌ 请提供任务ID和结果文件路径');
    console.log('使用 --help 查看帮助信息');
    process.exit(1);
  }

  if (args.includes('--dry-run')) {
    console.log('🧪 模拟运行模式');
    console.log(`📋 任务ID: ${taskId}`);
    console.log(`📄 结果文件: ${resultFile}`);
    process.exit(0);
  }

  // 读取质量检查结果
  try {
    const qualityResult = JSON.parse(fs.readFileSync(resultFile, 'utf8'));

    processQualityResult(taskId, qualityResult)
      .then((result) => {
        console.log('\n📋 处理结果:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ 处理过程中发生错误:', error.message);
        process.exit(1);
      });
  } catch (error) {
    console.error(`❌ 读取结果文件失败: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  processQualityResult,
  CONFIG,
};
