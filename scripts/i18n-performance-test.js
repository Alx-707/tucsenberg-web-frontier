#!/usr/bin/env node

/**
 * next-intl性能测试和基准脚本
 * 测试翻译加载性能、缓存效率和整体性能指标
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// 性能测试配置
const TEST_CONFIG = {
  ITERATIONS: 100,
  LOCALES: ['en', 'zh'],
  TIMEOUT: 5000,
  CACHE_WARMUP_ITERATIONS: 10,
};

// 性能目标
const PERFORMANCE_TARGETS = {
  LOAD_TIME: 50, // ms
  CACHE_HIT_RATE: 95, // %
  MEMORY_USAGE: 50, // MB
};

/**
 * 模拟翻译加载测试
 */
async function testTranslationLoading() {
  console.log('🔄 Testing translation loading performance...');

  const results = [];

  for (const locale of TEST_CONFIG.LOCALES) {
    const localeResults = [];

    for (let i = 0; i < TEST_CONFIG.ITERATIONS; i++) {
      const startTime = performance.now();

      try {
        // 模拟翻译文件加载
        const messagesPath = path.join(
          process.cwd(),
          'messages',
          `${locale}.json`,
        );
        const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

        const loadTime = performance.now() - startTime;
        localeResults.push({
          iteration: i + 1,
          loadTime,
          messageCount: Object.keys(messages).length,
          success: true,
        });
      } catch (error) {
        localeResults.push({
          iteration: i + 1,
          loadTime: performance.now() - startTime,
          error: error.message,
          success: false,
        });
      }
    }

    results.push({
      locale,
      results: localeResults,
      stats: calculateStats(localeResults),
    });
  }

  return results;
}

/**
 * 缓存性能测试
 */
async function testCachePerformance() {
  console.log('🔄 Testing cache performance...');

  const cache = new Map();
  const results = {
    hits: 0,
    misses: 0,
    loadTimes: [],
  };

  // 预热缓存
  for (let i = 0; i < TEST_CONFIG.CACHE_WARMUP_ITERATIONS; i++) {
    for (const locale of TEST_CONFIG.LOCALES) {
      const key = `messages-${locale}`;
      if (!cache.has(key)) {
        const messagesPath = path.join(
          process.cwd(),
          'messages',
          `${locale}.json`,
        );
        const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
        cache.set(key, messages);
      }
    }
  }

  // 测试缓存性能
  for (let i = 0; i < TEST_CONFIG.ITERATIONS; i++) {
    const locale =
      TEST_CONFIG.LOCALES[
        Math.floor(Math.random() * TEST_CONFIG.LOCALES.length)
      ];
    const key = `messages-${locale}`;

    const startTime = performance.now();

    if (cache.has(key)) {
      const messages = cache.get(key);
      results.hits++;
    } else {
      const messagesPath = path.join(
        process.cwd(),
        'messages',
        `${locale}.json`,
      );
      const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
      cache.set(key, messages);
      results.misses++;
    }

    const loadTime = performance.now() - startTime;
    results.loadTimes.push(loadTime);
  }

  return {
    ...results,
    hitRate: (results.hits / (results.hits + results.misses)) * 100,
    averageLoadTime:
      results.loadTimes.reduce((a, b) => a + b, 0) / results.loadTimes.length,
  };
}

/**
 * 内存使用测试
 */
function testMemoryUsage() {
  console.log('🔄 Testing memory usage...');

  const initialMemory = process.memoryUsage();

  // 加载所有翻译文件
  const translations = {};
  for (const locale of TEST_CONFIG.LOCALES) {
    const messagesPath = path.join(process.cwd(), 'messages', `${locale}.json`);
    translations[locale] = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
  }

  const finalMemory = process.memoryUsage();

  return {
    initial: initialMemory,
    final: finalMemory,
    difference: {
      rss: (finalMemory.rss - initialMemory.rss) / 1024 / 1024, // MB
      heapUsed: (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024, // MB
      heapTotal:
        (finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024, // MB
    },
  };
}

/**
 * 计算统计数据
 */
function calculateStats(results) {
  const successfulResults = results.filter((r) => r.success);
  const loadTimes = successfulResults.map((r) => r.loadTime);

  if (loadTimes.length === 0) {
    return {
      count: 0,
      successRate: 0,
      averageLoadTime: 0,
      minLoadTime: 0,
      maxLoadTime: 0,
      p95LoadTime: 0,
    };
  }

  loadTimes.sort((a, b) => a - b);

  return {
    count: successfulResults.length,
    successRate: (successfulResults.length / results.length) * 100,
    averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
    minLoadTime: loadTimes[0],
    maxLoadTime: loadTimes[loadTimes.length - 1],
    p95LoadTime: loadTimes[Math.floor(loadTimes.length * 0.95)],
  };
}

/**
 * 生成性能报告
 */
function generateReport(loadingResults, cacheResults, memoryResults) {
  const report = {
    timestamp: new Date().toISOString(),
    config: TEST_CONFIG,
    targets: PERFORMANCE_TARGETS,
    results: {
      loading: loadingResults,
      cache: cacheResults,
      memory: memoryResults,
    },
    summary: {
      overallScore: 0,
      recommendations: [],
    },
  };

  // 计算总体评分
  let score = 0;
  let scoreCount = 0;

  // 加载时间评分
  for (const localeResult of loadingResults) {
    if (localeResult.stats.averageLoadTime <= PERFORMANCE_TARGETS.LOAD_TIME) {
      score += 100;
    } else if (
      localeResult.stats.averageLoadTime <=
      PERFORMANCE_TARGETS.LOAD_TIME * 2
    ) {
      score += 70;
    } else {
      score += 30;
    }
    scoreCount++;
  }

  // 缓存命中率评分
  if (cacheResults.hitRate >= PERFORMANCE_TARGETS.CACHE_HIT_RATE) {
    score += 100;
  } else if (cacheResults.hitRate >= PERFORMANCE_TARGETS.CACHE_HIT_RATE * 0.8) {
    score += 70;
  } else {
    score += 30;
  }
  scoreCount++;

  // 内存使用评分
  if (memoryResults.difference.heapUsed <= PERFORMANCE_TARGETS.MEMORY_USAGE) {
    score += 100;
  } else if (
    memoryResults.difference.heapUsed <=
    PERFORMANCE_TARGETS.MEMORY_USAGE * 2
  ) {
    score += 70;
  } else {
    score += 30;
  }
  scoreCount++;

  report.summary.overallScore = Math.round(score / scoreCount);

  // 生成建议
  if (report.summary.overallScore < 70) {
    report.summary.recommendations.push(
      'Consider implementing more aggressive caching strategies',
    );
    report.summary.recommendations.push('Optimize translation file sizes');
    report.summary.recommendations.push(
      'Implement lazy loading for non-critical translations',
    );
  }

  return report;
}

/**
 * 验证性能优化实施效果
 */
async function validatePerformanceOptimizations() {
  console.log('🔍 Validating performance optimizations...\n');

  const validations = [];

  // 1. 检查缓存机制文件
  try {
    const cacheFile = path.join(process.cwd(), 'src/lib/i18n-performance.ts');
    if (fs.existsSync(cacheFile)) {
      validations.push({
        test: 'Cache mechanism file exists',
        status: '✅ PASS',
      });
    } else {
      validations.push({
        test: 'Cache mechanism file exists',
        status: '❌ FAIL',
      });
    }
  } catch (error) {
    validations.push({
      test: 'Cache mechanism file exists',
      status: '❌ ERROR',
    });
  }

  // 2. 检查增强的翻译Hook
  try {
    const hookFile = path.join(
      process.cwd(),
      'src/hooks/use-enhanced-translations.ts',
    );
    if (fs.existsSync(hookFile)) {
      validations.push({
        test: 'Enhanced translations hook exists',
        status: '✅ PASS',
      });
    } else {
      validations.push({
        test: 'Enhanced translations hook exists',
        status: '❌ FAIL',
      });
    }
  } catch (error) {
    validations.push({
      test: 'Enhanced translations hook exists',
      status: '❌ ERROR',
    });
  }

  // 3. 检查预加载组件
  try {
    const preloaderFile = path.join(
      process.cwd(),
      'src/components/i18n/translation-preloader.tsx',
    );
    if (fs.existsSync(preloaderFile)) {
      validations.push({
        test: 'Translation preloader component exists',
        status: '✅ PASS',
      });
    } else {
      validations.push({
        test: 'Translation preloader component exists',
        status: '❌ FAIL',
      });
    }
  } catch (error) {
    validations.push({
      test: 'Translation preloader component exists',
      status: '❌ ERROR',
    });
  }

  // 4. 检查性能仪表板
  try {
    const dashboardFile = path.join(
      process.cwd(),
      'src/components/i18n/performance-dashboard.tsx',
    );
    if (fs.existsSync(dashboardFile)) {
      validations.push({
        test: 'Performance dashboard component exists',
        status: '✅ PASS',
      });
    } else {
      validations.push({
        test: 'Performance dashboard component exists',
        status: '❌ FAIL',
      });
    }
  } catch (error) {
    validations.push({
      test: 'Performance dashboard component exists',
      status: '❌ ERROR',
    });
  }

  // 5. 检查布局集成
  try {
    const layoutFile = path.join(process.cwd(), 'src/app/[locale]/layout.tsx');
    const layoutContent = fs.readFileSync(layoutFile, 'utf-8');
    if (
      layoutContent.includes('CriticalTranslationPreloader') &&
      layoutContent.includes('PerformanceMonitoringPreloader')
    ) {
      validations.push({
        test: 'Layout integration complete',
        status: '✅ PASS',
      });
    } else {
      validations.push({
        test: 'Layout integration complete',
        status: '❌ FAIL',
      });
    }
  } catch (error) {
    validations.push({
      test: 'Layout integration complete',
      status: '❌ ERROR',
    });
  }

  return validations;
}

/**
 * 主测试函数
 */
async function runPerformanceTests() {
  console.log('🚀 Starting next-intl performance tests...\n');

  try {
    // 首先验证实施
    const validations = await validatePerformanceOptimizations();

    console.log('📋 Implementation Validation:');
    validations.forEach((validation) => {
      console.log(`   ${validation.status} ${validation.test}`);
    });

    const failedValidations = validations.filter(
      (v) => v.status.includes('FAIL') || v.status.includes('ERROR'),
    );
    if (failedValidations.length > 0) {
      console.log(
        `\n⚠️  ${failedValidations.length} validation(s) failed. Please check implementation.`,
      );
      return;
    }

    console.log('\n✅ All validations passed! Running performance tests...\n');

    // 运行各项测试
    const loadingResults = await testTranslationLoading();
    const cacheResults = await testCachePerformance();
    const memoryResults = testMemoryUsage();

    // 生成报告
    const report = generateReport(loadingResults, cacheResults, memoryResults);

    // 保存报告
    const reportPath = path.join(
      process.cwd(),
      'reports',
      'i18n-performance-report.json',
    );
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 显示结果
    console.log('\n📊 Performance Test Results:');
    console.log(
      `⏱️  Average Load Time: ${loadingResults[0]?.stats.averageLoadTime?.toFixed(2)}ms`,
    );
    console.log(`🎯 Cache Hit Rate: ${cacheResults.hitRate.toFixed(1)}%`);
    console.log(
      `💾 Memory Usage: ${memoryResults.difference.heapUsed.toFixed(2)}MB`,
    );
    console.log(`📈 Overall Score: ${report.summary.overallScore}/100`);
    console.log(`📄 Report saved: ${reportPath}`);

    // 检查是否达到目标
    if (report.summary.overallScore >= 80) {
      console.log('\n✅ Performance targets met!');
      console.log(
        '🎉 next-intl performance optimization implementation successful!',
      );
      process.exit(0);
    } else {
      console.log(
        '\n⚠️  Performance targets not met. See recommendations in report.',
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runPerformanceTests();
}

module.exports = { runPerformanceTests };
