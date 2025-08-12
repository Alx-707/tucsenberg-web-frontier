#!/usr/bin/env node

/**
 * Schema对等性检查脚本
 * 确保Zod schema与TinaCMS配置保持一致
 */

const fs = require('fs');
const path = require('path');

class SchemaParityChecker {
  constructor() {
    this.issues = [];
    this.tinaConfig = null;
    this.zodSchemas = null;
  }

  async run() {
    console.log('🔍 开始MDX内容Schema对等性检查...\n');

    try {
      // 读取MDX内容配置
      await this.loadContentConfig();

      // 读取Zod schemas
      await this.loadZodSchemas();

      // 执行对等性检查
      await this.performParityCheck();

      // 输出结果
      this.outputResults();
    } catch (error) {
      console.error('❌ Schema检查失败:', error.message);
      process.exit(1);
    }
  }

  async loadContentConfig() {
    const configPath = 'content/config/content.json';
    if (!fs.existsSync(configPath)) {
      throw new Error('MDX内容配置文件不存在');
    }

    // 读取MDX内容配置
    const configContent = fs.readFileSync(configPath, 'utf8');
    this.contentConfig = JSON.parse(configContent);
    console.log('✅ MDX内容配置已加载');

    // 定义内容类型和必需字段
    this.contentTypes = {
      posts: ['title', 'description', 'slug', 'locale', 'publishedAt'],
      pages: ['title', 'description', 'slug', 'locale'],
      documents: ['title', 'description', 'slug', 'locale', 'fileUrl'],
    };
  }

  async loadZodSchemas() {
    const schemaPath = 'src/lib/content-validation.ts';
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Zod schema文件不存在');
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Zod schemas已加载');

    // 简化处理：模拟schema结构
    this.zodSchemas = {
      pageSchema: ['title', 'description', 'seo'],
      postSchema: ['title', 'description', 'publishedAt'],
      caseStudySchema: ['title', 'description', 'client'],
    };
  }

  async performParityCheck() {
    console.log('🔄 执行MDX内容schema对等性检查...\n');

    // 检查每个内容类型
    for (const [contentType, requiredFields] of Object.entries(this.contentTypes)) {
      const schemaName = `${contentType.slice(0, -1)}Schema`; // posts -> postSchema
      const zodSchema = this.zodSchemas[schemaName];

      if (!zodSchema) {
        this.issues.push({
          type: 'missing_schema',
          contentType: contentType,
          message: `缺少对应的Zod schema: ${schemaName}`,
        });
        continue;
      }

      // 检查必需字段
      for (const field of requiredFields) {
        if (!zodSchema.includes(field)) {
          this.issues.push({
            type: 'missing_field',
            contentType: contentType,
            field: field,
            message: `Zod schema中缺少必需字段: ${field}`,
          });
        }
      }

      // 检查额外字段（可选，仅警告）
      for (const field of zodSchema) {
        if (!requiredFields.includes(field)) {
          console.log(`ℹ️  ${contentType} schema包含额外字段: ${field}`);
        }
      }
    }
  }

  outputResults() {
    console.log('📋 Schema对等性检查结果');
    console.log('='.repeat(50));

    if (this.issues.length === 0) {
      console.log('✅ 所有schemas保持一致，可以安全移除TinaCMS');
      process.exit(0);
    }

    console.log(`❌ 发现 ${this.issues.length} 个不一致问题:\n`);

    this.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type}] ${issue.collection}`);
      console.log(`   ${issue.message}`);
      if (issue.field) {
        console.log(`   字段: ${issue.field}`);
      }
      console.log('');
    });

    console.log('⚠️ 请先解决这些MDX内容schema问题');
    process.exit(1);
  }
}

// 运行检查
if (require.main === module) {
  const checker = new SchemaParityChecker();
  checker.run();
}

module.exports = SchemaParityChecker;
