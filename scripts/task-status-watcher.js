#!/usr/bin/env node

/**
 * 任务状态监听器
 * 监听 docs/data/tasks.json 文件变更，检测任务状态变化
 * 当任务状态从非'completed'变为'completed'时，自动触发质量检查流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  TASKS_FILE: path.join(process.cwd(), 'docs/data/tasks.json'),
  WATCH_INTERVAL: 2000, // 2秒检查一次
  BACKUP_DIR: path.join(process.cwd(), 'docs/data/backups'),
  LOG_FILE: path.join(process.cwd(), 'logs/task-watcher.log'),
  QUALITY_TRIGGER_SCRIPT: path.join(
    process.cwd(),
    'scripts/quality-trigger.js',
  ),
};

// 任务状态缓存
let taskStatusCache = new Map();
let isWatching = false;

/**
 * 初始化监听器
 */
function initializeWatcher() {
  console.log('🔍 初始化任务状态监听器...');

  // 确保必要的目录存在
  ensureDirectories();

  // 加载初始任务状态
  loadInitialTaskStatus();

  // 开始监听
  startWatching();
}

/**
 * 确保必要的目录存在
 */
function ensureDirectories() {
  const dirs = [path.dirname(CONFIG.LOG_FILE), CONFIG.BACKUP_DIR];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 创建目录: ${dir}`);
    }
  });
}

/**
 * 加载初始任务状态到缓存
 */
function loadInitialTaskStatus() {
  try {
    if (!fs.existsSync(CONFIG.TASKS_FILE)) {
      console.error(`❌ 任务文件不存在: ${CONFIG.TASKS_FILE}`);
      process.exit(1);
    }

    const taskData = JSON.parse(fs.readFileSync(CONFIG.TASKS_FILE, 'utf8'));

    if (!taskData.tasks || !Array.isArray(taskData.tasks)) {
      console.error('❌ 任务文件格式错误：缺少tasks数组');
      process.exit(1);
    }

    // 缓存所有任务的当前状态，并检查最近完成的任务
    const recentlyCompletedTasks = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1小时前

    taskData.tasks.forEach((task) => {
      if (task.id && task.status) {
        taskStatusCache.set(task.id, {
          status: task.status,
          name: task.name,
          lastUpdated: task.updatedAt || new Date().toISOString(),
        });

        // 检查是否是最近完成的任务（1小时内完成且有qualityAssurance配置）
        if (task.status === 'completed' && task.completedAt) {
          const completedTime = new Date(task.completedAt);
          if (completedTime > oneHourAgo && task.qualityAssurance) {
            recentlyCompletedTasks.push({
              id: task.id,
              name: task.name,
              previousStatus: 'unknown',
              currentStatus: task.status,
              task: task,
            });
            console.log(
              `🔍 发现最近完成的任务: ${task.name} (${task.completedAt})`,
            );
          }
        }
      }
    });

    console.log(`✅ 已加载 ${taskStatusCache.size} 个任务的状态到缓存`);
    logMessage(`初始化完成，监听 ${taskStatusCache.size} 个任务`);

    // 触发最近完成任务的质量检查
    if (recentlyCompletedTasks.length > 0) {
      console.log(
        `🚀 发现 ${recentlyCompletedTasks.length} 个最近完成的任务，触发质量检查...`,
      );
      triggerQualityChecks(recentlyCompletedTasks);
    }
  } catch (error) {
    console.error('❌ 加载初始任务状态失败:', error.message);
    process.exit(1);
  }
}

/**
 * 开始监听文件变更
 */
function startWatching() {
  if (isWatching) {
    console.log('⚠️  监听器已在运行中');
    return;
  }

  isWatching = true;
  console.log(`🔄 开始监听任务状态变更 (间隔: ${CONFIG.WATCH_INTERVAL}ms)`);
  console.log(`📁 监听文件: ${CONFIG.TASKS_FILE}`);

  // 使用定时器定期检查文件变更
  const watchInterval = setInterval(() => {
    try {
      checkTaskStatusChanges();
    } catch (error) {
      console.error('❌ 检查任务状态时发生错误:', error.message);
      logMessage(`错误: ${error.message}`);
    }
  }, CONFIG.WATCH_INTERVAL);

  // 优雅退出处理
  process.on('SIGINT', () => {
    console.log('\n🛑 收到退出信号，停止监听...');
    clearInterval(watchInterval);
    isWatching = false;
    logMessage('监听器已停止');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，停止监听...');
    clearInterval(watchInterval);
    isWatching = false;
    logMessage('监听器已停止');
    process.exit(0);
  });
}

/**
 * 检查任务状态变更
 */
function checkTaskStatusChanges() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(CONFIG.TASKS_FILE)) {
      console.log('⚠️  任务文件不存在，跳过检查');
      return;
    }

    // 读取当前任务数据
    const taskData = JSON.parse(fs.readFileSync(CONFIG.TASKS_FILE, 'utf8'));

    if (!taskData.tasks || !Array.isArray(taskData.tasks)) {
      console.log('⚠️  任务文件格式错误，跳过检查');
      return;
    }

    // 检查每个任务的状态变更
    const completedTasks = [];

    taskData.tasks.forEach((task) => {
      if (!task.id || !task.status) return;

      const cachedTask = taskStatusCache.get(task.id);

      if (cachedTask) {
        // 检查状态是否从非'completed'变为'completed'
        if (cachedTask.status !== 'completed' && task.status === 'completed') {
          completedTasks.push({
            id: task.id,
            name: task.name,
            previousStatus: cachedTask.status,
            currentStatus: task.status,
            task: task,
          });

          console.log(
            `✅ 检测到任务完成: ${task.name} (${cachedTask.status} → ${task.status})`,
          );
          logMessage(`任务完成: ${task.name} (${task.id})`);
        }

        // 更新缓存
        taskStatusCache.set(task.id, {
          status: task.status,
          name: task.name,
          lastUpdated: task.updatedAt || new Date().toISOString(),
        });
      } else {
        // 新任务，添加到缓存
        taskStatusCache.set(task.id, {
          status: task.status,
          name: task.name,
          lastUpdated: task.updatedAt || new Date().toISOString(),
        });

        // 如果新任务已经是completed状态，也触发质量检查
        if (task.status === 'completed') {
          completedTasks.push({
            id: task.id,
            name: task.name,
            previousStatus: 'new',
            currentStatus: task.status,
            task: task,
          });

          console.log(`✅ 检测到新的已完成任务: ${task.name}`);
          logMessage(`新的已完成任务: ${task.name} (${task.id})`);
        }
      }
    });

    // 触发质量检查
    if (completedTasks.length > 0) {
      triggerQualityChecks(completedTasks);
    }
  } catch (error) {
    console.error('❌ 检查任务状态变更时发生错误:', error.message);
    logMessage(`检查错误: ${error.message}`);
  }
}

/**
 * 触发质量检查
 */
function triggerQualityChecks(completedTasks) {
  console.log(`🚀 触发 ${completedTasks.length} 个任务的质量检查...`);

  completedTasks.forEach(({ task, previousStatus }) => {
    try {
      console.log(`  🔍 开始质量检查: ${task.name}`);
      logMessage(`开始质量检查: ${task.name} (${task.id})`);

      // 检查质量触发器脚本是否存在
      if (!fs.existsSync(CONFIG.QUALITY_TRIGGER_SCRIPT)) {
        console.log(
          `⚠️  质量触发器脚本不存在: ${CONFIG.QUALITY_TRIGGER_SCRIPT}`,
        );
        console.log('  📝 将使用现有的AI质量审查脚本');

        // 使用现有的AI质量审查脚本
        triggerExistingQualityReview(task);
      } else {
        // 调用专门的质量触发器脚本
        const command = `node "${CONFIG.QUALITY_TRIGGER_SCRIPT}" "${task.id}"`;
        console.log(`  ⚡ 执行: ${command}`);

        execSync(command, {
          stdio: 'inherit',
          timeout: 300000, // 5分钟超时
        });
      }

      console.log(`  ✅ 质量检查完成: ${task.name}`);
      logMessage(`质量检查完成: ${task.name} (${task.id})`);
    } catch (error) {
      console.error(`  ❌ 质量检查失败: ${task.name} - ${error.message}`);
      logMessage(`质量检查失败: ${task.name} (${task.id}) - ${error.message}`);
    }
  });
}

/**
 * 使用现有的AI质量审查脚本
 */
function triggerExistingQualityReview(task) {
  const aiReviewScript = path.join(
    process.cwd(),
    'scripts/ai-quality-review.js',
  );

  if (!fs.existsSync(aiReviewScript)) {
    console.log('  ⚠️  AI质量审查脚本不存在，跳过质量检查');
    return;
  }

  // 创建临时任务配置文件
  const tempConfigPath = path.join(process.cwd(), 'temp-task-config.json');
  fs.writeFileSync(tempConfigPath, JSON.stringify(task, null, 2));

  try {
    // 调用AI质量审查脚本
    const command = `node "${aiReviewScript}"`;
    console.log(`  ⚡ 执行现有质量审查: ${command}`);

    execSync(command, {
      stdio: 'inherit',
      timeout: 300000, // 5分钟超时
      env: {
        ...process.env,
        TASK_CONFIG_PATH: tempConfigPath,
      },
    });
  } finally {
    // 清理临时文件
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
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
🔍 任务状态监听器

用法:
  node scripts/task-status-watcher.js [选项]

选项:
  --help, -h     显示帮助信息
  --version, -v  显示版本信息
  --test         测试模式（单次检查）

功能:
  - 监听 docs/data/tasks.json 文件变更
  - 检测任务状态从非'completed'变为'completed'
  - 自动触发质量检查流程
  - 记录监听日志

配置:
  - 任务文件: ${CONFIG.TASKS_FILE}
  - 检查间隔: ${CONFIG.WATCH_INTERVAL}ms
  - 日志文件: ${CONFIG.LOG_FILE}
  - 质量触发器: ${CONFIG.QUALITY_TRIGGER_SCRIPT}
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
    console.log('任务状态监听器 v1.0.0');
    process.exit(0);
  }

  if (args.includes('--test')) {
    console.log('🧪 测试模式：执行单次检查');
    ensureDirectories();
    loadInitialTaskStatus();
    checkTaskStatusChanges();
    console.log('✅ 测试完成');
    process.exit(0);
  }

  // 正常启动监听器
  initializeWatcher();
}

module.exports = {
  initializeWatcher,
  checkTaskStatusChanges,
  CONFIG,
};
