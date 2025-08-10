#!/usr/bin/env node

/**
 * 性能监控体系验证脚本
 * 验证所有性能监控功能是否正常工作
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceMonitoringVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      passed: 0,
      failed: 0,
      total: 0,
    };
  }

  /**
   * 添加检查结果
   */
  addCheck(name, passed, message, details = null) {
    const check = {
      name,
      passed,
      message,
      details,
    };

    this.results.checks.push(check);
    this.results.total++;

    if (passed) {
      this.results.passed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${name}: ${message}`);
      if (details) {
        console.log(`   详情: ${details}`);
      }
    }
  }

  /**
   * 验证文件存在
   */
  verifyFileExists(filePath, description) {
    const exists = fs.existsSync(filePath);
    this.addCheck(
      `文件存在性检查: ${description}`,
      exists,
      exists ? '文件存在' : '文件不存在',
      filePath,
    );
    return exists;
  }

  /**
   * 验证TypeScript文件语法
   */
  verifyTypeScriptSyntax(filePath, description) {
    try {
      // 使用项目的TypeScript配置进行检查
      execSync(`pnpm type-check`, { stdio: 'pipe' });
      this.addCheck(
        `TypeScript语法检查: ${description}`,
        true,
        'TypeScript语法正确',
      );
      return true;
    } catch (error) {
      // 如果全局检查失败，尝试单独检查文件
      try {
        execSync(`npx tsc --noEmit --skipLibCheck ${filePath}`, {
          stdio: 'pipe',
        });
        this.addCheck(
          `TypeScript语法检查: ${description}`,
          true,
          'TypeScript语法正确',
        );
        return true;
      } catch (singleFileError) {
        this.addCheck(
          `TypeScript语法检查: ${description}`,
          false,
          'TypeScript语法错误',
          singleFileError.message,
        );
        return false;
      }
    }
  }

  /**
   * 验证JavaScript文件语法
   */
  verifyJavaScriptSyntax(filePath, description) {
    try {
      execSync(`node -c ${filePath}`, { stdio: 'pipe' });
      this.addCheck(
        `JavaScript语法检查: ${description}`,
        true,
        'JavaScript语法正确',
      );
      return true;
    } catch (error) {
      this.addCheck(
        `JavaScript语法检查: ${description}`,
        false,
        'JavaScript语法错误',
        error.message,
      );
      return false;
    }
  }

  /**
   * 验证文件内容包含特定字符串
   */
  verifyFileContains(filePath, searchStrings, description) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const missing = searchStrings.filter((str) => !content.includes(str));

      if (missing.length === 0) {
        this.addCheck(`内容检查: ${description}`, true, '包含所有必需内容');
        return true;
      } else {
        this.addCheck(
          `内容检查: ${description}`,
          false,
          '缺少必需内容',
          `缺少: ${missing.join(', ')}`,
        );
        return false;
      }
    } catch (error) {
      this.addCheck(
        `内容检查: ${description}`,
        false,
        '读取文件失败',
        error.message,
      );
      return false;
    }
  }

  /**
   * 验证性能分析器功能
   */
  verifyPerformanceAnalyzer() {
    console.log('\n🔍 验证性能分析器...');

    // 检查文件存在
    const analyzerPath = 'scripts/performance-analyzer.js';
    if (!this.verifyFileExists(analyzerPath, '性能分析器脚本')) {
      return false;
    }

    // 检查语法
    if (!this.verifyJavaScriptSyntax(analyzerPath, '性能分析器脚本')) {
      return false;
    }

    // 检查必需功能
    const requiredFeatures = [
      'PerformanceAnalyzer',
      'loadBaseline',
      'saveBaseline',
      'detectRegression',
      'generateReport',
      '--save-baseline',
      '--compare-baseline',
      '--ci',
    ];

    this.verifyFileContains(
      analyzerPath,
      requiredFeatures,
      '性能分析器必需功能',
    );

    // 测试帮助命令
    try {
      const helpOutput = execSync(
        'node scripts/performance-analyzer.js --help',
        {
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );

      const hasHelp =
        helpOutput.includes('性能分析器') && helpOutput.includes('用法');
      this.addCheck(
        '性能分析器帮助命令',
        hasHelp,
        hasHelp ? '帮助命令正常工作' : '帮助命令输出异常',
      );
    } catch (error) {
      this.addCheck(
        '性能分析器帮助命令',
        false,
        '帮助命令执行失败',
        error.message,
      );
    }

    return true;
  }

  /**
   * 验证Enhanced Web Vitals系统
   */
  verifyEnhancedWebVitals() {
    console.log('\n🔍 验证Enhanced Web Vitals系统...');

    const webVitalsPath = 'src/lib/enhanced-web-vitals.ts';
    if (!this.verifyFileExists(webVitalsPath, 'Enhanced Web Vitals文件')) {
      return false;
    }

    if (
      !this.verifyTypeScriptSyntax(webVitalsPath, 'Enhanced Web Vitals文件')
    ) {
      return false;
    }

    // 检查核心类和接口
    const requiredComponents = [
      'DetailedWebVitals',
      'PerformanceBaseline',
      'RegressionDetectionResult',
      'PerformanceAlertConfig',
      'EnhancedWebVitalsCollector',
      'PerformanceBaselineManager',
      'PerformanceRegressionDetector',
      'PerformanceAlertSystem',
      'PerformanceMonitoringManager',
    ];

    this.verifyFileContains(
      webVitalsPath,
      requiredComponents,
      'Enhanced Web Vitals核心组件',
    );

    // 检查关键方法
    const requiredMethods = [
      'saveBaseline',
      'getRecentBaseline',
      'detectRegression',
      'checkAndAlert',
      'performFullMonitoring',
      'generateComprehensiveReport',
    ];

    this.verifyFileContains(
      webVitalsPath,
      requiredMethods,
      'Enhanced Web Vitals关键方法',
    );

    return true;
  }

  /**
   * 验证文档
   */
  verifyDocumentation() {
    console.log('\n🔍 验证文档...');

    const guidePath = 'docs/performance/performance-monitoring-guide.md';
    if (!this.verifyFileExists(guidePath, '性能监控使用指南')) {
      return false;
    }

    // 检查文档内容
    const requiredSections = [
      '# 性能监控使用指南',
      '## 📊 概述',
      '## 🚀 快速开始',
      '## 📈 性能监控系统',
      '## 🔧 配置选项',
      '## 📊 报告格式',
      '## 🔄 CI/CD 集成',
      '## 🚨 故障排除',
      '## 📚 最佳实践',
    ];

    this.verifyFileContains(
      guidePath,
      requiredSections,
      '性能监控指南必需章节',
    );

    return true;
  }

  /**
   * 验证CI/CD工作流
   */
  verifyCIWorkflow() {
    console.log('\n🔍 验证CI/CD工作流...');

    const workflowPath = '.github/workflows/performance-check.yml';
    if (!this.verifyFileExists(workflowPath, 'CI/CD性能检查工作流')) {
      return false;
    }

    // 检查工作流内容
    const requiredElements = [
      'name: Performance Check',
      'performance-analysis:',
      'size-limit-check:',
      'lighthouse-audit:',
      'performance-summary:',
      '--compare-baseline',
      '--save-baseline',
      '--ci',
      'actions/upload-artifact@v3',
      'actions/github-script@v6',
    ];

    this.verifyFileContains(
      workflowPath,
      requiredElements,
      'CI/CD工作流必需元素',
    );

    return true;
  }

  /**
   * 验证package.json脚本
   */
  verifyPackageScripts() {
    console.log('\n🔍 验证package.json脚本...');

    const packagePath = 'package.json';
    if (!this.verifyFileExists(packagePath, 'package.json文件')) {
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const scripts = packageJson.scripts || {};

      const requiredScripts = [
        'size:check',
        'size:why',
        'analyze',
        'quality:full',
      ];

      const missingScripts = requiredScripts.filter(
        (script) => !scripts[script],
      );

      if (missingScripts.length === 0) {
        this.addCheck('package.json脚本检查', true, '包含所有必需脚本');
      } else {
        this.addCheck(
          'package.json脚本检查',
          false,
          '缺少必需脚本',
          `缺少: ${missingScripts.join(', ')}`,
        );
      }

      // 检查性能相关依赖
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      const requiredDeps = ['@next/bundle-analyzer', 'size-limit'];

      const missingDeps = requiredDeps.filter((dep) => !dependencies[dep]);

      if (missingDeps.length === 0) {
        this.addCheck('性能相关依赖检查', true, '包含所有必需依赖');
      } else {
        this.addCheck(
          '性能相关依赖检查',
          false,
          '缺少必需依赖',
          `缺少: ${missingDeps.join(', ')}`,
        );
      }
    } catch (error) {
      this.addCheck(
        'package.json解析',
        false,
        '解析package.json失败',
        error.message,
      );
    }

    return true;
  }

  /**
   * 验证配置文件
   */
  verifyConfigFiles() {
    console.log('\n🔍 验证配置文件...');

    // 检查size-limit配置
    const sizeLimitPath = '.size-limit.js';
    if (this.verifyFileExists(sizeLimitPath, 'size-limit配置文件')) {
      this.verifyFileContains(
        sizeLimitPath,
        ['module.exports', 'limit', 'path'],
        'size-limit配置内容',
      );
    }

    // 检查next.config.ts
    const nextConfigPath = 'next.config.ts';
    if (this.verifyFileExists(nextConfigPath, 'Next.js配置文件')) {
      this.verifyFileContains(
        nextConfigPath,
        ['bundleAnalyzer', 'withBundleAnalyzer'],
        'Next.js bundle分析器配置',
      );
    }

    return true;
  }

  /**
   * 执行完整验证
   */
  async verify() {
    console.log('🚀 开始验证性能监控体系...\n');

    // 执行各项验证
    this.verifyPerformanceAnalyzer();
    this.verifyEnhancedWebVitals();
    this.verifyDocumentation();
    this.verifyCIWorkflow();
    this.verifyPackageScripts();
    this.verifyConfigFiles();

    // 生成报告
    this.generateReport();

    return this.results.failed === 0;
  }

  /**
   * 生成验证报告
   */
  generateReport() {
    console.log('\n📊 验证报告');
    console.log('='.repeat(50));
    console.log(
      `🕐 时间: ${new Date(this.results.timestamp).toLocaleString()}`,
    );
    console.log(`✅ 通过: ${this.results.passed}/${this.results.total}`);
    console.log(`❌ 失败: ${this.results.failed}/${this.results.total}`);
    console.log(
      `📊 成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`,
    );

    if (this.results.failed > 0) {
      console.log('\n🚨 失败的检查:');
      this.results.checks
        .filter((check) => !check.passed)
        .forEach((check, index) => {
          console.log(`${index + 1}. ${check.name}: ${check.message}`);
          if (check.details) {
            console.log(`   详情: ${check.details}`);
          }
        });
    }

    // 保存报告
    this.saveReport();

    console.log(`\n🎯 验证${this.results.failed === 0 ? '成功' : '失败'}！`);
  }

  /**
   * 保存验证报告
   */
  saveReport() {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const reportPath = path.join(
        reportsDir,
        'performance-monitoring-verification.json',
      );
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

      console.log(`\n📄 验证报告已保存: ${reportPath}`);
    } catch (error) {
      console.warn(`⚠️  保存报告失败: ${error.message}`);
    }
  }
}

// 命令行接口
if (require.main === module) {
  const verifier = new PerformanceMonitoringVerifier();
  verifier
    .verify()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(`❌ 验证失败: ${error.message}`);
      process.exit(1);
    });
}

module.exports = PerformanceMonitoringVerifier;
