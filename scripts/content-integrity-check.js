#!/usr/bin/env node

/**
 * 内容完整性检查脚本
 * 验证MDX内容的完整性和一致性
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class ContentIntegrityChecker {
  constructor() {
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      missingTranslations: 0,
    };
  }

  async checkIntegrity() {
    console.log('🔍 开始内容完整性检查...\n');

    try {
      // 检查内容目录结构
      await this.checkDirectoryStructure();

      // 检查MDX文件
      await this.checkMDXFiles();

      // 检查多语言一致性
      await this.checkLanguageConsistency();

      // 输出结果
      this.outputResults();
    } catch (error) {
      console.error('❌ 内容完整性检查失败:', error.message);
      process.exit(1);
    }
  }

  async checkDirectoryStructure() {
    console.log('📁 检查目录结构...');

    const requiredDirs = [
      'content',
      'content/pages',
      'content/pages/en',
      'content/pages/zh',
      'content/posts',
      'content/posts/en',
      'content/posts/zh',
    ];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        this.issues.push({
          type: 'missing_directory',
          path: dir,
          message: `缺少必需的目录: ${dir}`,
        });
      }
    }

    console.log('✅ 目录结构检查完成\n');
  }

  async checkMDXFiles() {
    console.log('📄 检查MDX文件...');

    const contentTypes = ['pages', 'posts'];
    const locales = ['en', 'zh'];

    for (const type of contentTypes) {
      for (const locale of locales) {
        const dirPath = `content/${type}/${locale}`;
        if (!fs.existsSync(dirPath)) continue;

        const files = fs
          .readdirSync(dirPath)
          .filter((file) => file.endsWith('.mdx'));

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          await this.validateMDXFile(filePath, type, locale);
        }
      }
    }

    console.log('✅ MDX文件检查完成\n');
  }

  async validateMDXFile(filePath, type, locale) {
    this.stats.totalFiles++;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { data: frontMatter, content: body } = matter(content);

      // 验证必需字段
      const requiredFields = ['title', 'description', 'slug'];
      const missingFields = requiredFields.filter(
        (field) => !frontMatter[field],
      );

      if (missingFields.length > 0) {
        this.issues.push({
          type: 'missing_frontmatter',
          path: filePath,
          message: `缺少Front Matter字段: ${missingFields.join(', ')}`,
        });
        this.stats.invalidFiles++;
        return;
      }

      // 验证locale字段
      if (frontMatter.locale !== locale) {
        this.issues.push({
          type: 'locale_mismatch',
          path: filePath,
          message: `locale字段(${frontMatter.locale})与目录(${locale})不匹配`,
        });
      }

      // 验证内容不为空
      if (!body.trim()) {
        this.issues.push({
          type: 'empty_content',
          path: filePath,
          message: '文件内容为空',
        });
      }

      this.stats.validFiles++;
    } catch (error) {
      this.issues.push({
        type: 'parse_error',
        path: filePath,
        message: `解析失败: ${error.message}`,
      });
      this.stats.invalidFiles++;
    }
  }

  async checkLanguageConsistency() {
    console.log('🌍 检查多语言一致性...');

    const contentTypes = ['pages', 'posts'];

    for (const type of contentTypes) {
      const enDir = `content/${type}/en`;
      const zhDir = `content/${type}/zh`;

      if (!fs.existsSync(enDir) || !fs.existsSync(zhDir)) continue;

      const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.mdx'));
      const zhFiles = fs.readdirSync(zhDir).filter((f) => f.endsWith('.mdx'));

      // 检查缺失的翻译
      for (const enFile of enFiles) {
        if (!zhFiles.includes(enFile)) {
          this.issues.push({
            type: 'missing_translation',
            path: `${zhDir}/${enFile}`,
            message: `缺少中文翻译: ${enFile}`,
          });
          this.stats.missingTranslations++;
        }
      }

      for (const zhFile of zhFiles) {
        if (!enFiles.includes(zhFile)) {
          this.issues.push({
            type: 'missing_translation',
            path: `${enDir}/${zhFile}`,
            message: `缺少英文翻译: ${zhFile}`,
          });
          this.stats.missingTranslations++;
        }
      }
    }

    console.log('✅ 多语言一致性检查完成\n');
  }

  outputResults() {
    console.log('📋 内容完整性检查结果');
    console.log('='.repeat(50));
    console.log(`总文件数: ${this.stats.totalFiles}`);
    console.log(`有效文件: ${this.stats.validFiles}`);
    console.log(`无效文件: ${this.stats.invalidFiles}`);
    console.log(`缺失翻译: ${this.stats.missingTranslations}`);
    console.log('='.repeat(50));

    if (this.issues.length === 0) {
      console.log('✅ 所有内容文件完整且一致');
      process.exit(0);
    }

    console.log(`❌ 发现 ${this.issues.length} 个问题:\n`);

    // 按类型分组显示问题
    const groupedIssues = this.issues.reduce((groups, issue) => {
      const type = issue.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(issue);
      return groups;
    }, {});

    Object.entries(groupedIssues).forEach(([type, issues]) => {
      console.log(`\n📌 ${type.toUpperCase()} (${issues.length}个):`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.path}`);
        console.log(`     ${issue.message}`);
      });
    });

    console.log('\n⚠️ 请修复这些问题以确保内容完整性');

    // 如果只是警告级别的问题，不退出
    const criticalTypes = ['parse_error', 'missing_frontmatter'];
    const hasCriticalIssues = this.issues.some((issue) =>
      criticalTypes.includes(issue.type),
    );

    process.exit(hasCriticalIssues ? 1 : 0);
  }
}

// 运行检查
if (require.main === module) {
  const checker = new ContentIntegrityChecker();
  checker.checkIntegrity();
}

module.exports = ContentIntegrityChecker;
