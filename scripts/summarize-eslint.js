#!/usr/bin/env node
/*
 * Summarize ESLint JSON output (reports/eslint-report.json)
 * Outputs a concise JSON summary to stdout for the CLI to capture.
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.resolve(process.cwd(), 'reports/eslint-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('Missing reports/eslint-report.json');
  process.exit(1);
}

/** @type {Array<{filePath:string,errorCount:number,warningCount:number,fixableErrorCount:number,fixableWarningCount:number,source?:string,messages:Array<{ruleId:string|null,severity:number,message:string,line:number,column:number}>>}> */
const files = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const total = { errors: 0, warnings: 0 };
const byRule = new Map();
const messageSamples = new Map();

for (const f of files) {
  total.errors += f.errorCount || 0;
  total.warnings += f.warningCount || 0;
  for (const m of f.messages) {
    const key = m.ruleId || 'unknown';
    const entry = byRule.get(key) || { errors: 0, warnings: 0 };
    if (m.severity === 2) entry.errors += 1; else entry.warnings += 1;
    byRule.set(key, entry);
    if (!messageSamples.has(key) && m.message) messageSamples.set(key, m.message);
  }
}

// Helpers
const get = (ruleId) => byRule.get(ruleId) || { errors: 0, warnings: 0 };
const countMsgIncludes = (substr, filterRulePrefix = null) => {
  let n = 0;
  for (const f of files) {
    for (const m of f.messages) {
      if (filterRulePrefix && !(m.ruleId || '').startsWith(filterRulePrefix)) continue;
      if ((m.message || '').includes(substr)) n++;
    }
  }
  return n;
};

// Category 1: any 类型
const anyRule = '@typescript-eslint/no-explicit-any';
const anyStats = get(anyRule);

// Category 2: 安全相关（security*）
let securityErrors = 0, securityWarnings = 0;
for (const [ruleId, stat] of byRule.entries()) {
  if (ruleId.startsWith('security/') || ruleId.startsWith('security-node/')) {
    securityErrors += stat.errors;
    securityWarnings += stat.warnings;
  }
}
const securityTotal = securityErrors + securityWarnings;

// Specific security message splits (best-effort by message text)
const genericObjectInjection = countMsgIncludes('Generic Object Injection Sink');
const variableAssignedToInjection = countMsgIncludes('Variable Assigned to Object Injection Sink');

// Category 3: console
const consoleStats = get('no-console');

// Category 4: 魔法数字
const magicStats = get('no-magic-numbers');
// Breakdown by typical numbers (parse from message text)
const magicNumbers = new Map();
for (const f of files) {
  for (const m of f.messages) {
    if (m.ruleId === 'no-magic-numbers') {
      const match = m.message.match(/No magic number:?\s*(-?\d+)/i);
      if (match) {
        const num = match[1];
        magicNumbers.set(num, (magicNumbers.get(num) || 0) + 1);
      }
    }
  }
}
// sort top items
const magicBreakdown = Array.from(magicNumbers.entries())
  .sort((a,b)=>b[1]-a[1])
  .slice(0, 12)
  .map(([num, cnt]) => ({ number: Number(num), count: cnt }));

// Category 5: 复杂度
const complexityStats = {
  complexity: get('complexity'),
  maxDepth: get('max-depth'),
  maxNestedCallbacks: get('max-nested-callbacks'),
  noElseReturn: get('no-else-return'),
  noPlusPlus: get('no-plusplus'),
};

// Category 6: 未使用变量
const unusedCombined = {
  js: get('no-unused-vars'),
  ts: get('@typescript-eslint/no-unused-vars'),
};
// Extract common variable names
const unusedNameCounts = new Map();
for (const f of files) {
  for (const m of f.messages) {
    if (m.ruleId === 'no-unused-vars' || m.ruleId === '@typescript-eslint/no-unused-vars') {
      const mm = m.message.match(/'([^']+)' is defined but never used/);
      if (mm) {
        const name = mm[1];
        unusedNameCounts.set(name, (unusedNameCounts.get(name) || 0) + 1);
      }
    }
  }
}
const unusedTop = Array.from(unusedNameCounts.entries())
  .sort((a,b)=>b[1]-a[1])
  .slice(0, 10)
  .map(([name, count]) => ({ name, count }));

// Category 7: 开发工具相关
const tsNoCheck = get('@typescript-eslint/ban-ts-comment');
const tNotDefined = (() => {
  let n = 0;
  for (const f of files) {
    for (const m of f.messages) {
      if (m.ruleId === 'no-undef' && (m.message || '').includes("'t' is not defined")) n++;
    }
  }
  return n;
})();
const nextImg = get('@next/next/no-img-element');

const summary = {
  timestamp: new Date().toISOString(),
  totals: {
    errors: total.errors,
    warnings: total.warnings,
    total: total.errors + total.warnings,
  },
  anyType: { rule: anyRule, ...anyStats },
  security: {
    total: securityTotal,
    errors: securityErrors,
    warnings: securityWarnings,
    breakdown: {
      genericObjectInjection,
      variableAssignedToInjection,
    },
  },
  console: consoleStats,
  magicNumbers: {
    total: (magicStats.errors + magicStats.warnings),
    top: magicBreakdown,
  },
  complexity: {
    complexity: complexityStats.complexity,
    maxDepth: complexityStats.maxDepth,
    maxNestedCallbacks: complexityStats.maxNestedCallbacks,
    noElseReturn: complexityStats.noElseReturn,
    noPlusPlus: complexityStats.noPlusPlus,
  },
  unused: {
    total: unusedCombined.js.errors + unusedCombined.js.warnings + unusedCombined.ts.errors + unusedCombined.ts.warnings,
    js: unusedCombined.js,
    ts: unusedCombined.ts,
    topNames: unusedTop,
  },
  devTools: {
    tsNoCheck: tsNoCheck,
    tNotDefinedCount: tNotDefined,
    nextImg: nextImg,
  },
};

console.log(JSON.stringify(summary, null, 2));
