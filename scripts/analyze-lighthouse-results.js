const fs = require('fs');
const path = require('path');

// 读取所有 LHR 文件
const lhciDir = path.join(process.cwd(), '.lighthouseci');
const lhrFiles = fs
  .readdirSync(lhciDir)
  .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
  .map((f) => path.join(lhciDir, f));

// 分析结果
const analysis = {
  summary: {
    totalReports: lhrFiles.length,
    urls: {},
    timestamp: new Date().toISOString(),
  },
  categories: {
    performance: { scores: [], issues: [] },
    accessibility: { scores: [], issues: [] },
    bestPractices: { scores: [], issues: [] },
    seo: { scores: [], issues: [] },
  },
  issues: [],
};

// 优先级映射
const severityMap = {
  'largest-contentful-paint': {
    severity: 'High',
    impact: 'High',
    urgency: 'High',
  },
  'interactive': { severity: 'Medium', impact: 'Medium', urgency: 'Medium' },
  'total-blocking-time': { severity: 'Low', impact: 'Medium', urgency: 'Low' },
  'link-text': { severity: 'Medium', impact: 'Medium', urgency: 'Medium' },
  'errors-in-console': {
    severity: 'Medium',
    impact: 'Medium',
    urgency: 'High',
  },
  'valid-source-maps': { severity: 'Low', impact: 'Low', urgency: 'Low' },
  'network-dependency-tree-insight': {
    severity: 'Medium',
    impact: 'High',
    urgency: 'Medium',
  },
  'render-blocking-insight': {
    severity: 'Medium',
    impact: 'High',
    urgency: 'Medium',
  },
};

// 计算优先级分数
function calculatePriority(severity, impact, urgency) {
  const scoreMap = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return (
    (scoreMap[severity] || 1) * 0.4 +
    (scoreMap[impact] || 1) * 0.3 +
    (scoreMap[urgency] || 1) * 0.3
  );
}

// 处理每个报告
lhrFiles.forEach((file) => {
  const lhr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const url = lhr.finalUrl;

  // 记录 URL
  if (!analysis.summary.urls[url]) {
    analysis.summary.urls[url] = { count: 0, files: [] };
  }
  analysis.summary.urls[url].count++;
  analysis.summary.urls[url].files.push(path.basename(file));

  // 提取四大类指标得分
  analysis.categories.performance.scores.push({
    url,
    score: lhr.categories.performance.score,
  });
  analysis.categories.accessibility.scores.push({
    url,
    score: lhr.categories.accessibility.score,
  });
  analysis.categories.bestPractices.scores.push({
    url,
    score: lhr.categories['best-practices'].score,
  });
  analysis.categories.seo.scores.push({ url, score: lhr.categories.seo.score });

  // 提取失败的审计项
  ['performance', 'accessibility', 'best-practices', 'seo'].forEach(
    (categoryKey) => {
      const category = lhr.categories[categoryKey];
      const categoryName =
        categoryKey === 'best-practices' ? 'bestPractices' : categoryKey;

      category.auditRefs.forEach((ref) => {
        const audit = lhr.audits[ref.id];
        if (audit.score !== null && audit.score < 1) {
          const meta = severityMap[ref.id] || {
            severity: 'Low',
            impact: 'Low',
            urgency: 'Low',
          };
          const priority = calculatePriority(
            meta.severity,
            meta.impact,
            meta.urgency,
          );

          const issue = {
            id: ref.id,
            category: categoryName,
            title: audit.title,
            score: audit.score,
            severity: meta.severity,
            impact: meta.impact,
            urgency: meta.urgency,
            priority: priority,
            description: audit.description,
            displayValue: audit.displayValue || 'N/A',
            numericValue: audit.numericValue,
            numericUnit: audit.numericUnit,
            url: url,
            file: path.basename(file),
          };

          // 添加详细信息
          if (
            audit.details &&
            audit.details.items &&
            Array.isArray(audit.details.items)
          ) {
            issue.details = audit.details.items.slice(0, 10);
          } else if (audit.details && audit.details.items) {
            issue.details = [audit.details.items];
          }

          analysis.issues.push(issue);
        }
      });
    },
  );
});

// 按优先级排序问题
analysis.issues.sort((a, b) => b.priority - a.priority);

// 去重（同一个问题在多个报告中出现）
const uniqueIssues = [];
const seenIssues = new Set();

analysis.issues.forEach((issue) => {
  const key = `${issue.id}-${issue.category}`;
  if (!seenIssues.has(key)) {
    seenIssues.add(key);
    uniqueIssues.push(issue);
  }
});

analysis.issues = uniqueIssues;

// 计算平均得分
['performance', 'accessibility', 'bestPractices', 'seo'].forEach((cat) => {
  const { scores } = analysis.categories[cat];
  const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  analysis.categories[cat].averageScore = Math.round(avg * 100) / 100;
  analysis.categories[cat].belowThreshold = avg < 0.9;
});

// 输出结果
console.log(JSON.stringify(analysis, null, 2));
