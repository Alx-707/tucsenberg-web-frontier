#!/usr/bin/env node

/**
 * TypeScript错误分析工具
 * 分析项目中的TypeScript错误类型和分布，制定修复优先级
 */

const { execSync } = require('child_process');

// TypeScript错误代码说明
const ERROR_DESCRIPTIONS = {
  'TS2322': '类型不匹配 - Type X is not assignable to type Y',
  'TS2339': '属性不存在 - Property X does not exist on type Y',
  'TS1205': '重新导出错误 - Re-export errors',
  'TS6196': '未使用声明 - Declared but never used',
  'TS2345': '参数类型错误 - Argument type mismatch',
  'TS6133': '未使用变量 - Variable declared but never read',
  'TS1484': 'verbatimModuleSyntax错误 - Type must be imported using type-only import',
  'TS18046': '可能为undefined - Expression is possibly undefined',
  'TS1361': 'import type作为值使用 - Cannot be used as a value (imported using import type)',
  'TS2739': '缺少属性 - Type is missing properties',
  'TS2351': '构造函数重载错误 - Constructor overload error',
  'TS2571': '对象可能为null - Object is possibly null',
  'TS2532': '对象可能为undefined - Object is possibly undefined',
  'TS2353': '对象字面量错误 - Object literal may only specify known properties',
  'TS7006': '隐式any类型 - Parameter implicitly has an any type',
};

// 修复优先级（1=最高，5=最低）
const FIX_PRIORITY = {
  'TS1361': 1, // import type错误，容易批量修复
  'TS1484': 1, // verbatimModuleSyntax错误，容易批量修复
  'TS6133': 2, // 未使用变量，容易修复
  'TS6196': 2, // 未使用声明，容易修复
  'TS7006': 2, // 隐式any，需要添加类型
  'TS2345': 3, // 参数类型错误，需要仔细检查
  'TS18046': 3, // 可能为undefined，需要null检查
  'TS2532': 3, // 对象可能为undefined，需要null检查
  'TS2571': 3, // 对象可能为null，需要null检查
  'TS2339': 4, // 属性不存在，可能需要接口修改
  'TS2322': 4, // 类型不匹配，需要仔细分析
  'TS2739': 4, // 缺少属性，需要接口修改
  'TS2353': 4, // 对象字面量错误，需要类型定义
  'TS2351': 5, // 构造函数重载，复杂修复
  'TS1205': 5, // 重新导出错误，架构相关
};

/**
 * 获取TypeScript错误统计
 */
function getTypeScriptErrorStats() {
  try {
    console.log('🔍 分析TypeScript错误...');

    const output = execSync('pnpm type-check', { encoding: 'utf8', stdio: 'pipe' });
    const errorLines = output.split('\n').filter(line => line.includes('error TS'));

    const errorStats = {};
    const fileStats = {};

    errorLines.forEach(line => {
      // 提取错误代码
      const errorMatch = line.match(/error TS(\d+)/);
      if (errorMatch) {
        const errorCode = `TS${errorMatch[1]}`;
        errorStats[errorCode] = (errorStats[errorCode] || 0) + 1;
      }

      // 提取文件路径
      const fileMatch = line.match(/^([^(]+)\(/);
      if (fileMatch) {
        const filePath = fileMatch[1];
        fileStats[filePath] = (fileStats[filePath] || 0) + 1;
      }
    });

    return { errorStats, fileStats, totalErrors: errorLines.length };
  } catch (error) {
    // TypeScript有错误时会抛出异常，但我们需要捕获输出
    const output = error.stdout || error.stderr || '';
    const errorLines = output.split('\n').filter(line => line.includes('error TS'));

    if (errorLines.length === 0) {
      console.error('获取TypeScript错误统计失败:', error.message);
      return { errorStats: {}, fileStats: {}, totalErrors: 0 };
    }

    const errorStats = {};
    const fileStats = {};

    errorLines.forEach(line => {
      // 提取错误代码
      const errorMatch = line.match(/error TS(\d+)/);
      if (errorMatch) {
        const errorCode = `TS${errorMatch[1]}`;
        errorStats[errorCode] = (errorStats[errorCode] || 0) + 1;
      }

      // 提取文件路径
      const fileMatch = line.match(/^([^(]+)\(/);
      if (fileMatch) {
        const filePath = fileMatch[1];
        fileStats[filePath] = (fileStats[filePath] || 0) + 1;
      }
    });

    return { errorStats, fileStats, totalErrors: errorLines.length };
  }
}

/**
 * 分析错误优先级
 */
function analyzeErrorPriority(errorStats) {
  const priorityGroups = {
    1: [], // 最高优先级
    2: [], // 高优先级
    3: [], // 中等优先级
    4: [], // 低优先级
    5: [], // 最低优先级
  };

  Object.entries(errorStats).forEach(([errorCode, count]) => {
    const priority = FIX_PRIORITY[errorCode] || 4;
    priorityGroups[priority].push({ errorCode, count, priority });
  });

  return priorityGroups;
}

/**
 * 分析文件错误分布
 */
function analyzeFileDistribution(fileStats) {
  const sortedFiles = Object.entries(fileStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20); // 取前20个错误最多的文件

  const fileCategories = {
    tests: [],
    api: [],
    components: [],
    lib: [],
    app: [],
    other: []
  };

  sortedFiles.forEach(([filePath, count]) => {
    if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
      fileCategories.tests.push({ filePath, count });
    } else if (filePath.includes('/api/')) {
      fileCategories.api.push({ filePath, count });
    } else if (filePath.includes('/components/')) {
      fileCategories.components.push({ filePath, count });
    } else if (filePath.includes('/lib/')) {
      fileCategories.lib.push({ filePath, count });
    } else if (filePath.includes('/app/')) {
      fileCategories.app.push({ filePath, count });
    } else {
      fileCategories.other.push({ filePath, count });
    }
  });

  return fileCategories;
}

/**
 * 生成修复建议
 */
function generateFixSuggestions(priorityGroups, fileCategories) {
  const suggestions = [];

  // 优先级1：立即修复
  if (priorityGroups[1].length > 0) {
    const highPriorityErrors = priorityGroups[1].reduce((sum, item) => sum + item.count, 0);
    suggestions.push({
      priority: 1,
      title: '立即修复 - import type和模块语法错误',
      description: `${highPriorityErrors}个错误，可以批量自动修复`,
      errors: priorityGroups[1],
      action: '运行 node scripts/fix-import-type-issues.js'
    });
  }

  // 优先级2：清理未使用代码
  if (priorityGroups[2].length > 0) {
    const cleanupErrors = priorityGroups[2].reduce((sum, item) => sum + item.count, 0);
    suggestions.push({
      priority: 2,
      title: '代码清理 - 未使用变量和隐式any',
      description: `${cleanupErrors}个错误，需要手动清理`,
      errors: priorityGroups[2],
      action: '手动移除未使用变量，添加类型注解'
    });
  }

  // 测试文件修复
  if (fileCategories.tests.length > 0) {
    const testErrors = fileCategories.tests.reduce((sum, item) => sum + item.count, 0);
    suggestions.push({
      priority: 2,
      title: '测试文件修复',
      description: `${testErrors}个测试文件错误，主要是Mock类型问题`,
      files: fileCategories.tests.slice(0, 10),
      action: '修复测试文件中的Mock类型定义'
    });
  }

  return suggestions;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始TypeScript错误分析...\n');

  const { errorStats, fileStats, totalErrors } = getTypeScriptErrorStats();

  if (totalErrors === 0) {
    console.log('✅ 没有发现TypeScript错误！');
    return;
  }

  console.log(`📊 总错误数: ${totalErrors}\n`);

  // 分析错误优先级
  const priorityGroups = analyzeErrorPriority(errorStats);

  // 分析文件分布
  const fileCategories = analyzeFileDistribution(fileStats);

  // 生成修复建议
  const suggestions = generateFixSuggestions(priorityGroups, fileCategories);

  // 输出分析结果
  console.log('📈 错误类型分布（按优先级）:');
  Object.entries(priorityGroups).forEach(([priority, errors]) => {
    if (errors.length > 0) {
      console.log(`\n优先级 ${priority}:`);
      errors.forEach(({ errorCode, count }) => {
        const description = ERROR_DESCRIPTIONS[errorCode] || '未知错误类型';
        console.log(`  ${errorCode}: ${count}个 - ${description}`);
      });
    }
  });

  console.log('\n📁 错误文件分布（前10个）:');
  Object.entries(fileCategories).forEach(([category, files]) => {
    if (files.length > 0) {
      console.log(`\n${category.toUpperCase()}:`);
      files.slice(0, 5).forEach(({ filePath, count }) => {
        console.log(`  ${filePath}: ${count}个错误`);
      });
    }
  });

  console.log('\n🎯 修复建议:');
  suggestions.forEach((suggestion, index) => {
    console.log(`\n${index + 1}. ${suggestion.title}`);
    console.log(`   ${suggestion.description}`);
    console.log(`   建议操作: ${suggestion.action}`);
  });

  console.log('\n✨ 分析完成！建议按优先级顺序修复错误。');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { getTypeScriptErrorStats, analyzeErrorPriority, analyzeFileDistribution };
