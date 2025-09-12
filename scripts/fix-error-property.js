#!/usr/bin/env node

/**
 * 修复_error属性名错误，应该是error
 */

const fs = require('fs');
const path = require('path');

/**
 * 修复单个文件中的_error属性
 */
function fixErrorPropertyInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 替换 ._error 为 .error
    const newContent = content.replace(/\._error\b/g, '.error');
    
    if (content !== newContent) {
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
 * 主函数
 */
function main() {
  console.log('🚀 开始修复_error属性名错误...\n');

  const filesToFix = [
    'src/app/api/analytics/i18n/route.ts',
    'src/app/api/analytics/web-vitals/route.ts',
    'src/app/api/subscribe/route.ts',
    'src/app/api/whatsapp/send/route.ts',
    'src/app/api/whatsapp/webhook/route.ts',
    'src/app/api/monitoring/dashboard/handlers/get-handler.ts',
    'src/app/api/monitoring/dashboard/handlers/post-handler.ts',
    'src/app/api/monitoring/dashboard/handlers/put-handler.ts',
    'src/app/api/monitoring/dashboard/handlers/delete-handler.ts',
  ];

  let fixedCount = 0;
  
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      if (fixErrorPropertyInFile(file)) {
        fixedCount++;
      }
    } else {
      console.log(`⚠️ 文件不存在: ${file}`);
    }
  });

  console.log(`\n📊 修复完成统计:`);
  console.log(`   修复文件数: ${fixedCount}`);
  console.log('\n🎯 _error属性修复任务完成！');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixErrorPropertyInFile };
