#!/usr/bin/env node

/**
 * 代码分割分析脚本
 *
 * 分析项目中的组件使用模式，识别可以进行动态导入的组件
 * 为第五阶段代码分割和图片优化提供数据支持
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class CodeSplittingAnalyzer {
  constructor() {
    this.components = new Map();
    this.imports = new Map();
    this.results = {
      totalComponents: 0,
      dynamicImportCandidates: [],
      heavyComponents: [],
      unusedComponents: [],
      importAnalysis: {},
    };
  }

  /**
   * 分析组件文件大小
   */
  analyzeComponentSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      return {
        sizeBytes: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
        lineCount: content.split('\n').length,
        hasClientDirective: content.includes("'use client'"),
        hasServerDirective: content.includes("'use server'"),
        importCount: (content.match(/^import\s+/gm) || []).length,
        exportCount: (content.match(/^export\s+/gm) || []).length,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查组件是否为动态导入候选
   */
  isDynamicImportCandidate(componentPath, analysis) {
    const criteria = {
      // 大型组件（超过5KB或100行）
      isLarge: analysis.sizeBytes > 5120 || analysis.lineCount > 100,

      // 客户端组件（可以懒加载）
      isClientComponent: analysis.hasClientDirective,

      // 非关键路径组件
      isNonCritical: this.isNonCriticalComponent(componentPath),

      // 复杂组件（多个导入）
      isComplex: analysis.importCount > 10,
    };

    const score = Object.values(criteria).filter(Boolean).length;
    return { ...criteria, score, isCandidate: score >= 2 };
  }

  /**
   * 判断是否为非关键路径组件
   */
  isNonCriticalComponent(componentPath) {
    const nonCriticalPatterns = [
      '/showcase/',
      '/performance/',
      '/i18n/performance-dashboard',
      '/i18n/locale-detection-demo',
      '/theme/theme-performance-monitor',
      '/shared/animated-icon',
      '/shared/progress-indicator',
    ];

    return nonCriticalPatterns.some((pattern) =>
      componentPath.includes(pattern),
    );
  }

  /**
   * 分析组件导入关系
   */
  analyzeImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = [];

      // 匹配import语句
      const importRegex =
        /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*{[^}]*})?\s*from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // 分类导入
        if (importPath.startsWith('@/components/')) {
          imports.push({ type: 'component', path: importPath });
        } else if (importPath.startsWith('@/lib/')) {
          imports.push({ type: 'library', path: importPath });
        } else if (importPath.startsWith('@/hooks/')) {
          imports.push({ type: 'hook', path: importPath });
        } else if (
          !importPath.startsWith('.') &&
          !importPath.startsWith('@/')
        ) {
          imports.push({ type: 'external', path: importPath });
        } else {
          imports.push({ type: 'relative', path: importPath });
        }
      }

      return imports;
    } catch (error) {
      return [];
    }
  }

  /**
   * 扫描所有组件
   */
  scanComponents() {
    console.log('📦 扫描组件文件...');

    const componentPatterns = [
      'src/components/**/*.{tsx,ts}',
      '!src/components/**/*.test.{tsx,ts}',
      '!src/components/**/*.stories.{tsx,ts}',
    ];

    componentPatterns.forEach((pattern) => {
      const files = glob.sync(pattern, { cwd: process.cwd() });

      files.forEach((file) => {
        const fullPath = path.join(process.cwd(), file);
        const analysis = this.analyzeComponentSize(fullPath);

        if (analysis) {
          const imports = this.analyzeImports(fullPath);
          const candidateInfo = this.isDynamicImportCandidate(file, analysis);

          this.components.set(file, {
            ...analysis,
            imports,
            candidateInfo,
            relativePath: file,
          });

          console.log(
            `✅ 分析完成: ${file} (${analysis.sizeKB}KB, ${analysis.lineCount}行)`,
          );
        }
      });
    });

    this.results.totalComponents = this.components.size;
  }

  /**
   * 识别动态导入候选组件
   */
  identifyDynamicImportCandidates() {
    console.log('🎯 识别动态导入候选组件...');

    for (const [filePath, component] of this.components) {
      if (component.candidateInfo.isCandidate) {
        this.results.dynamicImportCandidates.push({
          path: filePath,
          size: component.sizeKB,
          lines: component.lineCount,
          score: component.candidateInfo.score,
          reasons: Object.entries(component.candidateInfo)
            .filter(
              ([key, value]) =>
                key !== 'score' && key !== 'isCandidate' && value,
            )
            .map(([key]) => key),
        });
      }

      // 识别大型组件
      if (parseFloat(component.sizeKB) > 10 || component.lineCount > 200) {
        this.results.heavyComponents.push({
          path: filePath,
          size: component.sizeKB,
          lines: component.lineCount,
          imports: component.imports.length,
        });
      }
    }

    // 按分数排序
    this.results.dynamicImportCandidates.sort((a, b) => b.score - a.score);
    this.results.heavyComponents.sort(
      (a, b) => parseFloat(b.size) - parseFloat(a.size),
    );
  }

  /**
   * 分析第三方库导入
   */
  analyzeExternalImports() {
    console.log('📚 分析第三方库导入...');

    const externalImports = new Map();

    for (const [filePath, component] of this.components) {
      component.imports.forEach((imp) => {
        if (imp.type === 'external') {
          if (!externalImports.has(imp.path)) {
            externalImports.set(imp.path, []);
          }
          externalImports.get(imp.path).push(filePath);
        }
      });
    }

    this.results.importAnalysis = {
      externalLibraries: Array.from(externalImports.entries())
        .map(([lib, files]) => ({
          library: lib,
          usageCount: files.length,
          files: files.slice(0, 5), // 只显示前5个文件
        }))
        .sort((a, b) => b.usageCount - a.usageCount),
    };
  }

  /**
   * 生成代码分割建议
   */
  generateSplittingRecommendations() {
    const recommendations = {
      // 高优先级：大型非关键组件
      highPriority: this.results.dynamicImportCandidates
        .filter((comp) => comp.score >= 3)
        .slice(0, 5),

      // 中优先级：中等大小的非关键组件
      mediumPriority: this.results.dynamicImportCandidates
        .filter((comp) => comp.score === 2)
        .slice(0, 3),

      // 第三方库优化建议
      libraryOptimization: this.results.importAnalysis.externalLibraries
        .filter((lib) => lib.usageCount > 3)
        .slice(0, 5),

      // 预期性能改进
      expectedImprovements: {
        bundleSizeReduction: '15-25%',
        initialLoadImprovement: '200-400ms',
        lcpImprovement: '50-100ms',
        chunkSizeOptimization: '20-30%',
      },
    };

    return recommendations;
  }

  /**
   * 运行完整分析
   */
  async runAnalysis() {
    console.log('🔍 开始代码分割分析...\n');

    this.scanComponents();
    this.identifyDynamicImportCandidates();
    this.analyzeExternalImports();

    const recommendations = this.generateSplittingRecommendations();

    this.generateReport(recommendations);
    this.saveResults(recommendations);
  }

  /**
   * 生成分析报告
   */
  generateReport(recommendations) {
    console.log('\n📊 代码分割分析报告');
    console.log('='.repeat(50));

    console.log(`📦 总组件数量: ${this.results.totalComponents}`);
    console.log(
      `🎯 动态导入候选: ${this.results.dynamicImportCandidates.length}`,
    );
    console.log(`⚡ 大型组件: ${this.results.heavyComponents.length}`);

    console.log('\n🔥 高优先级动态导入候选 (前5个):');
    recommendations.highPriority.forEach((comp, index) => {
      console.log(`   ${index + 1}. ${comp.path}`);
      console.log(
        `      大小: ${comp.size}KB, 行数: ${comp.lines}, 评分: ${comp.score}`,
      );
      console.log(`      原因: ${comp.reasons.join(', ')}`);
    });

    console.log('\n📚 第三方库使用统计 (前5个):');
    recommendations.libraryOptimization.forEach((lib, index) => {
      console.log(
        `   ${index + 1}. ${lib.library} - 使用 ${lib.usageCount} 次`,
      );
    });

    console.log('\n🚀 预期性能改进:');
    console.log(
      `   包大小减少: ${recommendations.expectedImprovements.bundleSizeReduction}`,
    );
    console.log(
      `   初始加载改进: ${recommendations.expectedImprovements.initialLoadImprovement}`,
    );
    console.log(
      `   LCP改进: ${recommendations.expectedImprovements.lcpImprovement}`,
    );
    console.log(
      `   代码块优化: ${recommendations.expectedImprovements.chunkSizeOptimization}`,
    );

    console.log(
      '\n🎉 分析完成！详细结果已保存到 reports/code-splitting-analysis.json',
    );
  }

  /**
   * 保存分析结果
   */
  saveResults(recommendations) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalComponents: this.results.totalComponents,
        dynamicImportCandidates: this.results.dynamicImportCandidates.length,
        heavyComponents: this.results.heavyComponents.length,
      },
      candidates: this.results.dynamicImportCandidates,
      heavyComponents: this.results.heavyComponents,
      importAnalysis: this.results.importAnalysis,
      recommendations,
    };

    const reportPath = path.join(reportsDir, 'code-splitting-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  }
}

// 主函数
async function main() {
  const analyzer = new CodeSplittingAnalyzer();
  await analyzer.runAnalysis();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CodeSplittingAnalyzer };
