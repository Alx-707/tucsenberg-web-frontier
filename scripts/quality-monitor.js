#!/usr/bin/env node

/**
 * 质量监控脚本
 * 定期运行质量检查并发送通知
 */

const ComprehensiveQualitySystem = require('./comprehensive-quality-system');

class QualityMonitor {
  constructor() {
    this.system = new ComprehensiveQualitySystem();
    this.thresholds = {
      critical: 60, // 低于60分发送紧急通知
      warning: 80, // 低于80分发送警告通知
    };
  }

  async runMonitoring() {
    console.log('🔍 启动质量监控...');

    try {
      await this.system.runComprehensiveQualityCheck();
      const score = this.system.report.overallScore;

      if (score < this.thresholds.critical) {
        await this.sendCriticalAlert(score);
      } else if (score < this.thresholds.warning) {
        await this.sendWarningAlert(score);
      } else {
        console.log('✅ 质量监控：项目质量良好');
      }
    } catch (error) {
      console.error('❌ 质量监控失败:', error.message);
      await this.sendErrorAlert(error);
    }
  }

  async sendCriticalAlert(score) {
    console.log(`🚨 紧急警告：项目质量分数过低 (${score}/100)`);
    // 这里可以集成邮件、Slack等通知系统
  }

  async sendWarningAlert(score) {
    console.log(`⚠️ 质量警告：项目质量需要改进 (${score}/100)`);
  }

  async sendErrorAlert(error) {
    console.log(`❌ 监控错误：${error.message}`);
  }
}

if (require.main === module) {
  const monitor = new QualityMonitor();
  monitor.runMonitoring();
}

module.exports = QualityMonitor;
