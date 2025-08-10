#!/usr/bin/env node

/**
 * 报告查看器 - 美观的报告展示
 * Report Viewer - Beautiful report presentation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReportViewer {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
  }

  /**
   * 确保报告是最新的
   */
  async ensureLatestReport() {
    console.log('📊 正在生成最新报告...');

    try {
      // 运行完整的质量报告生成（AI层的复杂逻辑）
      execSync('pnpm quality:report', {
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 120000,
      });

      console.log('✅ 报告生成完成\n');
      return true;
    } catch (error) {
      console.log('⚠️  使用现有报告\n');
      return false;
    }
  }

  /**
   * 检查报告文件是否存在
   */
  checkReportFiles() {
    const reports = {
      quality: path.join(this.reportsDir, 'simple-quality-report.html'),
      qualityJson: path.join(this.reportsDir, 'simple-quality-report.json'),
      deployment: path.join(this.reportsDir, 'deployment-report.json'),
      performance: path.join(this.reportsDir, 'performance-report.json'),
    };

    const available = {};
    Object.keys(reports).forEach((key) => {
      available[key] = fs.existsSync(reports[key]);
    });

    return { reports, available };
  }

  /**
   * 显示报告摘要
   */
  displayReportSummary() {
    const { reports, available } = this.checkReportFiles();

    console.log('📊 项目质量报告');
    console.log('='.repeat(40));

    // 显示主要指标
    if (available.qualityJson) {
      try {
        const qualityData = JSON.parse(
          fs.readFileSync(reports.qualityJson, 'utf8'),
        );

        console.log(`📈 总体评分: ${qualityData.summary.overallScore}/100`);
        console.log(
          `✅ 通过检查: ${qualityData.summary.passedChecks}/${qualityData.summary.totalChecks}`,
        );

        if (qualityData.stats) {
          console.log(`📁 项目文件: ${qualityData.stats.totalFiles} 个`);
          console.log(`📊 代码覆盖: ${qualityData.stats.testCoverage}%`);
        }

        if (qualityData.security) {
          console.log(
            `🔒 安全漏洞: ${qualityData.security.vulnerabilities} 个`,
          );
        }

        if (qualityData.performance) {
          console.log(`⚡ 性能得分: ${qualityData.performance.score}/100`);
        }
      } catch (error) {
        console.log('⚠️  无法读取质量数据');
      }
    }

    console.log('\n📋 可用报告:');

    // HTML质量报告
    if (available.quality) {
      console.log('🌐 详细质量报告 (HTML)');
      console.log(`   文件: ${reports.quality}`);
      console.log('   💡 在浏览器中打开查看完整报告');
    }

    // 部署报告
    if (available.deployment) {
      console.log('🚀 部署就绪报告');
      try {
        const deployData = JSON.parse(
          fs.readFileSync(reports.deployment, 'utf8'),
        );
        const status = deployData.deployment.ready
          ? '✅ 可部署'
          : '❌ 不可部署';
        console.log(`   状态: ${status} (${deployData.deployment.score}/100)`);
      } catch (error) {
        console.log('   状态: 无法读取');
      }
    }

    // 性能报告
    if (available.performance) {
      console.log('⚡ 性能分析报告');
      try {
        const perfData = JSON.parse(
          fs.readFileSync(reports.performance, 'utf8'),
        );
        console.log(`   性能得分: ${perfData.performance.score}/100`);
        console.log(`   发现问题: ${perfData.issues.length} 个`);
      } catch (error) {
        console.log('   状态: 无法读取');
      }
    }
  }

  /**
   * 尝试在浏览器中打开HTML报告
   */
  openInBrowser() {
    const { reports, available } = this.checkReportFiles();

    if (available.quality) {
      console.log('\n🌐 正在浏览器中打开详细报告...');

      try {
        // 根据操作系统选择打开命令
        const platform = process.platform;
        let command;

        if (platform === 'darwin') {
          command = `open "${reports.quality}"`;
        } else if (platform === 'win32') {
          command = `start "${reports.quality}"`;
        } else {
          command = `xdg-open "${reports.quality}"`;
        }

        execSync(command, { stdio: 'ignore' });
        console.log('✅ 报告已在浏览器中打开');

        return true;
      } catch (error) {
        console.log('⚠️  无法自动打开浏览器');
        console.log(`💡 请手动打开: ${reports.quality}`);
        return false;
      }
    } else {
      console.log('❌ HTML报告不存在，请先运行质量检查');
      return false;
    }
  }

  /**
   * 显示快速操作提示
   */
  displayQuickActions() {
    console.log('\n🎯 快速操作:');
    console.log('pnpm health  - 检查项目健康状况');
    console.log('pnpm ready   - 检查部署就绪状态');
    console.log('pnpm report  - 查看此报告');

    console.log('\n🔧 问题修复:');
    console.log('pnpm quality:fix     - 自动修复格式问题');
    console.log('pnpm test           - 运行测试');
    console.log('pnpm build:check    - 验证构建');
  }

  /**
   * 主要报告查看功能
   */
  async viewReport(options = {}) {
    console.log('🎯 项目质量报告查看器');
    console.log('='.repeat(40));

    // 确保有最新报告
    if (options.refresh !== false) {
      await this.ensureLatestReport();
    }

    // 显示报告摘要
    this.displayReportSummary();

    // 如果请求，在浏览器中打开
    if (options.open !== false) {
      this.openInBrowser();
    }

    // 显示快速操作
    this.displayQuickActions();

    return true;
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    refresh: !args.includes('--no-refresh'),
    open: !args.includes('--no-open'),
  };

  const viewer = new ReportViewer();
  viewer
    .viewReport(options)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(`❌ 报告查看失败: ${error.message}`);
      process.exit(1);
    });
}

module.exports = ReportViewer;
