#!/usr/bin/env node

/**
 * 字体子集化实施脚本
 *
 * 基于中文字符分析结果，生成字体子集化配置和实施指南
 * 支持PingFang SC字体的子集化处理
 */

const fs = require('fs');
const path = require('path');

class FontSubsetImplementation {
  constructor() {
    this.config = {
      sourceFont: 'PingFang SC',
      targetFormats: ['woff2', 'woff'],
      outputDir: 'public/fonts/subsets',
      characterFile: 'reports/chinese-characters.txt',
      analysisFile: 'reports/chinese-character-analysis.json',
    };

    this.results = {
      subsetGenerated: false,
      configUpdated: false,
      fallbackOptimized: false,
      cacheConfigured: false,
    };
  }

  /**
   * 读取字符分析结果
   */
  loadAnalysisResults() {
    try {
      const analysisPath = path.join(process.cwd(), this.config.analysisFile);
      const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

      const charactersPath = path.join(
        process.cwd(),
        this.config.characterFile,
      );
      const characters = fs.readFileSync(charactersPath, 'utf-8').trim();

      return {
        analysis: analysisData,
        characters,
        charCount: analysisData.summary.uniqueChars,
        estimatedSavings: analysisData.recommendations.estimatedSavings,
      };
    } catch (error) {
      console.error('❌ 无法读取字符分析结果:', error.message);
      return null;
    }
  }

  /**
   * 生成字体子集化配置
   */
  generateSubsetConfig(data) {
    const config = {
      // 字体子集化配置
      fontSubset: {
        source: {
          font: this.config.sourceFont,
          fallbacks: ['system-ui', 'sans-serif'],
        },
        subset: {
          characters: data.characters,
          unicodeRange: this.generateUnicodeRanges(data.characters),
          formats: this.config.targetFormats,
          outputDir: this.config.outputDir,
        },
        optimization: {
          hinting: true,
          compression: 'maximum',
          removeUnusedFeatures: true,
        },
        performance: {
          preload: true,
          display: 'swap',
          fallbackDelay: '100ms',
        },
      },

      // 预期性能改进
      expectedImprovements: {
        fileSizeReduction: data.estimatedSavings.savingsPercentage,
        loadTimeImprovement: '30-50ms',
        lcpImprovement: '30-50ms',
        cacheEfficiency: '95%',
      },

      // 实施步骤
      implementationSteps: [
        '1. 安装字体处理工具 (fonttools, pyftsubset)',
        '2. 生成字体子集文件',
        '3. 更新CSS字体配置',
        '4. 配置字体预加载',
        '5. 实施字体回退策略',
        '6. 配置缓存策略',
        '7. 验证字体显示效果',
      ],
    };

    return config;
  }

  /**
   * 生成Unicode范围
   */
  generateUnicodeRanges(characters) {
    const ranges = [];
    const codes = characters
      .split('')
      .map((char) => char.charCodeAt(0))
      .sort((a, b) => a - b);

    let start = codes[0];
    let end = codes[0];

    for (let i = 1; i < codes.length; i++) {
      if (codes[i] === end + 1) {
        end = codes[i];
      } else {
        ranges.push(
          start === end
            ? `U+${start.toString(16).toUpperCase()}`
            : `U+${start.toString(16).toUpperCase()}-${end.toString(16).toUpperCase()}`,
        );
        start = end = codes[i];
      }
    }

    // 添加最后一个范围
    ranges.push(
      start === end
        ? `U+${start.toString(16).toUpperCase()}`
        : `U+${start.toString(16).toUpperCase()}-${end.toString(16).toUpperCase()}`,
    );

    return ranges;
  }

  /**
   * 生成字体子集化命令
   */
  generateSubsetCommands(characters) {
    const commands = {
      // 使用pyftsubset生成子集
      pyftsubset: [
        'pip install fonttools',
        `pyftsubset "PingFang SC.ttc" \\`,
        `  --text="${characters}" \\`,
        `  --output-file="public/fonts/subsets/pingfang-sc-subset.woff2" \\`,
        `  --flavor=woff2 \\`,
        `  --layout-features="*" \\`,
        `  --glyph-names \\`,
        `  --symbol-cmap \\`,
        `  --legacy-cmap \\`,
        `  --notdef-glyph \\`,
        `  --notdef-outline \\`,
        `  --recommended-glyphs \\`,
        `  --name-legacy \\`,
        `  --drop-tables= \\`,
        `  --no-hinting`,
      ],

      // 生成WOFF格式
      woff: [
        `pyftsubset "PingFang SC.ttc" \\`,
        `  --text="${characters}" \\`,
        `  --output-file="public/fonts/subsets/pingfang-sc-subset.woff" \\`,
        `  --flavor=woff \\`,
        `  --layout-features="*"`,
      ],
    };

    return commands;
  }

  /**
   * 生成CSS配置
   */
  generateCSSConfig(unicodeRanges) {
    return `
/* 字体子集化配置 */
@font-face {
  font-family: 'PingFang SC Subset';
  src: url('/fonts/subsets/pingfang-sc-subset.woff2') format('woff2'),
       url('/fonts/subsets/pingfang-sc-subset.woff') format('woff');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
  unicode-range: ${unicodeRanges.join(', ')};
}

@font-face {
  font-family: 'PingFang SC Subset';
  src: url('/fonts/subsets/pingfang-sc-subset-bold.woff2') format('woff2'),
       url('/fonts/subsets/pingfang-sc-subset-bold.woff') format('woff');
  font-display: swap;
  font-weight: 700;
  font-style: normal;
  unicode-range: ${unicodeRanges.join(', ')};
}

/* 优化的中文字体栈 */
.font-chinese {
  font-family: 'PingFang SC Subset', 'PingFang SC', 'Hiragino Sans GB', 
               'Microsoft YaHei', 'Source Han Sans SC', 'Noto Sans CJK SC', 
               'WenQuanYi Micro Hei', sans-serif;
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 字体预加载提示 */
/* 在HTML head中添加：
<link rel="preload" href="/fonts/subsets/pingfang-sc-subset.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/subsets/pingfang-sc-subset-bold.woff2" as="font" type="font/woff2" crossorigin>
*/
`;
  }

  /**
   * 创建实施指南
   */
  createImplementationGuide(config, commands, cssConfig) {
    const guide = `# 字体子集化实施指南

## 概述

基于项目中文字符分析，我们识别出 ${config.fontSubset.subset.characters.length} 个唯一中文字符。
通过字体子集化，预期可以减少字体文件大小 ${config.expectedImprovements.fileSizeReduction}，
提升LCP性能 ${config.expectedImprovements.lcpImprovement}。

## 实施步骤

### 1. 安装字体处理工具

\`\`\`bash
# 安装Python fonttools
pip install fonttools

# 验证安装
pyftsubset --help
\`\`\`

### 2. 生成字体子集

\`\`\`bash
# 创建输出目录
mkdir -p public/fonts/subsets

# 生成WOFF2格式子集
${commands.pyftsubset.join('\n')}

# 生成WOFF格式子集
${commands.woff.join('\n')}
\`\`\`

### 3. 更新CSS配置

将以下CSS添加到 \`src/app/globals.css\`：

\`\`\`css${cssConfig}\`\`\`

### 4. 更新layout.tsx预加载配置

在 \`src/app/[locale]/layout.tsx\` 中添加字体预加载：

\`\`\`tsx
{/* 字体子集预加载 */}
<link
  rel='preload'
  href='/fonts/subsets/pingfang-sc-subset.woff2'
  as='font'
  type='font/woff2'
  crossOrigin='anonymous'
/>
<link
  rel='preload'
  href='/fonts/subsets/pingfang-sc-subset-bold.woff2'
  as='font'
  type='font/woff2'
  crossOrigin='anonymous'
/>
\`\`\`

### 5. 验证实施效果

\`\`\`bash
# 运行验证脚本
node scripts/verify-font-subset.js

# 检查字体文件大小
ls -lh public/fonts/subsets/

# 测试字体显示效果
pnpm dev
\`\`\`

## 预期性能改进

- **文件大小减少**: ${config.expectedImprovements.fileSizeReduction}
- **加载时间改进**: ${config.expectedImprovements.loadTimeImprovement}
- **LCP改进**: ${config.expectedImprovements.lcpImprovement}
- **缓存效率**: ${config.expectedImprovements.cacheEfficiency}

## 注意事项

1. **字体版权**: 确保有合法的字体使用权限
2. **字符覆盖**: 定期更新字符集以覆盖新增内容
3. **回退策略**: 保持完整的字体回退链
4. **浏览器兼容**: 测试不同浏览器的字体显示效果
5. **缓存策略**: 配置适当的HTTP缓存头

## 维护建议

- 每季度重新分析字符使用情况
- 监控字体加载性能指标
- 定期更新字体子集文件
- 保持字体回退策略的有效性
`;

    return guide;
  }

  /**
   * 运行字体子集化实施
   */
  async runImplementation() {
    console.log('🔤 开始字体子集化实施...\n');

    // 1. 加载分析结果
    const data = this.loadAnalysisResults();
    if (!data) {
      console.error('❌ 无法继续，请先运行字符分析脚本');
      return false;
    }

    console.log(`✅ 加载字符分析结果: ${data.charCount} 个唯一字符`);

    // 2. 生成配置
    const config = this.generateSubsetConfig(data);
    const unicodeRanges = this.generateUnicodeRanges(data.characters);
    const commands = this.generateSubsetCommands(data.characters);
    const cssConfig = this.generateCSSConfig(unicodeRanges);

    // 3. 创建输出目录
    const outputDir = path.join(process.cwd(), this.config.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`✅ 创建输出目录: ${this.config.outputDir}`);
    }

    // 4. 生成实施指南
    const guide = this.createImplementationGuide(config, commands, cssConfig);
    const guidePath = path.join(
      process.cwd(),
      'docs/font-subset-implementation-guide.md',
    );
    fs.writeFileSync(guidePath, guide);
    console.log(`✅ 生成实施指南: docs/font-subset-implementation-guide.md`);

    // 5. 保存配置文件
    const configPath = path.join(
      process.cwd(),
      'config/font-subset-config.json',
    );
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ 保存配置文件: config/font-subset-config.json`);

    // 6. 生成命令脚本
    const scriptPath = path.join(
      process.cwd(),
      'scripts/generate-font-subset.sh',
    );
    const scriptContent = `#!/bin/bash
# 字体子集生成脚本

echo "🔤 开始生成字体子集..."

# 检查依赖
if ! command -v pyftsubset &> /dev/null; then
    echo "❌ pyftsubset 未安装，请运行: pip install fonttools"
    exit 1
fi

# 创建输出目录
mkdir -p public/fonts/subsets

# 生成WOFF2格式
echo "📦 生成WOFF2格式..."
${commands.pyftsubset.join(' \\\n  ')}

# 生成WOFF格式
echo "📦 生成WOFF格式..."
${commands.woff.join(' \\\n  ')}

echo "✅ 字体子集生成完成！"
echo "📊 请运行验证脚本检查结果: node scripts/verify-font-subset.js"
`;
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    console.log(`✅ 生成执行脚本: scripts/generate-font-subset.sh`);

    this.generateReport(data, config);
    return true;
  }

  /**
   * 生成实施报告
   */
  generateReport(data, config) {
    console.log('\n📊 字体子集化实施报告');
    console.log('='.repeat(50));

    console.log(`🔤 字符分析结果:`);
    console.log(`   唯一字符数量: ${data.charCount}`);
    console.log(
      `   预估文件大小减少: ${data.estimatedSavings.savingsPercentage}`,
    );
    console.log(`   预估节省空间: ${data.estimatedSavings.savings}`);

    console.log(`\n🚀 预期性能改进:`);
    console.log(`   LCP改进: ${config.expectedImprovements.lcpImprovement}`);
    console.log(
      `   加载时间改进: ${config.expectedImprovements.loadTimeImprovement}`,
    );
    console.log(`   缓存效率: ${config.expectedImprovements.cacheEfficiency}`);

    console.log(`\n📋 生成的文件:`);
    console.log(`   ✅ 实施指南: docs/font-subset-implementation-guide.md`);
    console.log(`   ✅ 配置文件: config/font-subset-config.json`);
    console.log(`   ✅ 执行脚本: scripts/generate-font-subset.sh`);

    console.log(`\n🔧 下一步操作:`);
    console.log(`   1. 安装字体工具: pip install fonttools`);
    console.log(`   2. 执行字体生成: ./scripts/generate-font-subset.sh`);
    console.log(`   3. 更新CSS配置: 参考实施指南`);
    console.log(`   4. 运行验证脚本: node scripts/verify-font-subset.js`);

    console.log('\n🎉 字体子集化实施配置完成！');
  }
}

// 主函数
async function main() {
  const implementation = new FontSubsetImplementation();
  const success = await implementation.runImplementation();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FontSubsetImplementation };
