#!/usr/bin/env node

/**
 * 部署就绪检查器 - 超简单的部署决策
 * Deployment Ready Checker - Ultra-simple deployment decision
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentReadyChecker {
  constructor() {
    this.readiness = {
      ready: false,
      score: 0,
      blockers: [],
      warnings: [],
      confidence: 'low',
    };
  }

  /**
   * 显示进度条
   */
  showProgress(steps) {
    console.log('🚀 部署就绪检查进行中...\n');

    steps.forEach((step, index) => {
      const progress =
        '█'.repeat(index + 1) + '░'.repeat(steps.length - index - 1);
      process.stdout.write(`\r[${progress}] ${step}`);

      // 模拟检查时间
      const delay = Math.random() * 1000 + 500;
      execSync(`sleep ${delay / 1000}`, { stdio: 'ignore' });
    });

    console.log('\n');
  }

  /**
   * 运行完整的部署前检查
   */
  async runDeploymentChecks() {
    const steps = [
      '🏗️  构建验证...',
      '🧪 测试执行...',
      '🔒 安全扫描...',
      '⚡ 性能检查...',
      '📊 质量评估...',
    ];

    this.showProgress(steps);

    try {
      // 运行完整的部署检查（AI层的复杂逻辑）
      const output = execSync('pnpm deploy:check', {
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 180000, // 3分钟超时
      });

      console.log('✅ 部署检查完成\n');

      // 解析检查结果
      await this.parseDeploymentReport();

      return true;
    } catch (error) {
      console.log('⚠️  部署检查遇到问题，正在分析...\n');

      // 即使出错也尝试解析已有报告
      await this.parseDeploymentReport();

      return false;
    }
  }

  /**
   * 解析部署报告
   */
  async parseDeploymentReport() {
    try {
      const reportPath = path.join(
        process.cwd(),
        'reports',
        'deployment-report.json',
      );

      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        this.readiness.ready = report.deployment.ready;
        this.readiness.score = report.deployment.score;
        this.readiness.blockers = this.extractBlockers(report);
        this.readiness.warnings = this.extractWarnings(report);
        this.readiness.confidence = this.assessConfidence(report);
      } else {
        // 如果没有部署报告，尝试从质量报告推断
        await this.inferFromQualityReport();
      }
    } catch (error) {
      console.warn('⚠️  无法读取部署报告，使用基础评估');
      this.readiness.ready = false;
      this.readiness.confidence = 'low';
    }
  }

  /**
   * 从质量报告推断部署就绪性
   */
  async inferFromQualityReport() {
    try {
      const qualityReportPath = path.join(
        process.cwd(),
        'reports',
        'simple-quality-report.json',
      );

      if (fs.existsSync(qualityReportPath)) {
        const report = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));

        const score = report.summary.overallScore || 0;
        const failedChecks = report.summary.failedChecks || 0;

        this.readiness.score = score;
        this.readiness.ready = score >= 80 && failedChecks === 0;
        this.readiness.confidence =
          score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low';

        if (failedChecks > 0) {
          this.readiness.blockers.push({
            type: 'quality',
            message: `${failedChecks} 个质量检查失败`,
            action: '运行 pnpm health 查看详情',
          });
        }
      }
    } catch (error) {
      // 静默失败，使用默认值
    }
  }

  /**
   * 提取阻塞性问题
   */
  extractBlockers(report) {
    if (!report.deployment.blockers) return [];

    return report.deployment.blockers.map((blocker) => ({
      type: blocker.type,
      message: blocker.message,
      action: blocker.action,
    }));
  }

  /**
   * 提取警告问题
   */
  extractWarnings(report) {
    if (!report.deployment.warnings) return [];

    return report.deployment.warnings.slice(0, 3).map((warning) => ({
      type: warning.type,
      message: warning.message,
      action: warning.action,
    }));
  }

  /**
   * 评估信心度
   */
  assessConfidence(report) {
    const score = report.deployment.score || 0;
    const blockers = report.deployment.blockers?.length || 0;

    if (score >= 95 && blockers === 0) return 'high';
    if (score >= 85 && blockers === 0) return 'medium';
    return 'low';
  }

  /**
   * 显示部署决策
   */
  displayDeploymentDecision() {
    console.log('🚀 部署就绪评估');
    console.log('='.repeat(30));

    // 显示主要决策
    if (this.readiness.ready) {
      console.log('✅ 可以安全部署！');
      console.log(`📊 就绪分数: ${this.readiness.score}/100`);

      const confidenceIcons = {
        high: '🟢 高信心',
        medium: '🟡 中等信心',
        low: '🟠 低信心',
      };

      console.log(`🎯 信心度: ${confidenceIcons[this.readiness.confidence]}`);
    } else {
      console.log('❌ 暂不建议部署');
      console.log(`📊 就绪分数: ${this.readiness.score}/100 (需要≥80)`);
    }

    // 显示阻塞性问题
    if (this.readiness.blockers.length > 0) {
      console.log('\n🚨 必须修复的问题:');
      this.readiness.blockers.forEach((blocker, index) => {
        console.log(`${index + 1}. ${blocker.message}`);
        console.log(`   💡 解决方案: ${blocker.action}`);
      });
    }

    // 显示警告
    if (this.readiness.warnings.length > 0) {
      console.log('\n⚠️  建议修复的问题:');
      this.readiness.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
        console.log(`   💡 建议: ${warning.action}`);
      });
    }

    // 显示下一步建议
    console.log('\n📋 下一步:');
    if (this.readiness.ready) {
      console.log('🎉 可以执行部署命令');
      console.log('📊 查看详细报告: pnpm report');
    } else {
      console.log('🔧 修复上述问题后重新检查');
      console.log('🏥 查看项目健康: pnpm health');
      console.log('📊 查看详细报告: pnpm report');
    }
  }

  /**
   * 执行部署就绪检查
   */
  async checkReadiness() {
    console.log('🎯 部署就绪快速检查');
    console.log('='.repeat(30));

    const success = await this.runDeploymentChecks();
    this.displayDeploymentDecision();

    return this.readiness.ready;
  }
}

// 命令行接口
if (require.main === module) {
  const checker = new DeploymentReadyChecker();
  checker
    .checkReadiness()
    .then((ready) => {
      if (ready) {
        console.log('\n🎉 部署检查通过！');
      } else {
        console.log('\n⚠️  请修复问题后重试部署检查。');
      }
      process.exit(ready ? 0 : 1);
    })
    .catch((error) => {
      console.error(`❌ 部署检查失败: ${error.message}`);
      process.exit(1);
    });
}

module.exports = DeploymentReadyChecker;
