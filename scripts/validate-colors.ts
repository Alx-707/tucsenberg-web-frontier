#!/usr/bin/env tsx

/**
 * 颜色系统验证脚本
 * 检查所有颜色组合的对比度合规性
 */
import {
  ColorSystem,
  darkThemeColors,
  lightThemeColors,
} from '../src/lib/colors';

/**
 * 颜色验证报告
 */
interface ValidationReport {
  theme: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  issues: string[];
  score: number;
}

/**
 * 运行颜色验证
 */
function validateColors(): void {
  console.log('🎨 开始颜色系统验证...\n');

  // 验证明亮主题
  console.log('☀️ 验证明亮主题...');
  const lightReport = validateTheme('Light', lightThemeColors);
  printReport(lightReport);

  console.log('\n🌙 验证暗黑主题...');
  const darkReport = validateTheme('Dark', darkThemeColors);
  printReport(darkReport);

  // 总结报告
  console.log('\n📊 验证总结');
  console.log('='.repeat(50));

  const totalScore = (lightReport.score + darkReport.score) / 2;
  const totalIssues = lightReport.issues.length + darkReport.issues.length;

  console.log(`总体评分: ${totalScore.toFixed(1)}/100`);
  console.log(`总问题数: ${totalIssues}`);

  if (totalScore >= 90) {
    console.log('✅ 颜色系统质量优秀！');
  } else if (totalScore >= 80) {
    console.log('⚠️ 颜色系统质量良好，但有改进空间');
  } else {
    console.log('❌ 颜色系统需要重大改进');
  }

  // 如果有问题，退出码为1
  if (totalIssues > 0) {
    process.exit(1);
  }
}

/**
 * 验证单个主题
 */
function validateTheme(
  themeName: string,
  colors: typeof lightThemeColors,
): ValidationReport {
  const validation = ColorSystem.validate(colors);
  const totalChecks = 11; // 预定义的检查数量
  const failedChecks = validation.issues.length;
  const passedChecks = totalChecks - failedChecks;
  const score = (passedChecks / totalChecks) * 100;

  return {
    theme: themeName,
    totalChecks,
    passedChecks,
    failedChecks,
    issues: validation.issues,
    score,
  };
}

/**
 * 打印验证报告
 */
function printReport(report: ValidationReport): void {
  console.log(`主题: ${report.theme}`);
  console.log(`检查项目: ${report.totalChecks}`);
  console.log(`通过: ${report.passedChecks} ✅`);
  console.log(`失败: ${report.failedChecks} ❌`);
  console.log(`评分: ${report.score.toFixed(1)}/100`);

  if (report.issues.length > 0) {
    console.log('\n问题详情:');
    report.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  } else {
    console.log('🎉 所有对比度检查都通过了！');
  }
}

/**
 * 额外的颜色系统检查
 */
function performAdditionalChecks(): void {
  console.log('\n🔍 执行额外检查...');

  // 检查颜色命名一致性
  const lightKeys = Object.keys(lightThemeColors);
  const darkKeys = Object.keys(darkThemeColors);

  const missingInDark = lightKeys.filter((key) => !darkKeys.includes(key));
  const missingInLight = darkKeys.filter((key) => !lightKeys.includes(key));

  if (missingInDark.length > 0) {
    console.log(`❌ 暗黑主题缺少颜色: ${missingInDark.join(', ')}`);
  }

  if (missingInLight.length > 0) {
    console.log(`❌ 明亮主题缺少颜色: ${missingInLight.join(', ')}`);
  }

  if (missingInDark.length === 0 && missingInLight.length === 0) {
    console.log('✅ 主题颜色键一致性检查通过');
  }

  // 检查 OKLCH 值的合理性
  console.log('\n🎯 检查 OKLCH 值合理性...');

  let invalidValues = 0;

  [lightThemeColors, darkThemeColors].forEach((theme, themeIndex) => {
    const themeName = themeIndex === 0 ? 'Light' : 'Dark';

    Object.entries(theme).forEach(([key, color]) => {
      // 检查亮度范围 (0-1)
      if (color.l < 0 || color.l > 1) {
        console.log(`❌ ${themeName}.${key}: 亮度值 ${color.l} 超出范围 [0,1]`);
        invalidValues++;
      }

      // 检查色度范围 (0-0.4+，但通常不超过0.5)
      if (color.c < 0 || color.c > 0.5) {
        console.log(
          `⚠️ ${themeName}.${key}: 色度值 ${color.c} 可能超出常见范围 [0,0.5]`,
        );
      }

      // 检查色调范围 (0-360)
      if (color.h < 0 || color.h > 360) {
        console.log(
          `❌ ${themeName}.${key}: 色调值 ${color.h} 超出范围 [0,360]`,
        );
        invalidValues++;
      }

      // 检查透明度范围 (0-1)
      if (color.alpha !== undefined && (color.alpha < 0 || color.alpha > 1)) {
        console.log(
          `❌ ${themeName}.${key}: 透明度值 ${color.alpha} 超出范围 [0,1]`,
        );
        invalidValues++;
      }
    });
  });

  if (invalidValues === 0) {
    console.log('✅ OKLCH 值合理性检查通过');
  } else {
    console.log(`❌ 发现 ${invalidValues} 个无效的 OKLCH 值`);
  }
}

// 主函数
function main(): void {
  try {
    validateColors();
    performAdditionalChecks();

    // 颜色预览功能已移除

    console.log('\n🎉 颜色系统验证完成！');
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

export { performAdditionalChecks, validateColors, validateTheme };
