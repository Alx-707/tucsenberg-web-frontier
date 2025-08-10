#!/usr/bin/env node

/**
 * 质量监控系统启动脚本
 *
 * 初始化和启动完整的质量监控体系
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QualityMonitoringStarter {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.configPath = path.join(
      process.cwd(),
      'config',
      'quality-monitoring.json',
    );
    this.logFile = path.join(this.reportsDir, 'monitoring.log');

    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.reportsDir,
      path.join(this.reportsDir, 'coverage-trends'),
      path.join(this.reportsDir, 'performance-benchmarks'),
      path.join(this.reportsDir, 'automated'),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 启动质量监控系统
   */
  async startMonitoring() {
    console.log('🚀 启动质量监控系统...\n');

    try {
      // 1. 验证环境
      await this.verifyEnvironment();

      // 2. 初始化基线数据
      await this.initializeBaselines();

      // 3. 运行初始质量检查
      await this.runInitialQualityCheck();

      // 4. 生成初始报告
      await this.generateInitialReports();

      // 5. 设置监控任务
      await this.setupMonitoringTasks();

      console.log('\n✅ 质量监控系统启动完成！');
      this.displayMonitoringInfo();
    } catch (error) {
      console.error('❌ 质量监控系统启动失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 验证环境
   */
  async verifyEnvironment() {
    console.log('🔍 验证环境配置...');

    // 检查必要的依赖
    const requiredCommands = ['pnpm', 'git', 'node'];
    for (const cmd of requiredCommands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'pipe' });
        console.log(`✅ ${cmd} 已安装`);
      } catch (error) {
        throw new Error(`缺少必要依赖: ${cmd}`);
      }
    }

    // 检查配置文件
    if (!fs.existsSync(this.configPath)) {
      console.log('⚠️  质量监控配置文件不存在，使用默认配置');
    } else {
      console.log('✅ 质量监控配置文件已找到');
    }

    // 检查 package.json 脚本
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = [
      'test:coverage',
      'type-check',
      'lint:check',
      'build',
      'quality:dashboard',
      'coverage:trend',
      'performance:benchmark',
      'quality:gate',
      'report:automated',
    ];

    const missingScripts = requiredScripts.filter(
      (script) => !packageJson.scripts[script],
    );
    if (missingScripts.length > 0) {
      console.log(`⚠️  缺少脚本: ${missingScripts.join(', ')}`);
    } else {
      console.log('✅ 所有必要脚本已配置');
    }
  }

  /**
   * 初始化基线数据
   */
  async initializeBaselines() {
    console.log('📊 初始化基线数据...');

    try {
      // 生成初始覆盖率基线
      console.log('  📈 生成覆盖率基线...');
      execSync('pnpm test:coverage --run --reporter=json', {
        stdio: 'pipe',
        timeout: 180000,
      });
      console.log('  ✅ 覆盖率基线已生成');

      // 生成性能基线
      console.log('  ⚡ 生成性能基线...');
      execSync('pnpm type-check', { stdio: 'pipe', timeout: 60000 });
      console.log('  ✅ TypeScript 检查基线已生成');

      execSync('pnpm lint:check', { stdio: 'pipe', timeout: 60000 });
      console.log('  ✅ ESLint 检查基线已生成');
    } catch (error) {
      console.log('  ⚠️  基线数据生成部分失败，将使用默认值');
    }
  }

  /**
   * 运行初始质量检查
   */
  async runInitialQualityCheck() {
    console.log('🔍 运行初始质量检查...');

    const checks = [
      { name: 'TypeScript 类型检查', command: 'pnpm type-check' },
      { name: 'ESLint 代码检查', command: 'pnpm lint:check' },
      { name: '代码格式检查', command: 'pnpm format:check' },
    ];

    const results = [];

    for (const check of checks) {
      try {
        console.log(`  🔍 ${check.name}...`);
        execSync(check.command, { stdio: 'pipe', timeout: 60000 });
        console.log(`  ✅ ${check.name} 通过`);
        results.push({ name: check.name, status: 'passed' });
      } catch (error) {
        console.log(`  ❌ ${check.name} 失败`);
        results.push({
          name: check.name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // 保存初始检查结果
    const initialCheckPath = path.join(
      this.reportsDir,
      'initial-quality-check.json',
    );
    fs.writeFileSync(
      initialCheckPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          results,
          summary: {
            total: results.length,
            passed: results.filter((r) => r.status === 'passed').length,
            failed: results.filter((r) => r.status === 'failed').length,
          },
        },
        null,
        2,
      ),
    );

    console.log(`  💾 初始检查结果已保存: ${initialCheckPath}`);
  }

  /**
   * 生成初始报告
   */
  async generateInitialReports() {
    console.log('📊 生成初始监控报告...');

    try {
      // 生成质量仪表板
      console.log('  📈 生成质量仪表板...');
      execSync('pnpm quality:dashboard', { stdio: 'inherit', timeout: 120000 });

      // 生成覆盖率趋势报告
      console.log('  📊 生成覆盖率趋势报告...');
      execSync('pnpm coverage:trend', { stdio: 'inherit', timeout: 120000 });

      console.log('  ✅ 初始报告生成完成');
    } catch (error) {
      console.log('  ⚠️  部分报告生成失败，系统将继续运行');
    }
  }

  /**
   * 设置监控任务
   */
  async setupMonitoringTasks() {
    console.log('⚙️  设置监控任务...');

    // 创建监控任务配置
    const monitoringTasks = {
      daily: {
        enabled: true,
        schedule: '0 9 * * *', // 每天上午9点
        tasks: ['quality:dashboard', 'coverage:trend', 'performance:benchmark'],
      },
      weekly: {
        enabled: true,
        schedule: '0 9 * * 1', // 每周一上午9点
        tasks: ['report:automated', 'quality:comprehensive'],
      },
      onCommit: {
        enabled: true,
        tasks: ['quality:gate'],
      },
    };

    const tasksConfigPath = path.join(this.reportsDir, 'monitoring-tasks.json');
    fs.writeFileSync(tasksConfigPath, JSON.stringify(monitoringTasks, null, 2));

    console.log('  ✅ 监控任务配置已保存');
    console.log('  💡 提示: 可以通过 CI/CD 或 cron 任务来自动执行这些监控任务');
  }

  /**
   * 显示监控信息
   */
  displayMonitoringInfo() {
    console.log('\n📋 质量监控系统信息');
    console.log('='.repeat(50));

    console.log('\n🎯 可用命令:');
    console.log('  pnpm quality:dashboard     - 生成质量仪表板');
    console.log('  pnpm coverage:trend        - 覆盖率趋势分析');
    console.log('  pnpm performance:benchmark - 性能基准测试');
    console.log('  pnpm quality:gate          - 质量门禁检查');
    console.log('  pnpm report:automated      - 生成综合报告');
    console.log('  pnpm quality:comprehensive - 运行完整质量检查');

    console.log('\n📊 报告位置:');
    console.log(
      `  质量报告: ${path.join(this.reportsDir, 'quality-dashboard.html')}`,
    );
    console.log(
      `  覆盖率趋势: ${path.join(this.reportsDir, 'coverage-trends/')}`,
    );
    console.log(
      `  性能基准: ${path.join(this.reportsDir, 'performance-benchmarks/')}`,
    );
    console.log(`  综合报告: ${path.join(this.reportsDir, 'automated/')}`);

    console.log('\n🔧 配置文件:');
    console.log(`  监控配置: ${this.configPath}`);
    console.log(
      `  任务配置: ${path.join(this.reportsDir, 'monitoring-tasks.json')}`,
    );

    console.log('\n📈 质量目标:');
    console.log('  测试覆盖率: ≥ 85%');
    console.log('  构建时间: ≤ 2分钟');
    console.log('  ESLint 错误: 0个');
    console.log('  安全漏洞: 0个');

    console.log('\n🚀 下一步建议:');
    console.log('  1. 运行 pnpm quality:comprehensive 进行完整检查');
    console.log('  2. 查看生成的 HTML 报告了解当前质量状况');
    console.log('  3. 根据报告建议改进代码质量');
    console.log('  4. 在 CI/CD 中集成质量门禁检查');

    console.log('\n💡 提示:');
    console.log('  - 质量监控系统会自动跟踪趋势变化');
    console.log('  - 可以通过配置文件调整阈值和警报设置');
    console.log('  - 建议定期查看质量报告并采取改进措施');
  }

  /**
   * 记录日志
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }
}

// 主执行函数
async function main() {
  const starter = new QualityMonitoringStarter();

  try {
    await starter.startMonitoring();
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { QualityMonitoringStarter };
