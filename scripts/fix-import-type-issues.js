#!/usr/bin/env node

/**
 * 修复verbatimModuleSyntax导致的import type问题
 * 自动识别并修复错误使用import type的情况
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 需要作为值使用的类型（不应该用import type）
const VALUE_IMPORTS = [
  'NextRequest',
  'NextResponse',
  'ReactElement',
  'RenderOptions',
  'exportTestResults',
  'Mock',
  'MockedFunction',
  'vi',
  'expect',
  'describe',
  'it',
  'beforeEach',
  'afterEach',
  // 新增的函数（不应该用import type）
  'generateLocalizedMetadata',
  'useLocaleStorage',
  'useClientLocaleDetection',
];

// 需要作为类型使用的导入（应该用import type）
const TYPE_ONLY_IMPORTS = [
  'Metadata',
  'ImageProps',
  'TestResults',
  'FC',
  'ReactNode',
  'ComponentProps',
  // 新增的类型
  'ComponentStats',
  'ContactFormData',
  'FormSubmissionStatus',
  'DateFormatOptions',
  'LocaleDetectionResult',
  'UserLocalePreference',
  'Locale',
  'EnhancedLocaleSwitcherProps',
  'ApiResponse',
  'AirtableRecord',
  'EmailTemplateData',
  'FormValidationError',
  'ThemeMode',
  'MockFunction',
  'TestCallback',
  'TestConfig',
  'MockColorData',
  'AccessibilityManagerPrivate',
  'AccessibilityTestConfig',
  'ThemeAnalyticsPrivate',
  'ThemeAnalyticsInstance',
  'IncompleteThemeColors',
  'CSSVariablesTest',
  'ExtendedMockFunction',
  'SpyFunction',
  'TestSuiteConfig',
  'PatternMatchResult',
  'TestDataGenerator',
  'TestAssertion',
  'AllTestTypes',
  // 新增的类型
  'LucideIcon',
  'ContentType',
  'WhatsAppMessage',
  'WhatsAppContact',
  'WhatsAppMedia',
  'WhatsAppTemplate',
  'WhatsAppWebhookEvent',
  'WhatsAppError',
  'WhatsAppApiResponse',
  'WhatsAppMessageStatus',
  'WhatsAppBusinessProfile',
  'WhatsAppPhoneNumber',
  'WhatsAppWebhookPayload',
  'WhatsAppMessageType',
  'WhatsAppMediaType',
  'WhatsAppTemplateType',
  'WhatsAppButtonType',
  'WhatsAppInteractiveType',
  'WhatsAppLocationMessage',
  'WhatsAppContactMessage',
  'WhatsAppTextMessage',
  'WhatsAppImageMessage',
  'WhatsAppVideoMessage',
  'WhatsAppAudioMessage',
  'WhatsAppDocumentMessage',
  'WhatsAppStickerMessage',
  'WhatsAppReactionMessage',
  'WhatsAppInteractiveMessage',
  'WhatsAppTemplateMessage',
  'WhatsAppSystemMessage',
  'WhatsAppOrderMessage',
  'WhatsAppPaymentMessage',
  'WhatsAppReferralMessage',
  'WhatsAppButtonReply',
  'WhatsAppListReply',
  'WhatsAppQuickReply',
  'WhatsAppFlowReply',
  'WhatsAppCatalogReply',
  'WhatsAppProductReply',
  'WhatsAppLocationReply',
  'WhatsAppContactReply',
  'WhatsAppMediaReply',
  'WhatsAppTextReply',
  'WhatsAppInteractiveReply',
  'WhatsAppTemplateReply',
  'WhatsAppSystemReply',
  'WhatsAppOrderReply',
  'WhatsAppPaymentReply',
  'WhatsAppReferralReply',
];

/**
 * 修复单个文件的import type问题
 */
function fixImportTypeInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;

    // 1. 修复错误的import type（应该是值导入）
    VALUE_IMPORTS.forEach(importName => {
      // 匹配 import type { ImportName } from 'module' 模式
      const typeImportRegex = new RegExp(
        `import\\s+type\\s*{([^}]*\\b${importName}\\b[^}]*)}\\s*from\\s*(['"][^'"]+['"])`,
        'g'
      );

      newContent = newContent.replace(typeImportRegex, (match, imports, module) => {
        const importList = imports.split(',').map(imp => imp.trim());
        const valueImports = [];
        const typeImports = [];

        importList.forEach(imp => {
          if (VALUE_IMPORTS.some(val => imp.includes(val))) {
            valueImports.push(imp);
          } else {
            typeImports.push(imp);
          }
        });

        let result = '';

        // 添加type import（如果有剩余的类型）
        if (typeImports.length > 0) {
          result += `import type { ${typeImports.join(', ')} } from ${module};\n`;
        }

        // 添加value import
        if (valueImports.length > 0) {
          result += `import { ${valueImports.join(', ')} } from ${module};`;
        }

        if (result !== match) {
          modified = true;
          console.log(`  修复 ${filePath}: ${importName} 从 type import 改为 value import`);
        }

        return result || match;
      });
    });

    // 2. 移除多余的分号
    newContent = newContent.replace(/import[^;]*;\s*;/g, (match) => {
      return match.replace(/;\s*;/, ';');
    });

    // 3. 修复缺少的import type（应该是类型导入）
    TYPE_ONLY_IMPORTS.forEach(importName => {
      // 匹配 import { ImportName } from 'module' 模式（非type import）
      const valueImportRegex = new RegExp(
        `import\\s*{([^}]*\\b${importName}\\b[^}]*)}\\s*from\\s*(['"][^'"]+['"])`,
        'g'
      );

      newContent = newContent.replace(valueImportRegex, (match, imports, module) => {
        // 跳过已经是type import的情况
        if (match.includes('import type')) {
          return match;
        }

        const importList = imports.split(',').map(imp => imp.trim());
        const valueImports = [];
        const typeImports = [];

        importList.forEach(imp => {
          if (TYPE_ONLY_IMPORTS.some(type => imp.includes(type))) {
            typeImports.push(imp);
          } else {
            valueImports.push(imp);
          }
        });

        let result = '';

        // 添加type import
        if (typeImports.length > 0) {
          result += `import type { ${typeImports.join(', ')} } from ${module};\n`;
        }

        // 添加value import（如果有）
        if (valueImports.length > 0) {
          result += `import { ${valueImports.join(', ')} } from ${module};`;
        }

        if (result !== match && typeImports.length > 0) {
          modified = true;
          console.log(`  修复 ${filePath}: ${importName} 从 value import 改为 type import`);
        }

        return result || match;
      });
    });

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error.message);
    return false;
  }
}

/**
 * 递归处理目录中的所有TypeScript文件
 */
function fixImportTypeInDirectory(dirPath) {
  let fixedCount = 0;

  function processDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // 跳过node_modules和其他不需要处理的目录
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile() && /\.(ts|tsx)$/.test(item)) {
        if (fixImportTypeInFile(fullPath)) {
          fixedCount++;
        }
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    processDirectory(dirPath);
  }

  return fixedCount;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始修复verbatimModuleSyntax导致的import type问题...\n');

  const startTime = Date.now();

  // 修复src目录
  console.log('📁 处理 src 目录...');
  const srcFixedCount = fixImportTypeInDirectory('./src');

  const totalFixed = srcFixedCount;
  const duration = Date.now() - startTime;

  console.log(`\n📊 修复完成统计:`);
  console.log(`   修复文件数: ${totalFixed}`);
  console.log(`   耗时: ${duration}ms`);

  // 运行TypeScript检查验证修复效果
  console.log('\n🔍 验证修复效果...');
  try {
    const output = execSync('pnpm type-check 2>&1', { encoding: 'utf8' });
    const errorCount = (output.match(/error TS/g) || []).length;
    console.log(`✅ TypeScript检查完成，剩余错误: ${errorCount}个`);
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || '';
    const errorCount = (errorOutput.match(/error TS/g) || []).length;
    console.log(`⚠️ 仍有TypeScript错误: ${errorCount}个`);

    // 显示前10个错误
    const errorLines = errorOutput.split('\n').slice(0, 15);
    console.log('剩余错误示例:');
    errorLines.forEach(line => {
      if (line.trim() && line.includes('error TS')) {
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
