#!/usr/bin/env node

/**
 * 自动化质量保证工作流管理器
 * 整合监听器、触发器和结果处理器，实现完整的自动化质量保证流程
 */

const fs = require('fs');
const path = require('path');
const { spawn, fork } = require('child_process');

// 配置
const CONFIG = {
  TASKS_FILE: path.join(process.cwd(), 'docs/data/tasks.json'),
  LOG_FILE: path.join(process.cwd(), 'logs/workflow.log'),
  PID_FILE: path.join(process.cwd(), 'logs/workflow.pid'),
  SCRIPTS: {
    WATCHER: path.join(process.cwd(), 'scripts/task-status-watcher.js'),
    TRIGGER: path.join(process.cwd(), 'scripts/quality-trigger.js'),
    PROCESSOR: path.join(process.cwd(), 'scripts/quality-result-processor.js'),
  },
  WORKFLOW_CONFIG: {
    AUTO_START_WATCHER: true,
    ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS === 'true',
    MAX_CONCURRENT_CHECKS: parseInt(process.env.MAX_CONCURRENT_CHECKS) || 3,
    RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS) || 2,
  },
};

// 全局状态
let isRunning = false;
let watcherProcess = null;
let activeChecks = new Map();

/**
 * 启动自动化工作流
 */
async function startWorkflow(options = {}) {
  try {
    console.log('🚀 启动自动化质量保证工作流...');
    logMessage('工作流启动');

    if (isRunning) {
      console.log('⚠️  工作流已在运行中');
      return;
    }

    // 确保必要的目录和文件存在
    await initializeWorkflow();

    // 验证脚本文件
    validateScripts();

    // 写入PID文件
    writePidFile();

    // 启动任务状态监听器
    if (CONFIG.WORKFLOW_CONFIG.AUTO_START_WATCHER) {
      await startTaskWatcher();
    }

    // 设置信号处理
    setupSignalHandlers();

    isRunning = true;
    console.log('✅ 自动化工作流已启动');
    console.log(`📁 监听文件: ${CONFIG.TASKS_FILE}`);
    console.log(`📄 日志文件: ${CONFIG.LOG_FILE}`);
    console.log(
      `🔧 最大并发检查: ${CONFIG.WORKFLOW_CONFIG.MAX_CONCURRENT_CHECKS}`,
    );

    // 保持进程运行
    await keepAlive();
  } catch (error) {
    console.error(`❌ 启动工作流失败: ${error.message}`);
    logMessage(`工作流启动失败: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 停止自动化工作流
 */
async function stopWorkflow() {
  try {
    console.log('🛑 停止自动化工作流...');
    logMessage('工作流停止');

    isRunning = false;

    // 停止任务监听器
    if (watcherProcess) {
      console.log('🔄 停止任务状态监听器...');
      watcherProcess.kill('SIGTERM');
      watcherProcess = null;
    }

    // 等待活跃的质量检查完成
    if (activeChecks.size > 0) {
      console.log(`⏳ 等待 ${activeChecks.size} 个活跃的质量检查完成...`);
      await waitForActiveChecks();
    }

    // 清理PID文件
    cleanupPidFile();

    console.log('✅ 自动化工作流已停止');
  } catch (error) {
    console.error(`❌ 停止工作流失败: ${error.message}`);
    logMessage(`工作流停止失败: ${error.message}`);
  }
}

/**
 * 初始化工作流
 */
async function initializeWorkflow() {
  console.log('🔧 初始化工作流环境...');

  // 确保必要的目录存在
  const dirs = [
    path.dirname(CONFIG.LOG_FILE),
    path.dirname(CONFIG.PID_FILE),
    path.join(process.cwd(), 'reports/quality'),
    path.join(process.cwd(), 'reports/summary'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 创建目录: ${dir}`);
    }
  });

  // 检查任务文件是否存在
  if (!fs.existsSync(CONFIG.TASKS_FILE)) {
    throw new Error(`任务文件不存在: ${CONFIG.TASKS_FILE}`);
  }

  console.log('✅ 工作流环境初始化完成');
}

/**
 * 验证脚本文件
 */
function validateScripts() {
  console.log('🔍 验证脚本文件...');

  Object.entries(CONFIG.SCRIPTS).forEach(([name, scriptPath]) => {
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`脚本文件不存在: ${name} - ${scriptPath}`);
    }
    console.log(`✅ ${name}: ${scriptPath}`);
  });
}

/**
 * 写入PID文件
 */
function writePidFile() {
  const pidData = {
    pid: process.pid,
    startTime: new Date().toISOString(),
    command: process.argv.join(' '),
  };

  fs.writeFileSync(CONFIG.PID_FILE, JSON.stringify(pidData, null, 2));
  console.log(`📝 PID文件已创建: ${CONFIG.PID_FILE} (PID: ${process.pid})`);
}

/**
 * 清理PID文件
 */
function cleanupPidFile() {
  if (fs.existsSync(CONFIG.PID_FILE)) {
    fs.unlinkSync(CONFIG.PID_FILE);
    console.log('🗑️  PID文件已清理');
  }
}

/**
 * 启动任务状态监听器
 */
async function startTaskWatcher() {
  console.log('🔄 启动任务状态监听器...');

  return new Promise((resolve, reject) => {
    watcherProcess = fork(CONFIG.SCRIPTS.WATCHER, [], {
      stdio: 'pipe',
      env: {
        ...process.env,
        WORKFLOW_MODE: 'true',
      },
    });

    watcherProcess.on('message', (message) => {
      handleWatcherMessage(message);
    });

    watcherProcess.on('error', (error) => {
      console.error(`❌ 任务监听器错误: ${error.message}`);
      logMessage(`任务监听器错误: ${error.message}`);
      reject(error);
    });

    watcherProcess.on('exit', (code) => {
      console.log(`🔄 任务监听器退出，代码: ${code}`);
      logMessage(`任务监听器退出: ${code}`);
      watcherProcess = null;
    });

    // 监听器启动成功
    setTimeout(() => {
      if (watcherProcess && !watcherProcess.killed) {
        console.log('✅ 任务状态监听器已启动');
        resolve();
      } else {
        reject(new Error('任务监听器启动失败'));
      }
    }, 2000);
  });
}

/**
 * 处理监听器消息
 */
function handleWatcherMessage(message) {
  console.log(`📨 收到监听器消息: ${JSON.stringify(message)}`);

  if (message.type === 'task_completed') {
    handleTaskCompleted(message.taskId, message.task);
  }
}

/**
 * 处理任务完成事件
 */
async function handleTaskCompleted(taskId, task) {
  try {
    console.log(`✅ 处理任务完成事件: ${task.name} (${taskId})`);
    logMessage(`任务完成: ${task.name} (${taskId})`);

    // 检查并发限制
    if (activeChecks.size >= CONFIG.WORKFLOW_CONFIG.MAX_CONCURRENT_CHECKS) {
      console.log(
        `⏳ 达到最大并发限制 (${CONFIG.WORKFLOW_CONFIG.MAX_CONCURRENT_CHECKS})，等待...`,
      );
      await waitForAvailableSlot();
    }

    // 启动质量检查
    await startQualityCheck(taskId, task);
  } catch (error) {
    console.error(`❌ 处理任务完成事件失败: ${error.message}`);
    logMessage(`处理任务完成失败: ${taskId} - ${error.message}`);
  }
}

/**
 * 启动质量检查
 */
async function startQualityCheck(taskId, task) {
  console.log(`🔍 启动质量检查: ${task.name}`);

  const checkId = `${taskId}-${Date.now()}`;

  try {
    // 记录活跃检查
    activeChecks.set(checkId, {
      taskId,
      taskName: task.name,
      startTime: new Date().toISOString(),
      attempts: 0,
    });

    // 执行质量检查
    const result = await executeQualityCheck(taskId, task, checkId);

    // 处理检查结果
    await processCheckResult(taskId, task, result, checkId);
  } catch (error) {
    console.error(`❌ 质量检查失败: ${task.name} - ${error.message}`);
    logMessage(`质量检查失败: ${taskId} - ${error.message}`);

    // 重试逻辑
    const checkInfo = activeChecks.get(checkId);
    if (
      checkInfo &&
      checkInfo.attempts < CONFIG.WORKFLOW_CONFIG.RETRY_ATTEMPTS
    ) {
      console.log(
        `🔄 重试质量检查 (${checkInfo.attempts + 1}/${CONFIG.WORKFLOW_CONFIG.RETRY_ATTEMPTS})`,
      );
      checkInfo.attempts++;
      setTimeout(() => startQualityCheck(taskId, task), 5000);
    } else {
      // 移除失败的检查
      activeChecks.delete(checkId);
    }
  }
}

/**
 * 执行质量检查
 */
async function executeQualityCheck(taskId, task, checkId) {
  return new Promise((resolve, reject) => {
    const triggerProcess = spawn('node', [CONFIG.SCRIPTS.TRIGGER, taskId], {
      stdio: 'pipe',
      timeout: 600000, // 10分钟超时
    });

    let output = '';
    let errorOutput = '';

    triggerProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    triggerProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    triggerProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          output,
          timestamp: new Date().toISOString(),
        });
      } else {
        reject(
          new Error(`质量检查进程退出，代码: ${code}, 错误: ${errorOutput}`),
        );
      }
    });

    triggerProcess.on('error', (error) => {
      reject(new Error(`启动质量检查进程失败: ${error.message}`));
    });
  });
}

/**
 * 处理检查结果
 */
async function processCheckResult(taskId, task, result, checkId) {
  console.log(`📊 处理检查结果: ${task.name}`);

  try {
    // 这里可以调用结果处理器
    // 目前简化处理，直接记录结果

    console.log(`✅ 质量检查完成: ${task.name}`);
    logMessage(`质量检查完成: ${taskId} - 成功: ${result.success}`);

    // 移除活跃检查
    activeChecks.delete(checkId);
  } catch (error) {
    console.error(`❌ 处理检查结果失败: ${error.message}`);
    logMessage(`处理结果失败: ${taskId} - ${error.message}`);
    activeChecks.delete(checkId);
  }
}

/**
 * 等待可用的检查槽位
 */
async function waitForAvailableSlot() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (activeChecks.size < CONFIG.WORKFLOW_CONFIG.MAX_CONCURRENT_CHECKS) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);
  });
}

/**
 * 等待活跃检查完成
 */
async function waitForActiveChecks() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (activeChecks.size === 0) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);
  });
}

/**
 * 设置信号处理
 */
function setupSignalHandlers() {
  process.on('SIGINT', async () => {
    console.log('\n🛑 收到中断信号，正在停止工作流...');
    await stopWorkflow();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 收到终止信号，正在停止工作流...');
    await stopWorkflow();
    process.exit(0);
  });
}

/**
 * 保持进程运行
 */
async function keepAlive() {
  return new Promise((resolve) => {
    const keepAliveInterval = setInterval(() => {
      if (!isRunning) {
        clearInterval(keepAliveInterval);
        resolve();
      }
    }, 5000);
  });
}

/**
 * 获取工作流状态
 */
function getWorkflowStatus() {
  return {
    isRunning,
    activeChecks: Array.from(activeChecks.values()),
    watcherRunning: watcherProcess && !watcherProcess.killed,
    config: CONFIG.WORKFLOW_CONFIG,
    uptime: process.uptime(),
  };
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
🚀 自动化质量保证工作流管理器

用法:
  node scripts/automated-quality-workflow.js [命令] [选项]

命令:
  start          启动工作流 (默认)
  stop           停止工作流
  status         显示工作流状态
  restart        重启工作流

选项:
  --help, -h     显示帮助信息
  --version, -v  显示版本信息
  --daemon       后台运行模式

环境变量:
  ENABLE_NOTIFICATIONS=true     启用通知
  MAX_CONCURRENT_CHECKS=3       最大并发检查数
  RETRY_ATTEMPTS=2              重试次数

功能:
  - 监听任务状态变更
  - 自动触发质量检查
  - 处理检查结果
  - 管理并发检查
  - 错误重试机制
`);
}

// 主程序入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('自动化质量保证工作流管理器 v1.0.0');
    process.exit(0);
  }

  switch (command) {
    case 'start':
      startWorkflow();
      break;
    case 'stop':
      stopWorkflow().then(() => process.exit(0));
      break;
    case 'status':
      console.log('📊 工作流状态:');
      console.log(JSON.stringify(getWorkflowStatus(), null, 2));
      process.exit(0);
      break;
    case 'restart':
      stopWorkflow().then(() => startWorkflow());
      break;
    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('使用 --help 查看帮助信息');
      process.exit(1);
  }
}

module.exports = {
  startWorkflow,
  stopWorkflow,
  getWorkflowStatus,
  CONFIG,
};
