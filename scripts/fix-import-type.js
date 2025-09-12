#!/usr/bin/env node

/**
 * 修复verbatimModuleSyntax导致的import type问题
 * 批量转换需要使用import type的导入语句
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 需要转换为import type的类型导入模式
const TYPE_IMPORTS = [
  'Metadata',
  'ImageProps',
  'TestResults',
  'NextRequest',
  'NextResponse',
  // 添加更多需要type-only导入的类型
];

/**
 * 修复单个文件的import type问题
 */
function fixImportTypeInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    // 修复每个类型导入
    TYPE_IMPORTS.forEach(typeName => {
      // 匹配 import { TypeName } from 'module' 模式
      const importRegex = new RegExp(
        `import\\s*{([^}]*\\b${typeName}\\b[^}]*)}\\s*from\\s*(['"][^'"]+['"])`,
        'g'
      );

      newContent = newContent.replace(importRegex, (match, imports, module) => {
        // 检查是否已经是type import
        if (match.includes('import type')) {
          return match;
        }

        // 分离类型导入和值导入
        const importList = imports.split(',').map(imp => imp.trim());
        const typeImports = [];
        const valueImports = [];

        importList.forEach(imp => {
          if (TYPE_IMPORTS.some(type => imp.includes(type))) {
            typeImports.push(imp);
          } else {
            valueImports.push(imp);
          }
        });

        let result = '';
        
        // 添加type import
        if (typeImports.length > 0) {
          result += `import type { ${typeImports.join(', ')} } from ${module};\n`;
          modified = true;
        }

        // 添加value import（如果有）
        if (valueImports.length > 0) {
          result += `import { ${valueImports.join(', ')} } from ${module};`;
        }

        return result || match;
      });
    });

    // 如果文件被修改，写回文件
    if (modified) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ 修复: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ 修复失败 ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 递归扫描目录并修复文件
 */
function fixImportTypeInDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let fixedCount = 0;

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // 跳过node_modules和.next等目录
      if (!['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        fixedCount += fixImportTypeInDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      if (fixImportTypeInFile(fullPath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始修复verbatimModuleSyntax导致的import type问题...\n');

  const startTime = Date.now();
  
  // 修复src目录
  const srcFixedCount = fixImportTypeInDirectory('./src');
  
  // 修复app目录
  const appFixedCount = fixImportTypeInDirectory('./src/app');
  
  // 修复根目录的特定文件
  const rootFiles = ['mdx-components.tsx'];
  let rootFixedCount = 0;
  
  rootFiles.forEach(file => {
    if (fs.existsSync(file)) {
      if (fixImportTypeInFile(file)) {
        rootFixedCount++;
      }
    }
  });

  const totalFixed = srcFixedCount + appFixedCount + rootFixedCount;
  const duration = Date.now() - startTime;

  console.log(`\n📊 修复完成统计:`);
  console.log(`   修复文件数: ${totalFixed}`);
  console.log(`   耗时: ${duration}ms`);

  // 运行TypeScript检查验证修复效果
  console.log('\n🔍 验证修复效果...');
  try {
    execSync('pnpm type-check', { stdio: 'pipe' });
    console.log('✅ TypeScript检查通过！');
  } catch (error) {
    console.log('⚠️ 仍有TypeScript错误，需要进一步修复');
    // 显示剩余错误的前10行
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorLines = errorOutput.split('\n').slice(0, 10);
    console.log('剩余错误示例:');
    errorLines.forEach(line => {
      if (line.trim()) {
        console.log(`  ${line}`);
      }
    });
  }

  console.log('\n🎯 import type修复任务完成！');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixImportTypeInFile, fixImportTypeInDirectory };
