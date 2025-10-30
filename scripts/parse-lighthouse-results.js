#!/usr/bin/env node
/**
 * Lighthouse CI Results Parser
 *
 * 解析 Lighthouse CI 结果并过滤特定审计项
 *
 * 用法：
 *   node scripts/parse-lighthouse-results.js <audit-id>
 *
 * 示例：
 *   node scripts/parse-lighthouse-results.js largest-contentful-paint
 *   node scripts/parse-lighthouse-results.js render-blocking-resources
 *   node scripts/parse-lighthouse-results.js critical-request-chains
 *
 * 退出码：
 *   0 - 审计通过（所有URL得分≥1或数值在阈值内）
 *   1 - 审计失败（至少一个URL未通过）
 *   2 - 错误（参数错误或文件不存在）
 */

const fs = require('fs');
const path = require('path');

// 审计阈值配置（与lighthouserc.js保持一致）
const AUDIT_THRESHOLDS = {
  'largest-contentful-paint': { maxNumericValue: 5200, unit: 'ms' },
  'first-contentful-paint': { maxNumericValue: 2000, unit: 'ms' },
  'cumulative-layout-shift': { maxNumericValue: 0.15, unit: '' },
  'total-blocking-time': { maxNumericValue: 800, unit: 'ms' },
  'speed-index': { maxNumericValue: 3000, unit: 'ms' },
  'interactive': { maxNumericValue: 6000, unit: 'ms' },
  'server-response-time': { maxNumericValue: 600, unit: 'ms' },
  'max-potential-fid': { maxNumericValue: 200, unit: 'ms' },
};

function parseAuditId(auditId) {
  if (!auditId) {
    console.error('错误：缺少审计ID参数');
    console.error('用法：node scripts/parse-lighthouse-results.js <audit-id>');
    console.error(
      '示例：node scripts/parse-lighthouse-results.js largest-contentful-paint',
    );
    process.exit(2);
  }
  return auditId;
}

function findLhrFiles() {
  const lhciDir = path.join(process.cwd(), '.lighthouseci');

  if (!fs.existsSync(lhciDir)) {
    console.error(`错误：Lighthouse CI 目录不存在: ${lhciDir}`);
    console.error('请先运行：pnpm exec lhci autorun --config=lighthouserc.js');
    process.exit(2);
  }

  const lhrFiles = fs
    .readdirSync(lhciDir)
    .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
    .map((f) => path.join(lhciDir, f));

  if (lhrFiles.length === 0) {
    console.error(`错误：未找到 Lighthouse 报告文件`);
    console.error('请先运行：pnpm exec lhci autorun --config=lighthouserc.js');
    process.exit(2);
  }

  return lhrFiles;
}

function parseAuditResults(lhrFiles, auditId) {
  const results = [];
  const threshold = AUDIT_THRESHOLDS[auditId];

  lhrFiles.forEach((file) => {
    const lhr = JSON.parse(fs.readFileSync(file, 'utf8'));
    const audit = lhr.audits[auditId];

    if (!audit) {
      console.warn(
        `警告：审计 "${auditId}" 在报告中不存在: ${path.basename(file)}`,
      );
      return;
    }

    const result = {
      url: lhr.finalUrl,
      file: path.basename(file),
      score: audit.score,
      displayValue: audit.displayValue || 'N/A',
      numericValue: audit.numericValue,
      numericUnit: audit.numericUnit,
      passed: audit.score === null ? null : audit.score >= 1,
    };

    // 如果有数值阈值，检查是否通过
    if (threshold && result.numericValue !== undefined) {
      result.passed = result.numericValue <= threshold.maxNumericValue;
      result.threshold = threshold.maxNumericValue;
      result.unit = threshold.unit;
    }

    results.push(result);
  });

  return results;
}

function printResults(auditId, results) {
  console.log(`\n📊 Lighthouse 审计结果: ${auditId}`);
  console.log('='.repeat(80));

  const allPassed = results.every(
    (r) => r.passed === true || r.passed === null,
  );
  const threshold = AUDIT_THRESHOLDS[auditId];

  results.forEach((result, index) => {
    const status = result.passed === null ? '⚪' : result.passed ? '✅' : '❌';
    console.log(`\n${index + 1}. ${status} ${result.url}`);
    console.log(`   文件: ${result.file}`);
    console.log(
      `   得分: ${result.score !== null ? `${(result.score * 100).toFixed(0)}%` : 'N/A'}`,
    );
    console.log(`   数值: ${result.displayValue}`);

    if (threshold && result.numericValue !== undefined) {
      const value = result.numericValue;
      const max = result.threshold;
      const { unit } = result;
      const percentage = ((value / max) * 100).toFixed(1);
      console.log(
        `   阈值: ${value.toFixed(0)}${unit} / ${max}${unit} (${percentage}%)`,
      );
    }
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`总结: ${results.length} 个报告`);
  console.log(`通过: ${results.filter((r) => r.passed === true).length}`);
  console.log(`失败: ${results.filter((r) => r.passed === false).length}`);
  console.log(`N/A: ${results.filter((r) => r.passed === null).length}`);
  console.log('='.repeat(80));

  if (allPassed) {
    console.log(`\n✅ 审计 "${auditId}" 全部通过！\n`);
    return 0;
  }
  console.log(`\n❌ 审计 "${auditId}" 存在失败项\n`);
  return 1;
}

function main() {
  const auditId = parseAuditId(process.argv[2]);
  const lhrFiles = findLhrFiles();
  const results = parseAuditResults(lhrFiles, auditId);
  const exitCode = printResults(auditId, results);
  process.exit(exitCode);
}

main();
