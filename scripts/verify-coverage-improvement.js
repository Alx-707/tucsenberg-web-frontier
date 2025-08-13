#!/usr/bin/env node

/**
 * 测试覆盖率改进验证脚本
 * 验证测试覆盖率提升项目的进展和成果
 */

const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

// 读取覆盖率摘要
function readCoverageSummary() {
  try {
    const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (!fs.existsSync(summaryPath)) {
      console.log(colors.yellow('⚠️  覆盖率报告不存在，请先运行测试'));
      return null;
    }
    
    const content = fs.readFileSync(summaryPath, 'utf8');
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    console.error(colors.red('❌ 读取覆盖率报告失败:'), error.message);
    return null;
  }
}

// 分析覆盖率数据
function analyzeCoverage(coverageData) {
  if (!coverageData || !coverageData.total) {
    return null;
  }

  const total = coverageData.total;
  const currentCoverage = total.lines.pct;
  const coveredLines = total.lines.covered;
  const totalLines = total.lines.total;

  return {
    currentCoverage,
    coveredLines,
    totalLines,
    uncoveredLines: totalLines - coveredLines,
    functions: {
      covered: total.functions.covered,
      total: total.functions.total,
      pct: total.functions.pct,
    },
    branches: {
      covered: total.branches.covered,
      total: total.branches.total,
      pct: total.branches.pct,
    },
  };
}

// 检查关键文件的覆盖率
function checkKeyFiles(coverageData) {
  const keyFiles = [
    'src/components/home/hero-section.tsx',
    'src/components/home/project-overview.tsx',
    'src/components/home/tech-stack-section.tsx',
    'src/app/[locale]/contact/page.tsx',
    'src/components/i18n/enhanced-locale-switcher.tsx',
    'src/lib/structured-data-generators.ts',
    'src/lib/navigation.ts',
    'src/components/contact/contact-form.tsx',
  ];

  const results = [];
  
  for (const [filePath, fileData] of Object.entries(coverageData)) {
    if (filePath === 'total') continue;
    
    const normalizedPath = filePath.replace(/^\/.*\/tucsenberg-web-frontier\//, '');
    
    if (keyFiles.some(key => normalizedPath.includes(key))) {
      results.push({
        file: normalizedPath,
        coverage: fileData.lines.pct,
        covered: fileData.lines.covered,
        total: fileData.lines.total,
      });
    }
  }

  return results.sort((a, b) => b.coverage - a.coverage);
}

// 计算项目进展
function calculateProgress(currentCoverage) {
  const startCoverage = 54.4;
  const targetCoverage = 60.0;
  
  const totalImprovement = targetCoverage - startCoverage;
  const currentImprovement = currentCoverage - startCoverage;
  const progressPercentage = (currentImprovement / totalImprovement) * 100;
  const remainingImprovement = targetCoverage - currentCoverage;

  return {
    startCoverage,
    targetCoverage,
    currentCoverage,
    totalImprovement,
    currentImprovement,
    progressPercentage,
    remainingImprovement,
  };
}

// 生成报告
function generateReport() {
  console.log(colors.bold('\n🎯 测试覆盖率提升项目验证报告'));
  console.log('='.repeat(50));

  const coverageData = readCoverageSummary();
  if (!coverageData) {
    return;
  }

  const analysis = analyzeCoverage(coverageData);
  if (!analysis) {
    console.log(colors.red('❌ 无法分析覆盖率数据'));
    return;
  }

  const progress = calculateProgress(analysis.currentCoverage);

  // 总体进展
  console.log(colors.bold('\n📊 总体进展'));
  console.log(`起始覆盖率: ${colors.cyan(progress.startCoverage.toFixed(2) + '%')}`);
  console.log(`当前覆盖率: ${colors.green(progress.currentCoverage.toFixed(2) + '%')}`);
  console.log(`目标覆盖率: ${colors.blue(progress.targetCoverage.toFixed(2) + '%')}`);
  console.log(`已提升: ${colors.green('+' + progress.currentImprovement.toFixed(2) + '%')}`);
  console.log(`还需提升: ${colors.yellow('+' + progress.remainingImprovement.toFixed(2) + '%')}`);
  console.log(`完成度: ${colors.cyan(progress.progressPercentage.toFixed(1) + '%')}`);

  // 详细统计
  console.log(colors.bold('\n📈 详细统计'));
  console.log(`总行数: ${colors.cyan(analysis.totalLines.toLocaleString())}`);
  console.log(`已覆盖: ${colors.green(analysis.coveredLines.toLocaleString())} 行`);
  console.log(`未覆盖: ${colors.red(analysis.uncoveredLines.toLocaleString())} 行`);
  console.log(`函数覆盖率: ${colors.cyan(analysis.functions.pct.toFixed(2) + '%')} (${analysis.functions.covered}/${analysis.functions.total})`);
  console.log(`分支覆盖率: ${colors.cyan(analysis.branches.pct.toFixed(2) + '%')} (${analysis.branches.covered}/${analysis.branches.total})`);

  // 关键文件状态
  console.log(colors.bold('\n🎯 关键文件覆盖率'));
  const keyFiles = checkKeyFiles(coverageData);
  
  if (keyFiles.length > 0) {
    keyFiles.forEach(file => {
      const status = file.coverage === 100 ? '✅' : 
                   file.coverage >= 90 ? '🟢' :
                   file.coverage >= 60 ? '🟡' :
                   file.coverage > 0 ? '🟠' : '🔴';
      
      const fileName = file.file.split('/').pop();
      console.log(`${status} ${fileName}: ${colors.cyan(file.coverage.toFixed(1) + '%')} (${file.covered}/${file.total})`);
    });
  } else {
    console.log(colors.yellow('⚠️  未找到关键文件的覆盖率数据'));
  }

  // 成就总结
  console.log(colors.bold('\n🏆 项目成就'));
  const achievements = [];
  
  if (progress.currentImprovement > 0) {
    achievements.push(`✅ 成功提升覆盖率 ${progress.currentImprovement.toFixed(2)}%`);
  }
  
  const perfectFiles = keyFiles.filter(f => f.coverage === 100);
  if (perfectFiles.length > 0) {
    achievements.push(`✅ ${perfectFiles.length} 个文件达到100%覆盖率`);
  }
  
  const goodFiles = keyFiles.filter(f => f.coverage >= 90);
  if (goodFiles.length > 0) {
    achievements.push(`✅ ${goodFiles.length} 个文件达到90%+覆盖率`);
  }

  if (achievements.length > 0) {
    achievements.forEach(achievement => console.log(achievement));
  } else {
    console.log(colors.yellow('⚠️  暂无显著成就'));
  }

  // 下一步建议
  console.log(colors.bold('\n🎯 下一步建议'));
  
  if (progress.remainingImprovement > 0) {
    console.log(`📝 还需提升 ${progress.remainingImprovement.toFixed(2)}% 达到目标`);
    
    const lowCoverageFiles = keyFiles.filter(f => f.coverage < 60);
    if (lowCoverageFiles.length > 0) {
      console.log('🔍 优先处理低覆盖率文件:');
      lowCoverageFiles.forEach(file => {
        const fileName = file.file.split('/').pop();
        console.log(`   - ${fileName}: ${file.coverage.toFixed(1)}%`);
      });
    }
  } else {
    console.log(colors.green('🎉 恭喜！已达到目标覆盖率！'));
  }

  console.log('\n' + '='.repeat(50));
  console.log(colors.bold('📋 验证完成'));
}

// 主函数
function main() {
  try {
    generateReport();
  } catch (error) {
    console.error(colors.red('❌ 验证过程中发生错误:'), error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  readCoverageSummary,
  analyzeCoverage,
  checkKeyFiles,
  calculateProgress,
  generateReport,
};
