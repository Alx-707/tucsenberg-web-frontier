# Web Eval Agent MCP 服务器集成指南

## 概述

本文档描述如何在 Tucsenberg Web Frontier 项目中集成和配置 Web Eval Agent MCP 服务器，实现自动化 Web 应用测试和 UX 评估。

## 前置条件

- ✅ Node.js 18+ 已安装
- ✅ pnpm 包管理器已安装
- ✅ uv Python 包管理器已安装 (`/Users/Data/.local/bin/uv`)
- ✅ Playwright 浏览器依赖已安装

## MCP 服务器配置

### 1. 服务器信息

- **安装路径**: `/Users/Data/Tool/MCP/web-eval-agent/`
- **API Key**: `op-fkcf158yu3ClkhQfxgRI6dHXIDSTVDZy2016vtTsn_M`
- **服务器类型**: Web Eval Agent MCP Server

### 2. Claude Desktop 配置

将以下配置添加到您的 Claude Desktop 配置文件中：

**macOS 路径**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "web-eval-agent": {
      "command": "uv",
      "args": [
        "--directory",
        "/Users/Data/Tool/MCP/web-eval-agent",
        "run",
        "web-eval-agent"
      ],
      "env": {
        "OPENAI_API_KEY": "op-fkcf158yu3ClkhQfxgRI6dHXIDSTVDZy2016vtTsn_M"
      }
    }
  }
}
```

### 3. 环境变量配置

在项目根目录的 `.env.local` 文件中添加：

```bash
# Web Eval Agent 配置
PLAYWRIGHT_BASE_URL=http://localhost:3000
WEB_EVAL_AGENT_API_KEY=op-fkcf158yu3ClkhQfxgRI6dHXIDSTVDZy2016vtTsn_M

# Playwright 配置
PLAYWRIGHT_BROWSERS_PATH=/Users/Data/Library/Caches/ms-playwright
```

## 项目集成

### 1. 已安装的依赖

```json
{
  "devDependencies": {
    "@playwright/test": "^1.54.2",
    "playwright": "^1.54.2",
    "@axe-core/playwright": "^4.10.2"
  }
}
```

### 2. 配置文件

- ✅ `playwright.config.ts` - Playwright 主配置
- ✅ `tests/e2e/global-setup.ts` - 全局测试设置
- ✅ `tests/e2e/global-teardown.ts` - 全局测试清理

### 3. 测试文件

- ✅ `tests/e2e/basic-navigation.spec.ts` - 基础导航测试
- ✅ `tests/e2e/performance.spec.ts` - 性能测试
- ✅ `scripts/test-web-eval-agent.js` - Web Eval Agent 验证脚本

## 使用方法

### 1. 启动开发服务器

```bash
pnpm dev
```

### 2. 运行 Playwright 测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试
npx playwright test tests/e2e/basic-navigation.spec.ts

# 以 UI 模式运行
npx playwright test --ui

# 生成测试报告
npx playwright show-report
```

### 3. 验证 Web Eval Agent 集成

```bash
# 运行验证脚本
node scripts/test-web-eval-agent.js

# 查看测试报告
open reports/web-eval-agent-test-report.md
```

### 4. 通过 Claude Desktop 使用

在 Claude Desktop 中，您可以直接使用以下命令：

```
请使用 Web Eval Agent 测试我的网站 http://localhost:3000 的用户体验
```

## 测试场景

### 1. 基础功能测试

- 页面加载和导航
- 响应式设计验证
- 语言切换功能
- 表单提交流程

### 2. 性能测试

- 页面加载时间
- Core Web Vitals 指标
- 网络请求优化
- 资源加载效率

### 3. 用户体验评估

- 可访问性检查
- 交互流程分析
- 错误处理验证
- 移动端体验

## 与现有工具的协同

### React Scan 集成

Web Eval Agent 与项目现有的 React Scan 性能监控工具形成互补：

- **React Scan**: 实时组件性能监控
- **Web Eval Agent**: 端到端用户体验测试

### 质量保障流程

```bash
# 完整质量检查（包含 E2E 测试）
pnpm quality:full && npx playwright test

# 性能监控
pnpm perf:check && node scripts/test-web-eval-agent.js
```

## 报告和监控

### 1. 测试报告位置

- Playwright 报告: `reports/playwright-report/`
- Web Eval Agent 报告: `reports/web-eval-agent-test-report.md`
- 性能数据: `reports/performance-benchmarks/`

### 2. CI/CD 集成

在 GitHub Actions 中添加 E2E 测试步骤：

```yaml
- name: Run E2E Tests
  run: |
    pnpm dev &
    sleep 10
    npx playwright test
    node scripts/test-web-eval-agent.js
```

## 故障排除

### 常见问题

1. **浏览器未安装**
   ```bash
   npx playwright install
   ```

2. **开发服务器未启动**
   ```bash
   pnpm dev
   ```

3. **端口冲突**
   ```bash
   # 修改 playwright.config.ts 中的 baseURL
   baseURL: 'http://localhost:3001'
   ```

### 调试模式

```bash
# 以调试模式运行测试
npx playwright test --debug

# 查看测试执行过程
npx playwright test --headed
```

## 最佳实践

1. **测试隔离**: 每个测试应该独立运行
2. **数据清理**: 使用 global-setup 和 global-teardown
3. **等待策略**: 使用 `waitForLoadState('networkidle')`
4. **错误处理**: 捕获和记录控制台错误
5. **性能监控**: 定期检查 Core Web Vitals

## 安全考虑

- API Key 存储在环境变量中
- 测试数据不包含敏感信息
- 浏览器会话在测试后清理
- 网络请求记录不包含认证信息

## 更新和维护

- 定期更新 Playwright 版本
- 监控 Web Eval Agent 服务器状态
- 审查和优化测试用例
- 更新测试数据和场景
