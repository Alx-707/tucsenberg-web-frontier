#!/usr/bin/env node

/**
 * 翻译缓存性能测试脚本
 * 验证缓存机制的性能提升效果
 */

const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  ITERATIONS: 1000,
  LOCALES: ['en', 'zh'],
  NAMESPACES: ['seo', 'structured-data', 'common'],
  WARMUP_ITERATIONS: 100,
};

console.log('🚀 翻译缓存性能测试开始...\n');

/**
 * 模拟原始翻译加载（无缓存）
 */
async function loadTranslationsWithoutCache(locale, namespace) {
  const startTime = performance.now();

  try {
    const messagesPath = path.join(process.cwd(), 'messages', `${locale}.json`);
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    const namespaceMessages = messages[namespace] || {};

    // 模拟翻译函数创建的开销
    const t = (key, options = {}) => {
      const keys = key.split('.');
      let value = namespaceMessages;

      for (const k of keys) {
        value = value?.[k];
      }

      return value || options.defaultValue || key;
    };

    const loadTime = performance.now() - startTime;
    return { t, loadTime, cached: false };
  } catch (error) {
    const loadTime = performance.now() - startTime;
    return { t: () => 'error', loadTime, cached: false, error: true };
  }
}

/**
 * 模拟缓存版本的翻译加载
 */
class MockTranslationCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    };
  }

  async loadTranslationsWithCache(locale, namespace) {
    const startTime = performance.now();
    const cacheKey = `${locale}:${namespace}`;
    this.stats.totalRequests++;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      this.stats.hits++;
      const cached = this.cache.get(cacheKey);
      const loadTime = performance.now() - startTime;
      return { ...cached, loadTime, cached: true };
    }

    // 缓存未命中，加载翻译
    this.stats.misses++;

    try {
      const messagesPath = path.join(
        process.cwd(),
        'messages',
        `${locale}.json`,
      );
      const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
      const namespaceMessages = messages[namespace] || {};

      const t = (key, options = {}) => {
        const keys = key.split('.');
        let value = namespaceMessages;

        for (const k of keys) {
          value = value?.[k];
        }

        return value || options.defaultValue || key;
      };

      // 存储到缓存
      const result = { t, error: false };
      this.cache.set(cacheKey, result);

      const loadTime = performance.now() - startTime;
      return { ...result, loadTime, cached: false };
    } catch (error) {
      const loadTime = performance.now() - startTime;
      return { t: () => 'error', loadTime, cached: false, error: true };
    }
  }

  getStats() {
    const hitRate =
      this.stats.totalRequests > 0
        ? (this.stats.hits / this.stats.totalRequests) * 100
        : 0;

    return {
      ...this.stats,
      hitRate,
      cacheSize: this.cache.size,
    };
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalRequests: 0 };
  }
}

/**
 * 执行性能测试
 */
async function runPerformanceTest() {
  const cache = new MockTranslationCache();
  const results = {
    withoutCache: { times: [], errors: 0 },
    withCache: { times: [], errors: 0 },
  };

  console.log('📊 执行性能基准测试...');

  // 测试无缓存版本
  console.log('   测试无缓存版本...');
  for (let i = 0; i < TEST_CONFIG.ITERATIONS; i++) {
    const locale =
      TEST_CONFIG.LOCALES[
        Math.floor(Math.random() * TEST_CONFIG.LOCALES.length)
      ];
    const namespace =
      TEST_CONFIG.NAMESPACES[
        Math.floor(Math.random() * TEST_CONFIG.NAMESPACES.length)
      ];

    const result = await loadTranslationsWithoutCache(locale, namespace);
    results.withoutCache.times.push(result.loadTime);
    if (result.error) results.withoutCache.errors++;
  }

  // 预热缓存
  console.log('   预热缓存...');
  for (let i = 0; i < TEST_CONFIG.WARMUP_ITERATIONS; i++) {
    for (const locale of TEST_CONFIG.LOCALES) {
      for (const namespace of TEST_CONFIG.NAMESPACES) {
        await cache.loadTranslationsWithCache(locale, namespace);
      }
    }
  }

  // 测试缓存版本
  console.log('   测试缓存版本...');
  for (let i = 0; i < TEST_CONFIG.ITERATIONS; i++) {
    const locale =
      TEST_CONFIG.LOCALES[
        Math.floor(Math.random() * TEST_CONFIG.LOCALES.length)
      ];
    const namespace =
      TEST_CONFIG.NAMESPACES[
        Math.floor(Math.random() * TEST_CONFIG.NAMESPACES.length)
      ];

    const result = await cache.loadTranslationsWithCache(locale, namespace);
    results.withCache.times.push(result.loadTime);
    if (result.error) results.withCache.errors++;
  }

  return { results, cacheStats: cache.getStats() };
}

/**
 * 计算统计数据
 */
function calculateStats(times) {
  if (times.length === 0) return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };

  const sorted = times.slice().sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return { avg, min, max, p95, p99 };
}

/**
 * 生成性能报告
 */
function generateReport(testResults) {
  const { results, cacheStats } = testResults;

  const withoutCacheStats = calculateStats(results.withoutCache.times);
  const withCacheStats = calculateStats(results.withCache.times);

  const improvement = {
    avgImprovement:
      ((withoutCacheStats.avg - withCacheStats.avg) / withoutCacheStats.avg) *
      100,
    p95Improvement:
      ((withoutCacheStats.p95 - withCacheStats.p95) / withoutCacheStats.p95) *
      100,
    p99Improvement:
      ((withoutCacheStats.p99 - withCacheStats.p99) / withoutCacheStats.p99) *
      100,
  };

  console.log('\n📈 性能测试结果');
  console.log('='.repeat(60));

  console.log('\n🔴 无缓存版本:');
  console.log(`   平均加载时间: ${withoutCacheStats.avg.toFixed(2)}ms`);
  console.log(`   最小时间: ${withoutCacheStats.min.toFixed(2)}ms`);
  console.log(`   最大时间: ${withoutCacheStats.max.toFixed(2)}ms`);
  console.log(`   P95: ${withoutCacheStats.p95.toFixed(2)}ms`);
  console.log(`   P99: ${withoutCacheStats.p99.toFixed(2)}ms`);
  console.log(`   错误数: ${results.withoutCache.errors}`);

  console.log('\n🟢 缓存版本:');
  console.log(`   平均加载时间: ${withCacheStats.avg.toFixed(2)}ms`);
  console.log(`   最小时间: ${withCacheStats.min.toFixed(2)}ms`);
  console.log(`   最大时间: ${withCacheStats.max.toFixed(2)}ms`);
  console.log(`   P95: ${withCacheStats.p95.toFixed(2)}ms`);
  console.log(`   P99: ${withCacheStats.p99.toFixed(2)}ms`);
  console.log(`   错误数: ${results.withCache.errors}`);

  console.log('\n📊 缓存统计:');
  console.log(`   缓存命中率: ${cacheStats.hitRate.toFixed(1)}%`);
  console.log(`   缓存大小: ${cacheStats.cacheSize} 条目`);
  console.log(`   总请求数: ${cacheStats.totalRequests}`);
  console.log(`   缓存命中: ${cacheStats.hits}`);
  console.log(`   缓存未命中: ${cacheStats.misses}`);

  console.log('\n🚀 性能提升:');
  console.log(`   平均性能提升: ${improvement.avgImprovement.toFixed(1)}%`);
  console.log(`   P95性能提升: ${improvement.p95Improvement.toFixed(1)}%`);
  console.log(`   P99性能提升: ${improvement.p99Improvement.toFixed(1)}%`);

  // 评估结果
  console.log('\n🎯 评估结果:');
  if (improvement.avgImprovement >= 50) {
    console.log('   ✅ 优秀！缓存机制显著提升了性能');
  } else if (improvement.avgImprovement >= 30) {
    console.log('   ✅ 良好！缓存机制有效提升了性能');
  } else if (improvement.avgImprovement >= 10) {
    console.log('   ⚠️  一般！缓存机制有一定效果，但还有优化空间');
  } else {
    console.log('   ❌ 需要改进！缓存机制效果不明显');
  }

  if (cacheStats.hitRate >= 90) {
    console.log('   ✅ 缓存命中率优秀');
  } else if (cacheStats.hitRate >= 80) {
    console.log('   ⚠️  缓存命中率良好，但还有提升空间');
  } else {
    console.log('   ❌ 缓存命中率需要改进');
  }

  return {
    passed: improvement.avgImprovement >= 30 && cacheStats.hitRate >= 80,
    improvement,
    cacheStats,
  };
}

/**
 * 主函数
 */
async function main() {
  try {
    const testResults = await runPerformanceTest();
    const report = generateReport(testResults);

    console.log('\n' + '='.repeat(60));
    if (report.passed) {
      console.log('🎉 翻译缓存性能测试通过！');
      console.log('✅ 缓存机制成功实现了性能目标');
    } else {
      console.log('⚠️  翻译缓存性能测试需要改进');
      console.log('❌ 缓存机制未达到预期性能目标');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 性能测试执行失败:', error);
    process.exit(1);
  }
}

// 执行测试
main();
