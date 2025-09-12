# 核心脚本最小化保留清单

## 🎯 极简策略：只保留绝对必需的核心脚本

基于对项目开发流程、CI/CD集成和Git钩子的深入分析，以下是**绝对不可删除**的核心脚本清单。

## 📋 必须保留的脚本 (共28个)

### 1. 基础开发流程 (5个)
```json
{
  "dev": "next dev --turbopack",                    // 开发服务器 - 日常开发必需
  "build": "next build",                            // 生产构建 - 部署必需
  "start": "next start",                            // 生产启动 - 部署必需
  "postbuild": "next-sitemap",                      // 构建后处理 - SEO必需
  "prepare": "lefthook install"                     // npm生命周期 - Git钩子安装
}
```

### 2. 代码质量核心 (6个)
```json
{
  "type-check": "tsc --noEmit",                     // 类型检查 - Git钩子必需
  "type-check:strict": "tsc --noEmit --strict",    // 严格类型检查 - CI必需
  "lint:check": "eslint . --ext .js,.jsx,.ts,.tsx --config eslint.config.mjs",  // 代码检查 - CI必需
  "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --config eslint.config.mjs --fix",  // 代码修复 - Git钩子必需
  "format:check": "prettier --check .",            // 格式检查 - CI必需
  "format:write": "prettier --write ."             // 格式修复 - Git钩子必需
}
```

### 3. 测试核心 (4个)
```json
{
  "test": "vitest run",                             // 单元测试 - CI必需
  "test:coverage": "vitest run --coverage",        // 覆盖率测试 - CI必需
  "test:e2e": "playwright test",                   // E2E测试 - CI必需
  "playwright:install": "playwright install"       // E2E环境安装 - CI必需
}
```

### 4. 构建验证 (3个)
```json
{
  "build:check": "next build --no-lint",           // 构建验证 - Git钩子必需
  "size:check": "size-limit",                      // 包大小检查 - CI必需
  "analyze": "@next/bundle-analyzer"               // 包分析 - 性能监控必需
}
```

### 5. 安全和架构 (4个)
```json
{
  "security:audit": "pnpm audit --audit-level moderate",  // 安全审计 - CI必需
  "arch:check": "dependency-cruiser src --config .dependency-cruiser.js",  // 架构检查 - CI必需
  "circular:check": "madge --circular --extensions ts,tsx src",  // 循环依赖检查 - CI必需
  "duplication:check": "jscpd src --config .jscpd.json"  // 重复代码检查 - CI必需
}
```

### 6. Git钩子和提交 (3个)
```json
{
  "commitlint": "commitlint",                       // 提交信息检查 - Git钩子必需
  "hooks:install": "lefthook install",              // 钩子安装 - 开发环境必需
  "hooks:uninstall": "lefthook uninstall"          // 钩子卸载 - 维护必需
}
```

### 7. 国际化核心 (2个)
```json
{
  "validate:translations": "node scripts/validate-translations.js",  // 翻译验证 - CI必需
  "scan:translations": "node scripts/translation-scanner.js"         // 翻译扫描 - CI必需
}
```

### 8. 组合脚本 (1个)
```json
{
  "quality:check": "pnpm type-check && pnpm lint:check && pnpm format:check"  // 质量检查组合 - Git钩子必需
}
```

## 🗑️ 建议删除的脚本 (125个)

### 删除原因分析：

#### 1. 孤立脚本 (144个中的大部分)
- 从未被其他脚本或CI/CD调用
- 功能重复或已过时
- 只是简单的echo输出

#### 2. 功能重复脚本
```json
// 这些脚本功能与保留脚本重复
"lint": "...",                    // 与lint:check重复
"security:scan": "...",           // 与lint:check重复  
"test:gate": "...",              // 功能可由quality:check替代
"ui:test": "pnpm test",          // 只是调用test
"analytics:test": "pnpm test",   // 只是调用test
"integration:test": "pnpm test", // 只是调用test
"dev:test": "pnpm test",         // 只是调用test
"test:ai-validation": "pnpm test" // 只是调用test
```

#### 3. 占位符脚本 (7个)
```json
// 这些脚本只输出echo消息，无实际功能
"docs:validate": "echo '...'",
"deploy:test": "echo '...'", 
"a11y:test": "echo '...'",
"wcag:validate": "echo '...'",
"complexity:check": "echo '...'",
"lighthouse:ci": "echo '...'",
"renovate:validate": "echo '...'"
```

#### 4. 过度复杂的质量检查脚本
```json
// 这些脚本功能过于复杂，可由基础脚本组合替代
"quality:full": "...",           // 过于复杂的组合
"quality:enhanced": "...",       // 功能重复
"quality:comprehensive": "...",  // 功能重复
"quality:complete": "...",       // 功能重复
"quality:zero-tolerance": "...", // 功能重复
```

#### 5. 测试相关重复脚本
```json
// 大量测试脚本功能重复
"test:watch": "...",
"test:coverage:check": "...",
"test:coverage:report": "...",
"test:ui": "...",
"test:browser": "...",
"test:browser:watch": "...",
"test:browser:coverage": "...",
"test:performance:watch": "...",
"test:regression": "...",
"test:regression:critical": "...",
"test:quality": "...",
"test:quality:coverage": "...",
"test:quality:stability": "..."
```

## 🔧 必须保留的脚本文件 (仅3个)

基于CI/CD和核心功能需求，只需保留以下脚本文件：

```bash
scripts/validate-translations.js     # 翻译验证 - CI必需
scripts/translation-scanner.js       # 翻译扫描 - CI必需  
scripts/coverage-check.js           # 覆盖率检查 - CI必需
```

## 🗑️ 建议删除的脚本文件 (77个)

所有其他scripts目录中的文件都可以删除，包括：

### 质量检查脚本 (删除原因：功能重复)
- `comprehensive-quality-system.js`
- `simple-quality-check.js`
- `simple-quality-report.js`
- `test-enhanced-quality-checks.js`
- `quality-error-fixer.js`
- `ai-quality-review.js`
- `ai-quality-engine.js`
- `quality-report-aggregator.js`
- `quality-dashboard.js`
- `quality-gate.js`
- `quality-trigger.js`
- `quality-monitor.js`

### 测试相关脚本 (删除原因：功能可由基础命令替代)
- `test-quality-assessment.js`
- `test-performance-monitor.js`
- `regression-test-strategy.js`
- `component-coverage-analysis.js`
- `check-missing-tests.js`
- `final-coverage-verification.js`
- `validate-new-tests.js`

### 项目管理脚本 (删除原因：非核心功能)
- `project-health.js`
- `deployment-ready.js`
- `deployment-check.js`
- `report-viewer.js`
- `automated-report-generator.js`

### 一次性/过时脚本 (删除原因：已完成使命)
- `fix-qa-config.js`
- `implement-tiered-qa-config.js`
- `optimize-qa-structure.js`
- `integrate-new-tools.js`
- `fix-coverage-issues.js`

### 其他工具脚本 (删除原因：非核心开发流程)
- 所有分析、监控、工作流管理相关脚本

## 📊 极简化效果

### 数量对比
| 类别 | 当前数量 | 保留数量 | 删除数量 | 删除比例 |
|------|----------|----------|----------|----------|
| **Package.json脚本** | 153个 | 28个 | 125个 | **82%** |
| **Scripts文件** | 80个 | 3个 | 77个 | **96%** |
| **总脚本数** | 233个 | 31个 | 202个 | **87%** |

### 保留的功能覆盖
✅ **完整保留的核心功能**：
- 日常开发流程 (dev, build, start)
- 代码质量保证 (type-check, lint, format)
- 测试流程 (unit, coverage, e2e)
- 构建验证 (build-check, size-check)
- 安全检查 (audit, arch-check)
- Git钩子集成 (pre-commit, commit-msg)
- CI/CD集成 (所有GitHub Actions需要的脚本)
- 国际化支持 (翻译验证和扫描)

❌ **删除的非核心功能**：
- 复杂的质量监控和报告系统
- 重复的测试脚本变体
- 项目健康检查和部署就绪验证
- AI质量审查和自动化工作流
- 性能基准测试和趋势分析
- 各种分析和监控工具

## 🚀 实施建议

### 第一步：备份当前配置
```bash
# 创建完整备份
cp package.json package.json.backup
cp -r scripts scripts.backup
cp -r .github/workflows .github/workflows.backup
```

### 第二步：执行极简化清理
```bash
# 可以创建自动化脚本执行以下操作：
# 1. 更新package.json，只保留28个核心脚本
# 2. 删除77个非核心脚本文件
# 3. 删除重复的GitHub Actions工作流
# 4. 更新相关配置文件
```

### 第三步：验证功能完整性
```bash
# 验证核心功能正常
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm test         # 单元测试
pnpm test:e2e     # E2E测试
pnpm quality:check # 质量检查
```

## ⚠️ 风险评估

**低风险**：保留的28个脚本覆盖了所有核心开发流程和CI/CD需求
**中等风险**：删除了大量监控和报告功能，需要确认团队不依赖这些功能
**建议**：分阶段实施，先删除明显重复的脚本，再逐步删除复杂的监控系统

---

**结论**：通过极简化策略，可以将脚本数量从233个减少到31个，删除87%的脚本，同时保持所有核心开发功能的完整性。
