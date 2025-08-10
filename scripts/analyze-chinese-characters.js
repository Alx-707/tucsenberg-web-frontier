#!/usr/bin/env node

/**
 * 中文字符分析脚本
 *
 * 分析项目中实际使用的中文字符，为字体子集化提供数据支持
 * 扫描翻译文件、MDX内容文件和代码中的中文字符
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class ChineseCharacterAnalyzer {
  constructor() {
    this.chineseChars = new Set();
    this.fileStats = {};
    this.totalFiles = 0;
    this.results = {
      uniqueChars: 0,
      totalOccurrences: 0,
      fileBreakdown: {},
      characterFrequency: {},
      unicodeRanges: {},
    };
  }

  /**
   * 检查字符是否为中文字符
   */
  isChineseChar(char) {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK统一汉字
      (code >= 0x3400 && code <= 0x4dbf) || // CJK扩展A
      (code >= 0x20000 && code <= 0x2a6df) || // CJK扩展B
      (code >= 0x2a700 && code <= 0x2b73f) || // CJK扩展C
      (code >= 0x2b740 && code <= 0x2b81f) || // CJK扩展D
      (code >= 0x2b820 && code <= 0x2ceaf) || // CJK扩展E
      (code >= 0x2ceb0 && code <= 0x2ebef) || // CJK扩展F
      (code >= 0x30000 && code <= 0x3134f) || // CJK扩展G
      (code >= 0x3100 && code <= 0x312f) || // 注音符号
      (code >= 0x31a0 && code <= 0x31bf) || // 注音符号扩展
      (code >= 0xff00 && code <= 0xffef) // 全角字符
    );
  }

  /**
   * 分析文件中的中文字符
   */
  analyzeFile(filePath, content) {
    const fileChars = new Set();
    let charCount = 0;

    for (const char of content) {
      if (this.isChineseChar(char)) {
        this.chineseChars.add(char);
        fileChars.add(char);
        charCount++;

        // 统计字符频率
        this.results.characterFrequency[char] =
          (this.results.characterFrequency[char] || 0) + 1;
      }
    }

    this.fileStats[filePath] = {
      uniqueChars: fileChars.size,
      totalChars: charCount,
      characters: Array.from(fileChars),
    };

    console.log(
      `✅ 分析完成: ${filePath} (${fileChars.size} 个唯一字符, ${charCount} 个总字符)`,
    );
  }

  /**
   * 扫描翻译文件
   */
  scanTranslationFiles() {
    console.log('📝 扫描翻译文件...');

    const translationFiles = ['messages/zh.json'];

    translationFiles.forEach((file) => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.analyzeFile(file, content);
        this.totalFiles++;
      }
    });
  }

  /**
   * 扫描MDX内容文件
   */
  scanContentFiles() {
    console.log('📄 扫描MDX内容文件...');

    const contentPatterns = [
      'content/posts/zh/*.mdx',
      'content/pages/zh/*.mdx',
    ];

    contentPatterns.forEach((pattern) => {
      const files = glob.sync(pattern, { cwd: process.cwd() });
      files.forEach((file) => {
        const fullPath = path.join(process.cwd(), file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.analyzeFile(file, content);
        this.totalFiles++;
      });
    });
  }

  /**
   * 扫描代码文件中的中文字符
   */
  scanCodeFiles() {
    console.log('💻 扫描代码文件...');

    const codePatterns = ['src/**/*.{ts,tsx,js,jsx}', 'docs/**/*.md'];

    codePatterns.forEach((pattern) => {
      const files = glob.sync(pattern, { cwd: process.cwd() });
      files.forEach((file) => {
        const fullPath = path.join(process.cwd(), file);
        const content = fs.readFileSync(fullPath, 'utf-8');

        // 只分析包含中文字符的文件
        if (/[\u4e00-\u9fff]/.test(content)) {
          this.analyzeFile(file, content);
          this.totalFiles++;
        }
      });
    });
  }

  /**
   * 分析Unicode范围分布
   */
  analyzeUnicodeRanges() {
    const ranges = {
      'CJK统一汉字 (4E00-9FFF)': { min: 0x4e00, max: 0x9fff, count: 0 },
      'CJK扩展A (3400-4DBF)': { min: 0x3400, max: 0x4dbf, count: 0 },
      'CJK扩展B (20000-2A6DF)': { min: 0x20000, max: 0x2a6df, count: 0 },
      '全角字符 (FF00-FFEF)': { min: 0xff00, max: 0xffef, count: 0 },
      '其他': { count: 0 },
    };

    for (const char of this.chineseChars) {
      const code = char.charCodeAt(0);
      let categorized = false;

      for (const [rangeName, range] of Object.entries(ranges)) {
        if (rangeName !== '其他' && code >= range.min && code <= range.max) {
          range.count++;
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        ranges['其他'].count++;
      }
    }

    this.results.unicodeRanges = ranges;
  }

  /**
   * 生成字体子集建议
   */
  generateSubsetRecommendations() {
    const sortedChars = Array.from(this.chineseChars).sort();
    const highFrequencyChars = Object.entries(this.results.characterFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 100)
      .map(([char]) => char);

    return {
      allCharacters: sortedChars,
      highFrequencyCharacters: highFrequencyChars,
      unicodeString: sortedChars
        .map(
          (char) =>
            'U+' +
            char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'),
        )
        .join(','),
      subsetSize: sortedChars.length,
      estimatedSavings: this.estimateFileSizeSavings(sortedChars.length),
    };
  }

  /**
   * 估算文件大小节省
   */
  estimateFileSizeSavings(charCount) {
    // 基于PingFang SC字体的估算
    const avgFullFontSize = 15 * 1024 * 1024; // 约15MB
    const avgCharSize = avgFullFontSize / 20000; // 假设全字体包含约20000个字符
    const subsetSize = charCount * avgCharSize;
    const savings = avgFullFontSize - subsetSize;
    const savingsPercentage = (savings / avgFullFontSize) * 100;

    return {
      originalSize: `${(avgFullFontSize / 1024 / 1024).toFixed(1)}MB`,
      subsetSize: `${(subsetSize / 1024 / 1024).toFixed(1)}MB`,
      savings: `${(savings / 1024 / 1024).toFixed(1)}MB`,
      savingsPercentage: `${savingsPercentage.toFixed(1)}%`,
    };
  }

  /**
   * 运行完整分析
   */
  async runAnalysis() {
    console.log('🔍 开始中文字符分析...\n');

    this.scanTranslationFiles();
    this.scanContentFiles();
    this.scanCodeFiles();

    this.analyzeUnicodeRanges();

    this.results.uniqueChars = this.chineseChars.size;
    this.results.totalOccurrences = Object.values(
      this.results.characterFrequency,
    ).reduce((sum, count) => sum + count, 0);
    this.results.fileBreakdown = this.fileStats;

    this.generateReport();
  }

  /**
   * 生成分析报告
   */
  generateReport() {
    console.log('\n📊 中文字符分析报告');
    console.log('='.repeat(50));

    console.log(`📁 扫描文件数量: ${this.totalFiles}`);
    console.log(`🔤 唯一中文字符: ${this.results.uniqueChars}`);
    console.log(`📝 字符总出现次数: ${this.results.totalOccurrences}`);

    console.log('\n📋 Unicode范围分布:');
    Object.entries(this.results.unicodeRanges).forEach(([range, data]) => {
      if (data.count > 0) {
        console.log(`   ${range}: ${data.count} 个字符`);
      }
    });

    console.log('\n🔥 高频字符 (前20个):');
    const topChars = Object.entries(this.results.characterFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    topChars.forEach(([char, count], index) => {
      console.log(`   ${index + 1}. "${char}" - ${count} 次`);
    });

    const recommendations = this.generateSubsetRecommendations();
    console.log('\n💡 字体子集化建议:');
    console.log(`   子集字符数量: ${recommendations.subsetSize}`);
    console.log(
      `   预估原始大小: ${recommendations.estimatedSavings.originalSize}`,
    );
    console.log(
      `   预估子集大小: ${recommendations.estimatedSavings.subsetSize}`,
    );
    console.log(
      `   预估节省空间: ${recommendations.estimatedSavings.savings} (${recommendations.estimatedSavings.savingsPercentage})`,
    );

    // 保存详细结果到文件
    this.saveResults(recommendations);

    console.log(
      '\n🎉 分析完成！详细结果已保存到 reports/chinese-character-analysis.json',
    );
  }

  /**
   * 保存分析结果到文件
   */
  saveResults(recommendations) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.totalFiles,
        uniqueChars: this.results.uniqueChars,
        totalOccurrences: this.results.totalOccurrences,
      },
      unicodeRanges: this.results.unicodeRanges,
      characterFrequency: this.results.characterFrequency,
      fileBreakdown: this.results.fileBreakdown,
      recommendations,
    };

    const reportPath = path.join(reportsDir, 'chinese-character-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // 同时生成字符列表文件，用于字体工具
    const charListPath = path.join(reportsDir, 'chinese-characters.txt');
    fs.writeFileSync(charListPath, recommendations.allCharacters.join(''));
  }
}

// 主函数
async function main() {
  const analyzer = new ChineseCharacterAnalyzer();
  await analyzer.runAnalysis();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ChineseCharacterAnalyzer };
