#!/usr/bin/env node

/**
 * 质量检查触发器
 * 当任务完成时，读取任务的qualityAssurance配置并自动调用相应的质量检查流程
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// 配置
const CONFIG = {
  TASKS_FILE: path.join(process.cwd(), 'docs/data/tasks.json'),
  AI_REVIEW_SCRIPT: path.join(process.cwd(), 'scripts/ai-quality-review.js'),
  REPORTS_DIR: path.join(process.cwd(), 'reports/quality'),
  LOG_FILE: path.join(process.cwd(), 'logs/quality-trigger.log'),
  QUALITY_THRESHOLD: 90, // 默认质量阈值
  TIMEOUT: 600000, // 10分钟超时
};

/**
 * 主函数：触发指定任务的质量检查
 */
async function triggerQualityCheck(taskId) {
  try {
    console.log(`🚀 开始质量检查流程: ${taskId}`);
    logMessage(`开始质量检查: ${taskId}`);

    // 确保必要的目录存在
    ensureDirectories();

    // 查找并验证任务
    const task = await findAndValidateTask(taskId);
    if (!task) {
      throw new Error(`任务不存在或无效: ${taskId}`);
    }

    console.log(`📋 任务信息: ${task.name}`);
    console.log(`📊 状态: ${task.status}`);

    // 检查任务是否已完成
    if (task.status !== 'completed') {
      console.log(`⚠️  任务状态不是'completed'，当前状态: ${task.status}`);
      console.log('   跳过质量检查');
      return { success: false, reason: 'task_not_completed' };
    }

    // 检查是否有质量保证配置
    if (!task.qualityAssurance) {
      console.log('⚠️  任务没有质量保证配置，跳过质量检查');
      logMessage(`任务无质量保证配置: ${task.name} (${taskId})`);
      return { success: false, reason: 'no_quality_config' };
    }

    console.log('✅ 任务验证通过，开始执行质量检查...');

    // 执行质量检查流程
    const result = await executeQualityChecks(task);

    // 处理质量检查结果
    const finalResult = await processQualityResults(task, result);

    console.log(`🎯 质量检查完成: ${task.name}`);
    logMessage(
      `质量检查完成: ${task.name} (${taskId}) - 评分: ${result.qualityScore || 'N/A'}`,
    );

    return finalResult;
  } catch (error) {
    console.error(`❌ 质量检查失败: ${error.message}`);
    logMessage(`质量检查失败: ${taskId} - ${error.message}`);
    throw error;
  }
}

/**
 * 确保必要的目录存在
 */
function ensureDirectories() {
  const dirs = [CONFIG.REPORTS_DIR, path.dirname(CONFIG.LOG_FILE)];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * 查找并验证任务
 */
async function findAndValidateTask(taskId) {
  try {
    if (!fs.existsSync(CONFIG.TASKS_FILE)) {
      throw new Error(`任务文件不存在: ${CONFIG.TASKS_FILE}`);
    }

    const taskData = JSON.parse(fs.readFileSync(CONFIG.TASKS_FILE, 'utf8'));

    if (!taskData.tasks || !Array.isArray(taskData.tasks)) {
      throw new Error('任务文件格式错误：缺少tasks数组');
    }

    const task = taskData.tasks.find((t) => t.id === taskId);

    if (!task) {
      console.log(`❌ 未找到任务: ${taskId}`);
      console.log(`📋 可用任务列表:`);
      taskData.tasks.slice(0, 5).forEach((t) => {
        console.log(`   - ${t.id}: ${t.name}`);
      });
      if (taskData.tasks.length > 5) {
        console.log(`   ... 还有 ${taskData.tasks.length - 5} 个任务`);
      }
      return null;
    }

    return task;
  } catch (error) {
    console.error(`❌ 读取任务文件失败: ${error.message}`);
    throw error;
  }
}

/**
 * 执行质量检查流程
 */
async function executeQualityChecks(task) {
  console.log('🔄 执行质量检查流程...');

  const qualityConfig = task.qualityAssurance;

  // 显示质量检查配置信息
  if (qualityConfig.automatedChecks) {
    console.log(
      `📊 自动化检查工具: ${qualityConfig.automatedChecks.tools?.length || 0} 个`,
    );
    console.log(
      `🎯 通过标准: ${qualityConfig.automatedChecks.threshold || '未设置'}`,
    );
    console.log(
      `⏱️  预估时间: ${qualityConfig.automatedChecks.estimatedTime || '未设置'}`,
    );
  }

  if (qualityConfig.aiTechnicalReview) {
    console.log(
      `🤖 AI技术审查阈值: ${qualityConfig.aiTechnicalReview.threshold || '未设置'}`,
    );
  }

  try {
    // 检查AI质量审查脚本是否存在
    if (!fs.existsSync(CONFIG.AI_REVIEW_SCRIPT)) {
      throw new Error(`AI质量审查脚本不存在: ${CONFIG.AI_REVIEW_SCRIPT}`);
    }

    // 创建临时任务配置文件
    const tempConfigPath = path.join(
      process.cwd(),
      `temp-task-config-${task.id}.json`,
    );
    fs.writeFileSync(tempConfigPath, JSON.stringify(task, null, 2));

    console.log('⚡ 调用AI质量审查脚本...');

    let output = '';
    let qualityScore = null;
    let passRate = null;
    let success = false;

    try {
      // 调用AI质量审查脚本，传递任务配置文件路径
      output = execSync(
        `node "${CONFIG.AI_REVIEW_SCRIPT}" --task-config "${tempConfigPath}"`,
        {
          encoding: 'utf8',
          timeout: CONFIG.TIMEOUT,
        },
      );

      console.log('✅ AI质量审查执行完成');
      success = true;
    } catch (error) {
      // AI审查脚本可能因为评分不达标而返回错误码，但仍有有效输出
      console.log('📊 AI质量审查完成（可能评分不达标）');
      output = error.stdout || error.message;

      // 显示具体的错误信息
      if (error.stderr) {
        console.log('🔍 错误详情:', error.stderr);
      }
    } finally {
      // 清理临时文件
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
      }
    }

    // 尝试解析输出中的质量评分（无论是否成功）
    if (output) {
      qualityScore = extractQualityScore(output);
      passRate = extractPassRate(output);
    }

    return {
      success,
      qualityScore,
      passRate,
      output,
      error: success
        ? null
        : `AI质量审查评分${qualityScore || 'N/A'}分，未达到${task.qualityAssurance?.aiTechnicalReview?.threshold || '90分'}阈值`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ 执行质量检查时发生错误: ${error.message}`);

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 从输出中提取质量评分
 */
function extractQualityScore(output) {
  const scoreMatch = output.match(/质量评分[：:]\s*(\d+)/);
  return scoreMatch ? parseInt(scoreMatch[1], 10) : null;
}

/**
 * 从输出中提取通过率
 */
function extractPassRate(output) {
  const rateMatch = output.match(/检查通过率[：:]\s*(\d+)%/);
  return rateMatch ? parseInt(rateMatch[1], 10) : null;
}

/**
 * 处理质量检查结果
 */
async function processQualityResults(task, result) {
  console.log('📊 处理质量检查结果...');

  if (!result.success) {
    console.log(`❌ 质量检查执行失败: ${result.error}`);
    return {
      taskId: task.id,
      taskName: task.name,
      success: false,
      action: 'none',
      reason: 'quality_check_failed',
      error: result.error,
    };
  }

  const qualityScore = result.qualityScore;
  const threshold = extractThreshold(task.qualityAssurance);

  console.log(`📊 质量评分: ${qualityScore || 'N/A'}`);
  console.log(`🎯 要求阈值: ${threshold}`);
  console.log(`📈 检查通过率: ${result.passRate || 'N/A'}%`);

  // 判断是否达到质量标准
  const meetsStandard = qualityScore >= threshold;

  if (meetsStandard) {
    console.log('✅ 质量检查通过，任务确认完成');

    // 生成质量报告
    await generateQualityReport(task, result, 'passed');

    return {
      taskId: task.id,
      taskName: task.name,
      success: true,
      action: 'confirmed',
      qualityScore,
      threshold,
      passRate: result.passRate,
    };
  } else {
    console.log('❌ 质量检查未通过，建议回滚任务状态');

    // 生成质量报告
    await generateQualityReport(task, result, 'failed');

    // 注意：这里不自动回滚任务状态，而是建议人工处理
    console.log('⚠️  建议手动检查任务实现并重新提交');

    return {
      taskId: task.id,
      taskName: task.name,
      success: false,
      action: 'review_required',
      qualityScore,
      threshold,
      passRate: result.passRate,
      reason: 'quality_below_threshold',
    };
  }
}

/**
 * 提取质量阈值
 */
function extractThreshold(qualityAssurance) {
  if (qualityAssurance.aiTechnicalReview?.threshold) {
    const threshold = qualityAssurance.aiTechnicalReview.threshold;
    const match = threshold.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : CONFIG.QUALITY_THRESHOLD;
  }
  return CONFIG.QUALITY_THRESHOLD;
}

/**
 * 生成质量报告
 */
async function generateQualityReport(task, result, status) {
  try {
    const reportData = {
      taskId: task.id,
      taskName: task.name,
      status,
      timestamp: new Date().toISOString(),
      qualityScore: result.qualityScore,
      passRate: result.passRate,
      threshold: extractThreshold(task.qualityAssurance),
      qualityAssurance: task.qualityAssurance,
      output: result.output,
    };

    const reportPath = path.join(
      CONFIG.REPORTS_DIR,
      `quality-report-${task.id}-${Date.now()}.json`,
    );

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 质量报告已生成: ${reportPath}`);
  } catch (error) {
    console.error(`❌ 生成质量报告失败: ${error.message}`);
  }
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
🚀 质量检查触发器

用法:
  node scripts/quality-trigger.js <taskId> [选项]

参数:
  taskId         要检查的任务ID

选项:
  --help, -h     显示帮助信息
  --version, -v  显示版本信息
  --dry-run      模拟运行（不执行实际检查）

示例:
  node scripts/quality-trigger.js b51718cc-9669-4284-8520-1c082964f30b

功能:
  - 读取任务的qualityAssurance配置
  - 执行自动化质量检查
  - 生成质量报告
  - 根据结果决定任务状态

配置:
  - 任务文件: ${CONFIG.TASKS_FILE}
  - AI审查脚本: ${CONFIG.AI_REVIEW_SCRIPT}
  - 报告目录: ${CONFIG.REPORTS_DIR}
  - 默认阈值: ${CONFIG.QUALITY_THRESHOLD}分
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
    console.log('质量检查触发器 v1.0.0');
    process.exit(0);
  }

  const taskId = args.find((arg) => !arg.startsWith('--'));

  if (!taskId) {
    console.error('❌ 请提供任务ID');
    console.log('使用 --help 查看帮助信息');
    process.exit(1);
  }

  if (args.includes('--dry-run')) {
    console.log('🧪 模拟运行模式');
    console.log(`📋 将要检查的任务ID: ${taskId}`);
    process.exit(0);
  }

  // 执行质量检查
  triggerQualityCheck(taskId)
    .then((result) => {
      console.log('\n📋 质量检查结果:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ 质量检查过程中发生错误:', error.message);
      process.exit(1);
    });
}

module.exports = {
  triggerQualityCheck,
  CONFIG,
};
