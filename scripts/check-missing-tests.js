#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取所有源文件
function getSourceFiles() {
  try {
    const output = execSync(
      'find src -name "*.ts" -o -name "*.tsx" | grep -v "\\.test\\." | grep -v "\\.d\\.ts"',
      {
        encoding: 'utf8',
      },
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('获取源文件失败:', error.message);
    return [];
  }
}

// 获取所有测试文件
function getTestFiles() {
  try {
    const output = execSync(
      'find src -name "*.test.ts" -o -name "*.test.tsx"',
      {
        encoding: 'utf8',
      },
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('获取测试文件失败:', error.message);
    return [];
  }
}

// 检查文件是否有对应的测试
function hasTest(sourceFile, testFiles) {
  const fileName = path.basename(sourceFile);
  const dirName = path.dirname(sourceFile);

  // 检查多种可能的测试文件位置
  const possibleTestPaths = [
    // 同目录下的 .test. 文件
    sourceFile.replace(/\.(ts|tsx)$/, '.test.$1'),
    // __tests__ 目录下的文件
    path.join(
      dirName,
      '__tests__',
      fileName.replace(/\.(ts|tsx)$/, '.test.$1'),
    ),
    // tests 目录下的文件
    path.join(dirName, 'tests', fileName.replace(/\.(ts|tsx)$/, '.test.$1')),
  ];

  return possibleTestPaths.some((testPath) => testFiles.includes(testPath));
}

// 主函数
function main() {
  console.log('📊 测试覆盖情况分析\n');

  const sourceFiles = getSourceFiles();
  const testFiles = getTestFiles();

  // 找出没有测试的文件
  const untested = sourceFiles.filter((file) => !hasTest(file, testFiles));

  console.log('📈 统计结果:');
  console.log(`总源文件数: ${sourceFiles.length}`);
  console.log(`已有测试文件数: ${testFiles.length}`);
  console.log(`缺失测试的文件数: ${untested.length}`);
  console.log(
    `测试覆盖率: ${((testFiles.length / sourceFiles.length) * 100).toFixed(1)}%\n`,
  );

  if (untested.length > 0) {
    console.log('🔍 缺失测试的文件:');
    untested.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
  } else {
    console.log('✅ 所有源文件都有对应的测试文件！');
  }

  return {
    total: sourceFiles.length,
    tested: testFiles.length,
    untested: untested.length,
    untestedFiles: untested,
  };
}

if (require.main === module) {
  main();
}

module.exports = { main };
