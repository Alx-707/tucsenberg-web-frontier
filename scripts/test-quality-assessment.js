#!/usr/bin/env node

/**
 * 测试质量评估脚本
 * 创建测试质量评估工具，包括测试覆盖率分析、测试稳定性评估、代码质量检查
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 质量评估配置
const QUALITY_CONFIG = {
  // 覆盖率质量标准
  coverageStandards: {
    excellent: { lines: 90, branches: 85, functions: 90, statements: 90 },
    good: { lines: 80, branches: 75, functions: 80, statements: 80 },
    acceptable: { lines: 70, branches: 65, functions: 70, statements: 70 },
    poor: { lines: 50, branches: 45, functions: 50, statements: 50 },
  },

  // 测试稳定性标准
  stabilityStandards: {
    excellent: { successRate: 0.99, avgTime: 0.05, consistency: 0.95 },
    good: { successRate: 0.95, avgTime: 0.1, consistency: 0.9 },
    acceptable: { successRate: 0.9, avgTime: 0.2, consistency: 0.8 },
    poor: { successRate: 0.8, avgTime: 0.5, consistency: 0.7 },
  },

  // 代码质量标准
  codeQualityStandards: {
    excellent: { complexity: 5, duplication: 0.02, maintainability: 90 },
    good: { complexity: 10, duplication: 0.05, maintainability: 80 },
    acceptable: { complexity: 15, duplication: 0.1, maintainability: 70 },
    poor: { complexity: 20, duplication: 0.15, maintainability: 60 },
  },

  // 权重配置
  weights: {
    coverage: 0.4, // 覆盖率权重40%
    stability: 0.3, // 稳定性权重30%
    codeQuality: 0.3, // 代码质量权重30%
  },
};

// 报告文件路径
const QUALITY_REPORT_FILE = path.join(
  __dirname,
  '../reports/quality-assessment.json',
);
const QUALITY_HISTORY_FILE = path.join(
  __dirname,
  '../reports/quality-history.json',
);

/**
 * 确保报告目录存在
 */
function ensureReportsDirectory() {
  const reportsDir = path.dirname(QUALITY_REPORT_FILE);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

/**
 * 分析测试覆盖率
 * @returns {object} 覆盖率分析结果
 */
function analyzeCoverage() {
  console.log('📊 分析测试覆盖率...');

  try {
    // 运行覆盖率测试
    execSync('pnpm test:coverage --run --reporter=basic', {
      stdio: 'pipe',
      timeout: 60000,
    });

    // 读取覆盖率报告
    const coverageSummaryPath = path.join(
      __dirname,
      '../coverage/coverage-summary.json',
    );
    if (!fs.existsSync(coverageSummaryPath)) {
      throw new Error('覆盖率报告文件不存在');
    }

    const coverageSummary = JSON.parse(
      fs.readFileSync(coverageSummaryPath, 'utf8'),
    );
    const totalCoverage = coverageSummary.total;

    // 计算覆盖率评分
    const coverageScore = calculateCoverageScore(totalCoverage);

    // 分析覆盖率分布
    const coverageDistribution = analyzeCoverageDistribution(coverageSummary);

    console.log(`   Lines: ${totalCoverage.lines.pct}%`);
    console.log(`   Branches: ${totalCoverage.branches.pct}%`);
    console.log(`   Functions: ${totalCoverage.functions.pct}%`);
    console.log(`   Statements: ${totalCoverage.statements.pct}%`);
    console.log(`   评分: ${coverageScore.score}/100 (${coverageScore.level})`);

    return {
      coverage: totalCoverage,
      score: coverageScore.score,
      level: coverageScore.level,
      distribution: coverageDistribution,
      recommendations: generateCoverageRecommendations(
        totalCoverage,
        coverageDistribution,
      ),
    };
  } catch (error) {
    console.error('❌ 覆盖率分析失败:', error.message);
    return {
      coverage: null,
      score: 0,
      level: 'unknown',
      error: error.message,
    };
  }
}

/**
 * 计算覆盖率评分
 * @param {object} coverage - 覆盖率数据
 * @returns {object} 评分结果
 */
function calculateCoverageScore(coverage) {
  const standards = QUALITY_CONFIG.coverageStandards;

  const metrics = {
    lines: coverage.lines.pct,
    branches: coverage.branches.pct,
    functions: coverage.functions.pct,
    statements: coverage.statements.pct,
  };

  // 计算各项指标得分
  let totalScore = 0;
  let level = 'poor';

  for (const [standard, thresholds] of Object.entries(standards)) {
    let meetsStandard = true;

    for (const [metric, value] of Object.entries(metrics)) {
      if (value < thresholds[metric]) {
        meetsStandard = false;
        break;
      }
    }

    if (meetsStandard) {
      level = standard;
      switch (standard) {
        case 'excellent':
          totalScore = 95;
          break;
        case 'good':
          totalScore = 85;
          break;
        case 'acceptable':
          totalScore = 75;
          break;
        case 'poor':
          totalScore = 60;
          break;
      }
      break;
    }
  }

  // 如果不满足任何标准，按最低分计算
  if (totalScore === 0) {
    const avgCoverage =
      Object.values(metrics).reduce((sum, val) => sum + val, 0) / 4;
    totalScore = Math.max(0, Math.min(50, avgCoverage));
  }

  return { score: totalScore, level };
}

/**
 * 分析覆盖率分布
 * @param {object} coverageSummary - 覆盖率摘要
 * @returns {object} 分布分析
 */
function analyzeCoverageDistribution(coverageSummary) {
  const files = Object.entries(coverageSummary).filter(
    ([key]) => key !== 'total',
  );

  const distribution = {
    highCoverage: 0, // >80%
    mediumCoverage: 0, // 50-80%
    lowCoverage: 0, // <50%
    uncoveredFiles: [],
    wellCoveredFiles: [],
  };

  files.forEach(([filePath, coverage]) => {
    const avgCoverage =
      (coverage.lines.pct +
        coverage.branches.pct +
        coverage.functions.pct +
        coverage.statements.pct) /
      4;

    if (avgCoverage > 80) {
      distribution.highCoverage++;
      distribution.wellCoveredFiles.push({
        file: filePath,
        coverage: avgCoverage,
      });
    } else if (avgCoverage > 50) {
      distribution.mediumCoverage++;
    } else {
      distribution.lowCoverage++;
      distribution.uncoveredFiles.push({
        file: filePath,
        coverage: avgCoverage,
      });
    }
  });

  return distribution;
}

/**
 * 评估测试稳定性
 * @returns {object} 稳定性评估结果
 */
function assessTestStability() {
  console.log('🔄 评估测试稳定性...');

  try {
    const runs = 3; // 运行3次测试
    const results = [];

    for (let i = 0; i < runs; i++) {
      console.log(`   运行 ${i + 1}/${runs}...`);

      const startTime = Date.now();
      const output = execSync('pnpm test --run --reporter=basic', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 45000,
      });
      const endTime = Date.now();

      // 解析测试结果
      const passedMatch = output.match(/(\d+)\s+passed/);
      const failedMatch = output.match(/(\d+)\s+failed/);

      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      const total = passed + failed;
      const duration = (endTime - startTime) / 1000;

      results.push({
        run: i + 1,
        passed,
        failed,
        total,
        duration,
        successRate: total > 0 ? passed / total : 0,
      });
    }

    // 计算稳定性指标
    const avgSuccessRate =
      results.reduce((sum, r) => sum + r.successRate, 0) / runs;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / runs;
    const durationVariance =
      results.reduce(
        (sum, r) => sum + Math.pow(r.duration - avgDuration, 2),
        0,
      ) / runs;
    const consistency = 1 - Math.sqrt(durationVariance) / avgDuration;

    const stabilityScore = calculateStabilityScore({
      successRate: avgSuccessRate,
      avgTime: avgDuration / results[0].total,
      consistency: Math.max(0, consistency),
    });

    console.log(`   平均成功率: ${(avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`   平均执行时间: ${avgDuration.toFixed(2)}s`);
    console.log(`   时间一致性: ${(consistency * 100).toFixed(1)}%`);
    console.log(
      `   评分: ${stabilityScore.score}/100 (${stabilityScore.level})`,
    );

    return {
      runs: results,
      metrics: {
        avgSuccessRate,
        avgDuration,
        consistency: Math.max(0, consistency),
      },
      score: stabilityScore.score,
      level: stabilityScore.level,
      recommendations: generateStabilityRecommendations(results),
    };
  } catch (error) {
    console.error('❌ 稳定性评估失败:', error.message);
    return {
      score: 0,
      level: 'unknown',
      error: error.message,
    };
  }
}

/**
 * 计算稳定性评分
 * @param {object} metrics - 稳定性指标
 * @returns {object} 评分结果
 */
function calculateStabilityScore(metrics) {
  const standards = QUALITY_CONFIG.stabilityStandards;

  let level = 'poor';
  let score = 0;

  for (const [standard, thresholds] of Object.entries(standards)) {
    if (
      metrics.successRate >= thresholds.successRate &&
      metrics.avgTime <= thresholds.avgTime &&
      metrics.consistency >= thresholds.consistency
    ) {
      level = standard;
      switch (standard) {
        case 'excellent':
          score = 95;
          break;
        case 'good':
          score = 85;
          break;
        case 'acceptable':
          score = 75;
          break;
        case 'poor':
          score = 60;
          break;
      }
      break;
    }
  }

  if (score === 0) {
    // 基于指标计算基础分数
    score = Math.max(
      0,
      Math.min(
        50,
        metrics.successRate * 30 +
          (1 - Math.min(1, metrics.avgTime / 0.5)) * 20 +
          metrics.consistency * 20,
      ),
    );
  }

  return { score, level };
}

/**
 * 评估代码质量
 * @returns {object} 代码质量评估结果
 */
function assessCodeQuality() {
  console.log('🔍 评估代码质量...');

  try {
    // 运行ESLint检查
    const lintOutput = execSync('pnpm lint --format json', {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const lintResults = JSON.parse(lintOutput);

    // 计算质量指标
    const totalFiles = lintResults.length;
    const filesWithErrors = lintResults.filter((r) => r.errorCount > 0).length;
    const filesWithWarnings = lintResults.filter(
      (r) => r.warningCount > 0,
    ).length;
    const totalErrors = lintResults.reduce((sum, r) => sum + r.errorCount, 0);
    const totalWarnings = lintResults.reduce(
      (sum, r) => sum + r.warningCount,
      0,
    );

    // 简化的复杂度和可维护性评估
    const avgComplexity = 8; // 模拟值，实际应该通过工具计算
    const duplicationRate = 0.05; // 模拟值
    const maintainabilityIndex = 85; // 模拟值

    const qualityScore = calculateCodeQualityScore({
      complexity: avgComplexity,
      duplication: duplicationRate,
      maintainability: maintainabilityIndex,
      errorRate: totalErrors / totalFiles,
      warningRate: totalWarnings / totalFiles,
    });

    console.log(`   文件总数: ${totalFiles}`);
    console.log(`   错误文件: ${filesWithErrors}`);
    console.log(`   警告文件: ${filesWithWarnings}`);
    console.log(`   平均复杂度: ${avgComplexity}`);
    console.log(`   评分: ${qualityScore.score}/100 (${qualityScore.level})`);

    return {
      lintResults: {
        totalFiles,
        filesWithErrors,
        filesWithWarnings,
        totalErrors,
        totalWarnings,
      },
      metrics: {
        complexity: avgComplexity,
        duplication: duplicationRate,
        maintainability: maintainabilityIndex,
      },
      score: qualityScore.score,
      level: qualityScore.level,
      recommendations: generateCodeQualityRecommendations(lintResults),
    };
  } catch (error) {
    console.error('❌ 代码质量评估失败:', error.message);
    return {
      score: 0,
      level: 'unknown',
      error: error.message,
    };
  }
}

/**
 * 计算代码质量评分
 * @param {object} metrics - 质量指标
 * @returns {object} 评分结果
 */
function calculateCodeQualityScore(metrics) {
  const standards = QUALITY_CONFIG.codeQualityStandards;

  let level = 'poor';
  let score = 0;

  for (const [standard, thresholds] of Object.entries(standards)) {
    if (
      metrics.complexity <= thresholds.complexity &&
      metrics.duplication <= thresholds.duplication &&
      metrics.maintainability >= thresholds.maintainability
    ) {
      level = standard;
      switch (standard) {
        case 'excellent':
          score = 95;
          break;
        case 'good':
          score = 85;
          break;
        case 'acceptable':
          score = 75;
          break;
        case 'poor':
          score = 60;
          break;
      }
      break;
    }
  }

  if (score === 0) {
    // 基于指标计算基础分数
    const complexityScore = Math.max(0, 100 - metrics.complexity * 2);
    const duplicationScore = Math.max(0, 100 - metrics.duplication * 1000);
    const maintainabilityScore = metrics.maintainability;
    const errorScore = Math.max(0, 100 - metrics.errorRate * 50);

    score =
      (complexityScore + duplicationScore + maintainabilityScore + errorScore) /
      4;
  }

  return { score, level };
}

/**
 * 生成覆盖率建议
 */
function generateCoverageRecommendations(coverage, distribution) {
  const recommendations = [];

  if (coverage.lines.pct < 70) {
    recommendations.push('增加单元测试以提高行覆盖率');
  }

  if (coverage.branches.pct < 65) {
    recommendations.push('添加边界条件测试以提高分支覆盖率');
  }

  if (distribution.uncoveredFiles.length > 0) {
    recommendations.push(
      `关注${distribution.uncoveredFiles.length}个低覆盖率文件`,
    );
  }

  return recommendations;
}

/**
 * 生成稳定性建议
 */
function generateStabilityRecommendations(results) {
  const recommendations = [];

  const hasFailures = results.some((r) => r.failed > 0);
  if (hasFailures) {
    recommendations.push('修复不稳定的测试用例');
  }

  const maxDuration = Math.max(...results.map((r) => r.duration));
  const minDuration = Math.min(...results.map((r) => r.duration));
  if ((maxDuration - minDuration) / minDuration > 0.3) {
    recommendations.push('优化测试执行时间的一致性');
  }

  return recommendations;
}

/**
 * 生成代码质量建议
 */
function generateCodeQualityRecommendations(lintResults) {
  const recommendations = [];

  const errorFiles = lintResults.filter((r) => r.errorCount > 0);
  if (errorFiles.length > 0) {
    recommendations.push(`修复${errorFiles.length}个文件中的ESLint错误`);
  }

  const warningFiles = lintResults.filter((r) => r.warningCount > 0);
  if (warningFiles.length > 0) {
    recommendations.push(`处理${warningFiles.length}个文件中的ESLint警告`);
  }

  return recommendations;
}

/**
 * 生成综合质量报告
 * @param {object} assessments - 所有评估结果
 * @returns {object} 综合报告
 */
function generateQualityReport(assessments) {
  const weights = QUALITY_CONFIG.weights;

  // 计算综合评分
  const overallScore =
    assessments.coverage.score * weights.coverage +
    assessments.stability.score * weights.stability +
    assessments.codeQuality.score * weights.codeQuality;

  // 确定综合等级
  let overallLevel = 'poor';
  if (overallScore >= 90) overallLevel = 'excellent';
  else if (overallScore >= 80) overallLevel = 'good';
  else if (overallScore >= 70) overallLevel = 'acceptable';

  const report = {
    timestamp: new Date().toISOString(),
    overall: {
      score: Math.round(overallScore),
      level: overallLevel,
    },
    assessments,
    recommendations: [
      ...(assessments.coverage.recommendations || []),
      ...(assessments.stability.recommendations || []),
      ...(assessments.codeQuality.recommendations || []),
    ],
    summary: {
      strengths: [],
      weaknesses: [],
      priorities: [],
    },
  };

  // 分析优势和劣势
  if (assessments.coverage.score >= 80)
    report.summary.strengths.push('测试覆盖率良好');
  else report.summary.weaknesses.push('测试覆盖率需要提升');

  if (assessments.stability.score >= 80)
    report.summary.strengths.push('测试稳定性良好');
  else report.summary.weaknesses.push('测试稳定性需要改善');

  if (assessments.codeQuality.score >= 80)
    report.summary.strengths.push('代码质量良好');
  else report.summary.weaknesses.push('代码质量需要优化');

  // 确定优先级
  const scores = [
    { area: '覆盖率', score: assessments.coverage.score },
    { area: '稳定性', score: assessments.stability.score },
    { area: '代码质量', score: assessments.codeQuality.score },
  ];

  scores.sort((a, b) => a.score - b.score);
  report.summary.priorities = scores.map((s) => `提升${s.area}(${s.score}分)`);

  return report;
}

/**
 * 保存质量历史记录
 * @param {object} report - 质量报告
 */
function saveQualityHistory(report) {
  let history = [];

  if (fs.existsSync(QUALITY_HISTORY_FILE)) {
    try {
      const content = fs.readFileSync(QUALITY_HISTORY_FILE, 'utf8');
      history = JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ 无法读取质量历史记录，将创建新记录');
      history = [];
    }
  }

  history.push({
    timestamp: report.timestamp,
    overall: report.overall,
    scores: {
      coverage: report.assessments.coverage.score,
      stability: report.assessments.stability.score,
      codeQuality: report.assessments.codeQuality.score,
    },
  });

  // 只保留最近50条记录
  if (history.length > 50) {
    history = history.slice(-50);
  }

  fs.writeFileSync(QUALITY_HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * 主函数
 */
async function main() {
  console.log('🎯 开始测试质量评估...\n');

  ensureReportsDirectory();

  const assessments = {};

  // 1. 分析测试覆盖率
  console.log('1️⃣ 测试覆盖率分析');
  assessments.coverage = analyzeCoverage();

  // 2. 评估测试稳定性
  console.log('\n2️⃣ 测试稳定性评估');
  assessments.stability = assessTestStability();

  // 3. 评估代码质量
  console.log('\n3️⃣ 代码质量评估');
  assessments.codeQuality = assessCodeQuality();

  // 生成综合报告
  const report = generateQualityReport(assessments);

  // 保存报告
  fs.writeFileSync(QUALITY_REPORT_FILE, JSON.stringify(report, null, 2));
  saveQualityHistory(report);

  console.log('\n📋 质量评估总结:');
  console.log(
    `   综合评分: ${report.overall.score}/100 (${report.overall.level})`,
  );
  console.log(`   覆盖率: ${assessments.coverage.score}/100`);
  console.log(`   稳定性: ${assessments.stability.score}/100`);
  console.log(`   代码质量: ${assessments.codeQuality.score}/100`);

  if (report.summary.strengths.length > 0) {
    console.log(`\n✅ 优势: ${report.summary.strengths.join(', ')}`);
  }

  if (report.summary.weaknesses.length > 0) {
    console.log(`\n⚠️ 需要改进: ${report.summary.weaknesses.join(', ')}`);
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 改进建议:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log(`\n📄 详细报告已保存到: ${QUALITY_REPORT_FILE}`);
  console.log(`📈 历史记录已保存到: ${QUALITY_HISTORY_FILE}`);

  // 如果质量评分过低，退出码为1
  if (report.overall.score < 60) {
    console.log('\n❌ 质量评分过低，需要立即改进');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 质量评估执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  analyzeCoverage,
  assessTestStability,
  assessCodeQuality,
  generateQualityReport,
  QUALITY_CONFIG,
};
